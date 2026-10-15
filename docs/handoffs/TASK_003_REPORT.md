# Task 003 implementation report

Implemented and verified the first proactive intelligence slice. Authorized synthetic G2 telemetry automatically persists a suspected incident, an incident investigation and durable work without a complaint or staff action. Deterministic evidence assembly and permitted Cedar delivery complete with PostgreSQL persistence. Stop for review; do not merge or begin another slice.

## Repository, branch and delivery

Checkout: /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. Origin https://github.com/Ade20boss/veriq-cedar.git. Feature branch feat/proactive-incident-g0, based on fetched/clean main 2019c9facb1dbb7e72d6c6287f1aede0320a05be. This report is included in the implementation commit: use git rev-parse HEAD for its exact SHA; final chat publication report records pushed SHA/PR. No force push, main implementation commit, merge, replacement repository or teammate source modification.

TASK_003_FILES.txt lists every created/modified file. Source adds integration/operational, Cedar synthetic/status adapter and models, Veriq detector/processor/persistence/worker, composition replay/worker CLI, migration 0002 and acceptance tests. Existing foundation fixtures moved to tests/postgres_support.py for reuse; only no-business-table assertions/readiness head change to match this authorization. Frozen contracts/specs/proposals and the original migration/dependency lock are unchanged.

## Data and behavior

See ../PROACTIVE_G0.md for the precise eight-table migration/grant matrix and internal g0.internal.1 contract. Six Veriq tables own immutable scoped metric receipts, rule-signature incidents, supporting evidence, investigations, durable jobs and status outbox. Two Cedar tables own result identity receipts and latest investigation inbox. Composite tenant keys and explicit grants prevent normal cross-domain/private queries; no security isolation from shared-process compromise is claimed.

Frozen rule g0-1: 5 minutes, attempts>=20, timeout>=20%, historical attempts>=100, baseline<=5%, rise>=15 percentage points. G2 28% vs2% qualifies, Birch4% vs2% does not. One source snapshot per interval, immutable receipt fingerprint and unique active signature prevent uncontrolled duplication. Bank/source are checked against trusted composition configuration. No per-transfer outcome exists in the incident/status model.

Atomic ingestion schedules INCIDENT_ANALYSIS and REQUESTED delivery. Workers use row locks/SKIP LOCKED, 60-second expiring leases, fencing generation, stable job/run IDs, five attempts and bounded deterministic retries. Interrupted worker leases reclaim safely; new evidence supersedes old analysis; stable deliveries survive bank commit/ack interruption; inbox revisions never regress. Evidence assembly emits EVIDENCE_READY_AI_UNAVAILABLE while review remains UNREVIEWED. No AI request or unsupported causal/financial conclusion exists. bank_case_ids is empty.

Cedar SyntheticEvents exports only permitted route aggregates from the unchanged fixture. Veriq consumes neutral EventSource/ResultSink contracts; composition injects the Cedar sink/session. Core has no Cedar model/repository/session import. Tests also run a second-bank source through the same processor and exercise actual denied private/cross-schema SQL under restricted roles.

## Actual verification

Final full suite **61 passed**, zero failed/errors/skipped: **23 real PostgreSQL**, **38 non-server**. PostgreSQL16.2 native isolated server, no SQLite. Results and per-test names are in TASK_003_TEST_RESULTS.xml/TASK_003_TEST_OUTPUT.txt. All 33 foundation tests remain represented; their migration/metadata assertions now expect the authorized G0 tables. Non-server categories: factory/lifespan, health/readiness/errors/settings/logging with explicit dependency fakes/refused connection; AST import boundaries; pure thresholds/DTO validation/private-canary export.

Real tests: normal/Birch controls, qualifying G2 before complaints, automatic jobs, concurrent duplicate receipt/incident dedupe, bank scope/second source, evidence preservation, actual private/cross-schema/immutable-write denial, interrupted worker/reclaim/stale fence, concurrent claims, newer evidence superseding work, stale delivery suppression, crash after bank commit, unavailable sink retries/dead-letter, crash budget exhaustion, late/future events, transactional receiver rollback/replay, transient recovery and conflicting delivery identity. Tests retain actual migration upgrade/check/downgrade, readiness and session behavior. This does not claim all banking T01–T16 or broad proposed P01–P10.

CLI smoke passed actual role bootstrap/grants; Alembic upgrade/current/check/offline SQL; restricted-runtime replay; refusal to reset existing state; separate autonomous worker startup. TASK_003_DEMO_RESULT.json contains the observed one G2 SUSPECTED incident, one UNREVIEWED/EVIDENCE_READY_AI_UNAVAILABLE investigation, three successful jobs and permitted Cedar inbox. No manually preexisting incident or customer complaint. All temporary PostgreSQL/worker services stopped after verification. Ruff check/format (48 files) and uv lock --check passed. Direct dependencies/uv.lock unchanged from Task002; Python3.12.14, FastAPI0.143.2, Pydantic2.14.1, SQLAlchemy2.0.54, Alembic1.20.0, psycopg3.3.6, pytest9.1.1, HTTPX0.28.1, pydantic-settings2.16.0, Uvicorn0.54.0, Ruff0.17.0, uv0.13.1.

## Reproduce

Follow apps/backend/README.md for locked install, ignored environment configuration, PostgreSQL startup, Alembic upgrade head and grant-runtime.sql. In apps/backend, use a fresh disposable migrated/granted database with three restricted runtime URLs and ENVIRONMENT=test:

```bash
uv run --locked python -m veriq_cedar.composition.g0 replay --fixture ../../contracts/demo.json
```

Alternatively create a fresh dedicated veriq_cedar_test_* database, set TEST_DATABASE_ADMIN_URL and run:

```bash
uv run --locked pytest -s tests/test_g0.py::test_replay_g2_automatic_before_complaints_and_permitted_cedar_status
uv run --locked pytest
```

The first is a reproducible clean-state PostgreSQL demonstration with actual adapter input and automatic detector/jobs/delivery; test fixtures clean their own schemas/roles. Do not reuse real/development data for migration tests. Worker command is `uv run --locked python -m veriq_cedar.composition.g0 worker`; run alongside Uvicorn as a separate process. Synthetic replay starts finite telemetry and automatically drains its durable work; no staff detect/initiate endpoint exists.

## Failures resolved and limitations

Initial database test setup lost the launched server across execution-command boundaries; keeping server/tests/CLI smoke in one command resolved it. First real run passed G0 but migration check found an unnecessary unique constraint identical to the inbox primary key; removed it from both migration/model. Initial lint issues were corrected. No known test failure remains. Docker is absent and Podman runtime creation remains blocked, so Compose-image execution is unverified; tests use native PostgreSQL16.2. A few read/version probes initially used the wrong working directory and were corrected; no source/data was overwritten.

Reviewable G0 assumptions: ten-minute eligible lateness, rejection of future events and revised same-interval snapshots, lifetime-open rule signatures, finite synthetic source, configured in-process service principals, five-attempt bounded retries. These do not approve proposed HTTP schemas. No RLS/network bank auth/source attestation, live Cedar event outbox, closing/reopening policy, operator retry/approval commands, production supervisor/alerts or historical AI run store. No heartbeat/remote HTTP timeout is needed for this short in-process deterministic worker; a future remote adapter must add a bounded timeout. Claim outages terminate the worker for supervised restart; jobs remain durable. No financial ledger, payment network, customer case, AI endpoint or frontend implementation.

CURRENT_STATE.md is updated for Codex/Antigravity. Recommended next authorized slice: Cedar-owned durable complaint intake and neutral complaint-trigger handoff after contract review, preserving proactive investigations and authoritative financial evidence. Stop after Task003 feature PR/report.
