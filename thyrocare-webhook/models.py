"""
Self-contained SQLAlchemy models — mirrors only the tables this service reads/writes.
No imports from the main Bloodtests package.
"""
import enum
from datetime import datetime, timezone, timedelta

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, JSON,
    Float, ForeignKey, Enum, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    return datetime.now(IST)


# ── enums ─────────────────────────────────────────────────────────────────────

class OrderStatus(str, enum.Enum):
    CART = "CART"
    PENDING = "PENDING"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PROCESSING = "PROCESSING"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    SCHEDULED = "SCHEDULED"
    SCHEDULE_CONFIRMED_BY_LAB = "SCHEDULE_CONFIRMED_BY_LAB"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    SAMPLE_RECEIVED_BY_LAB = "SAMPLE_RECEIVED_BY_LAB"
    TESTING_IN_PROGRESS = "TESTING_IN_PROGRESS"
    REPORT_READY = "REPORT_READY"
    CANCELLED = "CANCELLED"


# ── orders ────────────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    order_status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING_PAYMENT)
    status_updated_at = Column(DateTime(timezone=True), default=now_ist, onupdate=now_ist)
    thyrocare_order_id = Column(String(100), nullable=True, index=True)
    thyrocare_booking_status = Column(String(20), nullable=True, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=now_ist)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    member_id = Column(Integer, nullable=True, index=True)
    thyrocare_order_id = Column(String(100), nullable=True, index=True)
    thyrocare_product_id = Column(Integer, nullable=True)
    thyrocare_booking_status = Column(String(20), nullable=True, index=True)
    thyrocare_booking_error = Column(String(500), nullable=True)
    order_status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING_PAYMENT)
    status_updated_at = Column(DateTime(timezone=True), default=now_ist, onupdate=now_ist)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    technician_name = Column(String(100), nullable=True)
    technician_contact = Column(String(20), nullable=True)

    order = relationship("Order", backref="items")


# ── thyrocare tracking ────────────────────────────────────────────────────────

class ThyrocareOrderTracking(Base):
    __tablename__ = "thyrocare_order_tracking"

    id = Column(Integer, primary_key=True, index=True)
    thyrocare_order_id = Column(String(50), unique=True, nullable=False, index=True)
    our_order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)

    current_order_status = Column(String(100), nullable=True)
    current_status_description = Column(String(100), nullable=True)

    phlebo_name = Column(String(200), nullable=True)
    phlebo_contact = Column(String(50), nullable=True)
    appointment_date = Column(DateTime(timezone=True), nullable=True)

    last_webhook_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_ist, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_ist, onupdate=now_ist)

    user_id = Column(Integer, nullable=True, index=True)
    member_ids = Column(JSON, nullable=True)
    order_item_ids = Column(JSON, nullable=True)
    thyrocare_product_id = Column(Integer, nullable=True, index=True)
    ref_order_no = Column(String(100), nullable=True, index=True)

    our_order = relationship("Order", foreign_keys=[our_order_id])
    patients = relationship("ThyrocarePatientTracking", back_populates="order_tracking", cascade="all, delete-orphan")
    status_history = relationship("ThyrocareOrderStatusHistory", back_populates="order_tracking", cascade="all, delete-orphan")


class ThyrocarePatientTracking(Base):
    __tablename__ = "thyrocare_patient_tracking"
    __table_args__ = (
        UniqueConstraint("thyrocare_order_id", "patient_id", name="uq_thyrocare_patient_order_patient"),
    )

    id = Column(Integer, primary_key=True, index=True)
    thyrocare_order_id = Column(String(50), nullable=False, index=True)
    order_tracking_id = Column(Integer, ForeignKey("thyrocare_order_tracking.id", ondelete="CASCADE"), nullable=False, index=True)

    patient_id = Column(String(50), nullable=False, index=True)
    patient_name = Column(String(200), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)

    is_report_available = Column(Boolean, nullable=True, default=False)
    report_url = Column(Text, nullable=True)
    report_pdf_s3_url = Column(Text, nullable=True)
    report_pdf_s3_key = Column(Text, nullable=True)
    report_timestamp = Column(DateTime(timezone=True), nullable=True)
    current_status = Column(String(100), nullable=True)

    member_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=now_ist, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_ist, onupdate=now_ist)

    order_tracking = relationship("ThyrocareOrderTracking", back_populates="patients")


class ThyrocareOrderStatusHistory(Base):
    __tablename__ = "thyrocare_order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    thyrocare_order_id = Column(String(50), nullable=False, index=True)
    order_tracking_id = Column(Integer, ForeignKey("thyrocare_order_tracking.id", ondelete="CASCADE"), nullable=False, index=True)

    order_status = Column(String(100), nullable=True)
    order_status_description = Column(String(100), nullable=True)
    thyrocare_timestamp = Column(String(50), nullable=True)
    b2c_patient_id = Column(String(50), nullable=True)

    raw_payload = Column(JSON, nullable=True)
    received_at = Column(DateTime(timezone=True), default=now_ist, nullable=False)

    order_tracking = relationship("ThyrocareOrderTracking", back_populates="status_history")
