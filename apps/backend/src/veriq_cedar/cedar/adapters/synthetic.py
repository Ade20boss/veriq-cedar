"""Allowlisted synthetic telemetry and idempotent Cedar status sink.

Exports only route aggregates from the developer fixture; no simulator dependency.
"""

import json
from datetime import datetime, timedelta
from hashlib import sha256
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.cedar.adapters.models import ResultInbox, ResultReceipt
from veriq_cedar.integration.operational import Evidence, IncidentStatus, MetricEvent, Principal


class SyntheticEvents:
    def __init__(self, principal: Principal, metrics: dict, now: datetime):
        self.principal, self.metrics, self.now = principal, metrics, now

    @classmethod
    def from_fixture(cls, fixture: Path, now: datetime):
        data = json.loads(fixture.read_text())
        # Select only the frozen permitted aggregate metric fields.
        metrics = {
            key: {
                field: row[field]
                for field in (
                    "route_id",
                    "service_id",
                    "baseline_attempts",
                    "baseline_timeouts",
                    "incident_window_attempts",
                    "incident_window_timeouts",
                )
            }
            for key, row in data["routes"].items()
        }
        return cls(Principal(bank_id="CED", source_system="cedar.synthetic.metrics"), metrics, now)

    def read_events(self) -> tuple[MetricEvent, ...]:
        events = []
        for key, row in sorted(self.metrics.items()):
            event_id = f"{key}/{self.now.isoformat().replace('+', '_')}"
            evidence = Evidence(
                evidence_id=f"metric/{event_id}",
                source_id="synthetic-route-aggregates",
                locator=f"routes/{key}",
                digest=sha256(json.dumps(row, sort_keys=True).encode()).hexdigest(),
            )
            events.append(
                MetricEvent(
                    bank_id=self.principal.bank_id,
                    source_system=self.principal.source_system,
                    event_id=event_id,
                    occurred_at=self.now,
                    observed_at=self.now,
                    route_id=row["route_id"],
                    service_id=row["service_id"],
                    window_start=self.now - timedelta(minutes=5),
                    window_end=self.now,
                    baseline_start=self.now - timedelta(days=1),
                    baseline_end=self.now - timedelta(minutes=5),
                    attempts=row["incident_window_attempts"],
                    timeouts=row["incident_window_timeouts"],
                    baseline_attempts=row["baseline_attempts"],
                    baseline_timeouts=row["baseline_timeouts"],
                    evidence=evidence,
                )
            )
        return tuple(events)


class CedarResultSink:
    def __init__(self, sessions: sessionmaker[Session], bank_id: str):
        self.sessions, self.bank_id = sessions, bank_id

    def deliver(self, status: IncidentStatus) -> str:
        status = IncidentStatus.model_validate(status.model_dump())
        if status.bank_id != self.bank_id:
            raise PermissionError("Result bank scope denied")
        digest = sha256(status.model_dump_json().encode()).hexdigest()
        with self.sessions.begin() as session:
            # Per-investigation serialization covers first insertion and out-of-order delivery.
            session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"),
                {"key": f"cedar-status/{status.bank_id}/{status.investigation_id}"},
            )
            receipt = session.get(ResultReceipt, (status.bank_id, status.delivery_id))
            if receipt:
                if receipt.digest != digest:
                    raise ValueError("Conflicting delivery identity")
                return status.delivery_id
            inbox = session.get(ResultInbox, (status.bank_id, status.investigation_id))
            payload = status.model_dump(mode="json")
            if inbox is None:
                session.add(
                    ResultInbox(
                        bank_id=status.bank_id,
                        investigation_id=status.investigation_id,
                        revision=status.revision,
                        payload=payload,
                    )
                )
            elif inbox.revision < status.revision:
                inbox.revision, inbox.payload = status.revision, payload
            elif inbox.revision == status.revision and inbox.payload != payload:
                raise ValueError("Conflicting status revision")
            session.add(
                ResultReceipt(bank_id=status.bank_id, delivery_id=status.delivery_id, digest=digest)
            )
        return status.delivery_id
