"""Accepted v1.0 success wire shapes; internal network capability types separate."""

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field


class WireModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class TransferInput(WireModel):
    beneficiary_bank_id: str
    beneficiary_account_id: str
    amount_kobo: Annotated[int, Field(strict=True, ge=1)]
    narration: str = ""


class NameEnquiryInput(WireModel):
    bank_id: str
    account_id: str


class Bank(WireModel):
    bank_id: str
    name: str
    is_fictional: bool = True


class AccountView(WireModel):
    id: str
    display_account_id: str
    currency: Literal["NGN"] = "NGN"
    available_balance_kobo: int
    owner_display_name: str


class NameEnquiryResult(WireModel):
    bank_id: str
    account_id: str
    beneficiary_name: str
    verified_in_simulation: bool = True


class Stage(StrEnum):
    CREATED = "CREATED"
    VALIDATED = "VALIDATED"
    DEBIT_POSTED = "DEBIT_POSTED"
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESPONSE_TIMEOUT = "RESPONSE_TIMEOUT"
    STATUS_QUERIED = "STATUS_QUERIED"
    COMPLETED = "COMPLETED"


class Outcome(StrEnum):
    UNKNOWN = "UNKNOWN"
    CREDIT_CONFIRMED = "CREDIT_CONFIRMED"
    FAILURE_CONFIRMED = "FAILURE_CONFIRMED"
    REVERSAL_POSTED = "REVERSAL_POSTED"


class TransferView(WireModel):
    id: str
    reference: str
    amount_kobo: int
    beneficiary_bank_id: str
    beneficiary_account_id: str
    processing_stage: Stage
    financial_outcome: Outcome
    last_evidence_id: str | None = None
    created_at: datetime
    updated_at: datetime


class PaymentRequest(WireModel):
    bank_id: str
    transfer_id: str
    instruction_id: str
    amount_kobo: Annotated[int, Field(strict=True, ge=1)]
    beneficiary_bank_id: str
    beneficiary_account_id: str


class NetworkObservation(WireModel):
    transfer_id: str
    instruction_id: str
    kind: Literal["CREDIT_RESPONSE", "OBSERVED_TIMEOUT"]
    evidence_id: str
    source: Literal["SYNTHETIC_GATEWAY"] = "SYNTHETIC_GATEWAY"
    amount_kobo: Annotated[int, Field(strict=True, ge=1)]
    beneficiary_bank_id: str
    beneficiary_account_id: str


class PaymentNetwork(Protocol):
    def submit(self, instruction: PaymentRequest) -> NetworkObservation: ...
