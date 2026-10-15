# Backend architecture and proactive investigation

Task 002 implementation note: apps/backend now contains configuration/lifecycle, domain-scoped database infrastructure, separate metadata bases, schema-only migration, infrastructure probes, generic neutral ports and tests. See its README and the Task 002 handoff for actual paths/results. The business-domain/event/investigation design below remains a proposal and is NOT implemented by the foundation task. All proactive/financial authority boundaries are preserved.

Task 001.1 review draft. Initial architecture and stack are accepted subject to these amendments. Automatic validated triggers are owner-directed; detailed ports, schemas and scheduling policies await contract review. No runtime code is implemented.

One modular FastAPI backend organizes Cedar and Veriq as independent business domains. Habeeb's FastAPI AI service remains separate. PostgreSQL persists financial state, context, durable event receipts, jobs and audit. No new queue product or microservice is selected.

## Proposed modules

```text
src/veriq_cedar/
  composition/                   # supplies bank adapter and separate credential dependencies
  platform/auth/                 # customer/staff sessions, bank/role permission checks
  platform/audit/                # actor, reason, references, immutable history
  platform/database/             # role-specific sessions; no global privileged ORM session
  platform/outbox/               # committed delivery, leasing, replay and idempotency
  cedar/accounts/ ledger/ transfers/ simulator/
  cedar/cases/                    # bank-owned complaints, interactions and case IDs
  cedar/staff/                    # lookup, assignment, escalation and customer communications
  cedar/integration/              # bank adapter, normalized exports, result inbox
  veriq/ports/                    # domain-neutral interfaces and DTOs
  veriq/sources/ knowledge/ context/
  veriq/operations/               # accepted event projection and deterministic detector
  veriq/investigations/           # incident/case subjects, evidence bundles, run history
  veriq/jobs/                     # autonomous scheduler/worker and delivery jobs
  veriq/verification/             # approved banking checks via adapter
  veriq/ai_client/                # typed, bounded advisory calls
  demo/                          # isolated operator scenario/clock controls
```

These names are a future structure, not created Python modules. Domain code uses explicit transport models and repositories; avoid empty abstraction layers. The composition root injects Cedar's implementation of the bank-neutral ports in BANK_ADAPTER_CONTRACT.md. Veriq cannot import Cedar SQLAlchemy models/repository classes, use Cedar database sessions or query exported SQL views directly. Even allowlisted views are accessed only inside the adapter. AI has no banking adapter credentials or database access.

## Independent ownership

Cedar owns identity, staff roles/departments, accounts, append-only journals, transfers and authoritative financial outcome, bank cases, customer interactions, assignment/escalation and approved customer communications. Veriq owns source-backed institutional context, incidents, investigations, run/jobs, advisory findings and its review history. A Cedar result inbox is a versioned permitted projection of Veriq data, not a second investigation engine. Neither shared process nor shared frontend deployment merges authority.

Bank case IDs, incident IDs, investigation IDs, run IDs, job IDs, verification IDs and result delivery IDs are distinct. No incident investigation requires a fabricated complaint or fake case ID. A later complaint may link to an incident while receiving a separate transaction/case investigation. Link rows cite exact evidence and record the correlation rule; they do not establish cause or financial finality.

## Events and autonomous work

Operational ingestion and validated detector rules run independently of customers, sessions and manual staff actions. Eligible anomaly → atomic suspected-incident upsert + incident investigation + queued job + outbox status delivery. The incident investigation begins before Ada's complaint. Complaint persistence → durable complaint event → authorized evidence retrieval → supported incident link, if any, plus automatic targeted case investigation. Sarah/Michael do not start routine work; manual re-investigation, escalation, specific verification and human approval are separate optional commands.

Workers run autonomously after service startup; replay tools/operator actions are not the normal job scheduler. The operator may start synthetic telemetry; backend decides detection and job creation. See EVENT_PROCESSING.md for leases, retries, coalescing, stale results and no-AI behavior.

## Banking and evidence safety

Use integer kobo and at least two balanced entries per journal. Persist debit, account projection, transfer and outbox in one PostgreSQL transaction; serialize competing balance writes and enforce scoped idempotency key/request fingerprint. Concurrent retries produce one intended debit. Never hold a financial DB transaction over network/AI calls. Reversals are append-only compensating journals on eligible authority.

Proposed schemas: cedar, cedar_private and veriq, plus permitted sender-evidence views used internally by Cedar's connector. Runtime Cedar role lacks private recipient truth; simulator role alone receives private credentials; Veriq role can access only Veriq state. Adapter role reads only allowlisted bank-visible records. Migration credentials alone manage grants. Revoke PUBLIC private schema/table/default privileges and test function/search-path escapes. AI has no DB credentials. Tenant/ownership filters remain mandatory. Optional RLS cannot replace API authorization.

One Python process can hold all credentials. Import rules and DB grants constrain normal code paths and mistakes; they do not isolate a compromised process or provide production-grade security. A future external bank adapter may use separately authenticated transport without changing Veriq's normalized core.

A route anomaly may explain response loss but never proves recipient credit/failure. Verification requests authorize a specific permitted banking query; they do not mutate outcomes. Only Cedar validates received authoritative status evidence and emits its new bank-visible outcome; Veriq ingests that evidence. Demo reveal uses the same mocked status-query pathway. Private simulation truth remains absent from core queries, DTOs, prompts, logs and browser bundles.

## Knowledge, AI and temporal safety

Immutable original sources/events feed separate projections. Deterministic structured parsing precedes AI narrative extraction. Persist source/chunk checksum, locator, actor, bank, observed/valid time, extraction method/run, assertion status and typed identity. Unknown aliases remain unresolved. Document acceptance establishes a source claim, not causal truth. Historical bundles filter observed_at as well as occurred_at; no future knowledge.

Preserve Habeeb's four existing case/extraction root schemas and two required endpoints. Proactive incident analysis needs a new proposed analyze-incident schema because existing analyze-case requires case_id and per-transfer financial_outcome. Never invent a bank complaint to satisfy it. Incident AI support needs Habeeb review; automatic incident jobs must already assemble/persist evidence and report explicit AI-unavailable/pending state without a manual gate. Case AI outcome must exactly equal the authoritative input. No route-level financial_outcome is invented.

Schema validation, source/quote checks, evidence-ID eligibility, identity equality and bundle revision checks precede advice persistence. Record stale runs historically and enqueue current work; never let delayed AI downgrade newer bank evidence. Customer-facing communication requires authorized review/publish even though investigation initiation is automatic.

## Next implementation after contract approval

G0 should implement and test the neutral ports, durable operational-event → detector → incident/job slice with a synthetic fake adapter, no complaint and no staff session. Demonstrate crash recovery and a bank-visible status inbox with AI unavailable; no money operation is needed for that bounded first proof. Then add Cedar G1 balanced/idempotent transfers and durable complaints, case linking and the two frontend integrations. Retain all frozen T01–T16 and add the acceptance checks in EVENT_PROCESSING.md. This sequence is a recommendation, not current authorization.
