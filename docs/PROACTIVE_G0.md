# Proactive G0 implementation contract

Task 003, 15 October 2026. This describes implemented internal behavior, not approval of the proposed v1.1 HTTP API. contracts/openapi.yaml, demo.json, original specs and all proposal files remain unchanged. Daniel owns the backend; no AI/frontend files are changed.

## Permitted boundary

integration/operational.py defines strict immutable Pydantic g0.internal.1 models and structural EventSource.read_events / ResultSink.deliver protocols. Existing generic ports remain available for later work. MetricEvent carries bank/source/event identity, ROUTE_METRIC_SNAPSHOT, aware occurred/observed times, route/service, explicit baseline/window counts and interval, and an allowlisted source/evidence ID/locator/SHA-256 reference. Extra fields, negative/noninteger counts, timeouts greater than attempts, overlapping baseline, naive times and non-five-minute windows are rejected. Veriq revalidates even model_copy instances, then checks a trusted composition Principal's bank/source/purpose. This is in-process capability configuration, not implemented network authentication or cryptographic source attestation.

Cedar SyntheticEvents selects only approved demo route aggregates and builds stable event/evidence IDs for a given replay timestamp. Private hero fields and unknown route fields are excluded. It requires no database or private simulator access. A second-bank fake exercises the same EventSource/core with OTHER as tenant. Composition alone connects CedarResultSink's Cedar sessions and Veriq's own sessions; Veriq imports no Cedar model, registry, settings or private session. The generic future ports are not all implemented.

IncidentStatus permits only bank/incident/investigation/delivery IDs, monotonic revision, SUSPECTED status, REQUESTED or EVIDENCE_READY_AI_UNAVAILABLE progress, UNREVIEWED review status, route/service, evidence IDs, emitted time and an empty bank_case_ids tuple. It has no freeform findings, financial outcome, causal claim or simulator payload. CedarResultSink revalidates and checks its configured bank, persists the stable delivery digest and updates its inbox only for a newer revision. Same identity/different payload and equal revision/different payload are rejected. Older permitted deliveries are acknowledged without regressing the inbox.

## Detection and atomic lifecycle

The synthetic route-timeout-degradation rule g0-1 uses exact rational comparison: five-minute snapshot; >=20 attempts; >=20% timeout; >=100 baseline attempts; <=5% baseline timeout; >=15 percentage point increase. G2 7/25 vs 2/100 qualifies; Birch/G3 1/25 vs 2/100 does not. Configurable Python DetectionRule thresholds are demonstration parameters, not production calibration; changing policy requires a new rule version during review.

Only snapshots ending within ten minutes of database time qualify; older accepted events remain immutable evidence receipts without opening a current incident. Future observations are rejected. This bounded lateness policy is a G0 assumption for review, not a generalized watermark/correction engine. One source snapshot per route/service/interval is accepted: same scoped event ID and identical payload returns the original receipt; changed payload or renamed/revised snapshot for the same interval is rejected. Only aggregate snapshots are supported, so raw-attempt/snapshot double counting is impossible in this slice.

One PostgreSQL transaction accepts the immutable receipt, evaluates the rule, creates/reuses the suspected incident and distinct incident investigation, appends supporting evidence, increments evidence/status revisions, queues INCIDENT_ANALYSIS and writes a REQUESTED result delivery/job. Bank-scoped transaction advisory locks plus database unique constraints serialize concurrent replay and threshold evaluation. No acknowledgement occurs before commit. Failure rolls everything back and producer replay recovers. Source/outbound event persistence and live polling remain future Cedar work; the finite synthetic source can replay its stable events.

Incident uniqueness is (bank, rule ID/version, route, service); all G0 incidents remain SUSPECTED, so this also guarantees one active incident. Resolution/reopening policy is deliberately absent. New qualifying windows attach evidence to the same incident/investigation and queue a deduplicated analysis revision; an older in-flight revision finishes as SUPERSEDED without publishing findings. No customer case is created or required. Evidence bundle assembly preserves permitted snapshots, baseline/window, source references, bank, run ID, evidence revision and bundle digest. It emits EVIDENCE_READY_AI_UNAVAILABLE; this means AI integration is absent, not that an AI provider was called. Review remains UNREVIEWED. No financial conclusion or human approval is inferred.

## Tables and migration

Migration 0002_proactive_g0 follows the unchanged 0001_domain_schemas. It creates:

| Domain/table | Purpose | Runtime privileges |
|---|---|---|
| veriq.operational_events | Scoped immutable payload/digest receipt and interval dedupe | Veriq SELECT/INSERT |
| veriq.incidents | Suspected rule signature/config/open time | Veriq SELECT/INSERT |
| veriq.incident_evidence | Bank-scoped incident→receipt reference and evidence revision | Veriq SELECT/INSERT |
| veriq.incident_investigations | Separate investigation, review/progress/revisions/latest bundle | Veriq SELECT/INSERT/UPDATE |
| veriq.investigation_jobs | Analysis/delivery run IDs, attempts, lease generation, retry/dead letter | Veriq SELECT/INSERT/UPDATE |
| veriq.status_deliveries | Immutable permitted payload outbox, one delivery job | Veriq SELECT/INSERT |
| cedar.investigation_result_receipts | Stable bank/delivery digest dedupe | Cedar SELECT/INSERT |
| cedar.investigation_status_inbox | Latest permitted projection per bank/investigation | Cedar SELECT/INSERT/UPDATE |

Composite bank+ID primary/foreign keys prevent cross-bank relationships. Index supports job-state scans. Runtime grants are an explicit allowlist in infra/postgres/grant-runtime.sql; no runtime DELETE/CREATE or cross-domain grants. cedar_private gets no table. No new role, ledger or payment/case table is added. Alembic metadata imports register both domains; readiness expects the new head. Upgrade, repeat-head, check (including unrelated public table), offline SQL and downgrade/base are exercised. Downgrade removes G0 data and is only a disposable database operation; never run it as an automatic recovery.

## Durable worker

QUEUED → LEASED → SUCCEEDED; failed work → RETRY_WAIT → LEASED; exhausted work/crashes → DEAD_LETTER. Each claim locks one eligible row with FOR UPDATE SKIP LOCKED, scopes by configured bank, increments attempt count and lease generation and commits. Default lease 60 seconds, maximum five attempts, deterministic retry delays 5/15/45/135 seconds (cap 180 for alternate attempt budgets), one-second idle polling. Retry attempts retain job/run IDs. Claiming an exhausted expired lease dead-letters it. Dead-letter recovery requires a future authorized operator policy; no automatic endless retry.

Completion/failure checks bank, owner, kind, lease generation, state and unexpired database-time lease under row lock. An expired or reclaimed worker cannot mutate current state. Analysis locks the investigation and verifies its evidence revision before assembling/publishing. Delivery calls the injected sink outside its database transaction, then fences the ack. Sink commit followed by worker crash yields replay of the same stable delivery ID, with no duplicate visible effect. This is at-least-once delivery, not exactly-once network execution. A newer revision cannot be overwritten by an older delivery.

Short deterministic work requires no heartbeat or external HTTP/AI. There is no provider timeout policy yet; a future remote sink must impose a bounded timeout. Latest bundle lives on investigation; superseded jobs retain run/revision/status, but this is not a complete historical AI run store. Explicit sanitized error codes are retained; raw exceptions are not logged/stored. Database claim outages fail the worker process; a service supervisor must restart it. No production supervisor/alert service is deployed by this task.

## Verification and limits

See handoffs/TASK_003_REPORT.md and TASK_003_TEST_RESULTS.xml for executed results. Tests use real PostgreSQL and distinct nonsuperuser runtime roles for persistence/private-access checks; no SQLite substitute. Unit tests use pure detector/DTOs plus the retained foundation's explicit HTTP/database fakes and actual refused loopback connection. Test replay and CLI instructions are in apps/backend/README.md.

Ten-minute lateness, immutable snapshots with correction rejection, fixed five-minute window, single open lifetime per rule signature, bounded deterministic retries and internal DTOs are reviewable G0 decisions. They do not approve the broader proposed API. Shared process credentials and schema/package grants do not provide production isolation; RLS, network principals, source attestation, operator recovery/approval commands, real event source outbox, incidents closing/reopening and full audit/run history are future work. No complaints, ledger, simulation, financial semantics, AI or frontends are implemented. Stop for technical review of this PR; next recommended slice is bank-owned durable complaint intake and its adapter events after the required contract review.
