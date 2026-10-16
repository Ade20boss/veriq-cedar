"""Neutral complaint receiver and case work; no Cedar persistence import or SQL."""

import json
from datetime import timedelta
from hashlib import sha256

from sqlalchemy import select, text

from veriq_cedar.integration.cases import CaseEvent
from veriq_cedar.veriq.operations.service import database_now, identity
from veriq_cedar.veriq.persistence.operational import EventReceipt, Incident, Job
from veriq_cedar.veriq.persistence.pitch import CaseInvestigation, CaseReceipt


class CaseReceiver:
    def __init__(self, sessions, bank="CED"):
        self.sessions, self.bank = sessions, bank

    def accept(self, event: CaseEvent) -> str:
        event = CaseEvent.model_validate(event.model_dump())
        if event.bank_id != self.bank:
            raise PermissionError("Case bank scope denied")
        digest = sha256(
            json.dumps(event.model_dump(mode="json"), sort_keys=True).encode()
        ).hexdigest()
        with self.sessions.begin() as session:
            session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": json.dumps(["case", self.bank, event.case_id])},
            )
            prior = session.scalar(
                select(CaseReceipt).where(
                    CaseReceipt.bank_id == self.bank, CaseReceipt.event_id == event.event_id
                )
            )
            if prior:
                if prior.digest != digest:
                    raise ValueError("Conflicting case event identity")
                return prior.id
            inv = session.scalar(
                select(CaseInvestigation)
                .where(
                    CaseInvestigation.bank_id == self.bank,
                    CaseInvestigation.case_id == event.case_id,
                )
                .with_for_update()
            )
            if inv is None:
                inv = CaseInvestigation(
                    bank_id=self.bank,
                    id=identity(),
                    case_id=event.case_id,
                    revision=0,
                    state="REQUESTED",
                    event={},
                    bundle=None,
                    incident_ids=[],
                )
                session.add(inv)
                session.flush()
            if inv.event and CaseEvent.model_validate(inv.event).observed_at > event.observed_at:
                raise ValueError("Stale case event")
            inv.revision += 1
            inv.state = "REQUESTED"
            inv.event = event.model_dump(mode="json")
            inv.bundle = None
            inv.incident_ids = []
            receipt = CaseReceipt(
                bank_id=self.bank,
                id=identity(),
                event_id=event.event_id,
                digest=digest,
                payload=event.model_dump(mode="json"),
            )
            session.add(receipt)
            time = database_now(session)
            session.add(
                Job(
                    bank_id=self.bank,
                    id=identity(),
                    investigation_id=None,
                    case_investigation_id=inv.id,
                    run_id=identity(),
                    kind="CASE_ANALYSIS",
                    dedupe_key=inv.id + "/" + str(inv.revision),
                    evidence_revision=inv.revision,
                    state="QUEUED",
                    attempts=0,
                    generation=0,
                    owner=None,
                    lease_until=None,
                    available_at=time,
                    updated_at=time,
                    last_error=None,
                )
            )
            return receipt.id


def assemble_case(session, job):
    inv = session.scalar(
        select(CaseInvestigation)
        .where(
            CaseInvestigation.bank_id == job.bank_id,
            CaseInvestigation.id == job.case_investigation_id,
        )
        .with_for_update()
    )
    if inv.revision != job.evidence_revision:
        job.last_error = "SUPERSEDED"
        return
    event = CaseEvent.model_validate(inv.event)
    evidence = [e.model_dump(mode="json") for e in event.evidence]
    evidence.append(
        {
            "id": "case/" + event.case_id,
            "source_system": "cedar.complaints",
            "kind": "CUSTOMER_REPORT",
            "observed_at": event.observed_at.isoformat(),
            "occurred_at": event.observed_at.isoformat(),
            "citation": "cedar.complaints/" + event.case_id,
            "verified_for_purpose": False,
            "data": {"case_id": event.case_id, "customer_report": event.customer_report},
        }
    )
    linked = []
    for incident in session.scalars(
        select(Incident).where(
            Incident.bank_id == job.bank_id,
            Incident.route_id == event.route_id,
            Incident.service_id == event.service_id,
            Incident.state == "SUSPECTED",
        )
    ):
        snapshots = session.scalars(
            select(EventReceipt).where(
                EventReceipt.bank_id == job.bank_id,
                EventReceipt.route_id == event.route_id,
                EventReceipt.service_id == event.service_id,
                EventReceipt.window_start <= event.transfer_at,
                EventReceipt.window_end >= event.transfer_at - timedelta(minutes=5),
                EventReceipt.accepted_at <= event.observed_at,
            )
        ).all()
        # Only the exact receipts that supported the incident, not arbitrary healthy snapshots.
        from veriq_cedar.veriq.persistence.operational import SupportingEvidence

        supporting = set(
            session.scalars(
                select(SupportingEvidence.receipt_id).where(
                    SupportingEvidence.bank_id == job.bank_id,
                    SupportingEvidence.incident_id == incident.id,
                )
            )
        )
        snapshots = [s for s in snapshots if s.id in supporting]
        if not snapshots:
            continue
        linked.append(incident.id)
        for row in snapshots:
            data = row.payload
            evidence.append(
                {
                    "id": data["evidence"]["evidence_id"],
                    "source_system": row.source_system,
                    "kind": "ROUTE_METRIC_SNAPSHOT",
                    "observed_at": data["observed_at"],
                    "occurred_at": data["occurred_at"],
                    "citation": data["evidence"]["source_id"]
                    + "/"
                    + data["evidence"]["locator"]
                    + "#"
                    + data["evidence"]["digest"],
                    "verified_for_purpose": True,
                    "data": {
                        "route_id": row.route_id,
                        "service_id": row.service_id,
                        "window_start": data["window_start"],
                        "window_end": data["window_end"],
                        "attempts": data["attempts"],
                        "timeouts": data["timeouts"],
                        "correlation_rule": "exact bank/route/service; "
                        "window plus five minutes; suspected only",
                    },
                }
            )
    inv.incident_ids = linked
    # Source-backed institutional relationships remain DOCUMENTED, never verified cause.
    from veriq_cedar.veriq.knowledge.models import Relationship, Source

    for edge in session.scalars(select(Relationship).where(Relationship.bank_id == job.bank_id)):
        if edge.from_id not in (event.route_id, event.service_id) and edge.to_id not in (
            event.route_id,
            event.service_id,
        ):
            continue
        source = session.get(Source, (job.bank_id, edge.source_id))
        if source.created_at > event.observed_at:
            continue
        evidence.append(
            {
                "id": edge.evidence_id,
                "source_system": "veriq.knowledge",
                "kind": "DOCUMENTED_RELATIONSHIP",
                "observed_at": source.created_at.isoformat(),
                "occurred_at": source.created_at.isoformat(),
                "citation": source.filename + "#" + edge.locator + "@sha256:" + source.checksum,
                "verified_for_purpose": True,
                "data": {
                    "from_entity_id": edge.from_id,
                    "to_entity_id": edge.to_id,
                    "type": edge.kind,
                    "status": "DOCUMENTED",
                },
            }
        )
    inv.bundle = {
        "case_id": event.case_id,
        "status": "EVIDENCE_READY_AI_UNAVAILABLE",
        "financial_outcome": event.financial_outcome,
        "evidence": evidence,
        "incident_ids": linked,
        "ai_result": None,
    }
    inv.state = "EVIDENCE_READY_AI_UNAVAILABLE"
