"""Short DB leases, SKIP LOCKED claims, fenced completion, bounded retries.

Opt-in case AI calls occur outside DB transactions.
External result delivery also occurs outside transactions.
"""

import json
from dataclasses import dataclass
from datetime import timedelta
from hashlib import sha256

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.integration.operational import IncidentStatus, ResultSink
from veriq_cedar.veriq.operations.service import database_now, emit_status
from veriq_cedar.veriq.persistence.operational import (
    EventReceipt,
    Incident,
    Investigation,
    Job,
    StatusDelivery,
    SupportingEvidence,
)


@dataclass(frozen=True)
class Claim:
    bank_id: str
    job_id: str
    owner: str
    generation: int
    kind: str


class Worker:
    def __init__(
        self,
        sessions: sessionmaker[Session],
        bank_id: str,
        owner: str,
        sink: ResultSink,
        *,
        lease_seconds: int = 60,
        max_attempts: int = 5,
        ai_client=None,
    ):
        if not 1 <= lease_seconds <= 3600 or not 1 <= max_attempts <= 20 or not owner:
            raise ValueError("Invalid worker bounds")
        self.sessions, self.bank_id, self.owner, self.sink = sessions, bank_id, owner, sink
        self.lease_seconds, self.max_attempts = lease_seconds, max_attempts
        if ai_client is not None and ai_client.timeout_seconds > lease_seconds - 5:
            raise ValueError("AI timeout must leave five seconds before lease expiry")
        self.ai_client = ai_client

    def claim(self) -> Claim | None:
        with self.sessions.begin() as session:
            now = database_now(session)
            candidates = (
                select(Job)
                .where(
                    Job.bank_id == self.bank_id,
                    or_(
                        and_(Job.state.in_(("QUEUED", "RETRY_WAIT")), Job.available_at <= now),
                        and_(Job.state == "LEASED", Job.lease_until <= now),
                    ),
                )
                .order_by(Job.available_at, Job.id)
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            while (job := session.scalar(candidates)) is not None:
                job.generation += 1
                job.updated_at = now
                if job.attempts >= self.max_attempts:
                    job.state, job.last_error = "DEAD_LETTER", "ATTEMPTS_EXHAUSTED"
                    job.owner, job.lease_until = None, None
                    session.flush()
                    continue
                job.state, job.owner = "LEASED", self.owner
                job.attempts += 1
                job.lease_until = now + timedelta(seconds=self.lease_seconds)
                return Claim(job.bank_id, job.id, self.owner, job.generation, job.kind)
        return None

    def _fenced(self, session: Session, claim: Claim) -> Job | None:
        if claim.bank_id != self.bank_id or claim.owner != self.owner:
            return None
        job = session.scalar(
            select(Job)
            .where(Job.bank_id == claim.bank_id, Job.id == claim.job_id)
            .with_for_update()
        )
        now = database_now(session)
        if (
            job is None
            or job.state != "LEASED"
            or job.owner != claim.owner
            or job.kind != claim.kind
            or job.generation != claim.generation
            or job.lease_until <= now
        ):
            return None
        return job

    def finish(self, claim: Claim) -> bool:
        if claim.bank_id != self.bank_id or claim.owner != self.owner:
            return False
        if claim.kind == "CASE_ANALYSIS" and self.ai_client is not None:
            from veriq_cedar.veriq.ai_client.worker_bridge import complete_case_with_ai

            return complete_case_with_ai(self, claim)
        if claim.kind == "RESULT_DELIVERY":
            with self.sessions.begin() as session:
                if self._fenced(session, claim) is None:
                    return False
                outbox = session.scalar(
                    select(StatusDelivery).where(
                        StatusDelivery.bank_id == claim.bank_id,
                        StatusDelivery.job_id == claim.job_id,
                    )
                )
                status = IncidentStatus.model_validate(outbox.payload)
            # At-least-once: crash after sink commit before ack is safe by stable delivery ID.
            if self.sink.deliver(status) != status.delivery_id:
                raise ValueError("Result acknowledgement identity mismatch")
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            if job.kind == "CASE_ANALYSIS":
                from veriq_cedar.veriq.investigations.cases import assemble_case

                assemble_case(session, job)
            if job.kind == "INCIDENT_ANALYSIS":
                inv = session.scalar(
                    select(Investigation)
                    .where(
                        Investigation.bank_id == job.bank_id,
                        Investigation.id == job.investigation_id,
                    )
                    .with_for_update()
                )
                if inv.evidence_revision != job.evidence_revision:
                    job.state, job.last_error = "SUCCEEDED", "SUPERSEDED"
                else:
                    rows = session.execute(
                        select(SupportingEvidence, EventReceipt)
                        .join(
                            EventReceipt,
                            and_(
                                SupportingEvidence.bank_id == EventReceipt.bank_id,
                                SupportingEvidence.receipt_id == EventReceipt.id,
                            ),
                        )
                        .where(
                            SupportingEvidence.bank_id == job.bank_id,
                            SupportingEvidence.incident_id == inv.incident_id,
                        )
                        .order_by(SupportingEvidence.revision, SupportingEvidence.id)
                    ).all()
                    # Immutable snapshots preserve source, time, window, baseline and evidence.
                    bundle = {
                        "contract_version": "g0.internal.1",
                        "bank_id": job.bank_id,
                        "evidence_revision": inv.evidence_revision,
                        "run_id": job.run_id,
                        "events": [row.payload for _, row in rows],
                    }
                    inv.bundle = bundle
                    inv.bundle_digest = sha256(
                        json.dumps(bundle, sort_keys=True).encode()
                    ).hexdigest()
                    inv.state = "EVIDENCE_READY_AI_UNAVAILABLE"
                    inv.revision += 1
                    session.flush()
                    incident = session.get(Incident, (job.bank_id, inv.incident_id))
                    emit_status(session, inv, incident, database_now(session))
            job.state = "SUCCEEDED"
            job.owner, job.lease_until = None, None
            job.updated_at = database_now(session)
        return True

    def fail(self, claim: Claim) -> bool:
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            now = database_now(session)
            job.state = "DEAD_LETTER" if job.attempts >= self.max_attempts else "RETRY_WAIT"
            job.last_error = "PROCESSING_UNAVAILABLE"
            job.available_at = now + timedelta(seconds=min(180, 5 * 3 ** (job.attempts - 1)))
            job.updated_at, job.owner, job.lease_until = now, None, None
        return True

    def run_once(self) -> bool:
        claim = self.claim()
        if claim is None:
            return False
        try:
            self.finish(claim)
        except Exception:
            # Do not persist/log raw adapter/driver text or secrets. Claim failures propagate.
            self.fail(claim)
        return True
