"""Atomic authorized receipt → deterministic incident → durable work/outbox."""

from dataclasses import asdict
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.integration.operational import IncidentStatus, MetricEvent, Principal
from veriq_cedar.veriq.operations.detector import DetectionRule
from veriq_cedar.veriq.persistence.operational import (
    EventReceipt,
    Incident,
    Investigation,
    Job,
    StatusDelivery,
    SupportingEvidence,
)


def identity() -> str:
    return str(uuid4())


def database_now(session: Session) -> datetime:
    return session.execute(text("SELECT clock_timestamp()")).scalar_one()


def enqueue(session: Session, inv: Investigation, kind: str, key: str, now: datetime) -> Job:
    job = Job(
        bank_id=inv.bank_id,
        id=identity(),
        investigation_id=inv.id,
        run_id=identity(),
        kind=kind,
        dedupe_key=key,
        evidence_revision=inv.evidence_revision,
        state="QUEUED",
        attempts=0,
        generation=0,
        owner=None,
        lease_until=None,
        available_at=now,
        updated_at=now,
        last_error=None,
    )
    session.add(job)
    session.flush()
    return job


def emit_status(session: Session, inv: Investigation, incident: Incident, now: datetime):
    refs = session.scalars(
        select(SupportingEvidence.evidence_id)
        .where(
            SupportingEvidence.bank_id == inv.bank_id, SupportingEvidence.incident_id == incident.id
        )
        .order_by(SupportingEvidence.revision, SupportingEvidence.id)
    ).all()
    delivery_id = identity()
    status = IncidentStatus(
        delivery_id=delivery_id,
        bank_id=inv.bank_id,
        incident_id=incident.id,
        investigation_id=inv.id,
        revision=inv.revision,
        investigation_status=inv.state,
        route_id=incident.route_id,
        service_id=incident.service_id,
        evidence_ids=tuple(refs),
        emitted_at=now,
    )
    job = enqueue(session, inv, "RESULT_DELIVERY", delivery_id, now)
    session.add(
        StatusDelivery(
            bank_id=inv.bank_id,
            id=delivery_id,
            job_id=job.id,
            payload=status.model_dump(mode="json"),
        )
    )


class EventProcessor:
    def __init__(
        self,
        sessions: sessionmaker[Session],
        principal: Principal,
        rule: DetectionRule | None = None,
    ):
        self.sessions, self.principal, self.rule = sessions, principal, rule or DetectionRule()

    def accept(self, event: MetricEvent) -> str:
        event = MetricEvent.model_validate(event.model_dump())
        self.principal.authorize(event)
        bank = event.bank_id
        with self.sessions.begin() as session:
            # Serialize identity first, then detector signature; both include tenant scope.
            for key in (
                f"event/{bank}/{event.source_system}/{event.event_id}",
                f"incident/{bank}/{self.rule.rule_id}/{self.rule.version}/{event.route_id}/{event.service_id}",
            ):
                session.execute(
                    text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"), {"key": key}
                )
            existing = session.scalar(
                select(EventReceipt).where(
                    EventReceipt.bank_id == bank,
                    EventReceipt.source_system == event.source_system,
                    EventReceipt.event_id == event.event_id,
                )
            )
            if existing:
                if existing.digest != event.fingerprint():
                    raise ValueError("Conflicting event identity")
                return existing.id
            window = session.scalar(
                select(EventReceipt).where(
                    EventReceipt.bank_id == bank,
                    EventReceipt.source_system == event.source_system,
                    EventReceipt.route_id == event.route_id,
                    EventReceipt.service_id == event.service_id,
                    EventReceipt.window_start == event.window_start,
                    EventReceipt.window_end == event.window_end,
                )
            )
            if window:
                raise ValueError(
                    "Snapshot interval already accepted; corrections require future policy"
                )
            now = database_now(session)
            if event.observed_at > now:
                raise ValueError("Future observations cannot be accepted")
            receipt = EventReceipt(
                bank_id=bank,
                id=identity(),
                source_system=event.source_system,
                event_id=event.event_id,
                route_id=event.route_id,
                service_id=event.service_id,
                window_start=event.window_start,
                window_end=event.window_end,
                digest=event.fingerprint(),
                payload=event.model_dump(mode="json"),
                accepted_at=now,
            )
            session.add(receipt)
            session.flush()
            if not self.rule.qualifies(event, now):
                return receipt.id
            incident = session.scalar(
                select(Incident).where(
                    Incident.bank_id == bank,
                    Incident.rule_id == self.rule.rule_id,
                    Incident.rule_version == self.rule.version,
                    Incident.route_id == event.route_id,
                    Incident.service_id == event.service_id,
                )
            )
            if incident is None:
                config = asdict(self.rule)
                config["max_lateness"] = self.rule.max_lateness.total_seconds()
                incident = Incident(
                    bank_id=bank,
                    id=identity(),
                    rule_id=self.rule.rule_id,
                    rule_version=self.rule.version,
                    route_id=event.route_id,
                    service_id=event.service_id,
                    state="SUSPECTED",
                    opened_at=now,
                    rule_config=config,
                )
                session.add(incident)
                session.flush()
                inv = Investigation(
                    bank_id=bank,
                    id=identity(),
                    incident_id=incident.id,
                    state="REQUESTED",
                    review_status="UNREVIEWED",
                    revision=0,
                    evidence_revision=0,
                    bundle=None,
                    bundle_digest=None,
                    opened_at=now,
                )
                session.add(inv)
                session.flush()
            else:
                inv = session.scalar(
                    select(Investigation)
                    .where(Investigation.bank_id == bank, Investigation.incident_id == incident.id)
                    .with_for_update()
                )
            inv.evidence_revision += 1
            inv.revision += 1
            inv.state = "REQUESTED"
            inv.bundle, inv.bundle_digest = None, None
            session.add(
                SupportingEvidence(
                    bank_id=bank,
                    id=identity(),
                    incident_id=incident.id,
                    receipt_id=receipt.id,
                    evidence_id=event.evidence.evidence_id,
                    revision=inv.evidence_revision,
                )
            )
            session.flush()
            enqueue(session, inv, "INCIDENT_ANALYSIS", f"{inv.id}/{inv.evidence_revision}", now)
            emit_status(session, inv, incident, now)
            return receipt.id
