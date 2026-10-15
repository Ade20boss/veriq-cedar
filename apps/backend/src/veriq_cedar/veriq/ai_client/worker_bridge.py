"""Opt-in bank-scoped case AI handoff; no AI calls within DB transactions."""
from copy import deepcopy
from datetime import timedelta

from sqlalchemy import select

from veriq_cedar.veriq.ai_client.client import AIClientError, build_case_request
from veriq_cedar.veriq.investigations.cases import assemble_case
from veriq_cedar.veriq.operations.service import database_now
from veriq_cedar.veriq.persistence.pitch import CaseInvestigation

SAFE_ERRORS = frozenset({"AI_UNAVAILABLE", "AI_RATE_LIMITED", "AI_AUTH_FAILED",
    "AI_REQUEST_REJECTED", "AI_INVALID_RESPONSE", "AI_RESPONSE_TOO_LARGE",
    "AI_UNEXPECTED_STATUS"})


def _case(session, job):
    return session.scalar(
        select(CaseInvestigation).where(
            CaseInvestigation.bank_id == job.bank_id,
            CaseInvestigation.id == job.case_investigation_id,
        ).with_for_update()
    )


def _finish(job, now, reason=None):
    job.state = "SUCCEEDED"
    job.last_error = reason
    job.owner = job.lease_until = None
    job.updated_at = now


def complete_case_with_ai(worker, claim):
    """Assemble/commit -> remote AI -> fence/recheck/commit.

    Failures preserve bank evidence; provider output is unapproved advice.
    """
    if worker.ai_client is None or claim.kind != "CASE_ANALYSIS":
        raise ValueError("Opted-in CASE_ANALYSIS worker required")
    with worker.sessions.begin() as session:
        job = worker._fenced(session, claim)
        if job is None:
            return False
        inv = _case(session, job)
        if inv is None:
            raise ValueError("Missing case investigation")
        if inv.revision != job.evidence_revision:
            _finish(job, database_now(session), "SUPERSEDED")
            return True
        if inv.bundle is None or inv.state == "REQUESTED":
            assemble_case(session, job)
        if inv.bundle is None or inv.state != "EVIDENCE_READY_AI_UNAVAILABLE":
            raise ValueError("Case evidence unavailable")
        snapshot = deepcopy(inv.bundle)
        revision = inv.revision

    request = build_case_request(claim.bank_id, snapshot)
    try:
        result = worker.ai_client.analyze_case(request)
    except AIClientError as exc:
        with worker.sessions.begin() as session:
            job = worker._fenced(session, claim)
            if job is None:
                return False
            inv = _case(session, job)
            if inv is None or inv.revision != revision or inv.bundle != snapshot:
                _finish(job, database_now(session), "SUPERSEDED")
                return True
            now = database_now(session)
            if exc.retryable and job.attempts < worker.max_attempts:
                job.state = "RETRY_WAIT"
                job.available_at = now + timedelta(
                    seconds=min(180, 5 * 3 ** (job.attempts - 1))
                )
            else:
                job.state = "DEAD_LETTER"
            job.last_error = exc.code if exc.code in SAFE_ERRORS else "AI_UNAVAILABLE"
            job.owner = job.lease_until = None
            job.updated_at = now
        return True

    with worker.sessions.begin() as session:
        job = worker._fenced(session, claim)
        if job is None:
            return False
        inv = _case(session, job)
        if (inv is None or inv.revision != revision
            or job.evidence_revision != revision
            or inv.state != "EVIDENCE_READY_AI_UNAVAILABLE"
            or inv.bundle != snapshot):
            _finish(job, database_now(session), "SUPERSEDED")
            return True
        updated = deepcopy(snapshot)
        updated["ai_result"] = result
        updated["status"] = "FINDINGS_READY"
        inv.bundle = updated
        inv.state = "FINDINGS_READY"
        _finish(job, database_now(session))
    return True
