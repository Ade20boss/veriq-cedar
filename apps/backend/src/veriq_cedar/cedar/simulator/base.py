"""SimulatorBase owns only cedar_private metadata; no business tables yet."""

from sqlalchemy.orm import DeclarativeBase

from veriq_cedar.platform.database.base import domain_metadata


class SimulatorBase(DeclarativeBase):
    metadata = domain_metadata("cedar_private")
