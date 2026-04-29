import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to thyrocare-webhook/.env")

engine_kwargs = {"echo": False, "future": True, "pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", 5))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", 10))
    engine_kwargs["pool_timeout"] = int(os.getenv("DB_POOL_TIMEOUT", 30))
    engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", 3600))

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass
