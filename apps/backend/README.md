# FastAPI backend: Cedar + Veriq pitch

Task 004 added the five approved v1.0 Cedar customer operations, fictional accounts, balanced posted ledger, durable idempotent transfers, limited private-CLI customer sessions and restricted S0/S2 network behavior. Task 002 infrastructure and proactive G0 are preserved. Complaints, staff, status reveal/verification, reversals, AI calls, frontend work and proposed v1.1 APIs remain outside this slice. Original contracts are unchanged. Use this existing checkout.


Task 005 now adds the approved operational incident/route reads, independent durable complaint intake, automatic bank-neutral case handoff, institutional source uploads/context and private investigator sessions. See ../../docs/handoffs/PITCH_BACKEND_STATUS.md for the exact functional endpoint list, frontend wiring and disclosure requirements. Older task scope paragraphs describe their historical milestones; no AI provider call or later status reveal is implemented by the pitch slice.

## Install dependencies

Tested with Python 3.12.14 and uv 0.13.1. Direct dependencies are pinned in pyproject.toml and all runtime/dev transitive versions and artifacts are locked in uv.lock. Python selection is in .python-version. From apps/backend:

```bash
# Project-local bootstrap if uv 0.13.1 is not already available:
python3 -m venv .uv-tool
.uv-tool/bin/python -m pip install uv==0.13.1
export PATH="$PWD/.uv-tool/bin:$PATH"
export UV_CACHE_DIR="$PWD/.uv-cache"
export UV_PYTHON_INSTALL_DIR="$PWD/.uv-python"
uv sync --locked
```

uv can acquire the pinned Python if it is not installed; this needs network access. No system package install is required for Python dependencies. `uv sync --locked` fails on a stale lock; intentional dependency updates require an explicit `uv lock` and reviewed lockfile change. Do not use an unpinned `pip install -r` as the setup recipe.

## Configure and start PostgreSQL

From repository root, copy infra/.env.example to infra/.env and apps/backend/.env.example to apps/backend/.env. Replace placeholders in both files with matching synthetic local passwords; URL-encode passwords in database URLs. Both .env files are ignored. Runtime and migration credentials are distinct. Never use migration credentials in the runtime URL fields.

```bash
cp infra/.env.example infra/.env
cp apps/backend/.env.example apps/backend/.env
# Edit the two ignored files before starting.
docker compose --env-file infra/.env -f infra/compose.yaml up -d --wait postgres
```

Compose binds only 127.0.0.1:5433 by default, uses an immutable official PostgreSQL 16 image digest and keeps a named development volume. First initialization creates three non-superuser runtime roles. Initialization scripts run only on a fresh volume: changing passwords in .env does not change existing roles. Do not delete an existing volume to fix this; intentionally update its roles as administrator. The container/migration administrator is privileged and is not an application login.

Docker is absent and Podman cannot initialize its runtime directory in the current execution environment. Compose configuration is supplied but was not executed here. Tests used a separate real PostgreSQL 16.2 process from task-local pgserver binaries, with Unix socket only; this is not an application dependency or deployment recommendation.

## Apply migrations and local runtime grants

From apps/backend after PostgreSQL is available:

```bash
uv run --locked alembic upgrade head
uv run --locked alembic current
```

From repository root, grant only the local runtime access needed by this foundation:

```bash
docker compose --env-file infra/.env -f infra/compose.yaml exec -T postgres \
  psql -U veriq_cedar_migrator -d veriq_cedar \
  -v cedar_role=cedar_runtime -v veriq_role=veriq_runtime \
  -v simulator_role=simulator_runtime < infra/postgres/grant-runtime.sql
```

The initial migration creates cedar, veriq and cedar_private schemas, revokes PUBLIC schema access and records revision 0001_domain_schemas. It creates no business table or role. Migration 0002_proactive_g0 adds eight G0 tables. Migration 0003_financial_g1 adds thirteen Cedar financial/auth/reference tables and two private simulator tables, with accounting/state triggers and restricted debit/locking functions; see ../../docs/FINANCIAL_G1.md. Apply head, then reapply the grant script: it grants own-schema USAGE, version-table SELECT and explicit G0/G1 privileges only. Cedar has no direct account-balance/ledger-write grant; only its reviewed debit function can post runtime journals and balance changes. Simulator alone has access to private policy/recipient credits. Veriq events/evidence/outbox and Cedar delivery receipts have no runtime UPDATE/DELETE grant. No runtime CREATE, cross-domain or blanket future-table DML is granted. Future migrations must explicitly grant reviewed table privileges. Runtime code never invokes create_all or migrations.

Alembic reads only MIGRATION_DATABASE_URL through separate MigrationSettings; runtime Settings does not contain that field. Autogeneration reflects only the three owned schemas; review generated revisions. `alembic downgrade base` is for a clean disposable disposable database, never an automatic startup/reset action; it uses no CASCADE and refuses to destroy unrelated schema objects. Update the readiness revision constant when adding a migration; a test checks it against Alembic head.

## Run

From apps/backend:

```bash
uv run --locked uvicorn veriq_cedar.main:create_app --factory \
  --host 127.0.0.1 --port 8000 --no-access-log
```

- GET /health: process liveness, no database access.
- GET /ready: checks SELECT 1, migration head and own-schema USAGE under all three runtime connections. Returns 503 with a sanitized error on unavailable/missing-grant/unmigrated database. It does not fix state or create tables.
- GET /infra/openapi.json: generated metadata for infrastructure plus the five implemented customer routes, including sessionAuth cookie security. Its historical URL is retained; canonical contracts/openapi.yaml remains the accepted business contract.

Application events are JSON with generated request ID, route template, status and duration; bodies, raw query strings, DSNs and exception text are omitted. Keep `--no-access-log` to disable Uvicorn's separate raw URL access log. Uvicorn lifecycle logs retain its default format. Responses include X-Request-ID. Error bodies use `{error:{code,message}}`. Infrastructure probes need no session. All five customer routes require a valid server-provisioned cedar_demo_session cookie.

## Test

From apps/backend:

```bash
uv run --locked pytest -m "not postgres"
uv run --locked ruff check src tests migrations
uv run --locked ruff format --check src tests migrations
```

For real PostgreSQL tests, create a fresh dedicated database named veriq_cedar_test_* with an administrator capable of creating/dropping test roles. Tests refuse a different database name or existing domain schemas. Do not point them at development/production data. For the provided local Compose service, from repository root:

```bash
docker compose --env-file infra/.env -f infra/compose.yaml exec -T postgres \
  createdb -U veriq_cedar_migrator veriq_cedar_test_foundation
```

Then from apps/backend set TEST_DATABASE_ADMIN_URL in your shell to the admin URL for that dedicated database (same localhost port), and run:

```bash
uv run --locked pytest
```

Without TEST_DATABASE_ADMIN_URL, the marked postgres tests are explicitly skipped. With it they execute real migrations, privilege checks, live readiness and session commit/rollback; no SQLite substitute. The remaining tests use offline configuration, explicit dependency fakes, actual loopback connection refusal, HTTPX ASGI transport with lifespan, and AST import checks. Task 003 adds real G0 acceptance tests, including the reproducible test replay below. Full banking tests T01–T16 and the broader proposed P01–P10 suite remain outside this slice.

## Package boundaries

Cedar and Veriq have separate declarative registries/schema metadata. Veriq imports no Cedar model/repository; generic integration protocols depend only on typing; the authorized g0.internal.1 transport models use Pydantic without HTTP, ORM or bank-domain dependencies. The composition root owns domain-scoped database dependencies. Shared Python process and these initial grants are not production-grade isolation. G0/G1 grants are explicit; production identity/login, RLS, remote-bank authentication and deployment remain future reviewed work.

See ../../docs/handoffs/CURRENT_STATE.md and TASK_002_REPORT.md for the verified environment, exact changes and next task.

## G0 demonstration and durable worker

After dependency/database/migration/grant setup above, use a **fresh disposable** database. The CLI refuses to reset existing event/inbox state and requires ENVIRONMENT=test for replay. It emits permitted frozen G2 and Birch metrics through the Cedar synthetic adapter; detection and job scheduling occur automatically in the receiver transaction. No incident seed, complaint or staff command exists.

From apps/backend, with all four database URLs configured (runtime URLs must use restricted roles):

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g0 replay \
  --fixture ../../contracts/demo.json
```

Expected: one CED/Elm/G2 SUSPECTED incident, an UNREVIEWED investigation with EVIDENCE_READY_AI_UNAVAILABLE, three SUCCEEDED jobs (analysis and two status deliveries), and one latest Cedar status inbox record with bank_case_ids=[]. Birch/G3 remains unaffected. The CLI emits permitted IDs/status only. The fixture's hero/private fields are excluded from event exports.

For a test-based clean replay, create the dedicated test database described above and set TEST_DATABASE_ADMIN_URL, then:

```bash
uv run --locked pytest -s tests/test_g0.py::test_replay_g2_automatic_before_complaints_and_permitted_cedar_status
```

This starts from empty migrated tables, uses three real restricted roles, passes events through the adapter and cleans up its own test schemas/roles. Do not run migration tests against existing development data.

Run the autonomous durable worker as a separate process alongside the API:

```bash
uv run --locked python -m veriq_cedar.composition.g0 worker
```

It polls CED jobs every second while idle; no staff session is needed. It scans queued/retry/expired jobs on restart. Synthetic replay itself emits a finite event batch and drains its jobs; a live Cedar event producer/outbox is not implemented. Production supervision and network adapter authentication remain future work. The worker deliberately does not run inside each Uvicorn process.

Read ../../docs/PROACTIVE_G0.md for internal contracts, lifecycle, role grants, retry bounds, late-window policy and limitations. No new dependency or HTTP endpoint was needed.

## Cedar G1 customer demo

Apply Alembic head and reapply infra/postgres/grant-runtime.sql as above before running this slice. The runtime app never seeds/migrates. From apps/backend with ENVIRONMENT=test and the separate MIGRATION_DATABASE_URL available only to the private CLI:

```bash
uv run --locked python -m veriq_cedar.composition.g1 seed --scenario S2
uv run --locked python -m veriq_cedar.composition.g1 mint-session \
  --customer CED-CUST-001 --cookie-file /tmp/ada.session.json
```

Seed uses fixture IDs CED-CUST-001, CED-ACC-001, ELM-ACC-009, fictional Birch BIR-ACC-001 and a balanced opening deposit of 10000000 kobo (₦100,000). It is idempotent and preserves spent balances; conflicting data/policy causes refusal. Session CLI writes a new mode-0600 *.session.json file containing a random one-hour token; only its SHA-256 hash is stored. Existing files are never overwritten. Session files are Git-ignored; keep them private and delete after use. The token is not printed in application logs or normal CLI stdout. No unauthenticated session-minting HTTP route exists.

Use the cookie from that private file with a same-origin local client. The exact protected endpoints are GET /v1/cedar/accounts/me, GET /v1/cedar/banks, POST /v1/cedar/name-enquiries, POST /v1/cedar/transfers (Idempotency-Key header, >=8 characters), GET /v1/cedar/transfers/{transferId}. JSON request/success shapes match the accepted v1.0 subset. POST requires application/json and rejects an explicitly foreign Origin. Bank/customer scope is taken from the stored session, never a request customer ID. Responses use no-store. This is **demo auth only**: no login/refresh/revocation UI, Set-Cookie journey or cross-origin frontend configuration is implemented; production authentication and separate frontend integration still require review. For a browser deployment, secure HttpOnly/SameSite cookie issuance and HTTPS belong to that future identity journey.

Run a complete database/HTTP replay in a **fresh disposable** migrated/granted database:

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g1 replay --scenario S2
```

It privately seeds/mints a temporary session, invokes the actual account/name-enquiry/transfer handlers, reads back the database balance/transfer, asserts one debit journal and prints actual permitted results. It then deletes its temporary session. Existing transfers cause refusal; it never resets data. Expected: 10000000→5000000 kobo, RESPONSE_TIMEOUT, UNKNOWN, one debit journal. Run `--scenario S0` in a **different fresh disposable database** for COMPLETED/CREDIT_CONFIRMED after a received credit response. To prove G0 precedes the transfer, run the documented G0 replay before G1 replay in the same fresh database; G1 does not reset its incident.

For regular local use, seed once, run Uvicorn as above, and run the recovery worker separately:

```bash
uv run --locked python -m veriq_cedar.composition.g1 worker
```

POST attempts immediate dispatch after its debit/instruction transaction commits; the worker recovers queued/retry/expired instructions even when the request process stops. Private `ENVIRONMENT=test ... g1 arm --scenario S0` changes only the policy for future network instructions; previously credited instructions retain their original result on replay. S2 response loss applies to Elm/G2; Birch/G3 follows the S0 comparison path. Customers cannot select either scenario.

For a test-based replay, set TEST_DATABASE_ADMIN_URL to a fresh dedicated veriq_cedar_test_* database, then run:

```bash
uv run --locked pytest -s tests/test_financial.py::test_s2_database_api_replay_known_state_stays_unknown
uv run --locked pytest tests/test_financial.py::test_s0_requires_eligible_received_response
uv run --locked pytest
```

These migration tests create/drop their dedicated test schemas/roles, so use only a disposable test database. Real PostgreSQL is required for accounting, concurrency and permission verification. Direct dependencies and uv.lock are unchanged. The developer replay imports HTTPX from the existing default dev dependency group; API/worker operation does not depend on HTTPX.

## Task 005 — integrated pitch

After `uv sync --locked`, apply `uv run --locked alembic upgrade head` (now 0004_pitch_g2), then reapply the explicit role-grant script from repository root as documented above. No runtime seeding/migrations. Use a **fresh disposable** migrated/granted database, three restricted runtime URLs and the separate private CLI MIGRATION_DATABASE_URL:

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 replay
```

This performs actual uploads → persisted context → G0 metric ingestion/incident → balanced S2 transfer/UNKNOWN → complaint → durable neutral handoff → automatic case investigation. It prints concise JSON with real IDs/counts/states/evidence IDs and verified assertions. It refuses existing sources/metrics/transfers and performs no reset. No investigate-button request or preinserted incident is used. Temporary replay sessions are removed at completion; resulting demo records remain.

For interactive local work, seed/provision the customer using G1 commands above. Provision a separate investigator:

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 staff-session \
  --cookie-file /tmp/investigator.session.json
```

This is administrator-only local provisioning, not a public role/login endpoint. Both roles use the frozen cookie name cedar_demo_session but **different opaque tokens and separate role stores**. A customer token cannot access Veriq. Use separate HTTP clients/browser cookie paths `/v1/cedar` and `/v1/veriq`; tokens/files remain private and expire in one hour. No login UI or automatic frontend session journey is supplied.

Run alongside Uvicorn:

```bash
uv run --locked python -m veriq_cedar.composition.g2 worker
```

The G2 process dispatches Cedar complaint outbox records and runs the existing G0 leased worker extended for CASE_ANALYSIS. It recovers queued/retry/expired work, independent of staff/AI sessions. G1's separate payment recovery worker remains available. Initial POST transfer still attempts immediate dispatch. Keep the G2 worker running for ongoing complaint automation; the pitch replay drains it in-process for reproducibility.

Upload the five files under ../../fixtures/onboarding sequentially: services.json, dependencies.csv, routes.json, historical_incidents.md, operations_sop.txt. Multipart fields are **file** and **source_kind** (e.g. PITCH_FIXTURE). Only these UTF-8 filenames/adapters are supported; 262144-byte file limit, 280000-byte total multipart limit, one file/one field. A checksum-identical upload with the same bank/filename/kind returns its original source/job. Structured parsing validates registered endpoints and persists DOCUMENTED relationships. Failed structured validation preserves its source with FAILED status; no partial context survives. Unstructured originals are UPLOADED with internal AI_UNAVAILABLE state and no extracted claims. Source original/content checksum and complaint receipts remain immutable. Source jobs are synchronous bounded parser units recorded on the source; no unnecessary external queue.

Actual frontend integration and same-origin proxy instructions: ../../docs/handoffs/PITCH_BACKEND_STATUS.md and ../../infra/pitch/Caddyfile. Authentication/origin checks are retained; browser wiring has not been exercised by this backend task. AI extraction/analyze-case and later financial reveal remain unavailable; report that honestly in the pitch.

For an interactive frontend ACT II on an already seeded/onboarded database, emit a fresh permitted synthetic metric batch without resetting anything (from apps/backend): `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 telemetry`. Keep g2 worker running. The detector automatically creates/reuses the G2 incident; this command supplies telemetry, not a manually inserted incident or staff investigation trigger. Metrics age truthfully: after ten minutes the operations endpoint reports INSUFFICIENT_DATA; emit another batch near the pitch rather than displaying stale data as current. This is a one-shot fictional source, not a continuous production monitor.


## Optional private AI case analysis (Task 006)

Apply migration `0005_case_ai`, then reapply `infra/postgres/grant-runtime.sql` with the existing explicit role variables. HTTPX0.28.1 is now a runtime dependency; run `uv sync --locked`. Existing schema grants remain separated; the new case_ai_runs table belongs to Veriq. No Cedar/private database permission is added.

By default `AI_ENABLED=false`; complaints and deterministic evidence investigation work without the AI service. Configure only the backend worker's private environment:

```dotenv
AI_ENABLED=true
AI_BASE_URL=http://127.0.0.1:8001
# AI_SERVICE_KEY must match the AI service INTERNAL_SERVICE_KEY. Supply privately.
AI_TIMEOUT_SECONDS=5
```

Non-loopback destinations additionally require an explicit exact-origin allowlist in the worker's private environment, for example `AI_TRUSTED_ORIGINS='["http://veriq-ai:8001"]'` for `AI_BASE_URL=http://veriq-ai:8001`. Loopback IPv4/IPv6 and localhost work without this setting, including custom ports. Private IPs/DNS names are not automatically trusted; a mismatch fails Settings validation before any credential/evidence send. Wildcards, embedded credentials and URL paths are rejected. Scheme/host/port must match (standard default ports normalize). This catches accidental public/provider URLs or mistyped internal hosts without requiring the service to be online at startup. Use AI_BASE_URL for the internal AI service, not its upstream LLM provider.

The allowlist is administrator approval of a service origin, not proof of service ownership or DNS/IP isolation. Protect configuration and local service ports, control DNS/egress, and use HTTPS with normal certificate verification for remote internal deployments. No runtime DNS/IP-classification guarantee is claimed. Redirects and environment proxies remain disabled. See the integration status for the approved bounded error-envelope classifications.

The key is never a browser/public environment value. Enabled but missing URL/key safely keeps deterministic mode and logs AI_UNCONFIGURED. URL must be an HTTP(S) origin without a path, query or embedded credentials; use a trusted internal address. Timeout is0.1–20seconds overall; the existing default job lease is60seconds. A configured custom worker lease must exceed its AI timeout.

Start Habeeb's independent service on8001 using its existing README (for the reproducible synthetic path set `LLM_PROVIDER=mock` and a private `INTERNAL_SERVICE_KEY`). Do not claim model reasoning in mock mode. Run the backend and `uv run --locked python -m veriq_cedar.composition.g2 worker` with the matching private AI settings. The worker commits deterministic evidence, queues CASE_AI, performs the network call outside transactions, validates it and exposes FINDINGS_READY through the existing authenticated case GET. HTTP handlers never wait for the AI call.

The four-act `g2 replay` deliberately keeps AI disabled and remains deterministic. For the separate connected/unavailable cross-service smoke, use `TEST_DATABASE_ADMIN_URL=<fresh disposable veriq_cedar_test_* database>` and `uv run --locked pytest tests/test_ai_orchestration.py -k actual_backend_worker_http -q`. Tests migrate/grant/tear down their dedicated database; never use an existing development database. They launch real backend HTTP, standalone worker and (connected mode) the unchanged actual AI service with deterministic mock provider. Full backend/AI test commands and disclosure details are in the AI integration status document.

Existing already-assembled cases from an AI-disabled worker are not automatically backfilled: new case evidence revisions assembled by an enabled worker schedule analysis. Same-event replay remains a no-op. Retrying an exhausted existing AI job needs deliberate bank/job-scoped maintenance after fixing its cause, retaining the immutable snapshot, job identity and generation. Do not reset arbitrary data or silently grant extra attempts. No source extraction, case publication or financial-status reveal is provided by this task.


## Task007 integration verification

See [integration evidence](../../docs/handoffs/INTEGRATION_VERIFICATION_STATUS.md) and [pitch operator runbook](../../docs/handoffs/PITCH_OPERATOR_RUNBOOK.md). On a fresh migrated/granted disposable database with private database URLs exported and ENVIRONMENT=test, `uv run --locked python scripts/verify_integration.py` runs actual API/G1/G2/mock-AI processes, proves durable outage recovery and emits a sanitized summary. It cleans up its child processes and temporary sessions; it never resets existing data. AI defaults to port8002 because8001 was occupied during verification. Frontend shells still require Usaamah's API integration; no browser workflow is claimed.
