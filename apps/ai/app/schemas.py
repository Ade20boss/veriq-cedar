"""Exact public request/response fields from Veriq_Cedar_API_Contract_v1.0.yaml.

Do not add fields to these wire models without an approved contract amendment.
Internal configuration, errors and prompts are not part of the wire contract.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class KnowledgeChunk(ContractModel):
    chunk_id: str
    text: str


class ClaimSubject(ContractModel):
    type: str
    external_id: str


class AIClaim(ContractModel):
    claim_id: str
    subject: ClaimSubject
    predicate: str
    object: str
    source_locator: str
    quoted_evidence: str
    classification: Literal["SOURCE_CLAIM", "CANDIDATE_RELATIONSHIP"]
    needs_review: bool


class AIExtractInput(ContractModel):
    bank_id: str
    source_id: str
    source_kind: str
    chunks: list[KnowledgeChunk]


class AIExtractOutput(ContractModel):
    source_id: str
    claims: list[AIClaim]
    unresolved_mentions: list[str]
    warnings: list[str]


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
