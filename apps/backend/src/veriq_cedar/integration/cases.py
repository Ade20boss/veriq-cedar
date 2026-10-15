"""Authorized sender-visible case projection; no private financial truth or ORM types."""

from typing import Literal, Protocol

from pydantic import AwareDatetime, Field, model_validator

from veriq_cedar.integration.operational import InternalModel


class CaseEvidence(InternalModel):
    id: str
    source_system: Literal["cedar.transfer_orchestrator"]
    kind: Literal["TRANSFER_STATE", "TRANSFER_STAGE"]
    observed_at: AwareDatetime
    occurred_at: AwareDatetime
    citation: str
    verified_for_purpose: Literal[True] = True
    data: dict

    @model_validator(mode="after")
    def permitted(self):
        allowed = {
            "stage",
            "financial_outcome",
            "transfer_id",
            "route_id",
            "service_id",
            "amount_kobo",
            "beneficiary_bank_id",
            "beneficiary_account_id",
        }
        if set(self.data) - allowed:
            raise ValueError("Unpermitted evidence fields")
        return self


class CaseEvent(InternalModel):
    version: Literal["g2.internal.1"] = "g2.internal.1"
    bank_id: str
    source_system: Literal["cedar.complaints"] = "cedar.complaints"
    event_id: str
    case_id: str
    transfer_id: str
    customer_report: str = Field(min_length=5, max_length=2000)
    route_id: str
    service_id: str
    transfer_at: AwareDatetime
    observed_at: AwareDatetime
    financial_outcome: Literal[
        "UNKNOWN", "CREDIT_CONFIRMED", "FAILURE_CONFIRMED", "REVERSAL_POSTED"
    ]
    evidence: tuple[CaseEvidence, ...] = Field(min_length=1)

    @model_validator(mode="after")
    def scope(self):
        if any(
            e.data.get("transfer_id") != self.transfer_id
            or e.data.get("route_id") != self.route_id
            or e.data.get("service_id") != self.service_id
            for e in self.evidence
        ):
            raise ValueError("Case evidence scope mismatch")
        return self


class CaseReceiver(Protocol):
    def accept(self, event: CaseEvent) -> str: ...
