"""
Thyrocare Webhook Microservice
"""
import os
import logging
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, Request, Header, HTTPException
from database import SessionLocal
from webhook_handler import process_thyrocare_webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("thyrocare_webhook")

WEBHOOK_API_KEY = os.getenv("WEBHOOK_API_KEY", "nucleotide-webhook711").strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Thyrocare webhook service starting...")
    yield
    logger.info("Thyrocare webhook service stopped.")


app = FastAPI(
    title="Thyrocare Webhook",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT", "production") != "production" else None,
    redoc_url=None,
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "thyrocare-webhook"}


@app.post("/thyrocare/webhook")
async def thyrocare_webhook(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    logger.info("Auth check | received_key=%r expected_key=%r", x_api_key, WEBHOOK_API_KEY)
    if not secrets.compare_digest(x_api_key, WEBHOOK_API_KEY):
        logger.warning(
            "Webhook rejected — invalid API key from %s",
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(status_code=401, detail="Invalid API key")

    try:
        raw = await request.json()
    except Exception:
        logger.warning("Could not parse webhook JSON body.")
        return {"respId": "RES00001", "response": "Success"}

    if not isinstance(raw, dict):
        return {"respId": "RES00001", "response": "Success"}

    db = SessionLocal()
    try:
        process_thyrocare_webhook(db, raw)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Webhook processing error: %s", exc, exc_info=True)
    finally:
        db.close()

    return {"respId": "RES00001", "response": "Success"}
