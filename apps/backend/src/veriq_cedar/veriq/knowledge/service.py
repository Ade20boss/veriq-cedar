"""Small deterministic source adapters. Unstructured text is preserved, never fake-extracted."""

import csv
import io
import json
from collections import Counter
from datetime import UTC, datetime
from hashlib import sha256

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import select, text

from veriq_cedar.integration.operational import Identifier
from veriq_cedar.veriq.knowledge.models import ContextVersion, Entity, Relationship, Source
from veriq_cedar.veriq.operations.service import database_now, identity

MAX_BYTES = 262144
FILES = {
    "services.json",
    "dependencies.csv",
    "routes.json",
    "historical_incidents.md",
    "operations_sop.txt",
}


class EntityInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: Identifier
    type: str = Field(pattern="^(BANK|SERVICE)$")
    name: str = Field(min_length=1, max_length=160)


class RouteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: Identifier
    service_id: Identifier
    from_bank_id: Identifier
    to_bank_id: Identifier


class Knowledge:
    def __init__(self, sessions):
        self.sessions = sessions

    def register(self, bank, filename, kind, content):
        if filename not in FILES or not 1 <= len(kind) <= 80 or not 0 < len(content) <= MAX_BYTES:
            raise ValueError("Unsupported source or size")
        content.decode("utf-8")
        if b"\x00" in content:
            raise ValueError("Text source required")
        digest = sha256(content).hexdigest()
        with self.sessions.begin() as session:
            session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": "knowledge/" + bank},
            )
            prior = session.scalar(
                select(Source).where(
                    Source.bank_id == bank,
                    Source.checksum == digest,
                    Source.filename == filename,
                    Source.source_kind == kind,
                )
            )
            if prior:
                return {"source_id": prior.id, "status": prior.status, "job_id": prior.job_id}
            time = database_now(session)
            source = Source(
                bank_id=bank,
                id=identity(),
                filename=filename,
                source_kind=kind,
                checksum=digest,
                content=content,
                status="UPLOADED",
                job_id=identity(),
                job_state="AI_UNAVAILABLE",
                method="NONE",
                error_code=None,
                created_at=time,
            )
            session.add(source)
            session.flush()
            if filename in ("services.json", "dependencies.csv", "routes.json"):
                try:
                    with session.begin_nested():
                        self._parse(session, source)
                    source.status = "PARSED"
                    source.job_state = "SUCCEEDED"
                    source.method = "DETERMINISTIC_" + filename
                except (ValueError, KeyError, TypeError, ValidationError):
                    source.status = "FAILED"
                    source.job_state = "FAILED"
                    source.error_code = "SOURCE_VALIDATION_FAILED"
            version = session.get(ContextVersion, bank)
            if version:
                version.revision += 1
                version.updated_at = time
            else:
                session.add(ContextVersion(bank_id=bank, revision=1, updated_at=time))
            return {"source_id": source.id, "status": source.status, "job_id": source.job_id}

    def _entity(self, session, source, identifier, kind, name):
        old = session.get(Entity, (source.bank_id, identifier))
        if old:
            if (old.kind, old.name) != (kind, name):
                raise ValueError("Conflicting registered entity")
        else:
            session.add(
                Entity(
                    bank_id=source.bank_id, id=identifier, kind=kind, name=name, source_id=source.id
                )
            )
            session.flush()

    def _edge(self, session, source, from_id, to_id, kind, locator):
        if (
            session.get(Entity, (source.bank_id, from_id)) is None
            or session.get(Entity, (source.bank_id, to_id)) is None
        ):
            raise ValueError("Unregistered relationship endpoint")
        if not 1 <= len(kind) <= 80:
            raise ValueError("Invalid relationship kind")
        session.add(
            Relationship(
                bank_id=source.bank_id,
                id=identity(),
                source_id=source.id,
                from_id=from_id,
                to_id=to_id,
                kind=kind,
                status="DOCUMENTED",
                evidence_id=source.id + "/" + locator,
                locator=locator,
            )
        )

    def _parse(self, session, source):
        body = source.content.decode("utf-8")
        if source.filename == "services.json":
            data = json.loads(body)
            if (
                not isinstance(data, dict)
                or set(data) != {"entities"}
                or len(data["entities"]) > 200
            ):
                raise ValueError("Invalid inventory")
            for raw in data["entities"]:
                row = EntityInput.model_validate(raw)
                self._entity(session, source, row.id, row.type, row.name)
        elif source.filename == "dependencies.csv":
            rows = csv.DictReader(io.StringIO(body))
            if rows.fieldnames != ["from_entity_id", "to_entity_id", "type"]:
                raise ValueError("Invalid dependency headers")
            for i, row in enumerate(rows, 2):
                if i > 201 or None in row:
                    raise ValueError("Invalid dependency row")
                self._edge(
                    session,
                    source,
                    row["from_entity_id"],
                    row["to_entity_id"],
                    row["type"],
                    "row-" + str(i),
                )
        else:
            data = json.loads(body)
            if not isinstance(data, dict) or set(data) != {"routes"} or len(data["routes"]) > 100:
                raise ValueError("Invalid routes")
            for i, raw in enumerate(data["routes"]):
                route = RouteInput.model_validate(raw)
                self._entity(session, source, route.id, "ROUTE", route.id)
                for field, kind in [
                    ("from_bank_id", "ORIGINATES_AT"),
                    ("service_id", "USES"),
                    ("to_bank_id", "DESTINATION"),
                ]:
                    self._edge(
                        session,
                        source,
                        route.id,
                        getattr(route, field),
                        kind,
                        "routes-" + str(i) + "-" + field,
                    )

    def sources(self, bank):
        with self.sessions() as session:
            return [
                {
                    "source_id": s.id,
                    "filename": s.filename,
                    "source_kind": s.source_kind,
                    "status": s.status,
                    "accepted_claims": 0,
                    "flagged_claims": 0,
                    "checksum_sha256": s.checksum,
                }
                for s in session.scalars(
                    select(Source).where(Source.bank_id == bank).order_by(Source.created_at)
                )
            ]

    def context(self, bank):
        with self.sessions() as session:
            entities = session.scalars(select(Entity.kind).where(Entity.bank_id == bank)).all()
            edges = session.scalars(select(Relationship).where(Relationship.bank_id == bank)).all()
            sources = session.scalars(select(Source.id).where(Source.bank_id == bank)).all()
            v = session.get(ContextVersion, bank)
            return {
                "bank_id": bank,
                "context_version": v.revision if v else 0,
                "entity_counts": dict(Counter(entities)),
                "relationship_counts": dict(Counter(e.kind for e in edges)),
                "source_count": len(sources),
                "candidate_count": sum(e.status == "CANDIDATE" for e in edges),
                "verified_count": sum(e.status == "VERIFIED" for e in edges),
                "updated_at": v.updated_at if v else datetime(1970, 1, 1, tzinfo=UTC),
            }

    def relationships(self, bank):
        with self.sessions() as session:
            return [
                {
                    "id": e.id,
                    "bank_id": bank,
                    "from_entity_id": e.from_id,
                    "to_entity_id": e.to_id,
                    "type": e.kind,
                    "status": e.status,
                    "evidence_ids": [e.evidence_id],
                    "source_id": e.source_id,
                    "valid_from": None,
                }
                for e in session.scalars(
                    select(Relationship)
                    .where(Relationship.bank_id == bank)
                    .order_by(Relationship.id)
                )
            ]
