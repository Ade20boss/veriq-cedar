"""Private disposable seed/auth/operator CLI and autonomous payment dispatch worker."""

import argparse
import json
import os
import time
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.seed import mint_session, seed
from veriq_cedar.cedar.simulator.models import NetworkPolicy
from veriq_cedar.composition.financial import get_dispatcher
from veriq_cedar.platform.database.session import DatabaseRegistry
from veriq_cedar.platform.settings import MigrationSettings, Settings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("seed", "mint-session", "arm", "worker", "replay"))
    parser.add_argument("--scenario", choices=("S0", "S2"), default="S2")
    parser.add_argument("--customer", default="CED-CUST-001")
    parser.add_argument("--cookie-file", type=Path)
    args = parser.parse_args()
    if args.command == "worker":
        registry = DatabaseRegistry(Settings())
        try:
            registry.check_ready()
            dispatcher = get_dispatcher(registry)
            while True:
                if not dispatcher.run_once():
                    time.sleep(1)
        finally:
            registry.dispose()
        return
    if os.environ.get("ENVIRONMENT") != "test":
        parser.error("Private synthetic setup requires ENVIRONMENT=test")
    if args.command == "replay":
        import asyncio

        asyncio.run(replay(Settings(), MigrationSettings(), args.scenario))
        return
    engine = create_engine(
        MigrationSettings().database_url.get_secret_value(), hide_parameters=True
    )
    try:
        with Session(engine) as session, session.begin():
            if args.command == "seed":
                seed(session, args.scenario)
            elif args.command == "arm":
                policy = session.get(NetworkPolicy, "CED")
                if policy is None:
                    raise ValueError("Seed the synthetic bank first")
                policy.scenario = args.scenario
            else:
                if args.cookie_file is None or not args.cookie_file.name.endswith(".session.json"):
                    parser.error("--cookie-file must be a new private *.session.json file")
                token, expires = mint_session(session, args.customer)
                # Exclusive mode prevents accidental credential-file overwrite; no token on stdout.
                fd = os.open(args.cookie_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(fd, "w") as output:
                    json.dump(
                        {
                            "cookie_name": "cedar_demo_session",
                            "cookie_value": token,
                            "expires_at": expires.isoformat(),
                        },
                        output,
                    )
        print(json.dumps({"synthetic": True, "command": args.command, "status": "completed"}))
    finally:
        engine.dispose()


async def replay(settings, migration_settings, scenario):
    """Runs actual HTTP handlers/database; refuses existing transfers and never resets."""
    from hashlib import sha256

    from httpx import ASGITransport, AsyncClient
    from sqlalchemy import func, select

    from veriq_cedar.cedar.accounts.models import DemoSession
    from veriq_cedar.cedar.transfers.models import Transfer
    from veriq_cedar.main import create_app

    engine = create_engine(migration_settings.database_url.get_secret_value(), hide_parameters=True)
    token = None
    try:
        with Session(engine) as session, session.begin():
            if session.scalar(select(func.count()).select_from(Transfer)):
                raise ValueError(
                    "Replay refuses existing transfers; use a fresh disposable database"
                )
            seed(session, scenario)
            token, _ = mint_session(session, "CED-CUST-001")
        app = create_app(settings)
        async with (
            app.router.lifespan_context(app),
            AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://synthetic.local",
                cookies={"cedar_demo_session": token},
            ) as client,
        ):
            before = (await client.get("/v1/cedar/accounts/me")).json()
            enquiry = await client.post(
                "/v1/cedar/name-enquiries", json={"bank_id": "ELM", "account_id": "ELM-ACC-009"}
            )
            submitted = await client.post(
                "/v1/cedar/transfers",
                headers={"Idempotency-Key": "g1-private-cli-replay"},
                json={
                    "beneficiary_bank_id": "ELM",
                    "beneficiary_account_id": "ELM-ACC-009",
                    "amount_kobo": 5000000,
                },
            )
            if submitted.status_code != 201:
                raise RuntimeError("Synthetic transfer did not complete its command")
            transfer = submitted.json()
            after = (await client.get("/v1/cedar/accounts/me")).json()
            outcome = "UNKNOWN" if scenario == "S2" else "CREDIT_CONFIRMED"
            if transfer["financial_outcome"] != outcome:
                raise RuntimeError("Replay did not reach expected sender-visible state")
            from veriq_cedar.cedar.ledger.models import Journal
            from veriq_cedar.platform.database.session import DatabaseDomain

            with app.state.databases.sessions[DatabaseDomain.CEDAR]() as session:
                journals = session.scalar(
                    select(func.count())
                    .select_from(Journal)
                    .where(Journal.kind == "TRANSFER_DEBIT")
                )
            if (
                journals != 1
                or after["available_balance_kobo"] != before["available_balance_kobo"] - 5000000
            ):
                raise RuntimeError("Replay financial assertion failed")
            print(
                json.dumps(
                    {
                        "synthetic": True,
                        "scenario": scenario,
                        "before": before,
                        "name_enquiry": enquiry.json(),
                        "transfer": transfer,
                        "after": after,
                        "debit_journals": journals,
                    },
                    indent=2,
                )
            )
    finally:
        if token:
            with Session(engine) as session, session.begin():
                record = session.get(DemoSession, sha256(token.encode()).hexdigest())
                if record:
                    session.delete(record)
        engine.dispose()


if __name__ == "__main__":
    main()
