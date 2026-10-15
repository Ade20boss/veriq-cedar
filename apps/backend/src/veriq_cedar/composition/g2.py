"""Private staff provisioning, autonomous existing-job worker and four-act pitch replay."""

import argparse
import json
import logging
import os
import secrets
import time
from datetime import timedelta
from hashlib import sha256
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from veriq_cedar.cedar.adapters.synthetic import CedarResultSink
from veriq_cedar.cedar.complaints.delivery import ComplaintDelivery
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.platform.logging import configure_logging
from veriq_cedar.platform.settings import MigrationSettings, Settings
from veriq_cedar.veriq.ai.client import AIClient
from veriq_cedar.veriq.investigations.cases import CaseReceiver
from veriq_cedar.veriq.investigations.worker import Worker
from veriq_cedar.veriq.operations.service import database_now
from veriq_cedar.veriq.persistence.pitch import StaffSession


def mint_staff(session, bank="CED"):
    token = secrets.token_urlsafe(32)
    session.add(
        StaffSession(
            token_hash=sha256(token.encode()).hexdigest(),
            bank_id=bank,
            role="INVESTIGATOR",
            expires_at=database_now(session) + timedelta(hours=1),
        )
    )
    return token


def configured_ai(settings):
    if (
        settings.ai_enabled
        and settings.ai_base_url
        and settings.ai_service_key
        and settings.ai_service_key.get_secret_value().strip()
    ):
        return AIClient(
            settings.ai_base_url.get_secret_value(),
            settings.ai_service_key.get_secret_value(),
            settings.ai_timeout_seconds,
        )
    if settings.ai_enabled:
        logging.getLogger("veriq_cedar.veriq.ai").warning(
            "case_ai.unconfigured", extra={"error_code": "AI_UNCONFIGURED"}
        )
    return None


def components(registry, ai_client=None):
    v = registry.sessions[DatabaseDomain.VERIQ]
    c = registry.sessions[DatabaseDomain.CEDAR]
    return ComplaintDelivery(c, CaseReceiver(v)), Worker(
        v,
        "CED",
        "pitch-worker-" + secrets.token_hex(6),
        CedarResultSink(c, "CED"),
        ai_client=ai_client,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("staff-session", "worker", "replay", "telemetry"))
    parser.add_argument("--cookie-file", type=Path)
    args = parser.parse_args()
    if args.command == "worker":
        settings = Settings()
        configure_logging(settings.log_level)
        registry = DatabaseRegistry(settings)
        try:
            registry.check_ready()
            delivery, worker = components(registry, configured_ai(settings))
            while True:
                delivered = delivery.run_once()
                worked = worker.run_once()
                if not delivered and not worked:
                    time.sleep(1)
        finally:
            registry.dispose()
        return
    if os.environ.get("ENVIRONMENT") != "test":
        parser.error("Private demo provisioning requires ENVIRONMENT=test")
    if args.command == "telemetry":
        from datetime import UTC, datetime

        from veriq_cedar.cedar.adapters.synthetic import SyntheticEvents
        from veriq_cedar.veriq.operations.service import EventProcessor

        registry = DatabaseRegistry(Settings())
        try:
            registry.check_ready()
            source = SyntheticEvents.from_fixture(
                Path(__file__).resolve().parents[5] / "contracts/demo.json", datetime.now(UTC)
            )
            processor = EventProcessor(registry.sessions[DatabaseDomain.VERIQ], source.principal)
            receipts = [processor.accept(event) for event in source.read_events()]
            print(json.dumps({"fictional_environment": True, "accepted_event_receipts": receipts}))
        finally:
            registry.dispose()
        return
    if args.command == "replay":
        import asyncio

        from veriq_cedar.composition.pitch_replay import replay

        asyncio.run(replay(Settings(), MigrationSettings()))
        return
    if args.cookie_file is None or not args.cookie_file.name.endswith(".session.json"):
        parser.error("A new private *.session.json path is required")
    engine = create_engine(
        MigrationSettings().database_url.get_secret_value(), hide_parameters=True
    )
    try:
        with Session(engine) as session, session.begin():
            token = mint_staff(session)
            fd = os.open(args.cookie_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w") as output:
                json.dump(
                    {
                        "cookie_name": "cedar_demo_session",
                        "cookie_value": token,
                        "cookie_path": "/v1/veriq",
                    },
                    output,
                )
        print(
            "Fictional investigator session provisioned; one-hour expiry. "
            "Token is only in the private file."
        )
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
