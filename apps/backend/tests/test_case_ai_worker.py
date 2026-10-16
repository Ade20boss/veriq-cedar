"""Synthetic fence and transaction-boundary tests; no Groq calls."""
from contextlib import contextmanager
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest

from veriq_cedar.veriq.ai_client.client import AIClientError
from veriq_cedar.veriq.ai_client.worker_bridge import complete_case_with_ai

BUNDLE = {"case_id": "CASE-1", "status": "EVIDENCE_READY_AI_UNAVAILABLE",
    "financial_outcome": "UNKNOWN", "evidence": [],
    "incident_ids": [], "ai_result": None}


class Sessions:
    def __init__(self, inv):
        self.inv = inv
        self.in_transaction = False
        self.count = 0

    @contextmanager
    def begin(self):
        assert not self.in_transaction
        self.in_transaction = True
        self.count += 1
        try:
            yield self
        finally:
            self.in_transaction = False

    def scalar(self, query):
        return self.inv


class AI:
    timeout_seconds = 10

    def __init__(self, sessions, hook=None, error=None):
        self.sessions = sessions
        self.hook = hook
        self.error = error
        self.calls = []

    def analyze_case(self, payload):
        assert not self.sessions.in_transaction
        self.calls.append(payload)
        if self.hook:
            self.hook()
        if self.error:
            raise self.error
        return {"case_id": payload["case_id"],
                "financial_outcome": payload["financial_outcome"],
                "observations": [], "hypotheses": [],
                "unknowns": ["Credit remains unverified"],
                "recommended_checks": [],
                "customer_safe_update_draft": "UNAPPROVED"}


@pytest.fixture
def state(monkeypatch):
    import veriq_cedar.veriq.ai_client.worker_bridge as bridge
    now = datetime(2026, 10, 15, 20, tzinfo=UTC)
    monkeypatch.setattr(bridge, "database_now", lambda session: now)
    job = SimpleNamespace(bank_id="CED", case_investigation_id="INV-1",
        evidence_revision=1, state="LEASED", attempts=1, owner="w",
        lease_until=now + timedelta(seconds=60), updated_at=now, last_error=None,
        available_at=now)
    inv = SimpleNamespace(revision=1, state="EVIDENCE_READY_AI_UNAVAILABLE",
                          bundle=deepcopy(BUNDLE))
    sessions = Sessions(inv)
    claim = SimpleNamespace(bank_id="CED", kind="CASE_ANALYSIS")
    worker = SimpleNamespace(sessions=sessions, ai_client=None, max_attempts=5,
        _fenced=lambda session, submitted: job if job.state == "LEASED" else None)
    return worker, claim, job, inv, sessions


def test_valid_result_only_persists_after_remote_call(state):
    worker, claim, job, inv, sessions = state
    worker.ai_client = AI(sessions)
    assert complete_case_with_ai(worker, claim)
    assert sessions.count == 2
    assert inv.state == inv.bundle["status"] == "FINDINGS_READY"
    assert inv.bundle["financial_outcome"] == "UNKNOWN"
    assert inv.bundle["ai_result"]["financial_outcome"] == "UNKNOWN"
    assert job.state == "SUCCEEDED"


def test_superseded_during_model_call_is_discarded(state):
    worker, claim, job, inv, sessions = state
    def change():
        inv.revision = 2
        inv.state = "REQUESTED"
        inv.bundle = None
    worker.ai_client = AI(sessions, hook=change)
    assert complete_case_with_ai(worker, claim)
    assert inv.bundle is None
    assert job.last_error == "SUPERSEDED"


def test_changed_snapshot_is_not_overwritten(state):
    worker, claim, job, inv, sessions = state
    worker.ai_client = AI(sessions, hook=lambda: inv.bundle.update({"changed": True}))
    assert complete_case_with_ai(worker, claim)
    assert inv.bundle["changed"] and job.last_error == "SUPERSEDED"


def test_rate_limit_preserves_evidence_and_waits(state):
    worker, claim, job, inv, sessions = state
    worker.ai_client = AI(sessions, error=AIClientError("AI_RATE_LIMITED", retryable=True))
    assert complete_case_with_ai(worker, claim)
    assert inv.bundle == BUNDLE
    assert job.state == "RETRY_WAIT" and job.last_error == "AI_RATE_LIMITED"
    assert job.available_at > job.updated_at


def test_invalid_result_dead_letters_without_erasing_case(state):
    worker, claim, job, inv, sessions = state
    worker.ai_client = AI(sessions, error=AIClientError("AI_INVALID_RESPONSE"))
    assert complete_case_with_ai(worker, claim)
    assert job.state == "DEAD_LETTER" and inv.bundle == BUNDLE


def test_exhausted_retry_dead_letters(state):
    worker, claim, job, inv, sessions = state
    job.attempts = worker.max_attempts
    worker.ai_client = AI(sessions, error=AIClientError("AI_UNAVAILABLE", retryable=True))
    assert complete_case_with_ai(worker, claim)
    assert job.state == "DEAD_LETTER"


def test_stale_before_remote_call_skips_ai(state):
    worker, claim, job, inv, sessions = state
    inv.revision = 2
    worker.ai_client = AI(sessions)
    assert complete_case_with_ai(worker, claim)
    assert worker.ai_client.calls == []
    assert job.last_error == "SUPERSEDED"


def test_lost_lease_discards_result(state):
    worker, claim, job, inv, sessions = state
    worker.ai_client = AI(sessions, hook=lambda: setattr(job, "state", "RETRY_WAIT"))
    assert complete_case_with_ai(worker, claim) is False
    assert inv.bundle == BUNDLE
