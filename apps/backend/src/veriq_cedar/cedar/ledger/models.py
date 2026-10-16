"""Posted journals/entries: append-only; database constraint triggers enforce accounting."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.accounts.models import BankKey
from veriq_cedar.cedar.base import CedarBase


class LedgerAccount(BankKey, CedarBase):
    __tablename__ = "ledger_accounts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "account_id"], ["cedar.accounts.bank_id", "cedar.accounts.id"]
        ),
        UniqueConstraint("bank_id", "account_id"),
        CheckConstraint(
            "kind IN ('DEPOSIT_LIABILITY','OUTGOING_TRANSFER_CLEARING','DEMO_CASH_ASSET')",
            name="ledger_account_kind",
        ),
    )
    kind: Mapped[str] = mapped_column(String(40))
    account_id: Mapped[str | None] = mapped_column(String(160))


class Journal(BankKey, CedarBase):
    __tablename__ = "ledger_journals"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "account_id"], ["cedar.accounts.bank_id", "cedar.accounts.id"]
        ),
        ForeignKeyConstraint(
            ["bank_id", "transfer_id"], ["cedar.transfers.bank_id", "cedar.transfers.id"]
        ),
        UniqueConstraint("bank_id", "transfer_id"),
        CheckConstraint("amount_kobo > 0", name="journal_positive_amount"),
        CheckConstraint("kind IN ('OPENING','TRANSFER_DEBIT')", name="journal_kind"),
    )
    account_id: Mapped[str] = mapped_column(String(160))
    transfer_id: Mapped[str | None] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(40))
    amount_kobo: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("clock_timestamp()")
    )
    created_xid: Mapped[str] = mapped_column(
        String(32), server_default=text("pg_current_xact_id()::text")
    )


class Entry(BankKey, CedarBase):
    __tablename__ = "ledger_entries"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "journal_id"], ["cedar.ledger_journals.bank_id", "cedar.ledger_journals.id"]
        ),
        ForeignKeyConstraint(
            ["bank_id", "ledger_account_id"],
            ["cedar.ledger_accounts.bank_id", "cedar.ledger_accounts.id"],
        ),
        CheckConstraint(
            "(debit_kobo > 0 AND credit_kobo = 0) OR (credit_kobo > 0 AND debit_kobo = 0)",
            name="one_positive_side",
        ),
    )
    journal_id: Mapped[str] = mapped_column(String(160))
    ledger_account_id: Mapped[str] = mapped_column(String(160))
    debit_kobo: Mapped[int] = mapped_column(BigInteger)
    credit_kobo: Mapped[int] = mapped_column(BigInteger)
