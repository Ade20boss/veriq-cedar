"""Create separate data namespaces only; no business tables or runtime roles.

Revision ID: 0001_domain_schemas
Revises: none
"""

from alembic import op
from sqlalchemy.schema import CreateSchema, DropSchema

revision = "0001_domain_schemas"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    for schema in ("cedar", "veriq", "cedar_private"):
        op.execute(CreateSchema(schema))
        op.execute(f'REVOKE ALL ON SCHEMA "{schema}" FROM PUBLIC')


def downgrade() -> None:
    # No CASCADE: later/untracked data must never be silently destroyed.
    for schema in ("cedar_private", "veriq", "cedar"):
        op.execute(DropSchema(schema))
