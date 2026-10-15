"""Approved v1.0 projections from actual G0 receipts/incidents."""

from datetime import timedelta

from sqlalchemy import select

from veriq_cedar.integration.operational import MetricEvent
from veriq_cedar.veriq.operations.detector import DetectionRule
from veriq_cedar.veriq.operations.service import database_now
from veriq_cedar.veriq.persistence.operational import EventReceipt, Incident, SupportingEvidence
from veriq_cedar.veriq.persistence.pitch import CaseInvestigation


class OperationalRead:
    def __init__(self, sessions):
        self.sessions = sessions

    def operations(self, bank):
        with self.sessions() as session:
            now = database_now(session)
            latest = {}
            rows = session.scalars(
                select(EventReceipt)
                .where(EventReceipt.bank_id == bank)
                .order_by(EventReceipt.window_end.desc(), EventReceipt.accepted_at.desc())
            ).all()
            for row in rows:
                signature = (row.route_id, row.service_id)
                if signature in latest:
                    continue
                event = MetricEvent.model_validate(row.payload)
                eligible = timedelta(0) <= now - event.window_end <= timedelta(minutes=10)
                enough = event.attempts >= 20 and event.baseline_attempts >= 100
                status = (
                    "INSUFFICIENT_DATA"
                    if not eligible or not enough
                    else ("DEGRADED" if DetectionRule().qualifies(event, now) else "NORMAL")
                )
                latest[signature] = {
                    "route_id": row.route_id,
                    "service_id": row.service_id,
                    "window_attempts": event.attempts,
                    "window_timeouts": event.timeouts,
                    "baseline_attempts": event.baseline_attempts,
                    "baseline_timeouts": event.baseline_timeouts,
                    "status": status,
                }
            return list(latest.values())

    def incidents(self, bank, incident_id=None):
        with self.sessions() as session:
            query = select(Incident).where(Incident.bank_id == bank)
            if incident_id:
                query = query.where(Incident.id == incident_id)
            result = []
            for incident in session.scalars(query.order_by(Incident.opened_at, Incident.id)):
                refs = session.scalars(
                    select(SupportingEvidence.evidence_id).where(
                        SupportingEvidence.bank_id == bank,
                        SupportingEvidence.incident_id == incident.id,
                    )
                ).all()
                result.append(
                    {
                        "id": incident.id,
                        "bank_id": bank,
                        "route_id": incident.route_id,
                        "status": incident.state,
                        "first_observed_at": incident.opened_at,
                        "finding_summary": "Deterministic route timeout threshold exceeded; "
                        "operational issue suspected, cause unverified.",
                        "evidence_ids": refs,
                        "case_ids": session.scalars(
                            select(CaseInvestigation.case_id).where(
                                CaseInvestigation.bank_id == bank,
                                CaseInvestigation.incident_ids.contains([incident.id]),
                            )
                        ).all(),
                    }
                )
            return result
