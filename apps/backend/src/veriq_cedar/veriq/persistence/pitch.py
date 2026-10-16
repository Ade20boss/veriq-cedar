"""Pitch persistence: staff capabilities and bank-case investigations, never Cedar models."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.veriq.persistence.base import VeriqBase
from veriq_cedar.veriq.persistence.operational import Identity


class StaffSession(VeriqBase):
    __tablename__ = "investigator_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(40))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class CaseInvestigation(Identity, VeriqBase):
    __tablename__ = "case_investigations"
    __table_args__ = (UniqueConstraint("bank_id", "case_id"),)
    case_id: Mapped[str] = mapped_column(String(160))
    revision: Mapped[int] = mapped_column(Integer)
    state: Mapped[str] = mapped_column(String(40))
    event: Mapped[dict] = mapped_column(JSONB)
    bundle: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    incident_ids: Mapped[list] = mapped_column(JSONB)


class CaseReceipt(Identity, VeriqBase):
    __tablename__ = "case_event_receipts"
    __table_args__ = (UniqueConstraint("bank_id", "event_id"),)
    event_id: Mapped[str] = mapped_column(String(256))
    digest: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSONB)
