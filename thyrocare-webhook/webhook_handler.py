"""
Core webhook processing logic.
Updates every Thyrocare-related field across:
  - thyrocare_order_tracking
  - thyrocare_order_status_history
  - thyrocare_patient_tracking
  - order_items  (thyrocare_booking_status, order_status, scheduled_date,
                  technician_name, technician_contact)
  - orders       (thyrocare_booking_status, order_status on CANCELLED)
"""
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from models import (
    Order,
    OrderItem,
    OrderStatus,
    ThyrocareOrderTracking,
    ThyrocarePatientTracking,
    ThyrocareOrderStatusHistory,
    now_ist,
)

logger = logging.getLogger("thyrocare_webhook.handler")


# ─────────────────────────────────────────────────────────────────────────────
# Thyrocare status → our OrderStatus
# ─────────────────────────────────────────────────────────────────────────────

_STATUS_MAP: dict[str, OrderStatus] = {
    # Thyrocare orderStatus values (primary mapping source)
    "ORDER_PLACED":     OrderStatus.CONFIRMED,
    "ASSIGNED":         OrderStatus.SCHEDULED,
    "STARTED":          OrderStatus.SCHEDULE_CONFIRMED_BY_LAB,   # sub-status: technician en route
    "ARRIVED":          OrderStatus.SCHEDULE_CONFIRMED_BY_LAB,   # sub-status: collection in progress
    "SERVICED":         OrderStatus.SAMPLE_COLLECTED,
    "UNDER_PROCESSING": OrderStatus.SAMPLE_RECEIVED_BY_LAB,
    "COMPLETED":        OrderStatus.REPORT_READY,
    "CANCELLED":        OrderStatus.CANCELLED,
    # Alternate / legacy orderStatus variants
    "YET TO ASSIGN":    OrderStatus.CONFIRMED,
    "DONE":             OrderStatus.REPORT_READY,
    "REPORTED":         OrderStatus.REPORT_READY,
}


def _map_status(thyro_status: Optional[str]) -> Optional[OrderStatus]:
    if not thyro_status:
        return None
    return _STATUS_MAP.get(thyro_status.upper().strip())


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _nonempty(val) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    return s or None


def _parse_dt(raw) -> Optional[datetime]:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except Exception:
        return None


def _comma_contains(stored: str, needle: str) -> bool:
    if not stored or not needle:
        return False
    return any(p.strip() == needle.strip() for p in stored.split(","))


# ─────────────────────────────────────────────────────────────────────────────
# Resolve our internal order
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_our_order(db: Session, thyrocare_order_id: str):
    """Return (our_order_id, user_id, member_ids, order_item_ids)."""
    items = (
        db.query(OrderItem)
        .filter(OrderItem.thyrocare_order_id == thyrocare_order_id)
        .all()
    )

    our_order_id = items[0].order_id if items else None
    user_id      = items[0].user_id  if items else None
    member_ids   = list({oi.member_id for oi in items if oi.member_id})
    item_ids     = [oi.id for oi in items]

    if our_order_id is None:
        tid = thyrocare_order_id
        order_row = db.query(Order).filter(Order.thyrocare_order_id == tid).first()
        if not order_row:
            candidates = (
                db.query(Order)
                .filter(
                    Order.thyrocare_order_id.isnot(None),
                    or_(
                        Order.thyrocare_order_id.like(f"{tid},%"),
                        Order.thyrocare_order_id.like(f"%,{tid},%"),
                        Order.thyrocare_order_id.like(f"%,{tid}"),
                    ),
                )
                .all()
            )
            order_row = next(
                (o for o in candidates if _comma_contains(o.thyrocare_order_id, tid)),
                None,
            )
        if order_row:
            our_order_id = order_row.id
            if user_id is None:
                user_id = order_row.user_id

    return our_order_id, user_id, member_ids, item_ids


# ─────────────────────────────────────────────────────────────────────────────
# order_items — update all Thyrocare-related fields
# ─────────────────────────────────────────────────────────────────────────────

def _update_order_items(
    db: Session,
    thyrocare_order_id: str,
    our_order_id: Optional[int],
    order_status: Optional[str],
    order_status_description: Optional[str],
    phlebo: dict,
    appt_date: Optional[datetime],
):
    """
    Update every Thyrocare-related column on matching order_items rows:
      - thyrocare_booking_status  → latest Thyrocare status string
      - order_status              → mapped OrderStatus enum
      - scheduled_date            → appointment date from webhook
      - technician_name           → phlebo name
      - technician_contact        → phlebo contact
    """
    items = (
        db.query(OrderItem)
        .filter(OrderItem.thyrocare_order_id == thyrocare_order_id)
        .all()
    )

    # Fallback: if no items matched by thyrocare_order_id, try via our_order_id
    if not items and our_order_id:
        items = (
            db.query(OrderItem)
            .filter(
                OrderItem.order_id == our_order_id,
                OrderItem.thyrocare_order_id.isnot(None),
            )
            .all()
        )

    if not items:
        return

    # Determine the canonical status string to store
    booking_status = (
        _nonempty(order_status_description)
        or _nonempty(order_status)
    )
    mapped = _map_status(order_status)

    phlebo_name    = _nonempty(phlebo.get("name"))
    phlebo_contact = _nonempty(
        phlebo.get("contactNumber") or phlebo.get("mobile") or phlebo.get("phone")
    )

    for it in items:
        if booking_status:
            it.thyrocare_booking_status = booking_status
        if mapped:
            it.order_status = mapped
            it.status_updated_at = now_ist()
        if appt_date:
            it.scheduled_date = appt_date
        if phlebo_name:
            it.technician_name = phlebo_name
        if phlebo_contact:
            it.technician_contact = phlebo_contact


# ─────────────────────────────────────────────────────────────────────────────
# orders — update Thyrocare booking status + propagate CANCELLED
# ─────────────────────────────────────────────────────────────────────────────

def _update_order(
    db: Session,
    thyrocare_order_id: str,
    our_order_id: Optional[int],
    order_status: Optional[str],
    order_status_description: Optional[str],
):
    if not our_order_id:
        return

    order_row = db.query(Order).filter(Order.id == our_order_id).first()
    if not order_row:
        return

    booking_status = _nonempty(order_status_description) or _nonempty(order_status)
    if booking_status:
        order_row.thyrocare_booking_status = booking_status

    # Propagate CANCELLED: only when ALL items for this thyrocare_order_id are cancelled
    mapped = _map_status(order_status)
    if mapped == OrderStatus.CANCELLED:
        all_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == our_order_id)
            .all()
        )
        if all_items and all(i.order_status == OrderStatus.CANCELLED for i in all_items):
            order_row.order_status = OrderStatus.CANCELLED
            order_row.status_updated_at = now_ist()

    order_row.updated_at = now_ist()


# ─────────────────────────────────────────────────────────────────────────────
# thyrocare_order_tracking upsert
# ─────────────────────────────────────────────────────────────────────────────

def _upsert_tracking(
    db: Session,
    thyrocare_order_id: str,
    our_order_id, user_id, member_ids, item_ids,
    order_status, order_status_description,
    phlebo: dict, appt_date,
) -> ThyrocareOrderTracking:

    tracking = (
        db.query(ThyrocareOrderTracking)
        .filter(ThyrocareOrderTracking.thyrocare_order_id == thyrocare_order_id)
        .first()
    )

    phlebo_name    = _nonempty(phlebo.get("name"))
    phlebo_contact = _nonempty(
        phlebo.get("contactNumber") or phlebo.get("mobile") or phlebo.get("phone")
    )

    if not tracking:
        try:
            with db.begin_nested():
                tracking = ThyrocareOrderTracking(
                    thyrocare_order_id=thyrocare_order_id,
                    our_order_id=our_order_id,
                    user_id=user_id,
                    member_ids=member_ids or None,
                    order_item_ids=item_ids or None,
                    current_order_status=order_status,
                    current_status_description=order_status_description,
                    phlebo_name=phlebo_name,
                    phlebo_contact=phlebo_contact,
                    appointment_date=appt_date,
                    last_webhook_at=now_ist(),
                )
                db.add(tracking)
                db.flush()
        except IntegrityError:
            tracking = (
                db.query(ThyrocareOrderTracking)
                .filter(ThyrocareOrderTracking.thyrocare_order_id == thyrocare_order_id)
                .first()
            )
            if tracking is None:
                raise

    # Always merge latest values
    if order_status:
        tracking.current_order_status = order_status
    if order_status_description:
        tracking.current_status_description = order_status_description
    if phlebo_name:
        tracking.phlebo_name = phlebo_name
    if phlebo_contact:
        tracking.phlebo_contact = phlebo_contact
    if appt_date:
        tracking.appointment_date = appt_date
    if our_order_id and not tracking.our_order_id:
        tracking.our_order_id = our_order_id
    if user_id and not tracking.user_id:
        tracking.user_id = user_id
    if member_ids and not tracking.member_ids:
        tracking.member_ids = member_ids
    if item_ids and not tracking.order_item_ids:
        tracking.order_item_ids = item_ids
    tracking.last_webhook_at = now_ist()

    return tracking


# ─────────────────────────────────────────────────────────────────────────────
# thyrocare_order_status_history
# ─────────────────────────────────────────────────────────────────────────────

def _record_history(
    db: Session,
    tracking: ThyrocareOrderTracking,
    order_status, order_status_description,
    thyrocare_timestamp, b2c_patient_id, raw_payload,
):
    if not order_status:
        return

    existing = (
        db.query(ThyrocareOrderStatusHistory)
        .filter(
            ThyrocareOrderStatusHistory.order_tracking_id == tracking.id,
            ThyrocareOrderStatusHistory.order_status == order_status,
            ThyrocareOrderStatusHistory.order_status_description == order_status_description,
        )
        .first()
    )

    if existing:
        existing.raw_payload = raw_payload
        existing.thyrocare_timestamp = thyrocare_timestamp
        existing.b2c_patient_id = b2c_patient_id or existing.b2c_patient_id
        existing.received_at = now_ist()
    else:
        db.add(ThyrocareOrderStatusHistory(
            thyrocare_order_id=tracking.thyrocare_order_id,
            order_tracking_id=tracking.id,
            order_status=order_status,
            order_status_description=order_status_description,
            thyrocare_timestamp=thyrocare_timestamp,
            b2c_patient_id=b2c_patient_id or None,
            raw_payload=raw_payload,
            received_at=now_ist(),
        ))


# ─────────────────────────────────────────────────────────────────────────────
# thyrocare_patient_tracking
# ─────────────────────────────────────────────────────────────────────────────

def _upsert_patients(
    db: Session,
    tracking: ThyrocareOrderTracking,
    patients: list,
    order_status_description,
):
    for p in patients:
        if not isinstance(p, dict):
            continue
        patient_id = _nonempty(
            p.get("id") or p.get("patientId") or p.get("b2cPatientId")
            or (p.get("attributes") or {}).get("leadId")
        )
        if not patient_id:
            continue

        is_report  = bool(p.get("isReportAvailable"))
        report_url = _nonempty(p.get("reportUrl"))
        report_ts  = _parse_dt(_nonempty(p.get("reportTimestamp")))

        age = None
        try:
            age = int(p["age"]) if p.get("age") is not None else None
        except (ValueError, TypeError):
            pass

        existing = (
            db.query(ThyrocarePatientTracking)
            .filter(
                ThyrocarePatientTracking.order_tracking_id == tracking.id,
                ThyrocarePatientTracking.patient_id == patient_id,
            )
            .first()
        )

        if existing:
            if order_status_description:
                existing.current_status = order_status_description
            if is_report:
                existing.is_report_available = True
            if report_url:
                existing.report_url = report_url
            if report_ts:
                existing.report_timestamp = report_ts
            if p.get("name"):
                existing.patient_name = str(p["name"]).strip()
            if age is not None:
                existing.age = age
            if p.get("gender"):
                existing.gender = str(p["gender"]).strip()
            existing.updated_at = now_ist()
        else:
            db.add(ThyrocarePatientTracking(
                thyrocare_order_id=tracking.thyrocare_order_id,
                order_tracking_id=tracking.id,
                patient_id=patient_id,
                patient_name=_nonempty(p.get("name")),
                age=age,
                gender=_nonempty(p.get("gender")),
                is_report_available=is_report,
                report_url=report_url,
                report_timestamp=report_ts,
                current_status=order_status_description,
                user_id=tracking.user_id,
            ))


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def process_thyrocare_webhook(db: Session, payload: dict) -> None:
    """
    Parse a raw Thyrocare webhook payload and update the DB.
    Caller is responsible for commit / rollback.
    """
    # ── normalise ─────────────────────────────────────────────────────────────
    od = payload.get("orderData")
    order_data: dict = dict(od) if isinstance(od, dict) else {}

    for key in ("patients",):
        if not order_data.get(key) and isinstance(payload.get(key), list):
            order_data[key] = payload[key]
    for key in ("phlebo",):
        if not order_data.get(key) and isinstance(payload.get(key), dict):
            order_data[key] = payload[key]
    for key in ("appointmentDate", "lastUpdatedTimestamp", "orderId",
                "status", "orderStatusDescription", "b2cPatientId"):
        if not order_data.get(key) and payload.get(key) not in (None, ""):
            order_data[key] = payload[key]

    thyrocare_order_id = _nonempty(
        payload.get("orderId") or order_data.get("orderId")
    )
    if not thyrocare_order_id:
        logger.warning("Webhook missing orderId — skipping.")
        return

    order_status = (
        _nonempty(payload.get("orderStatus"))
        or _nonempty(payload.get("status"))
        or _nonempty(order_data.get("status"))
    )
    order_status_description = (
        _nonempty(payload.get("orderStatusDescription"))
        or _nonempty(order_data.get("orderStatusDescription"))
    )
    thyrocare_timestamp = (
        _nonempty(payload.get("timestamp"))
        or _nonempty(order_data.get("lastUpdatedTimestamp"))
    )
    b2c_patient_id = _nonempty(
        payload.get("b2cPatientId") or order_data.get("b2cPatientId")
    ) or ""

    phlebo = order_data.get("phlebo") or {}
    if not isinstance(phlebo, dict):
        phlebo = {}

    appt_date = _parse_dt(order_data.get("appointmentDate"))
    patients  = order_data.get("patients") or []

    logger.info(
        "Webhook | order=%s status=%s desc=%s patients=%d",
        thyrocare_order_id, order_status, order_status_description, len(patients),
    )

    # ── resolve internal order ────────────────────────────────────────────────
    our_order_id, user_id, member_ids, item_ids = _resolve_our_order(
        db, thyrocare_order_id
    )

    # ── 1. update order_items (all Thyrocare fields) ──────────────────────────
    _update_order_items(
        db, thyrocare_order_id, our_order_id,
        order_status, order_status_description,
        phlebo, appt_date,
    )

    # ── 2. update orders (booking_status + CANCELLED propagation) ────────────
    _update_order(
        db, thyrocare_order_id, our_order_id,
        order_status, order_status_description,
    )

    # ── 3. upsert thyrocare_order_tracking ────────────────────────────────────
    tracking = _upsert_tracking(
        db,
        thyrocare_order_id=thyrocare_order_id,
        our_order_id=our_order_id,
        user_id=user_id,
        member_ids=member_ids,
        item_ids=item_ids,
        order_status=order_status,
        order_status_description=order_status_description,
        phlebo=phlebo,
        appt_date=appt_date,
    )
    db.flush()

    # ── 4. status history ─────────────────────────────────────────────────────
    _record_history(
        db, tracking,
        order_status, order_status_description,
        thyrocare_timestamp, b2c_patient_id, payload,
    )

    # ── 5. patient tracking ───────────────────────────────────────────────────
    _upsert_patients(db, tracking, patients, order_status_description)

    logger.info("Webhook done | order=%s", thyrocare_order_id)
