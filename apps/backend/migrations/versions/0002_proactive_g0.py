"""Persist proactive incident G0 and permitted Cedar inbox
Revision ID: 0002_proactive_g0
Revises: 0001_domain_schemas
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_proactive_g0"
down_revision = "0001_domain_schemas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Reviewed Task 003 tables only; no ledger/private simulation tables.
    op.create_table(
        "investigation_result_receipts",
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("delivery_id", sa.String(length=160), nullable=False),
        sa.Column("digest", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint(
            "bank_id", "delivery_id", name=op.f("pk_investigation_result_receipts")
        ),
        schema="cedar",
    )
    op.create_table(
        "investigation_status_inbox",
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("investigation_id", sa.String(length=160), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint(
            "bank_id", "investigation_id", name=op.f("pk_investigation_status_inbox")
        ),
        schema="cedar",
    )
    op.create_table(
        "incidents",
        sa.Column("rule_id", sa.String(length=160), nullable=False),
        sa.Column("rule_version", sa.String(length=160), nullable=False),
        sa.Column("route_id", sa.String(length=160), nullable=False),
        sa.Column("service_id", sa.String(length=160), nullable=False),
        sa.Column("state", sa.String(length=40), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rule_config", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_incidents")),
        sa.UniqueConstraint(
            "bank_id",
            "rule_id",
            "rule_version",
            "route_id",
            "service_id",
            name=op.f("uq_incidents_bank_id"),
        ),
        schema="veriq",
    )
    op.create_table(
        "operational_events",
        sa.Column("source_system", sa.String(length=160), nullable=False),
        sa.Column("event_id", sa.String(length=160), nullable=False),
        sa.Column("route_id", sa.String(length=160), nullable=False),
        sa.Column("service_id", sa.String(length=160), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("window_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("digest", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_operational_events")),
        sa.UniqueConstraint(
            "bank_id", "source_system", "event_id", name="uq_operational_event_identity"
        ),
        sa.UniqueConstraint(
            "bank_id",
            "source_system",
            "route_id",
            "service_id",
            "window_start",
            "window_end",
            name="uq_operational_metric_window",
        ),
        schema="veriq",
    )
    op.create_table(
        "incident_evidence",
        sa.Column("incident_id", sa.String(length=160), nullable=False),
        sa.Column("receipt_id", sa.String(length=160), nullable=False),
        sa.Column("evidence_id", sa.String(length=160), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.ForeignKeyConstraint(
            ["bank_id", "incident_id"],
            ["veriq.incidents.bank_id", "veriq.incidents.id"],
            name=op.f("fk_incident_evidence_bank_id_incidents"),
        ),
        sa.ForeignKeyConstraint(
            ["bank_id", "receipt_id"],
            ["veriq.operational_events.bank_id", "veriq.operational_events.id"],
            name=op.f("fk_incident_evidence_bank_id_operational_events"),
        ),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_incident_evidence")),
        sa.UniqueConstraint(
            "bank_id", "incident_id", "receipt_id", name=op.f("uq_incident_evidence_bank_id")
        ),
        schema="veriq",
    )
    op.create_table(
        "incident_investigations",
        sa.Column("incident_id", sa.String(length=160), nullable=False),
        sa.Column("state", sa.String(length=40), nullable=False),
        sa.Column("review_status", sa.String(length=40), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("evidence_revision", sa.Integer(), nullable=False),
        sa.Column("bundle", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("bundle_digest", sa.String(length=64), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.ForeignKeyConstraint(
            ["bank_id", "incident_id"],
            ["veriq.incidents.bank_id", "veriq.incidents.id"],
            name=op.f("fk_incident_investigations_bank_id_incidents"),
        ),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_incident_investigations")),
        sa.UniqueConstraint(
            "bank_id", "incident_id", name=op.f("uq_incident_investigations_bank_id")
        ),
        schema="veriq",
    )
    op.create_table(
        "investigation_jobs",
        sa.Column("investigation_id", sa.String(length=160), nullable=False),
        sa.Column("run_id", sa.String(length=160), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("dedupe_key", sa.String(length=160), nullable=False),
        sa.Column("evidence_revision", sa.Integer(), nullable=False),
        sa.Column("state", sa.String(length=40), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=False),
        sa.Column("owner", sa.String(length=160), nullable=True),
        sa.Column("lease_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_error", sa.String(length=40), nullable=True),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.ForeignKeyConstraint(
            ["bank_id", "investigation_id"],
            ["veriq.incident_investigations.bank_id", "veriq.incident_investigations.id"],
            name=op.f("fk_investigation_jobs_bank_id_incident_investigations"),
        ),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_investigation_jobs")),
        sa.UniqueConstraint(
            "bank_id", "kind", "dedupe_key", name=op.f("uq_investigation_jobs_bank_id")
        ),
        schema="veriq",
    )
    op.create_index(
        op.f("ix_investigation_jobs_state"),
        "investigation_jobs",
        ["state"],
        unique=False,
        schema="veriq",
    )
    op.create_table(
        "status_deliveries",
        sa.Column("job_id", sa.String(length=160), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("bank_id", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.ForeignKeyConstraint(
            ["bank_id", "job_id"],
            ["veriq.investigation_jobs.bank_id", "veriq.investigation_jobs.id"],
            name=op.f("fk_status_deliveries_bank_id_investigation_jobs"),
        ),
        sa.PrimaryKeyConstraint("bank_id", "id", name=op.f("pk_status_deliveries")),
        sa.UniqueConstraint("bank_id", "job_id", name=op.f("uq_status_deliveries_bank_id")),
        schema="veriq",
    )


def downgrade() -> None:
    # Reviewed Task 003 tables only; no ledger/private simulation tables.
    op.drop_table("status_deliveries", schema="veriq")
    op.drop_index(
        op.f("ix_investigation_jobs_state"), table_name="investigation_jobs", schema="veriq"
    )
    op.drop_table("investigation_jobs", schema="veriq")
    op.drop_table("incident_investigations", schema="veriq")
    op.drop_table("incident_evidence", schema="veriq")
    op.drop_table("operational_events", schema="veriq")
    op.drop_table("incidents", schema="veriq")
    op.drop_table("investigation_status_inbox", schema="cedar")
    op.drop_table("investigation_result_receipts", schema="cedar")
