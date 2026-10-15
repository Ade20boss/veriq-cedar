"""Task 003 internal contracts only; no HTTP or AI wire contract is approved here."""

from datetime import timedelta
from hashlib import sha256
from typing import Annotated, Literal, Protocol

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

Identifier = Annotated[str, Field(min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_.:/-]+$")]
Digest = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]


class InternalModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Evidence(InternalModel):
    evidence_id: Identifier
    source_id: Identifier
    locator: Identifier
    digest: Digest
    visibility: Literal["BANK_OPERATIONAL"] = "BANK_OPERATIONAL"


class MetricEvent(InternalModel):
    contract_version: Literal["g0.internal.1"] = "g0.internal.1"
    bank_id: Identifier
    source_system: Identifier
    event_id: Identifier
    event_type: Literal["ROUTE_METRIC_SNAPSHOT"] = "ROUTE_METRIC_SNAPSHOT"
    occurred_at: AwareDatetime
    observed_at: AwareDatetime
    route_id: Identifier
    service_id: Identifier
    window_start: AwareDatetime
    window_end: AwareDatetime
    baseline_start: AwareDatetime
    baseline_end: AwareDatetime
    attempts: Annotated[int, Field(strict=True, ge=0)]
    timeouts: Annotated[int, Field(strict=True, ge=0)]
    baseline_attempts: Annotated[int, Field(strict=True, ge=0)]
    baseline_timeouts: Annotated[int, Field(strict=True, ge=0)]
    evidence: Evidence

    @model_validator(mode="after")
    def valid_window(self):
        if not (self.baseline_start < self.baseline_end <= self.window_start < self.window_end):
            raise ValueError("Non-overlapping historical baseline and observation required")
        if self.window_end - self.window_start != timedelta(minutes=5):
            raise ValueError("G0 accepts five-minute metric snapshots only")
        if not self.window_end == self.occurred_at <= self.observed_at:
            raise ValueError("Event and observation times must follow the window")
        if self.timeouts > self.attempts or self.baseline_timeouts > self.baseline_attempts:
            raise ValueError("Timeouts cannot exceed attempts")
        return self

    def fingerprint(self) -> str:
        return sha256(self.model_dump_json().encode()).hexdigest()


class Principal(InternalModel):
    """Trusted composition configuration, never constructed from an unchecked request."""

    bank_id: Identifier
    source_system: Identifier
    purpose: Literal["OPERATIONAL_MONITORING"] = "OPERATIONAL_MONITORING"

    def authorize(self, event: MetricEvent):
        if (event.bank_id, event.source_system) != (self.bank_id, self.source_system):
            raise PermissionError("Operational source scope denied")


class IncidentStatus(InternalModel):
    contract_version: Literal["g0.internal.1"] = "g0.internal.1"
    delivery_id: Identifier
    bank_id: Identifier
    incident_id: Identifier
    investigation_id: Identifier
    revision: Annotated[int, Field(strict=True, ge=1)]
    incident_status: Literal["SUSPECTED"] = "SUSPECTED"
    investigation_status: Literal["REQUESTED", "EVIDENCE_READY_AI_UNAVAILABLE"]
    review_status: Literal["UNREVIEWED"] = "UNREVIEWED"
    route_id: Identifier
    service_id: Identifier
    evidence_ids: tuple[Identifier, ...]
    bank_case_ids: tuple[()] = ()
    emitted_at: AwareDatetime


class EventSource(Protocol):
    def read_events(self) -> tuple[MetricEvent, ...]: ...


class ResultSink(Protocol):
    def deliver(self, status: IncidentStatus) -> str: ...
