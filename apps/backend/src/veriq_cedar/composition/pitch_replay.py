"""Truthful four-act replay through real HTTP handlers, neutral adapters and PostgreSQL."""

import json
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path

from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.models import DemoSession
from veriq_cedar.cedar.accounts.seed import mint_session, seed
from veriq_cedar.cedar.adapters.synthetic import SyntheticEvents
from veriq_cedar.cedar.ledger.models import Entry, Journal
from veriq_cedar.cedar.transfers.models import Transfer
from veriq_cedar.composition.g2 import components, mint_staff
from veriq_cedar.platform.database.session import DatabaseDomain
from veriq_cedar.veriq.knowledge.models import Source
from veriq_cedar.veriq.operations.service import EventProcessor
from veriq_cedar.veriq.persistence.operational import EventReceipt
from veriq_cedar.veriq.persistence.pitch import StaffSession


async def replay(settings, migration_settings):
    from veriq_cedar.main import create_app

    root = Path(__file__).resolve().parents[5]
    # This developer command needs the repository fixture files.
    if not (root / "contracts/demo.json").is_file():
        raise RuntimeError("Run the developer replay from its repository installation")
    engine = create_engine(migration_settings.database_url.get_secret_value(), hide_parameters=True)
    customer = staff = None
    try:
        with Session(engine) as session, session.begin():
            for model in (Transfer, Source, EventReceipt):
                if session.scalar(select(func.count()).select_from(model)):
                    raise ValueError(
                        "Pitch replay requires a fresh disposable database; no reset is performed"
                    )
            seed(session, "S2")
            customer, _ = mint_session(session, "CED-CUST-001")
            staff = mint_staff(session)
        app = create_app(settings.model_copy(update={"log_level": "ERROR"}))
        async with (
            app.router.lifespan_context(app),
            AsyncClient(transport=ASGITransport(app=app), base_url="http://pitch.local") as client,
        ):

            async def get(path):
                response = await client.get(path)
                if response.status_code != 200:
                    raise RuntimeError("Pitch GET failed: " + path)
                return response.json()

            client.cookies.set("cedar_demo_session", staff)
            registered = []
            for filename in (
                "services.json",
                "dependencies.csv",
                "routes.json",
                "historical_incidents.md",
                "operations_sop.txt",
            ):
                response = await client.post(
                    "/v1/veriq/banks/CED/sources",
                    files={
                        "file": (filename, (root / "fixtures/onboarding" / filename).read_bytes())
                    },
                    data={"source_kind": "PITCH_FIXTURE"},
                )
                if response.status_code != 202 or response.json()["status"] not in (
                    "PARSED",
                    "UPLOADED",
                ):
                    raise RuntimeError("Source onboarding failed")
                registered.append(response.json())
            context = await get("/v1/veriq/banks/CED/context")
            relationships = await get("/v1/veriq/banks/CED/relationships")
            if context["source_count"] != 5 or len(relationships) != 10:
                raise RuntimeError("Context verification failed")
            registry = app.state.databases
            source = SyntheticEvents.from_fixture(root / "contracts/demo.json", datetime.now(UTC))
            processor = EventProcessor(registry.sessions[DatabaseDomain.VERIQ], source.principal)
            for event in source.read_events():
                processor.accept(event)
            delivery, worker = components(registry)

            def drain():
                for _ in range(50):
                    a = delivery.run_once()
                    b = worker.run_once()
                    if not a and not b:
                        return
                raise RuntimeError("Pitch jobs did not quiesce")

            drain()
            operations = await get("/v1/veriq/banks/CED/operations")
            incidents = await get("/v1/veriq/banks/CED/incidents")
            if (
                len(incidents) != 1
                or incidents[0]["status"] != "SUSPECTED"
                or incidents[0]["case_ids"]
            ):
                raise RuntimeError("Proactive incident assertion failed")
            if {r["service_id"]: r["status"] for r in operations} != {
                "G2": "DEGRADED",
                "G3": "NORMAL",
            }:
                raise RuntimeError("Route comparison assertion failed")
            client.cookies.set("cedar_demo_session", customer)
            before = await get("/v1/cedar/accounts/me")
            response = await client.post(
                "/v1/cedar/transfers",
                headers={"Idempotency-Key": "pitch-s2-transfer"},
                json={
                    "beneficiary_bank_id": "ELM",
                    "beneficiary_account_id": "ELM-ACC-009",
                    "amount_kobo": 5000000,
                },
            )
            if response.status_code != 201:
                raise RuntimeError("Transfer command failed")
            transfer = response.json()
            if (
                transfer["financial_outcome"] != "UNKNOWN"
                or transfer["processing_stage"] != "RESPONSE_TIMEOUT"
            ):
                raise RuntimeError("S2 authority assertion failed")
            after = await get("/v1/cedar/accounts/me")
            response = await client.post(
                "/v1/cedar/complaints",
                json={
                    "transfer_id": transfer["id"],
                    "description": "My fictional Elm transfer timed out. Please investigate.",
                },
            )
            if response.status_code != 201:
                raise RuntimeError("Durable complaint intake failed")
            complaint = response.json()
            drain()
            client.cookies.set("cedar_demo_session", staff)
            investigation = await get("/v1/veriq/banks/CED/cases/" + complaint["id"])
            if (
                investigation["status"] != "EVIDENCE_READY_AI_UNAVAILABLE"
                or investigation["financial_outcome"] != "UNKNOWN"
                or investigation["incident_ids"] != [incidents[0]["id"]]
                or investigation["ai_result"] is not None
            ):
                raise RuntimeError("Automatic case assertion failed")
            with registry.sessions[DatabaseDomain.CEDAR]() as session:
                journals = session.scalars(
                    select(Journal).where(Journal.kind == "TRANSFER_DEBIT")
                ).all()
                entries = session.scalars(
                    select(Entry).where(Entry.journal_id == journals[0].id)
                ).all()
                balanced = (
                    len(journals) == 1
                    and len(entries) == 2
                    and sum(e.debit_kobo for e in entries)
                    == sum(e.credit_kobo for e in entries)
                    == 5000000
                )
            if (
                not balanced
                or after["available_balance_kobo"] != before["available_balance_kobo"] - 5000000
            ):
                raise RuntimeError("Ledger assertion failed")
            denied = 0
            for domain in (DatabaseDomain.CEDAR, DatabaseDomain.VERIQ):
                with registry.engines[domain].connect() as connection:
                    try:
                        connection.execute(text("SELECT * FROM cedar_private.recipient_credits"))
                    except DBAPIError:
                        denied += 1
                        connection.rollback()
            if denied != 2:
                raise RuntimeError("Private grant assertion failed")
            print(
                json.dumps(
                    {
                        "fictional_environment": True,
                        "deterministic_network_mock": "S2; no AI called",
                        "act_i": {
                            "sources": registered,
                            "context": context,
                            "relationship_count": len(relationships),
                        },
                        "act_ii": {"operations": operations, "incident": incidents[0]},
                        "act_iii": {
                            "transfer": transfer,
                            "balance_before_kobo": before["available_balance_kobo"],
                            "balance_after_kobo": after["available_balance_kobo"],
                            "debit_journals": len(journals),
                        },
                        "act_iv": {
                            "complaint": complaint,
                            "investigation_status": investigation["status"],
                            "financial_outcome": investigation["financial_outcome"],
                            "incident_ids": investigation["incident_ids"],
                            "evidence_ids": [e["id"] for e in investigation["evidence"]],
                        },
                        "verification": {
                            "balanced_single_debit": balanced,
                            "private_reads_denied": denied,
                            "automatic_case_without_investigate_request": True,
                            "ai_result": None,
                        },
                    },
                    indent=2,
                )
            )
    finally:
        with Session(engine) as session, session.begin():
            for model, token in ((DemoSession, customer), (StaffSession, staff)):
                if token:
                    row = session.get(model, sha256(token.encode()).hexdigest())
                    if row:
                        session.delete(row)
        engine.dispose()
