"""Short DB leases, SKIP LOCKED claims, fenced completion, bounded retries.

External result delivery and optional case AI calls occur outside DB transactions.
"""

import json
import logging
from dataclasses import dataclass
from datetime import timedelta
from hashlib import sha256

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.integration.operational import IncidentStatus, ResultSink
from veriq_cedar.veriq.ai.client import AIError, validate_result
from veriq_cedar.veriq.ai.orchestration import build_request, bundle_digest, digest, schedule
from veriq_cedar.veriq.operations.service import database_now, emit_status
from veriq_cedar.veriq.persistence.operational import (
    EventReceipt,
    Incident,
    Investigation,
    Job,
    StatusDelivery,
    SupportingEvidence,
)
from veriq_cedar.veriq.persistence.pitch import CaseAI, CaseInvestigation

logger = logging.getLogger("veriq_cedar.veriq.ai")


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
        if ai_client is not None and ai_client.timeout >= lease_seconds:
            raise ValueError("AI timeout must be shorter than worker lease")
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
                    if job.kind == "CASE_AI":
                        self._ai_status(session, job, "EVIDENCE_READY_AI_UNAVAILABLE")
                        self._ai_log(job, "ATTEMPTS_EXHAUSTED")
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
        if claim.kind == "CASE_AI":
            return self._finish_ai(claim)
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
                if self.ai_client is not None and job.last_error != "SUPERSEDED":
                    inv = session.get(CaseInvestigation, (job.bank_id, job.case_investigation_id))
                    if not schedule(session, inv):
                        job.last_error = "AI_INPUT_INVALID"
                        self._ai_log(job, "AI_INPUT_INVALID")
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

    def fail(self, claim: Claim, code="PROCESSING_UNAVAILABLE") -> bool:
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            now = database_now(session)
            job.state = "DEAD_LETTER" if job.attempts >= self.max_attempts else "RETRY_WAIT"
            job.last_error = code
            job.available_at = now + timedelta(seconds=min(180, 5 * 3 ** (job.attempts - 1)))
            job.updated_at, job.owner, job.lease_until = now, None, None
            if job.kind == "CASE_AI":
                self._ai_status(session, job, "EVIDENCE_READY_AI_UNAVAILABLE")
                self._ai_log(job, code)
        return True

    @staticmethod
    def _ai_log(job, code=None, mode=None):
        logger.log(
            logging.WARNING if code else logging.INFO,
            "case_ai.completed",
            extra={
                "job_id": job.id,
                "attempts": job.attempts,
                "generation": job.generation,
                "analysis_state": job.state,
                "error_code": code,
                "provider_mode": mode,
            },
        )

    @staticmethod
    def _ai_status(session, job, state):
        inv = session.scalar(
            select(CaseInvestigation)
            .where(
                CaseInvestigation.bank_id == job.bank_id,
                CaseInvestigation.id == job.case_investigation_id,
            )
            .with_for_update()
        )
        if (
            inv
            and inv.revision == job.evidence_revision
            and inv.bundle
            and inv.bundle["ai_result"] is None
        ):
            inv.state = state
            inv.bundle = {**inv.bundle, "status": state}
        return inv

    def _ai_snapshot(self, session, job):
        inv = session.scalar(
            select(CaseInvestigation)
            .where(
                CaseInvestigation.bank_id == job.bank_id,
                CaseInvestigation.id == job.case_investigation_id,
            )
            .with_for_update()
        )
        run = session.get(CaseAI, (job.bank_id, job.id))
        if inv is None or inv.revision != job.evidence_revision or inv.bundle is None:
            job.state, job.last_error = "SUCCEEDED", "SUPERSEDED"
            job.owner, job.lease_until = None, None
            return None
        if (
            run is None
            or run.revision != inv.revision
            or run.case_investigation_id != inv.id
            or bundle_digest(inv.bundle) != run.bundle_digest
            or digest(run.request) != run.request_digest
        ):
            raise AIError("AI_INPUT_SCOPE_INVALID")
        # Recheck scoped persisted provenance, including after the network call.
        current = build_request(session, inv)
        if digest(current.model_dump(mode="json")) != run.request_digest:
            raise AIError("AI_INPUT_SCOPE_INVALID")
        if run.result is None:
            inv.state = "AI_PENDING"
            inv.bundle = {**inv.bundle, "status": "AI_PENDING"}
        return run, current, inv

    def _finish_ai(self, claim):
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            snapshot = self._ai_snapshot(session, job)
            if snapshot is None:
                return True
            run, request, inv = snapshot
            if run.result is not None:
                job.state, job.owner, job.lease_until = "SUCCEEDED", None, None
                return True
        # All session/row locks are released. Only the immutable typed snapshot leaves Veriq.
        if self.ai_client is None:
            raise AIError("AI_DISABLED")
        result, mode = self.ai_client.analyze(request)
        # Independently validate even an injected/replaced transport's returned object.
        result = validate_result(request, result.model_dump_json().encode(), mode)
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            snapshot = self._ai_snapshot(session, job)
            if snapshot is None:
                return True
            run, current, inv = snapshot
            run.result, run.provider_mode = result.model_dump(mode="json"), mode
            run.completed_at = database_now(session)
            inv.state = "FINDINGS_READY"
            inv.bundle = {**inv.bundle, "status": "FINDINGS_READY", "ai_result": run.result}
            job.state, job.last_error = "SUCCEEDED", None
            job.owner, job.lease_until = None, None
            job.updated_at = database_now(session)
        self._ai_log(job, mode=mode)
        return True

    def run_once(self) -> bool:
        claim = self.claim()
        if claim is None:
            return False
        try:
            self.finish(claim)
        except AIError as error:
            self.fail(claim, error.code)
        except Exception:
            # Do not persist/log raw adapter/driver text or secrets. Claim failures propagate.
            self.fail(claim)
        return True
