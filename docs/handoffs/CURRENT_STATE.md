# Veriq + Cedar current engineering handoff

Task 003, 15 October 2026 (Africa/Lagos). Proactive G0 implementation verified and prepared for technical review. Stop after the feature branch commit/push and PR; do not merge or start a new slice.

## Repository and branch

Existing writable checkout: /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. No second repository, relocation or reset was created. Origin: https://github.com/Ade20boss/veriq-cedar.git. Branch: feat/proactive-incident-g0. Started from fetched main at 2019c9facb1dbb7e72d6c6287f1aede0320a05be; main was clean and identical to origin/main. Only backend, grants and related documentation are changed; AI/frontends and contracts/specs are unchanged.

This handoff is included in the G0 feature commit. Obtain its exact containing/current commit with `git rev-parse HEAD`; verify remote with `git ls-remote origin refs/heads/feat/proactive-incident-g0`. The final chat report supplies the verified pushed SHA and PR. Commit/push only this feature branch, never implementation directly to main. Publication/access records from Task 002-GIT remain historical in its report. Prior collaborator invites were confirmed pending, not claimed accepted; main PR protection remains unchanged by Task 003.

## Implemented state

Task 002 FastAPI/settings/logging/DI/connection foundation is retained. Task 003 adds typed internal g0.internal.1 operational metric/evidence/principal/status models, neutral event-source/result-sink protocols, finite Cedar synthetic adapter, deterministic five-minute route detector and atomic acceptance→suspected incident/evidence→investigation→jobs/status outbox. No complaint/staff action gates this workflow. G2 7/25 vs 2/100 qualifies under frozen thresholds; Birch 1/25 does not. Exact source identities, timestamps, intervals, rule/config and evidence are persisted.

Worker claims one eligible PostgreSQL row with SKIP LOCKED, scopes by bank, leases with owner/generation, assembles evidence without AI, checks evidence revision, fences completion/retry and handles expired worker leases. Default 60-second leases, five attempts, deterministic bounded retries. Cedar receives only allowlisted progress and evidence references through an idempotent monotonic inbox. Investigation remains UNREVIEWED; AI unavailable means no incident AI integration exists. No financial conclusion is emitted.

Migration head: 0002_proactive_g0, after unchanged 0001_domain_schemas. Six Veriq tables: operational_events, incidents, incident_evidence, incident_investigations, investigation_jobs, status_deliveries. Two Cedar tables: investigation_result_receipts, investigation_status_inbox. No private simulator, banking, ledger or case table. Explicit role table grants in infra/postgres/grant-runtime.sql must be reapplied after upgrade head. Runtime code does not migrate/create/reset tables. Events/evidence/outbox/delivery receipts have no runtime UPDATE/DELETE grant. Schema/package separation is not production isolation.

See ../PROACTIVE_G0.md for exact internal contracts, table/grant matrix, lifecycle and assumptions. The accepted v1.0 contract and all proposed v1.1 files remain byte unchanged. No business HTTP endpoint is registered; infrastructure /health, /ready, /infra/openapi.json are preserved. Internal Task 003 models do not finalize any proposed HTTP API. No AI/frontend/ledger/payment simulation/complaint implementation was added.

## Verified tests and replay

Final full run: 61 passed, zero failures/errors/skips; 38 non-server tests and 23 actual PostgreSQL tests. This retains the foundation suite and adds G0 normal/G2/Birch detection, no complaints, automatic jobs, concurrent duplicate and distinct windows, bank/source scopes, evidence references, private-canary allowlist, actual role/private/cross-schema denial, event immutability, worker crash/reclaim/fencing, stale evidence/results, interrupted delivery, bounded retries/dead letter, transient recovery, conflicting identities and future/late-event policy. No SQLite substitute. Non-server tests use pure detector/DTOs and the retained explicit application/DB fakes plus actual refused loopback connection. Broader banking T01–T16/proposed P01–P10 are not claimed complete.

Actual server: PostgreSQL 16.2 via task-local pgserver 0.1.4 native binaries, private Unix socket, dedicated disposable veriq_cedar_test_g0. Role/bootstrap/grant scripts, Alembic upgrade/current/check/offline SQL, CLI replay, reset refusal and separate worker startup passed. Replay persisted one G2 incident, one EVIDENCE_READY_AI_UNAVAILABLE/UNREVIEWED investigation, one analysis job plus two delivery jobs (all SUCCEEDED), and one latest Cedar inbox with bank_case_ids=[]. No incident was preinserted. All test PostgreSQL and worker processes were stopped. No developer database/service is left running. Compose remains unexecuted here (Docker absent; Podman runtime restricted).

Ruff check/format passed for 48 Python files; uv lock --check passed. Dependencies unchanged from Task 002 (Python 3.12.14, exact pins and uv.lock). Details/results: TASK_003_REPORT.md, TASK_003_COMMANDS.md, TASK_003_TEST_RESULTS.xml, TASK_003_TEST_OUTPUT.txt, TASK_003_CLI_SMOKE.txt, TASK_003_DEMO_RESULT.json, TASK_003_FILES.txt.

## Startup and resumption

Use apps/backend/README.md to install with uv sync --locked, configure ignored environment files, start PostgreSQL, apply Alembic head and explicit grants. Never use migrator credentials in runtime settings. From apps/backend:

```bash
uv run --locked python -m veriq_cedar.composition.g0 worker
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Run these as separate processes. The worker polls durable CED jobs automatically and recovers expired leases on restart. A live event producer/outbox is future work. For a fresh disposable synthetic database with the documented restricted runtime grants:

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g0 replay --fixture ../../contracts/demo.json
```

Test replay requires a separate fresh veriq_cedar_test_* database with TEST_DATABASE_ADMIN_URL, then `uv run --locked pytest -s tests/test_g0.py::test_replay_g2_automatic_before_complaints_and_permitted_cedar_status`. Tests create/drop only their disposable schemas/roles. CLI replay refuses existing event/inbox data and never resets a database.

Open this existing checkout in Codex/Antigravity, read AGENTS/current handoff/PROACTIVE_G0/report, inspect status/log and PR before work. Preserve teammate changes. Use feature branches/PRs to main. Daniel owns backend; Habeeb apps/ai; Usaamah frontend migration subject to prior plan. No teammate applications are imported by this slice.

## Review assumptions and next safe action

Review ten-minute lateness, rejection of snapshot corrections/future observations, incident lifetime unique per bank/rule version/route/service, internal DTO version, retry bounds and explicit grants. No additional signoff is fabricated. Limitations: in-process configured principals, no RLS/network auth/source attestation; finite synthetic source with no Cedar durable event outbox; no incident closing/reopening, staff recovery commands, heartbeat/remote timeout integration, production supervision/alerts or complete historical AI run store. Database claim outages require process supervision/restart. Latest deterministic bundle only is stored, with job/run/revision history. AI findings remain advisory by architecture; no AI call is made here.

Stop for Task 003 technical review. Recommended next slice, only after authorization and required contract review: Cedar-owned durable complaint intake plus bank-neutral complaint event/targeted investigation handoff, retaining proactive incident independence and financial evidence rules. Ledger/payment/AI/UI remain separate reviewed work.
