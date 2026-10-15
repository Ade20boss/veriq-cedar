"""Independent backend models for the frozen v1.0 AI wire contract."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


FinancialOutcome = Literal["UNKNOWN", "CREDIT_CONFIRMED", "FAILURE_CONFIRMED", "REVERSAL_POSTED"]
RelationStatus = Literal["CANDIDATE", "DOCUMENTED", "OBSERVED", "VERIFIED", "REJECTED"]
IncidentStatus = Literal["SUSPECTED", "CONFIRMED", "REJECTED", "CLOSED"]


class EvidenceRecord(ContractModel):
    id: str
    source_system: str
    kind: str
    observed_at: datetime
    occurred_at: datetime
    citation: str
    verified_for_purpose: bool
    data: dict[str, Any]


class KnowledgeRelationship(ContractModel):
    id: str
    bank_id: str
    from_entity_id: str
    to_entity_id: str
    type: str
    status: RelationStatus
    evidence_ids: list[str]
    source_id: str
    valid_from: datetime | None = None


class Incident(ContractModel):
    id: str
    bank_id: str
    route_id: str
    status: IncidentStatus
    first_observed_at: datetime
    finding_summary: str
    evidence_ids: list[str]
    case_ids: list[str]


class AIObservation(ContractModel):
    text: str
    evidence_ids: list[str]


class AIHypothesis(ContractModel):
    text: str
    evidence_ids: list[str]
    alternatives: list[str]


class AIInvestigationInput(ContractModel):
    case_id: str
    bank_id: str
    financial_outcome: FinancialOutcome
    question: str
    evidence: list[EvidenceRecord]
    known_relationships: list[KnowledgeRelationship]
    historical_incidents: list[Incident]


class AIInvestigationOutput(ContractModel):
    case_id: str
    financial_outcome: FinancialOutcome
    observations: list[AIObservation]
    hypotheses: list[AIHypothesis]
    unknowns: list[str]
    recommended_checks: list[str]
    customer_safe_update_draft: str
