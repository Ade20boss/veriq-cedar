"""G1 real PostgreSQL accounting, transport, private-role and crash-retry acceptance."""

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from hashlib import sha256
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.auth import CustomerIdentity
from veriq_cedar.cedar.accounts.models import Account, DemoSession
from veriq_cedar.cedar.accounts.seed import mint_session, seed, seed_customer
from veriq_cedar.cedar.ledger.models import Entry, Journal
from veriq_cedar.cedar.simulator.models import NetworkPolicy, RecipientCredit
from veriq_cedar.cedar.simulator.network import SyntheticNetwork
from veriq_cedar.cedar.transfers.contracts import NameEnquiryInput, TransferInput
from veriq_cedar.cedar.transfers.dispatcher import Dispatcher
from veriq_cedar.cedar.transfers.models import (
    BankingEvent,
    Idempotency,
    PaymentEvidence,
    PaymentInstruction,
    Transfer,
    TransferAttempt,
)
from veriq_cedar.cedar.transfers.service import Banking, now
from veriq_cedar.main import create_app
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.platform.errors import InfrastructureError

pytestmark = pytest.mark.postgres


class FinancialFixture(SimpleNamespace):
    def __repr__(self):
        return "<financial test fixture; credentials hidden>"


@pytest.fixture
def fin(runtime_settings, migrated):
    with Session(migrated) as session, session.begin():
        seed(session)
        seed_customer(session, "CED-CUST-002", "CED-ACC-002", "Other fictional customer")
        ada_token, expires = mint_session(session, "CED-CUST-001")
        other_token, _ = mint_session(session, "CED-CUST-002")
    registry = DatabaseRegistry(runtime_settings)
    cedar = registry.sessions[DatabaseDomain.CEDAR]
    private = registry.sessions[DatabaseDomain.SIMULATOR]
    network = SyntheticNetwork(private, "CED")
    try:
        yield FinancialFixture(
            registry=registry,
            settings=runtime_settings,
            admin=migrated,
            cedar=cedar,
            private=private,
            bank=Banking(cedar),
            network=network,
            dispatcher=Dispatcher(cedar, network),
            ada=CustomerIdentity("CED", "CED-CUST-001"),
            other=CustomerIdentity("CED", "CED-CUST-002"),
            ada_token=ada_token,
            other_token=other_token,
        )
    finally:
        registry.dispose()


def request(amount=5_000_000, **changes):
    return TransferInput(
        beneficiary_bank_id="ELM",
        beneficiary_account_id="ELM-ACC-009",
        amount_kobo=amount,
        **changes,
    )


def debit_count(fin):
    with fin.cedar() as session:
        return session.scalar(
            select(func.count()).select_from(Journal).where(Journal.kind == "TRANSFER_DEBIT")
        )


def count(fin, model):
    with fin.cedar() as session:
        return session.scalar(select(func.count()).select_from(model))


def arm(fin, scenario):
    with Session(fin.admin) as session, session.begin():
        session.get(NetworkPolicy, "CED").scenario = scenario


def expire(fin, claim):
    with fin.admin.begin() as connection:
        connection.execute(
            text(
                "UPDATE cedar.payment_instructions SET lease_until=clock_timestamp()-interval"
                " '1 second' WHERE id=:id"
            ),
            {"id": claim.instruction_id},
        )


@pytest.mark.anyio
async def test_s2_database_api_replay_known_state_stays_unknown(fin, capsys):
    app = create_app(fin.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": fin.ada_token},
        ) as client,
    ):
        before = (await client.get("/v1/cedar/accounts/me")).json()
        assert before == {
            "id": "CED-ACC-001",
            "display_account_id": "CED-ACC-001",
            "currency": "NGN",
            "available_balance_kobo": 10_000_000,
            "owner_display_name": "Ada (fictional)",
        }
        banks = await client.get("/v1/cedar/banks")
        assert banks.status_code == 200
        assert {b["bank_id"] for b in banks.json()} == {"ELM", "BIR"}
        enquiry = await client.post(
            "/v1/cedar/name-enquiries", json={"bank_id": "ELM", "account_id": "ELM-ACC-009"}
        )
        assert enquiry.json() == {
            "bank_id": "ELM",
            "account_id": "ELM-ACC-009",
            "beneficiary_name": "Elm beneficiary (fictional)",
            "verified_in_simulation": True,
        }
        result = await client.post(
            "/v1/cedar/transfers",
            headers={"Idempotency-Key": "hero-transfer-001"},
            json=request().model_dump(),
        )
        assert result.status_code == 201, result.text
        transfer = result.json()
        assert transfer["processing_stage"] == "RESPONSE_TIMEOUT"
        assert transfer["financial_outcome"] == "UNKNOWN"
        assert set(transfer) == {
            "id",
            "reference",
            "amount_kobo",
            "beneficiary_bank_id",
            "beneficiary_account_id",
            "processing_stage",
            "financial_outcome",
            "last_evidence_id",
            "created_at",
            "updated_at",
        }
        after = (await client.get("/v1/cedar/accounts/me")).json()
        assert after["available_balance_kobo"] == 5_000_000
        assert (await client.get("/v1/cedar/transfers/" + transfer["id"])).json() == transfer
        repeat = await client.post(
            "/v1/cedar/transfers",
            headers={"Idempotency-Key": "hero-transfer-001"},
            json=request().model_dump(),
        )
        assert repeat.json()["id"] == transfer["id"] and debit_count(fin) == 1
        with fin.private() as session:
            credits = session.scalars(select(RecipientCredit)).all()
            assert len(credits) == 1 and credits[0].credited_kobo == 5_000_000
            assert credits[0].scenario == "S2"
        with fin.cedar() as session:
            stages = session.scalars(
                select(BankingEvent.stage).order_by(BankingEvent.observed_at)
            ).all()
            assert stages == [
                "CREATED",
                "VALIDATED",
                "DEBIT_POSTED",
                "SUBMITTED",
                "RESPONSE_TIMEOUT",
            ]
            journal = session.scalar(select(Journal).where(Journal.kind == "TRANSFER_DEBIT"))
            entries = session.scalars(select(Entry).where(Entry.journal_id == journal.id)).all()
            assert (
                sum(e.debit_kobo for e in entries)
                == sum(e.credit_kobo for e in entries)
                == 5_000_000
            )
            assert {e.ledger_account_id: (e.debit_kobo, e.credit_kobo) for e in entries} == {
                "CED-ACC-001": (5_000_000, 0),
                "CED-CLEARING": (0, 5_000_000),
            }
        logs = capsys.readouterr().out
        assert fin.ada_token not in logs and "RECIPIENT_CREDITED" not in logs
        assert not any(
            x in str(transfer)
            for x in ("scenario", "credited_kobo", "private_ground_truth", "recipient_credits")
        )
        print(
            {
                "synthetic": True,
                "before": before,
                "name_enquiry": enquiry.json(),
                "transfer": transfer,
                "after": after,
                "debit_journals": debit_count(fin),
            }
        )


def test_s0_requires_eligible_received_response(fin):
    arm(fin, "S0")
    identifier = fin.bank.create(fin.ada, "normal-transfer-001", request())
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"
    assert fin.bank.get(fin.ada, identifier).processing_stage == "DEBIT_POSTED"
    claim = fin.dispatcher.claim(identifier)
    assert claim
    observation = fin.network.submit(claim.request)
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"
    assert fin.dispatcher.complete(claim, observation)
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "CREDIT_CONFIRMED"
    assert fin.bank.get(fin.ada, identifier).processing_stage == "COMPLETED"
    assert count(fin, PaymentEvidence) == 1 and debit_count(fin) == 1


def test_insufficient_funds_and_invalid_beneficiary_do_not_debit(fin):
    with pytest.raises(InfrastructureError, match="INSUFFICIENT_FUNDS"):
        fin.bank.create(fin.ada, "too-expensive", request(10_000_001))
    with pytest.raises(InfrastructureError, match="BENEFICIARY_NOT_FOUND"):
        fin.bank.create(
            fin.ada,
            "invalid-recipient",
            request().model_copy(update={"beneficiary_bank_id": "REAL"}),
        )
    assert (
        debit_count(fin)
        == count(fin, Transfer)
        == count(fin, PaymentInstruction)
        == count(fin, Idempotency)
        == 0
    )
    assert fin.bank.account(fin.ada).available_balance_kobo == 10_000_000


def test_idempotency_conflict_and_customer_scope(fin):
    identifier = fin.bank.create(fin.ada, "same-key-001", request())
    assert fin.bank.create(fin.ada, "same-key-001", request()) == identifier
    with pytest.raises(InfrastructureError, match="IDEMPOTENCY_CONFLICT"):
        fin.bank.create(fin.ada, "same-key-001", request(1))
    other = fin.bank.create(fin.other, "same-key-001", request(1))
    assert other != identifier and debit_count(fin) == 2
    with pytest.raises(InfrastructureError, match="NOT_FOUND"):
        fin.bank.get(fin.other, identifier)
    with pytest.raises(InfrastructureError, match="NOT_FOUND"):
        fin.bank.get(CustomerIdentity("OTHER", "CED-CUST-001"), identifier)


def test_concurrent_same_key_one_debit_and_one_recipient_credit(fin):
    with ThreadPoolExecutor(max_workers=4) as pool:
        identifiers = list(
            pool.map(lambda _: fin.bank.create(fin.ada, "concurrent-same-key", request()), range(8))
        )
    assert len(set(identifiers)) == 1 and debit_count(fin) == 1
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda _: fin.dispatcher.run_once(identifiers[0]), range(4)))
    with fin.private() as session:
        assert session.scalar(select(func.count()).select_from(RecipientCredit)) == 1
    assert (
        count(fin, PaymentInstruction) == 1
        and fin.bank.account(fin.ada).available_balance_kobo == 5_000_000
    )


def test_concurrent_independent_transfers_cannot_overspend(fin):
    def create(i):
        try:
            return fin.bank.create(fin.ada, f"concurrent-independent-{i}", request(7_000_000))
        except InfrastructureError as error:
            return error.code

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(create, range(2)))
    assert results.count("INSUFFICIENT_FUNDS") == 1
    assert debit_count(fin) == 1 and fin.bank.account(fin.ada).available_balance_kobo == 3_000_000


def test_atomic_rollback_after_debit_before_outbox(fin, monkeypatch):
    from veriq_cedar.cedar.transfers import service

    original = service.stage

    def crash(session, transfer, value):
        original(session, transfer, value)
        if value == "DEBIT_POSTED":
            raise RuntimeError("simulated interruption")

    monkeypatch.setattr(service, "stage", crash)
    with pytest.raises(RuntimeError):
        fin.bank.create(fin.ada, "rollback-after-debit", request())
    assert (
        debit_count(fin)
        == count(fin, Transfer)
        == count(fin, BankingEvent)
        == count(fin, Idempotency)
        == 0
    )
    assert fin.bank.account(fin.ada).available_balance_kobo == 10_000_000
    monkeypatch.setattr(service, "stage", original)
    fin.bank.create(fin.ada, "rollback-after-debit", request())
    assert debit_count(fin) == 1


def test_posted_ledger_is_append_only_even_for_administrator(fin):
    identifier = fin.bank.create(fin.ada, "immutable-ledger", request())
    for statement in [
        "UPDATE cedar.ledger_entries SET debit_kobo=1 WHERE debit_kobo>0",
        "DELETE FROM cedar.ledger_entries",
        "UPDATE cedar.ledger_journals SET amount_kobo=1",
        "DELETE FROM cedar.ledger_journals",
    ]:
        with pytest.raises(DBAPIError):
            with fin.admin.begin() as connection:
                connection.execute(text(statement))
    with pytest.raises(DBAPIError):
        with fin.admin.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO "
                    "cedar.ledger_entries(bank_id,id,journal_id,"
                    "ledger_account_id,debit_kobo,credit_kobo)"
                    " VALUES ('CED','late-entry',:j,'CED-ACC-001',1,0)"
                ),
                {"j": "debit/" + identifier},
            )
    assert debit_count(fin) == 1


def test_database_rejects_unbalanced_journal_and_incorrect_projection(fin):
    with pytest.raises(DBAPIError):
        with Session(fin.admin) as session, session.begin():
            session.add(
                Journal(
                    bank_id="CED",
                    id="bad-journal",
                    account_id="CED-ACC-001",
                    kind="OPENING",
                    transfer_id=None,
                    amount_kobo=100,
                )
            )
            session.flush()
            session.add(
                Entry(
                    bank_id="CED",
                    id="bad-dr",
                    journal_id="bad-journal",
                    ledger_account_id="CED-CASH",
                    debit_kobo=100,
                    credit_kobo=0,
                )
            )
    with pytest.raises(DBAPIError):
        with fin.admin.begin() as connection:
            connection.execute(
                text("UPDATE cedar.accounts SET available_balance_kobo=0 WHERE id='CED-ACC-001'")
            )
    assert fin.bank.account(fin.ada).available_balance_kobo == 10_000_000


def test_private_roles_and_no_ai_or_browser_ledger_write(fin):
    for domain in (DatabaseDomain.CEDAR, DatabaseDomain.VERIQ):
        with fin.registry.engines[domain].connect() as connection:
            for table in ("cedar_private.recipient_credits", "cedar_private.network_policy"):
                with pytest.raises(DBAPIError):
                    connection.execute(text("SELECT * FROM " + table))
                connection.rollback()
    with fin.registry.engines[DatabaseDomain.CEDAR].connect() as connection:
        for statement in (
            "UPDATE cedar.accounts SET available_balance_kobo=1",
            "DELETE FROM cedar.ledger_entries",
            (
                "INSERT INTO "
                "cedar.ledger_entries(bank_id,id,journal_id,"
                "ledger_account_id,debit_kobo,credit_kobo)"
                " VALUES ('CED','fake','fake','fake',1,0)"
            ),
        ):
            with pytest.raises(DBAPIError):
                connection.execute(text(statement))
            connection.rollback()
    for name in ("g1_ai_no_db", "g1_frontend_no_db"):
        with fin.admin.begin() as connection:
            connection.exec_driver_sql(
                f"CREATE ROLE {name} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE"
            )
        from sqlalchemy import create_engine

        untrusted = create_engine(fin.admin.url.set(username=name), hide_parameters=True)
        try:
            with untrusted.connect() as connection:
                for statement in (
                    "SELECT * FROM cedar.ledger_entries",
                    "SELECT cedar.g1_post_debit('CED','anything')",
                ):
                    with pytest.raises(DBAPIError):
                        connection.execute(text(statement))
                    connection.rollback()
        finally:
            untrusted.dispose()
            with fin.admin.begin() as connection:
                connection.exec_driver_sql(f"DROP ROLE {name}")


def test_dispatch_crash_after_private_credit_before_ack_is_recoverable(fin):
    identifier = fin.bank.create(fin.ada, "crash-after-network-credit", request())
    old = fin.dispatcher.claim(identifier)
    old_response = fin.network.submit(old.request)
    expire(fin, old)
    restarted = Dispatcher(fin.cedar, fin.network)
    current = restarted.claim(identifier)
    assert current.instruction_id == old.instruction_id and current.generation > old.generation
    replay = restarted.network.submit(current.request)
    assert replay == old_response
    assert not fin.dispatcher.complete(old, old_response)
    assert restarted.complete(current, replay)
    assert not restarted.complete(current, replay)
    with fin.private() as session:
        assert session.scalar(select(func.count()).select_from(RecipientCredit)) == 1
    assert count(fin, TransferAttempt) == 2 and debit_count(fin) == 1
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"


def test_duplicate_delayed_and_mismatched_messages_cannot_change_outcome(fin):
    arm(fin, "S0")
    identifier = fin.bank.create(fin.ada, "eligible-response-001", request())
    claim = fin.dispatcher.claim(identifier)
    response = fin.network.submit(claim.request)
    with pytest.raises(ValueError):
        fin.dispatcher.complete(claim, response.model_copy(update={"amount_kobo": 1}))
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"
    assert fin.dispatcher.complete(claim, response)
    assert not fin.dispatcher.complete(
        claim, response.model_copy(update={"kind": "OBSERVED_TIMEOUT"})
    )
    with pytest.raises(DBAPIError):
        with fin.admin.begin() as connection:
            connection.execute(
                text("UPDATE cedar.transfers SET financial_outcome='FAILURE_CONFIRMED'")
            )
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "CREDIT_CONFIRMED"


def test_seed_idempotent_preserves_spent_balance_and_policy_is_private(fin):
    fin.bank.create(fin.ada, "seed-preserves-history", request())
    with Session(fin.admin) as session, session.begin():
        seed(session)
    assert fin.bank.account(fin.ada).available_balance_kobo == 5_000_000 and debit_count(fin) == 1
    with Session(fin.admin) as session, session.begin():
        session.get(NetworkPolicy, "CED").scenario = "S0"
    with pytest.raises(ValueError):
        with Session(fin.admin) as session, session.begin():
            seed(session, "S2")


@pytest.mark.anyio
async def test_http_auth_ownership_expiry_and_no_operator_routes(fin):
    identifier = fin.bank.create(fin.ada, "ownership-test-001", request())
    app = create_app(fin.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client,
    ):
        assert (await client.get("/v1/cedar/accounts/me")).status_code == 401
        assert (
            await client.post(
                "/v1/cedar/transfers",
                json=request().model_dump(),
                headers={"Idempotency-Key": "anonymous-key"},
            )
        ).status_code == 401
        client.cookies.set("cedar_demo_session", fin.other_token)
        assert (await client.get("/v1/cedar/transfers/" + identifier)).status_code == 404
        assert (await client.get("/v1/cedar/accounts/me")).json()["id"] == "CED-ACC-002"
        with Session(fin.admin) as session, session.begin():
            session.get(DemoSession, sha256(fin.other_token.encode()).hexdigest()).expires_at = now(
                session
            ) - timedelta(seconds=1)
        assert (await client.get("/v1/cedar/accounts/me")).status_code == 401
        client.cookies.set("cedar_demo_session", "CED-CUST-001")
        assert (await client.get("/v1/cedar/accounts/me")).status_code == 401
        for route in ("/v1/cedar/sessions", "/v1/demo/status-reveal", "/v1/cedar/staff/cases"):
            assert (await client.post(route, json={})).status_code == 404
    assert debit_count(fin) == 1


@pytest.mark.anyio
@pytest.mark.parametrize("amount", [0, -1, True, False, 1.5, 5000000.0, "5000000"])
async def test_api_rejects_non_positive_or_non_integer_money(fin, amount):
    app = create_app(fin.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": fin.ada_token},
        ) as client,
    ):
        payload = request().model_dump()
        payload["amount_kobo"] = amount
        assert (
            await client.post(
                "/v1/cedar/transfers", json=payload, headers={"Idempotency-Key": "invalid-amount"}
            )
        ).status_code == 422
    assert debit_count(fin) == 0


@pytest.mark.anyio
@pytest.mark.parametrize(
    "extra",
    [
        {"scenario_id": "S0"},
        {"force_success": True},
        {"drop_response": False},
        {"customer_id": "CED-CUST-002"},
    ],
)
async def test_customer_cannot_choose_scenario_or_identity(fin, extra):
    app = create_app(fin.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": fin.ada_token},
        ) as client,
    ):
        result = await client.post(
            "/v1/cedar/transfers",
            json={**request().model_dump(), **extra},
            headers={"Idempotency-Key": "invalid-operator-field"},
        )
        assert result.status_code == 422
    assert debit_count(fin) == 0


def test_account_status_and_name_enquiry_validation(fin):
    with Session(fin.admin) as session, session.begin():
        session.get(Account, ("CED", "CED-ACC-001")).status = "FROZEN"
    with pytest.raises(InfrastructureError, match="ACCOUNT_UNAVAILABLE"):
        fin.bank.create(fin.ada, "frozen-account", request())
    with pytest.raises(InfrastructureError, match="BENEFICIARY_NOT_FOUND"):
        fin.bank.name_enquiry(NameEnquiryInput(bank_id="ELM", account_id="NOT-FICTIONAL-REFERENCE"))
    assert debit_count(fin) == 0


def test_network_rejects_changed_instruction_and_survives_operator_policy_change(fin):
    identifier = fin.bank.create(fin.ada, "network-stable-instruction", request())
    claim = fin.dispatcher.claim(identifier)
    first = fin.network.submit(claim.request)
    arm(fin, "S0")
    assert fin.network.submit(claim.request) == first
    with pytest.raises(ValueError):
        fin.network.submit(claim.request.model_copy(update={"amount_kobo": 1}))
    assert first.kind == "OBSERVED_TIMEOUT"


@pytest.mark.anyio
async def test_cookie_security_metadata_and_same_origin_json_guard(fin):
    app = create_app(fin.settings)
    security = app.openapi()["components"]["securitySchemes"]["sessionAuth"]
    assert security == {"type": "apiKey", "in": "cookie", "name": "cedar_demo_session"}
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": fin.ada_token},
        ) as client,
    ):
        denied = await client.post(
            "/v1/cedar/transfers",
            json=request().model_dump(),
            headers={"Idempotency-Key": "cross-origin-test", "Origin": "https://untrusted.example"},
        )
        assert denied.status_code == 403
        assert (await client.get("/v1/cedar/accounts/me")).headers["cache-control"] == "no-store"
        invalid = await client.post(
            "/v1/cedar/transfers",
            content="{}",
            headers={"Idempotency-Key": "wrong-media-type", "Content-Type": "text/plain"},
        )
        assert invalid.status_code == 415
    assert debit_count(fin) == 0


def test_database_rejects_impossible_outcomes_and_negative_money(fin):
    identifier = fin.bank.create(fin.ada, "database-guard-test", request())
    for statement in [
        "UPDATE cedar.transfers SET financial_outcome='CREDIT_CONFIRMED'",
        "UPDATE cedar.transfers SET processing_stage='COMPLETED'",
        "UPDATE cedar.transfers SET amount_kobo=-1",
    ]:
        with pytest.raises(DBAPIError):
            with fin.admin.begin() as connection:
                connection.execute(text(statement))
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"


def test_network_outage_retains_durable_unknown_and_bounded_attempts(fin):
    class UnavailableNetwork:
        def submit(self, instruction):
            raise ConnectionError("private-provider-text-must-not-be-stored")

    identifier = fin.bank.create(fin.ada, "network-unavailable-key", request())
    worker = Dispatcher(fin.cedar, UnavailableNetwork())
    for _attempt in range(5):
        assert worker.run_once(identifier)
        with fin.admin.begin() as connection:
            connection.execute(
                text(
                    "UPDATE cedar.payment_instructions SET available_at=clock_timestamp() "
                    "WHERE state='RETRY_WAIT'"
                )
            )
    assert not worker.run_once(identifier)
    with fin.cedar() as session:
        job = session.scalar(select(PaymentInstruction))
        assert job.state == "DEAD_LETTER" and job.attempts == 5
    assert fin.bank.get(fin.ada, identifier).financial_outcome == "UNKNOWN"
    assert count(fin, TransferAttempt) == 5 and debit_count(fin) == 1
    with fin.private() as session:
        assert session.scalar(select(func.count()).select_from(RecipientCredit)) == 0
