"""Veriq-owned G0 persistence; no Cedar model/session dependencies."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.veriq.persistence.base import VeriqBase


class Identity:
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    id: Mapped[str] = mapped_column(String(160), primary_key=True)


class EventReceipt(Identity, VeriqBase):
    __tablename__ = "operational_events"
    __table_args__ = (
        UniqueConstraint(
            "bank_id", "source_system", "event_id", name="uq_operational_event_identity"
        ),
        UniqueConstraint(
            "bank_id",
            "source_system",
            "route_id",
            "service_id",
            "window_start",
            "window_end",
            name="uq_operational_metric_window",
        ),
    )
    source_system: Mapped[str] = mapped_column(String(160))
    event_id: Mapped[str] = mapped_column(String(160))
    route_id: Mapped[str] = mapped_column(String(160))
    service_id: Mapped[str] = mapped_column(String(160))
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    digest: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSONB)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Incident(Identity, VeriqBase):
    __tablename__ = "incidents"
    __table_args__ = (
        UniqueConstraint("bank_id", "rule_id", "rule_version", "route_id", "service_id"),
    )
    rule_id: Mapped[str] = mapped_column(String(160))
    rule_version: Mapped[str] = mapped_column(String(160))
    route_id: Mapped[str] = mapped_column(String(160))
    service_id: Mapped[str] = mapped_column(String(160))
    state: Mapped[str] = mapped_column(String(40))
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    rule_config: Mapped[dict] = mapped_column(JSONB)


class SupportingEvidence(Identity, VeriqBase):
    __tablename__ = "incident_evidence"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "incident_id"], ["veriq.incidents.bank_id", "veriq.incidents.id"]
        ),
        ForeignKeyConstraint(
            ["bank_id", "receipt_id"],
            ["veriq.operational_events.bank_id", "veriq.operational_events.id"],
        ),
        UniqueConstraint("bank_id", "incident_id", "receipt_id"),
    )
    incident_id: Mapped[str] = mapped_column(String(160))
    receipt_id: Mapped[str] = mapped_column(String(160))
    evidence_id: Mapped[str] = mapped_column(String(160))
    revision: Mapped[int] = mapped_column(Integer)


class Investigation(Identity, VeriqBase):
    __tablename__ = "incident_investigations"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "incident_id"], ["veriq.incidents.bank_id", "veriq.incidents.id"]
        ),
        UniqueConstraint("bank_id", "incident_id"),
    )
    incident_id: Mapped[str] = mapped_column(String(160))
    state: Mapped[str] = mapped_column(String(40))
    review_status: Mapped[str] = mapped_column(String(40))
    revision: Mapped[int] = mapped_column(Integer)
    evidence_revision: Mapped[int] = mapped_column(Integer)
    bundle: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    bundle_digest: Mapped[str | None] = mapped_column(String(64))
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Job(Identity, VeriqBase):
    __tablename__ = "investigation_jobs"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "investigation_id"],
            ["veriq.incident_investigations.bank_id", "veriq.incident_investigations.id"],
        ),
        UniqueConstraint("bank_id", "kind", "dedupe_key"),
    )
    investigation_id: Mapped[str] = mapped_column(String(160))
    run_id: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(40))
    dedupe_key: Mapped[str] = mapped_column(String(160))
    evidence_revision: Mapped[int] = mapped_column(Integer)
    state: Mapped[str] = mapped_column(String(40), index=True)
    attempts: Mapped[int] = mapped_column(Integer)
    generation: Mapped[int] = mapped_column(Integer)
    owner: Mapped[str | None] = mapped_column(String(160))
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(String(40))


class StatusDelivery(Identity, VeriqBase):
    __tablename__ = "status_deliveries"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "job_id"],
            ["veriq.investigation_jobs.bank_id", "veriq.investigation_jobs.id"],
        ),
        UniqueConstraint("bank_id", "job_id"),
    )
    job_id: Mapped[str] = mapped_column(String(160))
    payload: Mapped[dict] = mapped_column(JSONB)
