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

-- Task 004: sender-visible financial tables; private/ledger mutation is NOT granted.
GRANT SELECT ON cedar.customers, cedar.accounts, cedar.beneficiaries, cedar.demo_sessions,
 cedar.ledger_accounts, cedar.ledger_journals, cedar.ledger_entries,
 cedar.transfers, cedar.transfer_idempotency, cedar.banking_events,
 cedar.payment_instructions, cedar.transfer_attempts, cedar.payment_evidence TO :"cedar_role";
GRANT INSERT, UPDATE ON cedar.transfers, cedar.payment_instructions TO :"cedar_role";
GRANT INSERT ON cedar.transfer_idempotency, cedar.banking_events,
 cedar.transfer_attempts, cedar.payment_evidence TO :"cedar_role";
GRANT EXECUTE ON FUNCTION cedar.g1_lock_account(text,text), cedar.g1_post_debit(text,text),
 cedar.g1_check_projection(text,text) TO :"cedar_role";
GRANT SELECT ON cedar_private.network_policy TO :"simulator_role";
GRANT SELECT, INSERT ON cedar_private.recipient_credits TO :"simulator_role";

-- Task 005 explicit demo access: customer complaints remain Cedar-owned.
GRANT SELECT, INSERT ON cedar.complaints TO :"cedar_role";
GRANT SELECT, INSERT, UPDATE ON cedar.complaint_outbox TO :"cedar_role";
GRANT SELECT ON veriq.investigator_sessions TO :"veriq_role";
GRANT SELECT, INSERT ON veriq.case_event_receipts, veriq.knowledge_entities,
 veriq.knowledge_relationships TO :"veriq_role";
GRANT SELECT, INSERT, UPDATE ON veriq.case_investigations, veriq.knowledge_sources,
 veriq.context_versions TO :"veriq_role";
