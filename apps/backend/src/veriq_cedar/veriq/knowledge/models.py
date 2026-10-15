"""Durable source originals, parser provenance and bank-scoped materialized context."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKeyConstraint,
    Integer,
    LargeBinary,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from veriq_cedar.veriq.persistence.base import VeriqBase
from veriq_cedar.veriq.persistence.operational import Identity


class Source(Identity, VeriqBase):
    __tablename__ = "knowledge_sources"
    __table_args__ = (UniqueConstraint("bank_id", "checksum", "filename", "source_kind"),)
    filename: Mapped[str] = mapped_column(String(160))
    source_kind: Mapped[str] = mapped_column(String(80))
    checksum: Mapped[str] = mapped_column(String(64))
    content: Mapped[bytes] = mapped_column(LargeBinary)
    status: Mapped[str] = mapped_column(String(40))
    job_id: Mapped[str] = mapped_column(String(160), unique=True)
    job_state: Mapped[str] = mapped_column(String(40))
    method: Mapped[str] = mapped_column(String(80))
    error_code: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Entity(Identity, VeriqBase):
    __tablename__ = "knowledge_entities"
    kind: Mapped[str] = mapped_column(String(40))
    name: Mapped[str] = mapped_column(String(160))
    source_id: Mapped[str] = mapped_column(String(160))
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "source_id"],
            ["veriq.knowledge_sources.bank_id", "veriq.knowledge_sources.id"],
        ),
    )


class Relationship(Identity, VeriqBase):
    __tablename__ = "knowledge_relationships"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bank_id", "source_id"],
            ["veriq.knowledge_sources.bank_id", "veriq.knowledge_sources.id"],
        ),
        ForeignKeyConstraint(
            ["bank_id", "from_id"],
            ["veriq.knowledge_entities.bank_id", "veriq.knowledge_entities.id"],
            name="fk_knowledge_relationship_from",
        ),
        ForeignKeyConstraint(
            ["bank_id", "to_id"],
            ["veriq.knowledge_entities.bank_id", "veriq.knowledge_entities.id"],
            name="fk_knowledge_relationship_to",
        ),
    )
    source_id: Mapped[str] = mapped_column(String(160))
    from_id: Mapped[str] = mapped_column(String(160))
    to_id: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40))
    evidence_id: Mapped[str] = mapped_column(String(240))
    locator: Mapped[str] = mapped_column(String(160))


class ContextVersion(VeriqBase):
    __tablename__ = "context_versions"
    bank_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    revision: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
