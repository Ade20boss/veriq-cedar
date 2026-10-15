# Veriq + Cedar current engineering handoff

Task 004, 15 October 2026 (Africa/Lagos). Bounded Cedar financial G1 implemented and verified; stop after feature commit/push and PR for technical review. No automatic merge or subsequent implementation is authorized.

## Repository / integration baseline

Working checkout: /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. Existing writable repository, no move/replacement/reset. Origin https://github.com/Ade20boss/veriq-cedar.git. Branch feat/cedar-financial-core-g1, created from fetched clean main 87e062539ba453bd9a99be70fa4386cea634bd86. GitHub confirmed G0 PR1 merged as e40028fe7060ec7b0c5e83d74706d640ec6abe56 and Habeeb AI foundation PR2 merged as 87e062539ba453bd9a99be70fa4386cea634bd86. AI/frontend source, original specs/contracts/proposals and migrations0001/0002 are preserved. No teammate PR was merged by this task.

This handoff/report is part of the G1 feature commit. Obtain its exact current/containing SHA with git rev-parse HEAD; compare to git ls-remote origin refs/heads/feat/cedar-financial-core-g1. Final chat report records verified pushed SHA/PR. No force push, implementation on main or merge is authorized. Prior Task003 reports/artifacts remain the historical G0 proof; its README/design are preserved except general entry points updated for current behavior.

## Implemented G1 state

Synthetic Cedar customers/accounts/ownership/status, integer NGN available balance, fictional Elm/Birch beneficiaries and private hashed expiring demo sessions. Append-only double-entry ledger with deferred PostgreSQL accounting/projection checks. Transfer debits deposit liability and credits outgoing clearing atomically with account projection, idempotency, immutable stage events and durable instruction. Opening funds debit synthetic cash asset/credit deposit liability. One account per customer is the bounded G1 assumption; initial Ada balance10000000 kobo.

Bank/customer/key-hash scoped idempotency lock plus account lock, unique journal/instruction/idempotency constraints and database posting validation prevent double debit/overspend. Same-key/same material input returns the original ID/current state; conflicting input gets409. Failed validation/funds check creates no debit. Posted facts cannot be updated/deleted or receive entries in later transactions; runtime Cedar has no direct account-balance/ledger DML. Reviewed locking/posting SECURITY DEFINER functions have fixed search paths and revoked PUBLIC execution.

Durable sender dispatcher claims queued/retry/expired instructions using SKIP LOCKED and 60-second generation fences; max5 attempts with bounded retry. POST tries dispatch after financial commit; a separate worker resumes interrupted work. Private synthetic network commits one immutable credit per stable transfer/instruction and returns only permitted response/timeout evidence. Crash after private commit before sender acknowledgement cannot double credit. S0 becomes CREDIT_CONFIRMED only after persisted eligible response; S2 Elm/G2 stays RESPONSE_TIMEOUT/UNKNOWN while private recipient credit exists. Birch/G3 follows the normal comparison path. Duplicate/stale/delayed evidence cannot regress state. No reveal/status-query/reversal endpoint exists.

Five exact accepted v1.0 customer operations are registered: GET accounts/me, GET banks, POST name-enquiries, POST transfers, GET transfers/{transferId}, under /v1/cedar. All require cedar_demo_session via sessionAuth cookie security. A random token hash/database-time expiry resolves bank/customer; no client identity/default-customer bypass. Private test-only CLI seeds, arms future synthetic policy and mints mode0600 ignored *.session.json files; no public auth-mint route. POST uses JSON/same-origin guard; responses no-store. This is limited demo auth, not production login or cross-origin frontend integration.

## Database / grants / services

Migration head0003_financial_g1 follows unchanged0002_proactive_g0. New Cedar13 tables: customers, accounts, beneficiaries, demo_sessions, ledger_accounts, ledger_journals, ledger_entries, transfers, transfer_idempotency, banking_events, payment_instructions, transfer_attempts, payment_evidence. Private2: network_policy, recipient_credits. Existing G0 tables unchanged, total23. New constraint/state/immutability triggers and reviewed functions are in the migration. Apply Alembic head then reapply infra/postgres/grant-runtime.sql. Runtime never create_all/migrates/seeds. Veriq gets no new Cedar/private grants; simulator can read policy and select/insert private credits only. AI/browser roles have no financial access or credentials. Shared process is not production isolation/RLS.

Task002 FastAPI settings/DI/logging/probes/session management retained. /health, /ready and historical /infra/openapi.json retained; generated metadata now includes the five authorized customer routes and cookie security. Canonical API YAML and proposed v1.1 files remain byte unchanged. Habeeb's merged AI service is present and unchanged, not called by this task. No frontend source imported.

G0 route metrics, suspected incidents, durable analysis/delivery worker and bank-neutral status inbox remain operational. Financial banking_events are durable Cedar-owned sender-visible history/outbox with source, route/service and permitted stage/outcome; no financial event is sent through G0's metric port. The CLI smoke persisted G0's proactive incident before the G1 transfer in the same database. No complaint/staff action gates G0 or transfer processing.

## Actual verification

**91 backend tests passed**, zero failures/errors/skips: **53 real PostgreSQL tests** (30G1 +18G0 +5foundation), **38 non-server tests** (retained factory/settings/errors/logging/pure detector/DTO/import checks, explicit dependency fakes and actual refused loopback connection). All61 prior backend tests are retained, with authorized route/table/head assertions updated. Financial tests cover money validation incl bool/float, ownership, fictitious bank/name enquiry, balanced/append-only journals, DB projection/outcome guards, atomic rollback, insufficient funds, same/conflicting/scoped idempotency, concurrent duplicate/independent debits, S0/S2, private/untrusted role denial, crash-after-credit recovery, stale/duplicate/mismatched response, seed preservation, auth expiry/anonymous/other customer, scenario denial, same-origin/JSON/cookie metadata, frozen accounts and bounded outage attempts. Broader full banking T01–T16/other scenario suite is not claimed complete. AI's separate tests were not rerun by this task.

Real environment: Python3.12.14, PostgreSQL16.2 native binaries from task-local pgserver0.1.4, Unix socket only, isolated disposable veriq_cedar_test_* databases, actual separate nonsuperuser Cedar/Veriq/simulator roles and unprivileged AI/browser test roles. No SQLite. Docker absent/Podman runtime restricted; Compose image execution remains unverified. All temporary PostgreSQL/Uvicorn/worker processes stopped. No developer service/database or usable replay session is left running; private cookie files were deleted after smoke. Work-only test clusters/logs are outside Git.

Actual CLI smoke: role bootstrap/grants, Alembic upgrade/current/check/offline SQL, S0 and S2 replay in separate fresh databases, G0 before S2, duplicate replay refusal, idempotent seed, private session file mode, operator command refusal outside ENVIRONMENT=test, live Uvicorn health/readiness/401/protected account GET and durable worker startup passed. Both replays: one debit journal, 10000000→5000000 balance. S0 COMPLETED/CREDIT_CONFIRMED; S2 RESPONSE_TIMEOUT/UNKNOWN. Ruff lint/format63 Python files passed; uv lock --check passed. Dependencies unchanged.

Details: TASK_004_REPORT.md, TASK_004_FILES.txt, TASK_004_COMMANDS.md, TASK_004_TEST_RESULTS.xml/TEST_OUTPUT.txt, CLI_SMOKE.txt, DEMO_S0/S2.json and G0_BEFORE_TRANSFER.json. ../FINANCIAL_G1.md records exact design, grants, authority, limits and review assumptions.

## Reproduce / resume

From backend README: uv sync --locked; configure ignored infra/backend environment files with separate runtime and migration credentials; start PostgreSQL; alembic upgrade head; reapply explicit grants. Runtime Settings must not use the migrator login. Private demo commands from apps/backend with ENVIRONMENT=test:

```bash
uv run --locked python -m veriq_cedar.composition.g1 seed --scenario S2
uv run --locked python -m veriq_cedar.composition.g1 mint-session --customer CED-CUST-001 --cookie-file /tmp/ada.session.json
```

Run API and financial worker as separate processes:

```bash
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
uv run --locked python -m veriq_cedar.composition.g1 worker
```

G0 worker remains `uv run --locked python -m veriq_cedar.composition.g0 worker`. For actual full S2 replay use a fresh disposable migrated/granted database and `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g1 replay --scenario S2`. Use another fresh database for S0. Replay refuses existing transfers, does not reset and removes its temporary session. To demonstrate G0 first, run its documented fixture replay before G1 replay in that same disposable database. Private session file tokens are not shareable handoff data; each developer provisions their own. No browser login/Set-Cookie/CORS journey is supplied.

For all tests, use fresh dedicated veriq_cedar_test_* and TEST_DATABASE_ADMIN_URL, then uv run --locked pytest. Never point destructive migration tests at development/customer data. See README for test-based S0/S2 replay selectors. Codex/Antigravity: open this same checkout, read AGENTS/current handoff/FINANCIAL_G1/report/contracts, inspect status/log/PR and preserve teammate edits. Stop after PR review request; no automatic next implementation.

## Known limits / next review

Synthetic in-process network, one account/customer, two-entry G1 journals, application amount bound, max5 dispatch attempts, one-hour CLI sessions and Elm-only S2 policy are reviewable bounded choices. No production identity/HTTPS-cookie flow, frontend CORS integration, RLS, process isolation, external bank authentication, supervisor/alerts, operator retry/dead-letter recovery UI, status verification/reveal, reversal, reconciliation, complaints/staff/case investigation or AI integration. Private recipient credits represent a minimal append-only credit record, not a complete recipient-bank settlement ledger. DB connection claim outages need process restart; durable state remains. No automatic financial failure/reversal on timeout or exhausted dispatch.

Recommended next authorized slice: eligible transaction-status verification through the restricted bank adapter and audited synthetic reveal, after required contract review. Preserve UNKNOWN until that evidence exists, and preserve proactive incident independence. Do not implement it automatically.
