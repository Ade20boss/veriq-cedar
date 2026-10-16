"""Veriq-only snapshot provenance, scheduling and revision checks. No network I/O here."""

import json
from datetime import datetime, timedelta
from hashlib import sha256

from sqlalchemy import select

from veriq_cedar.integration.ai import AIInvestigationInput
from veriq_cedar.integration.cases import CaseEvent
from veriq_cedar.veriq.ai.client import AIError
from veriq_cedar.veriq.knowledge.models import Relationship, Source
from veriq_cedar.veriq.operations.service import database_now, identity
from veriq_cedar.veriq.persistence.operational import (
    EventReceipt,
    Incident,
    Job,
    SupportingEvidence,
)
from veriq_cedar.veriq.persistence.pitch import CaseAI, CaseReceipt

QUESTION = (
    "Review this bank-permitted case snapshot. Describe supported observations, advisory "
    "hypotheses and alternatives, unresolved facts and authorized evidence checks. "
    "Customer reports are unverified; DOCUMENTED topology is not verified causality. "
    "Preserve the bank financial outcome. Do not publish messages or perform financial actions."
)


def digest(value):
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def bundle_digest(bundle):
    return digest(
        {k: bundle[k] for k in ("case_id", "financial_outcome", "evidence", "incident_ids")}
    )


def build_request(session, inv):
    event = CaseEvent.model_validate(inv.event)
    receipt = session.scalar(
        select(CaseReceipt).where(
            CaseReceipt.bank_id == inv.bank_id,
            CaseReceipt.event_id == event.event_id,
        )
    )
    if (
        event.bank_id != inv.bank_id
        or event.case_id != inv.case_id
        or receipt is None
        or receipt.payload != inv.event
        or inv.bundle["financial_outcome"] != event.financial_outcome
    ):
        raise AIError("AI_INPUT_SCOPE_INVALID")
    request = {
        "case_id": inv.case_id,
        "bank_id": inv.bank_id,
        "financial_outcome": event.financial_outcome,
        "question": QUESTION,
        "evidence": inv.bundle["evidence"],
        "known_relationships": [],
        "historical_incidents": [],
    }
    # Input DTO has no bank field on EvidenceRecord: enforce scope using persisted provenance.
    originals = {e.id: e.model_dump(mode="json") for e in event.evidence}
    ids = set()
    for evidence in request["evidence"]:
        eid, kind = evidence["id"], evidence["kind"]
        if eid in ids or datetime.fromisoformat(evidence["observed_at"]) > event.observed_at:
            raise AIError("AI_INPUT_SCOPE_INVALID")
        ids.add(eid)
        if kind in {"TRANSFER_STATE", "TRANSFER_STAGE"}:
            if evidence != originals.get(eid):
                raise AIError("AI_INPUT_SCOPE_INVALID")
        elif kind == "CUSTOMER_REPORT":
            if (
                eid != "case/" + inv.case_id
                or evidence["verified_for_purpose"]
                or evidence["source_system"] != "cedar.complaints"
                or evidence["data"]
                != {"case_id": inv.case_id, "customer_report": event.customer_report}
            ):
                raise AIError("AI_INPUT_SCOPE_INVALID")
        elif kind == "DOCUMENTED_RELATIONSHIP":
            edge = session.scalar(
                select(Relationship).where(
                    Relationship.bank_id == inv.bank_id,
                    Relationship.evidence_id == eid,
                    Relationship.status == "DOCUMENTED",
                )
            )
            source = session.get(Source, (inv.bank_id, edge.source_id)) if edge else None
            if (
                source is None
                or source.created_at > event.observed_at
                or evidence["citation"]
                != source.filename + "#" + edge.locator + "@sha256:" + source.checksum
                or evidence["source_system"] != "veriq.knowledge"
                or not evidence["verified_for_purpose"]
                or evidence["data"]
                != {
                    "from_entity_id": edge.from_id,
                    "to_entity_id": edge.to_id,
                    "type": edge.kind,
                    "status": "DOCUMENTED",
                }
            ):
                raise AIError("AI_INPUT_SCOPE_INVALID")
            request["known_relationships"].append(
                {
                    "id": edge.id,
                    "bank_id": inv.bank_id,
                    "from_entity_id": edge.from_id,
                    "to_entity_id": edge.to_id,
                    "type": edge.kind,
                    "status": edge.status,
                    "evidence_ids": [eid],
                    "source_id": edge.source_id,
                    "valid_from": None,
                }
            )
        elif kind == "ROUTE_METRIC_SNAPSHOT":
            row = session.scalar(
                select(EventReceipt)
                .join(
                    SupportingEvidence,
                    (SupportingEvidence.bank_id == EventReceipt.bank_id)
                    & (SupportingEvidence.receipt_id == EventReceipt.id),
                )
                .where(
                    EventReceipt.bank_id == inv.bank_id,
                    EventReceipt.route_id == event.route_id,
                    EventReceipt.service_id == event.service_id,
                    EventReceipt.accepted_at <= event.observed_at,
                    EventReceipt.window_start <= event.transfer_at,
                    EventReceipt.window_end >= event.transfer_at - timedelta(minutes=5),
                    SupportingEvidence.incident_id.in_(inv.incident_ids),
                    SupportingEvidence.evidence_id == eid,
                )
                .limit(1)
            )
            if row is None:
                raise AIError("AI_INPUT_SCOPE_INVALID")
            p = row.payload
            expected = {
                "route_id": row.route_id,
                "service_id": row.service_id,
                "window_start": p["window_start"],
                "window_end": p["window_end"],
                "attempts": p["attempts"],
                "timeouts": p["timeouts"],
                "correlation_rule": "exact bank/route/service; "
                "window plus five minutes; suspected only",
            }
            if (
                not evidence["verified_for_purpose"]
                or evidence["data"] != expected
                or evidence["source_system"] != row.source_system
                or evidence["citation"]
                != p["evidence"]["source_id"]
                + "/"
                + p["evidence"]["locator"]
                + "#"
                + p["evidence"]["digest"]
            ):
                raise AIError("AI_INPUT_SCOPE_INVALID")
        else:
            raise AIError("AI_INPUT_SCOPE_INVALID")
    for incident in session.scalars(
        select(Incident).where(
            Incident.bank_id == inv.bank_id,
            Incident.id.in_(inv.incident_ids),
            Incident.opened_at <= event.observed_at,
            Incident.route_id == event.route_id,
            Incident.service_id == event.service_id,
        )
    ):
        refs = (
            set(
                session.scalars(
                    select(SupportingEvidence.evidence_id).where(
                        SupportingEvidence.bank_id == inv.bank_id,
                        SupportingEvidence.incident_id == incident.id,
                    )
                )
            )
            & ids
        )
        if refs:
            request["historical_incidents"].append(
                {
                    "id": incident.id,
                    "bank_id": inv.bank_id,
                    "route_id": incident.route_id,
                    "status": "SUSPECTED",
                    "first_observed_at": incident.opened_at.isoformat(),
                    "finding_summary": "Persisted operational suspicion; cause unverified.",
                    "evidence_ids": sorted(refs),
                    "case_ids": [inv.case_id],
                }
            )
    if (
        len(ids) > 100
        or len(request["known_relationships"]) > 100
        or len(request["historical_incidents"]) > 50
    ):
        raise AIError("AI_INPUT_TOO_LARGE")
    return AIInvestigationInput.model_validate_json(json.dumps(request))


def schedule(session, inv):
    from pydantic import ValidationError

    try:
        request = build_request(session, inv).model_dump(mode="json")
    except (AIError, ValidationError, ValueError, KeyError, TypeError):
        # Deterministic bundle remains committed, even if not eligible for optional AI.
        return False
    time, jid = database_now(session), identity()
    session.add(
        Job(
            bank_id=inv.bank_id,
            id=jid,
            investigation_id=None,
            case_investigation_id=inv.id,
            run_id=identity(),
            kind="CASE_AI",
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
    session.flush()
    session.add(
        CaseAI(
            bank_id=inv.bank_id,
            id=jid,
            case_investigation_id=inv.id,
            revision=inv.revision,
            request=request,
            request_digest=digest(request),
            bundle_digest=bundle_digest(inv.bundle),
            result=None,
            provider_mode=None,
            created_at=time,
            completed_at=None,
        )
    )
    inv.state = "AI_PENDING"
    inv.bundle = {**inv.bundle, "status": "AI_PENDING"}
    return True
