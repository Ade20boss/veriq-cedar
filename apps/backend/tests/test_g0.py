"""Real PostgreSQL acceptance/replay tests; foundation fixture roles are reused."""

from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError

from veriq_cedar.cedar.adapters.models import ResultInbox, ResultReceipt
from veriq_cedar.cedar.adapters.synthetic import CedarResultSink, SyntheticEvents
from veriq_cedar.composition.g0 import ingest
from veriq_cedar.integration.operational import IncidentStatus, MetricEvent, Principal
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.veriq.investigations.worker import Worker
from veriq_cedar.veriq.operations.service import EventProcessor
from veriq_cedar.veriq.persistence.operational import (
    EventReceipt,
    Incident,
    Investigation,
    Job,
    StatusDelivery,
    SupportingEvidence,
)

pytestmark = pytest.mark.postgres
FIXTURE = Path(__file__).resolve().parents[3] / "contracts/demo.json"


@pytest.fixture
def g0(runtime_settings):
    registry = DatabaseRegistry(runtime_settings)
    v = registry.sessions[DatabaseDomain.VERIQ]
    c = registry.sessions[DatabaseDomain.CEDAR]
    source = SyntheticEvents.from_fixture(FIXTURE, datetime.now(UTC))
    processor = EventProcessor(v, source.principal)
    sink = CedarResultSink(c, "CED")
    worker = Worker(v, "CED", "worker-a", sink)
    try:
        yield registry, v, c, source, processor, sink, worker
    finally:
        registry.dispose()


def count(sessions, model):
    with sessions() as session:
        return session.scalar(select(func.count()).select_from(model))


def g2(source):
    return next(e for e in source.read_events() if e.service_id == "G2")


def drain(worker):
    for _ in range(30):
        if not worker.run_once():
            return
    pytest.fail("Worker did not quiesce")


def claim_analysis(worker):
    for _ in range(10):
        claim = worker.claim()
        assert claim is not None
        if claim.kind == "INCIDENT_ANALYSIS":
            return claim
        assert worker.finish(claim)
    pytest.fail("Analysis was not automatically scheduled")


def expire(engine, claim):
    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE veriq.investigation_jobs "
                "SET lease_until=clock_timestamp()-interval '1 second' "
                "WHERE bank_id=:bank AND id=:id"
            ),
            {"bank": claim.bank_id, "id": claim.job_id},
        )


def test_replay_g2_automatic_before_complaints_and_permitted_cedar_status(g0, migrated):
    _, v, c, source, processor, sink, worker = g0
    assert count(v, EventReceipt) == count(v, Incident) == count(c, ResultInbox) == 0
    ingest(source, processor)
    assert count(v, EventReceipt) == 2
    assert count(v, Incident) == count(v, Investigation) == count(v, SupportingEvidence) == 1
    with v() as session:
        incident = session.scalar(select(Incident))
        inv = session.scalar(select(Investigation))
        assert (incident.route_id, incident.service_id, incident.state) == (
            "ROUTE-CED-ELM-G2",
            "G2",
            "SUSPECTED",
        )
        assert inv.state == "REQUESTED" and inv.review_status == "UNREVIEWED"
        assert set(session.scalars(select(Job.kind))) == {"INCIDENT_ANALYSIS", "RESULT_DELIVERY"}
        assert incident.rule_config["min_increase_points"] == 15
    with migrated.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM cedar.complaints")).scalar_one() == 0
    drain(worker)
    with v() as session, c() as bank_session:
        inv = session.scalar(select(Investigation))
        assert inv.state == "EVIDENCE_READY_AI_UNAVAILABLE"
        assert inv.review_status == "UNREVIEWED" and inv.bundle_digest
        assert inv.bundle["events"] == [g2(source).model_dump(mode="json")]
        evidence = session.scalar(select(SupportingEvidence))
        assert evidence.evidence_id == g2(source).evidence.evidence_id
        assert (
            session.get(EventReceipt, ("CED", evidence.receipt_id)).payload
            == inv.bundle["events"][0]
        )
        status = bank_session.scalar(select(ResultInbox)).payload
        assert status["bank_case_ids"] == []
        assert status["investigation_status"] == inv.state
        assert status["evidence_ids"] == [evidence.evidence_id]
        assert all(j.state == "SUCCEEDED" for j in session.scalars(select(Job)))
        assert len(session.scalars(select(Job)).all()) == 3
        assert not any(
            word in str(status).lower()
            for word in (
                "financial_outcome",
                "recipient",
                "credited",
                "root_cause",
                "private_ground_truth",
            )
        )
        print({"incident_id": incident.id, "investigation_id": inv.id, "status": status})
    # Stable receipts/ack IDs; repeated result delivery has no second visible effect.
    with v() as session:
        deliveries = [
            IncidentStatus.model_validate(d.payload)
            for d in session.scalars(select(StatusDelivery))
        ]
    before = count(c, ResultReceipt)
    for delivery in reversed(deliveries):
        assert sink.deliver(delivery) == sink.deliver(delivery) == delivery.delivery_id
    assert count(c, ResultReceipt) == before == 2
    assert count(c, ResultInbox) == 1
    print(
        "PASS: adapter → PostgreSQL incident/investigation/jobs → "
        "permitted Cedar inbox; zero complaints"
    )


@pytest.mark.parametrize("normal_g2", [False, True], ids=["birch-negative-control", "normal-g2"])
def test_normal_and_birch_do_not_create_incident(g0, normal_g2):
    _, v, _, source, processor, _, worker = g0
    event = (
        g2(source).model_copy(update={"timeouts": 1})
        if normal_g2
        else next(e for e in source.read_events() if e.service_id == "G3")
    )
    processor.accept(event)
    assert count(v, EventReceipt) == 1 and count(v, Incident) == count(v, Job) == 0
    assert not worker.run_once()


def test_duplicate_concurrent_events_and_conflicting_replay(g0):
    _, v, _, source, processor, _, _ = g0
    event = g2(source)
    with ThreadPoolExecutor(max_workers=4) as pool:
        receipts = list(pool.map(lambda _: processor.accept(event), range(8)))
    assert len(set(receipts)) == 1
    assert count(v, EventReceipt) == count(v, Incident) == count(v, Investigation) == 1
    assert count(v, Job) == 2
    with pytest.raises(ValueError, match="Conflicting event"):
        processor.accept(event.model_copy(update={"timeouts": 8}))
    with pytest.raises(ValueError, match="Snapshot interval"):
        processor.accept(event.model_copy(update={"event_id": "renamed-event"}))
    assert count(v, EventReceipt) == 1


def test_core_runs_with_second_bank_source_and_enforces_scope(g0):
    _, v, c, source, processor, sink, _ = g0
    first = g2(source)
    second = first.model_copy(update={"bank_id": "OTHER"})
    with pytest.raises(PermissionError):
        processor.accept(second)

    class OtherBank:
        def read_events(self):
            return (second,)

    other = EventProcessor(v, Principal(bank_id="OTHER", source_system=second.source_system))
    ingest(OtherBank(), other)
    processor.accept(first)
    assert count(v, Incident) == 2
    with v() as session:
        assert set(session.scalars(select(Incident.bank_id))) == {"OTHER", "CED"}
        foreign = session.scalar(select(StatusDelivery).where(StatusDelivery.bank_id == "OTHER"))
    with pytest.raises(PermissionError):
        sink.deliver(IncidentStatus.model_validate(foreign.payload))
    assert count(c, ResultInbox) == 0
    other_worker = Worker(v, "OTHER", "other-worker", sink)
    claim = other_worker.claim()
    assert claim.bank_id == "OTHER"


def test_actual_roles_deny_private_and_cross_domain_access_and_event_mutation(g0, migrated):
    registry, v, _, source, processor, _, _ = g0
    with migrated.begin() as connection:
        connection.execute(text("CREATE TABLE cedar_private.g0_canary (truth text)"))
        connection.execute(
            text("INSERT INTO cedar_private.g0_canary VALUES ('PRIVATE_RECIPIENT_CREDITED_CANARY')")
        )
    try:
        processor.accept(g2(source))
        for domain, target in [
            (DatabaseDomain.VERIQ, "cedar_private.g0_canary"),
            (DatabaseDomain.CEDAR, "cedar_private.g0_canary"),
            (DatabaseDomain.VERIQ, "cedar.investigation_status_inbox"),
            (DatabaseDomain.CEDAR, "veriq.operational_events"),
        ]:
            with registry.engines[domain].connect() as connection:
                with pytest.raises(DBAPIError):
                    connection.execute(text(f"SELECT * FROM {target}"))
                connection.rollback()
        with registry.engines[DatabaseDomain.VERIQ].connect() as connection:
            with pytest.raises(DBAPIError):
                connection.execute(text("UPDATE veriq.operational_events SET digest='changed'"))
            connection.rollback()
            with pytest.raises(DBAPIError):
                connection.execute(text("DELETE FROM veriq.operational_events"))
        with v() as session:
            assert "PRIVATE_RECIPIENT_CREDITED_CANARY" not in str(
                session.scalar(select(EventReceipt.payload))
            )
        with pytest.raises(ValidationError):
            MetricEvent.model_validate(
                {**g2(source).model_dump(), "private_ground_truth": "CANARY"}
            )
    finally:
        with migrated.begin() as connection:
            connection.execute(text("DROP TABLE cedar_private.g0_canary"))


def test_interrupted_worker_recovery_fences_old_worker(g0, migrated):
    _, v, _, source, processor, sink, worker = g0
    processor.accept(g2(source))
    old = claim_analysis(worker)
    expire(migrated, old)
    restarted = Worker(v, "CED", "worker-after-restart", sink)
    recovered = claim_analysis(restarted)
    assert recovered.job_id == old.job_id and recovered.generation > old.generation
    assert not worker.finish(old) and not worker.fail(old)
    assert restarted.finish(recovered)
    assert not restarted.finish(recovered)
    drain(restarted)
    with v() as session:
        job = session.get(Job, ("CED", old.job_id))
        assert job.attempts == 2 and job.state == "SUCCEEDED"
        assert session.scalar(select(Investigation)).revision == 2
    assert count(v, StatusDelivery) == 2


def test_concurrent_claims_never_lease_same_job(g0):
    _, v, _, source, processor, sink, _ = g0
    processor.accept(g2(source))
    workers = [Worker(v, "CED", f"parallel-{i}", sink) for i in range(4)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        claims = list(pool.map(lambda w: w.claim(), workers))
    live = [claim for claim in claims if claim]
    assert len(live) == 2 and len({c.job_id for c in live}) == 2


def test_new_evidence_supersedes_inflight_run_and_old_delivery_cannot_regress(g0):
    _, v, c, source, processor, sink, worker = g0
    event = g2(source)
    earlier = event.model_copy(
        update={
            "event_id": "earlier-window",
            "window_start": event.window_start - timedelta(minutes=5),
            "window_end": event.window_end - timedelta(minutes=5),
            "occurred_at": event.occurred_at - timedelta(minutes=5),
            "baseline_end": event.baseline_end - timedelta(minutes=5),
        }
    )
    processor.accept(earlier)
    old = claim_analysis(worker)
    processor.accept(event)
    assert worker.finish(old)
    drain(worker)
    with v() as session, c() as bank_session:
        inv = session.scalar(select(Investigation))
        assert inv.evidence_revision == 2 and inv.revision == 3
        assert len(inv.bundle["events"]) == 2
        assert session.get(Job, ("CED", old.job_id)).last_error == "SUPERSEDED"
        deliveries = [
            IncidentStatus.model_validate(x.payload)
            for x in session.scalars(select(StatusDelivery))
        ]
        assert bank_session.scalar(select(ResultInbox)).revision == 3
    for delivery in sorted(deliveries, key=lambda x: x.revision, reverse=True):
        sink.deliver(delivery)
    with c() as session:
        assert session.scalar(select(ResultInbox)).revision == 3
    assert count(v, Incident) == count(v, Investigation) == 1


def test_delivery_crash_after_bank_commit_replays_safely(g0, migrated):
    _, v, c, source, processor, sink, worker = g0
    processor.accept(g2(source))
    while True:
        claim = worker.claim()
        assert claim is not None
        if claim.kind == "RESULT_DELIVERY":
            break
        worker.finish(claim)
    with v() as session:
        delivery = session.scalar(
            select(StatusDelivery).where(StatusDelivery.job_id == claim.job_id)
        )
        status = IncidentStatus.model_validate(delivery.payload)
    sink.deliver(status)  # Simulated crash here: no Veriq acknowledgement.
    expire(migrated, claim)
    restarted = Worker(v, "CED", "redelivery-worker", sink)
    drain(restarted)
    assert count(c, ResultInbox) == 1
    with v() as session:
        assert session.get(Job, ("CED", claim.job_id)).state == "SUCCEEDED"
    assert count(c, ResultReceipt) == 2


def test_unavailable_sink_bounded_retry_and_dead_letter(g0, migrated):
    _, v, c, source, processor, _, _ = g0

    class UnavailableSink:
        def deliver(self, status):
            raise RuntimeError("DO_NOT_STORE_secret_or_provider_error")

    processor.accept(g2(source))
    worker = Worker(v, "CED", "failing-worker", UnavailableSink(), max_attempts=2)
    drain(worker)
    with v() as session:
        pending = session.scalars(select(Job).where(Job.kind == "RESULT_DELIVERY")).all()
        assert len(pending) == 2
        assert all(j.state == "RETRY_WAIT" and j.attempts == 1 for j in pending)
    with migrated.begin() as connection:
        connection.execute(
            text(
                "UPDATE veriq.investigation_jobs "
                "SET available_at=clock_timestamp()-interval '1 second' "
                "WHERE state='RETRY_WAIT'"
            )
        )
    drain(worker)
    assert not worker.run_once()
    with v() as session:
        failed = session.scalars(select(Job).where(Job.kind == "RESULT_DELIVERY")).all()
        assert all(
            j.state == "DEAD_LETTER"
            and j.attempts == 2
            and j.last_error == "PROCESSING_UNAVAILABLE"
            for j in failed
        )
    assert count(c, ResultInbox) == 0


def test_crashes_also_exhaust_retry_budget(g0, migrated):
    _, v, _, source, processor, sink, _ = g0
    processor.accept(g2(source))
    worker = Worker(v, "CED", "crasher", sink, max_attempts=1)
    claim = claim_analysis(worker)
    expire(migrated, claim)
    drain(worker)
    with v() as session:
        job = session.get(Job, ("CED", claim.job_id))
        assert job.state == "DEAD_LETTER" and job.last_error == "ATTEMPTS_EXHAUSTED"
    assert not worker.finish(claim)


def test_late_event_is_retained_without_opening_current_incident(g0):
    _, v, _, source, processor, _, _ = g0
    event = g2(source)
    values = {
        field: getattr(event, field) - timedelta(hours=1)
        for field in (
            "window_start",
            "window_end",
            "occurred_at",
            "observed_at",
            "baseline_start",
            "baseline_end",
        )
    }
    processor.accept(event.model_copy(update=values))
    assert count(v, EventReceipt) == 1 and count(v, Incident) == 0


def test_receiver_transaction_failure_rolls_back_then_replay_recovers(g0, monkeypatch):
    _, v, _, source, processor, _, worker = g0
    import veriq_cedar.veriq.operations.service as service

    original = service.enqueue

    def crash(*args, **kwargs):
        raise RuntimeError("simulated receiver crash before commit")

    monkeypatch.setattr(service, "enqueue", crash)
    with pytest.raises(RuntimeError):
        processor.accept(g2(source))
    for model in (EventReceipt, Incident, SupportingEvidence, Investigation, Job, StatusDelivery):
        assert count(v, model) == 0
    monkeypatch.setattr(service, "enqueue", original)
    processor.accept(g2(source))
    drain(worker)
    assert count(v, Incident) == count(v, Investigation) == 1


def test_transient_delivery_outage_recovers_without_losing_evidence(g0, migrated):
    _, v, c, source, processor, sink, _ = g0

    class RecoveringSink:
        available = False

        def deliver(self, status):
            if not self.available:
                raise ConnectionError("offline")
            return sink.deliver(status)

    recovering = RecoveringSink()
    worker = Worker(v, "CED", "recovering-worker", recovering)
    processor.accept(g2(source))
    drain(worker)
    assert count(c, ResultInbox) == 0
    with v() as session:
        assert session.scalar(select(Investigation)).bundle_digest
    recovering.available = True
    with migrated.begin() as connection:
        connection.execute(
            text(
                "UPDATE veriq.investigation_jobs SET available_at=clock_timestamp() "
                "WHERE state='RETRY_WAIT'"
            )
        )
    drain(worker)
    assert count(c, ResultInbox) == 1
    with v() as session:
        assert all(j.state == "SUCCEEDED" for j in session.scalars(select(Job)))


def test_conflicting_result_identity_is_rejected(g0):
    _, v, c, source, processor, sink, worker = g0
    processor.accept(g2(source))
    drain(worker)
    with v() as session:
        status = IncidentStatus.model_validate(session.scalar(select(StatusDelivery)).payload)
    with pytest.raises(ValueError, match="Conflicting delivery"):
        sink.deliver(status.model_copy(update={"service_id": "FAKE"}))
    assert count(c, ResultReceipt) == 2


def test_concurrent_new_windows_reuse_one_incident_and_preserve_both(g0):
    _, v, _, source, processor, _, worker = g0
    event = g2(source)
    earlier = event.model_copy(
        update={
            "event_id": "previous-window",
            **{
                field: getattr(event, field) - timedelta(minutes=5)
                for field in (
                    "window_start",
                    "window_end",
                    "occurred_at",
                    "observed_at",
                    "baseline_start",
                    "baseline_end",
                )
            },
        }
    )
    with ThreadPoolExecutor(max_workers=2) as pool:
        receipts = list(pool.map(processor.accept, (event, earlier)))
    assert len(set(receipts)) == 2
    assert count(v, Incident) == count(v, Investigation) == 1
    assert count(v, SupportingEvidence) == 2
    drain(worker)
    with v() as session:
        assert len(session.scalar(select(Investigation)).bundle["events"]) == 2


def test_future_event_rejected_without_receipt(g0):
    _, v, _, source, processor, _, _ = g0
    event = g2(source)
    values = {
        field: getattr(event, field) + timedelta(days=1)
        for field in (
            "window_start",
            "window_end",
            "occurred_at",
            "observed_at",
            "baseline_start",
            "baseline_end",
        )
    }
    with pytest.raises(ValueError, match="Future observations"):
        processor.accept(event.model_copy(update=values))
    assert count(v, EventReceipt) == 0
