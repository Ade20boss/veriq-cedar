"""Cedar-owned permitted result inbox. No bank case/financial persistence."""

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.base import CedarBase


class ResultReceipt(CedarBase):
    __tablename__ = "investigation_result_receipts"
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    delivery_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    digest: Mapped[str] = mapped_column(String(64))


class ResultInbox(CedarBase):
    __tablename__ = "investigation_status_inbox"
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    revision: Mapped[int] = mapped_column(Integer)
    payload: Mapped[dict] = mapped_column(JSONB)
