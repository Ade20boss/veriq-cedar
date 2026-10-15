"""Sender-visible transfers, immutable evidence/events and durable dispatch state."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.accounts.models import BankKey
from veriq_cedar.cedar.base import CedarBase


class Transfer(BankKey, CedarBase):
    __tablename__ = "transfers"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "account_id"], ["cedar.accounts.bank_id", "cedar.accounts.id"]
        ),
        ForeignKeyConstraint(
            ["bank_id", "customer_id"], ["cedar.customers.bank_id", "cedar.customers.id"]
        ),
        ForeignKeyConstraint(
            ["beneficiary_bank_id", "beneficiary_account_id"],
            ["cedar.beneficiaries.bank_id", "cedar.beneficiaries.id"],
        ),
        UniqueConstraint("reference"),
        CheckConstraint("amount_kobo > 0", name="transfer_positive_amount"),
        CheckConstraint(
            (
                "processing_stage IN ('CREATED','VALIDATED','DEBIT_POSTED','SUBMITTED',"
                "'ACKNOWLEDGED','RESPONSE_TIMEOUT','STATUS_QUERIED','COMPLETED')"
            ),
            name="transfer_stage",
        ),
        CheckConstraint(
            (
                "financial_outcome IN "
                "('UNKNOWN','CREDIT_CONFIRMED','FAILURE_CONFIRMED','REVERSAL_POSTED')"
            ),
            name="transfer_outcome",
        ),
    )
    customer_id: Mapped[str] = mapped_column(String(160))
    account_id: Mapped[str] = mapped_column(String(160))
    reference: Mapped[str] = mapped_column(String(160))
    amount_kobo: Mapped[int] = mapped_column(BigInteger)
    beneficiary_bank_id: Mapped[str] = mapped_column(String(160))
    beneficiary_account_id: Mapped[str] = mapped_column(String(160))
    route_id: Mapped[str] = mapped_column(String(160))
    service_id: Mapped[str] = mapped_column(String(160))
    narration: Mapped[str | None] = mapped_column(String)
    processing_stage: Mapped[str] = mapped_column(String(40))
    financial_outcome: Mapped[str] = mapped_column(String(40))
    last_evidence_id: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Idempotency(CedarBase):
    __tablename__ = "transfer_idempotency"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id"),
    )
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    key: Mapped[str] = mapped_column(String, primary_key=True)
    digest: Mapped[str] = mapped_column(String(64))
    transfer_id: Mapped[str] = mapped_column(String(160))


class BankingEvent(BankKey, CedarBase):
    __tablename__ = "banking_events"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id", "stage"),
    )
    transfer_id: Mapped[str] = mapped_column(String(160))
    stage: Mapped[str] = mapped_column(String(40))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    payload: Mapped[dict] = mapped_column(JSONB)


class PaymentInstruction(BankKey, CedarBase):
    __tablename__ = "payment_instructions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id"),
    )
    transfer_id: Mapped[str] = mapped_column(String(160))
    state: Mapped[str] = mapped_column(String(20), index=True)
    attempts: Mapped[int] = mapped_column(Integer)
    generation: Mapped[int] = mapped_column(Integer)
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class TransferAttempt(BankKey, CedarBase):
    __tablename__ = "transfer_attempts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id", "attempt_number"),
    )
    transfer_id: Mapped[str] = mapped_column(String(160))
    attempt_number: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PaymentEvidence(BankKey, CedarBase):
    __tablename__ = "payment_evidence"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id", "kind"),
    )
    transfer_id: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(40))
    source: Mapped[str] = mapped_column(String(40))
    amount_kobo: Mapped[int] = mapped_column(BigInteger)
    beneficiary_bank_id: Mapped[str] = mapped_column(String(160))
    beneficiary_account_id: Mapped[str] = mapped_column(String(160))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
