-- Run as migration administrator after alembic upgrade head.
-- psql variables allow test/other local role names without embedding passwords.
\set ON_ERROR_STOP on
GRANT USAGE ON SCHEMA cedar TO :"cedar_role";
GRANT USAGE ON SCHEMA veriq TO :"veriq_role";
GRANT USAGE ON SCHEMA cedar_private TO :"simulator_role";
GRANT SELECT ON TABLE public.alembic_version TO :"cedar_role", :"veriq_role", :"simulator_role";
-- No runtime CREATE, cross-domain grants or blanket future-table DML grants.
-- Future table grants must be reviewed with their business migration.

-- Task 003 explicit table allowlist; no private data or cross-domain grants.
GRANT SELECT, INSERT ON TABLE veriq.operational_events, veriq.incidents,
  veriq.incident_evidence, veriq.status_deliveries TO :"veriq_role";
GRANT SELECT, INSERT, UPDATE ON TABLE veriq.incident_investigations,
  veriq.investigation_jobs TO :"veriq_role";
GRANT SELECT, INSERT ON TABLE cedar.investigation_result_receipts TO :"cedar_role";
GRANT SELECT, INSERT, UPDATE ON TABLE cedar.investigation_status_inbox TO :"cedar_role";
