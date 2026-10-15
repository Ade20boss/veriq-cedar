"""Developer replay and autonomous durable worker; no business HTTP endpoint."""

import argparse
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import func, select

from veriq_cedar.cedar.adapters.models import ResultInbox
from veriq_cedar.cedar.adapters.synthetic import CedarResultSink, SyntheticEvents
from veriq_cedar.integration.operational import EventSource, Principal
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.platform.settings import Settings
from veriq_cedar.veriq.investigations.worker import Worker
from veriq_cedar.veriq.operations.service import EventProcessor
from veriq_cedar.veriq.persistence.operational import EventReceipt, Incident, Investigation, Job


def ingest(source: EventSource, processor: EventProcessor):
    for event in source.read_events():
        processor.accept(event)  # Acknowledgement follows the atomic receiver commit.


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("replay", "worker"))
    parser.add_argument("--fixture", type=Path)
    args = parser.parse_args()
    settings = Settings()
    if settings.environment != "test" and args.command == "replay":
        parser.error("Synthetic replay requires ENVIRONMENT=test and a fresh disposable database")
    registry = DatabaseRegistry(settings)
    try:
        registry.check_ready()
        veriq = registry.sessions[DatabaseDomain.VERIQ]
        cedar = registry.sessions[DatabaseDomain.CEDAR]
        worker = Worker(veriq, "CED", str(uuid4()), CedarResultSink(cedar, "CED"))
        if args.command == "worker":
            while True:
                if not worker.run_once():
                    time.sleep(1)
        else:
            if args.fixture is None:
                parser.error("--fixture must identify the approved contracts/demo.json")
            # Guard clean synthetic state; never delete/reset existing rows.
            with veriq() as session:
                if session.scalar(select(func.count()).select_from(EventReceipt)):
                    parser.error("Replay requires empty operational event state; refuses to reset")
            with cedar() as session:
                if session.scalar(select(func.count()).select_from(ResultInbox)):
                    parser.error("Replay requires empty bank status state; refuses to reset")
            source = SyntheticEvents.from_fixture(args.fixture, datetime.now(UTC))
            ingest(
                source,
                EventProcessor(
                    veriq, Principal(bank_id="CED", source_system="cedar.synthetic.metrics")
                ),
            )
            while worker.run_once():
                pass
            with veriq() as session, cedar() as bank_session:
                incidents = session.scalars(select(Incident).where(Incident.bank_id == "CED")).all()
                inv = session.scalar(select(Investigation).where(Investigation.bank_id == "CED"))
                jobs = session.scalars(select(Job).where(Job.bank_id == "CED")).all()
                inbox = bank_session.scalar(select(ResultInbox).where(ResultInbox.bank_id == "CED"))
                if (
                    len(incidents) != 1
                    or inv is None
                    or inbox is None
                    or any(j.state != "SUCCEEDED" for j in jobs)
                ):
                    raise RuntimeError(
                        "Synthetic replay did not complete; inspect durable job state"
                    )
                print(
                    json.dumps(
                        {
                            "synthetic": True,
                            "incidents": [
                                {
                                    "id": i.id,
                                    "bank_id": i.bank_id,
                                    "state": i.state,
                                    "route_id": i.route_id,
                                    "service_id": i.service_id,
                                }
                                for i in incidents
                            ],
                            "investigation_id": inv.id,
                            "investigation_status": inv.state,
                            "review_status": inv.review_status,
                            "jobs": [
                                {"job_id": j.id, "kind": j.kind, "state": j.state} for j in jobs
                            ],
                            "cedar_status": inbox.payload,
                        },
                        indent=2,
                    )
                )
    finally:
        registry.dispose()


if __name__ == "__main__":
    main()
