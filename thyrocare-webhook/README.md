# Thyrocare Webhook Microservice

Fully self-contained FastAPI service — **no dependency on the main Bloodtests package**.  
Exposes only two endpoints and connects to the **same RDS database** as the main app.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/thyrocare/webhook` | Thyrocare order-status callback |

## What gets updated on every webhook

| Table | Fields updated |
|-------|---------------|
| `thyrocare_order_tracking` | `current_order_status`, `current_status_description`, `phlebo_name`, `phlebo_contact`, `appointment_date`, `last_webhook_at` |
| `thyrocare_order_status_history` | Upsert one row per unique `(status, description)` pair |
| `thyrocare_patient_tracking` | `current_status`, `is_report_available`, `report_url`, `report_timestamp`, `patient_name`, `age`, `gender` |
| `order_items` | `thyrocare_booking_status`, `order_status` (mapped enum), `scheduled_date`, `technician_name`, `technician_contact` |
| `orders` | `thyrocare_booking_status`; `order_status → CANCELLED` when all items are cancelled |

## Status mapping (Thyrocare → our OrderStatus)

| Thyrocare value | Our OrderStatus |
|-----------------|----------------|
| `BOOKED` | `SCHEDULED` |
| `SCHEDULE_CONFIRMED_BY_LAB` | `SCHEDULE_CONFIRMED_BY_LAB` |
| `SAMPLE_COLLECTED` | `SAMPLE_COLLECTED` |
| `SAMPLE_RECEIVED_BY_LAB` | `SAMPLE_RECEIVED_BY_LAB` |
| `TESTING_IN_PROGRESS` | `TESTING_IN_PROGRESS` |
| `REPORT_READY` / `DONE` / `REPORTED` / `SERVICED` | `REPORT_READY` |
| `CANCELLED` | `CANCELLED` |
| `YET TO ASSIGN` | `CONFIRMED` |

---

## Local development

```bash
cd thyrocare-webhook
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL
ENVIRONMENT=development uvicorn main:app --reload --port 8001
```

---

## AWS deployment (recommended: App Runner)

### Why it works on AWS

- The service is **fully self-contained** — `models.py` mirrors only the tables it needs
- It only needs `DATABASE_URL` pointing at your existing RDS instance
- No shared filesystem or code mount required

### Option A — AWS App Runner (simplest)

1. Push this folder to its own GitHub repo (or ECR image)
2. Create an App Runner service:
   - Source: your repo / ECR image
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port 8001`
   - Port: `8001`
3. Add environment variables:
   ```
   DATABASE_URL = postgresql://user:pass@your-rds.region.rds.amazonaws.com:5432/dbname
   ENVIRONMENT  = production
   ```
4. Make sure the App Runner service's VPC connector can reach your RDS security group
5. Give Thyrocare the App Runner HTTPS URL:
   ```
   https://<apprunner-id>.region.awsapprunner.com/thyrocare/webhook
   ```

### Option B — ECS Fargate

```bash
# Build and push
docker build -t thyrocare-webhook .
docker tag thyrocare-webhook:latest <account>.dkr.ecr.<region>.amazonaws.com/thyrocare-webhook:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/thyrocare-webhook:latest
```

Create a Fargate task with:
- Container port: `8001`
- Environment variable: `DATABASE_URL`
- Same VPC / security group as RDS

Put an ALB in front for HTTPS termination.

### Option C — Same EC2 as main app (different port)

```bash
# On the server
cd /opt/thyrocare-webhook
pip install -r requirements.txt
# Run as a systemd service on port 8001
uvicorn main:app --host 0.0.0.0 --port 8001
```

Add an Nginx location block:
```nginx
location /thyrocare/webhook {
    proxy_pass http://127.0.0.1:8001;
}
```

---

## Security note

Thyrocare does not send a signature header, so there is no HMAC verification.  
If you want to restrict access, add an IP allowlist in your ALB / security group  
to only accept requests from Thyrocare's IP range.
