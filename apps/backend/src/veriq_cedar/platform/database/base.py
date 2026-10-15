"""Metadata factory only; each domain owns its own declarative registry."""

from sqlalchemy import MetaData

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def domain_metadata(schema: str) -> MetaData:
    return MetaData(schema=schema, naming_convention=NAMING_CONVENTION)
