"""Optional versioned case AI stage on existing durable jobs."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005_case_ai"
down_revision = "0004_pitch_g2"
branch_labels = None
depends_on = None


def subject(ai):
    kinds = "'CASE_ANALYSIS','CASE_AI'" if ai else "'CASE_ANALYSIS'"
    op.drop_constraint(
        op.f("ck_investigation_jobs_job_subject"),
        "investigation_jobs",
        schema="veriq",
        type_="check",
    )
    op.create_check_constraint(
        op.f("ck_investigation_jobs_job_subject"),
        "investigation_jobs",
        f"(kind IN ({kinds}) AND investigation_id IS NULL "
        "AND case_investigation_id IS NOT NULL) OR "
        "(kind IN ('INCIDENT_ANALYSIS','RESULT_DELIVERY') AND investigation_id IS NOT NULL "
        "AND case_investigation_id IS NULL)",
        schema="veriq",
    )


def upgrade():
    subject(True)
    op.create_table(
        "case_ai_runs",
        sa.Column("bank_id", sa.String(160), primary_key=True),
        sa.Column("id", sa.String(160), primary_key=True),
        sa.Column("case_investigation_id", sa.String(160), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("request", postgresql.JSONB(), nullable=False),
        sa.Column("request_digest", sa.String(64), nullable=False),
        sa.Column("bundle_digest", sa.String(64), nullable=False),
        sa.Column("result", postgresql.JSONB(none_as_null=True), nullable=True),
        sa.Column("provider_mode", sa.String(40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["bank_id", "id"],
            ["veriq.investigation_jobs.bank_id", "veriq.investigation_jobs.id"],
            name="fk_case_ai_runs_bank_id_investigation_jobs",
        ),
        sa.ForeignKeyConstraint(
            ["bank_id", "case_investigation_id"],
            ["veriq.case_investigations.bank_id", "veriq.case_investigations.id"],
            name="fk_case_ai_runs_bank_id_case_investigations",
        ),
        sa.UniqueConstraint(
            "bank_id", "case_investigation_id", "revision", name="uq_case_ai_runs_bank_id"
        ),
        schema="veriq",
    )
    op.execute("""
CREATE FUNCTION veriq.a2_snapshot_immutable() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog,pg_temp AS $$ BEGIN
 IF ROW(NEW.bank_id,NEW.id,NEW.case_investigation_id,NEW.revision,NEW.request,
 NEW.request_digest,NEW.bundle_digest,NEW.created_at) IS DISTINCT FROM
 ROW(OLD.bank_id,OLD.id,OLD.case_investigation_id,OLD.revision,OLD.request,
 OLD.request_digest,OLD.bundle_digest,OLD.created_at) OR OLD.result IS NOT NULL THEN
 RAISE EXCEPTION 'AI snapshot or accepted result is immutable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER a2_snapshot_originals BEFORE UPDATE ON veriq.case_ai_runs
FOR EACH ROW EXECUTE FUNCTION veriq.a2_snapshot_immutable();
REVOKE ALL ON FUNCTION veriq.a2_snapshot_immutable() FROM PUBLIC;
""")


def downgrade():
    op.drop_table("case_ai_runs", schema="veriq")
    op.execute("DROP FUNCTION veriq.a2_snapshot_immutable()")
    op.execute("DELETE FROM veriq.investigation_jobs WHERE kind='CASE_AI'")
    # Retain deterministic evidence, remove AI findings on this explicit downgrade.
    op.execute("""UPDATE veriq.case_investigations SET state='EVIDENCE_READY_AI_UNAVAILABLE',
    bundle=jsonb_set(jsonb_set(bundle,'{ai_result}','null'::jsonb),'{status}',
    '"EVIDENCE_READY_AI_UNAVAILABLE"'::jsonb) WHERE jsonb_typeof(bundle)='object'""")
    subject(False)
