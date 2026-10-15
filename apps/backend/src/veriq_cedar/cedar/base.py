"""CedarBase owns only cedar metadata; no business tables yet."""

from sqlalchemy.orm import DeclarativeBase

from veriq_cedar.platform.database.base import domain_metadata


class CedarBase(DeclarativeBase):
    metadata = domain_metadata("cedar")
