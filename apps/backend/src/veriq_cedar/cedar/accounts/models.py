"""Cedar-owned fictional identities, reference data and hashed demo sessions."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.base import CedarBase


class BankKey:
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    id: Mapped[str] = mapped_column(String(160), primary_key=True)


class Customer(BankKey, CedarBase):
    __tablename__ = "customers"
    display_name: Mapped[str] = mapped_column(String(160))


class Account(BankKey, CedarBase):
    __tablename__ = "accounts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "customer_id"], ["cedar.customers.bank_id", "cedar.customers.id"]
        ),
        UniqueConstraint("bank_id", "customer_id"),
        CheckConstraint("available_balance_kobo >= 0", name="nonnegative_balance"),
        CheckConstraint("currency = 'NGN'", name="ngn_currency"),
        CheckConstraint("status IN ('ACTIVE','FROZEN','CLOSED')", name="account_status"),
    )
    customer_id: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(16))
    currency: Mapped[str] = mapped_column(String(3))
    available_balance_kobo: Mapped[int] = mapped_column(BigInteger)


class Beneficiary(BankKey, CedarBase):
    __tablename__ = "beneficiaries"
    name: Mapped[str] = mapped_column(String(160))
    bank_name: Mapped[str] = mapped_column(String(160))


class DemoSession(CedarBase):
    __tablename__ = "demo_sessions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "customer_id"], ["cedar.customers.bank_id", "cedar.customers.id"]
        ),
    )
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String(160))
    customer_id: Mapped[str] = mapped_column(String(160))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
