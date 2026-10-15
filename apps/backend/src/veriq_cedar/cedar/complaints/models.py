"""Cedar-owned complaint and atomic, durable permitted event outbox."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.accounts.models import BankKey
from veriq_cedar.cedar.base import CedarBase


class Complaint(BankKey, CedarBase):
    __tablename__ = "complaints"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
    )
    customer_id: Mapped[str] = mapped_column(String(160))
    transfer_id: Mapped[str] = mapped_column(String(160))
    reference: Mapped[str] = mapped_column(String(160))
    customer_report: Mapped[str] = mapped_column(String(2000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ComplaintOutbox(BankKey, CedarBase):
    __tablename__ = "complaint_outbox"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "case_id"], ["cedar.complaints.bank_id", "cedar.complaints.id"]
        ),
    )
    case_id: Mapped[str] = mapped_column(String(160))
    payload: Mapped[dict] = mapped_column(JSONB)
    state: Mapped[str] = mapped_column(String(40), index=True)
    attempts: Mapped[int] = mapped_column(Integer)
    generation: Mapped[int] = mapped_column(Integer)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
