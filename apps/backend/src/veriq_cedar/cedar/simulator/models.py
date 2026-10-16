"""Private synthetic network data. Never imported by customer/Veriq modules."""

from sqlalchemy import BigInteger, CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.cedar.simulator.base import SimulatorBase


class NetworkPolicy(SimulatorBase):
    __tablename__ = "network_policy"
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    scenario: Mapped[str] = mapped_column(String(2))
    __table_args__ = (CheckConstraint("scenario IN ('S0','S2')", name="supported_scenario"),)


class RecipientCredit(SimulatorBase):
    __tablename__ = "recipient_credits"
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    transfer_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    instruction_id: Mapped[str] = mapped_column(String(160))
    digest: Mapped[str] = mapped_column(String(64))
    recipient_bank_id: Mapped[str] = mapped_column(String(160))
    recipient_account_id: Mapped[str] = mapped_column(String(160))
    credited_kobo: Mapped[int] = mapped_column(BigInteger)
    scenario: Mapped[str] = mapped_column(String(2))
    __table_args__ = (CheckConstraint("credited_kobo > 0", name="positive_credit"),)
