"""VeriqBase owns only veriq metadata; no business tables yet."""

from sqlalchemy.orm import DeclarativeBase

from veriq_cedar.platform.database.base import domain_metadata


class VeriqBase(DeclarativeBase):
    metadata = domain_metadata("veriq")
