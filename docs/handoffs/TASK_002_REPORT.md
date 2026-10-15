# Task 002 backend foundation review report

15 October 2026, Africa/Lagos. Result: actual FastAPI backend foundation implemented and tested; stop for technical review. No banking/business API, ledger or proposed v1.1 endpoint was implemented.

## 1 Repository and Git state

Working checkout: `/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`.

The existing checkout was verified writable with the expected engineering documents. The optional ~/Projects destination remains unavailable in the read-only execution /home mount. Work continued safely in the original fallback without a move, overwrite, new Git repository or delay for the full v1.1 amendment. main remains unborn, all initial/new project files untracked; no commits/staging/remote/push. Original Git metadata is preserved.

TASK_002_CHANGES.json lists every added/modified file with before/after SHA-256, and TASK_002_FILE_INVENTORY.txt lists all non-ignored deliverables. The report appendix enumerates the exact changed files. A review archive excludes local environments, credentials, caches and database test data but includes source/docs and original Git metadata.

## 2 What now works

- App factory `veriq_cedar.main:create_app` with lifespan-managed, separately disposed Cedar/Veriq/simulator engine/session infrastructure.
- Typed environment validation and secret masking; distinct runtime URL fields; only migration tooling reads the migration URL. Bounded connection/statement/pool settings.
- SQLAlchemy 2 declarative bases with separate domain metadata/registries, explicit non-autocommitting dependency sessions and no business tables.
- Alembic config/environment/template plus initial `0001_domain_schemas` migration. Creates cedar/veriq/cedar_private and revokes PUBLIC schema access, uses no CASCADE and reflects only owned schemas for autogeneration. No create_all at runtime.
- GET /health (no database dependency), GET /ready (all runtime connections, migration head and own-schema usage), and separate /infra/openapi.json. Banking /v1 routes are absent.
- Safe centralized Error envelopes, validation/HTTP/database/unexpected error handling, generated request IDs and structured application request logs excluding body/query/credential/exception text. Startup command disables Uvicorn's separate access log.
- Separate future Cedar account/ledger/transfer/simulator/complaint/adapter and Veriq knowledge/operations/investigation/AI-client packages. Only namespace/metadata infrastructure exists in them. Neutral generic protocols define integration extension points without implementing unapproved v1.1 wire schemas.
- Local PostgreSQL Compose configuration, role bootstrap and explicit post-migration own-schema USAGE/version-SELECT grants. No blanket DML or cross-domain grants.

The current banking API YAML, all proposed contract YAML/JSON and archived specifications are unchanged. No financial outcomes, scenarios, staff/session business endpoints, ledger entries, complaints, incident detectors, jobs, AI calls or frontend flows were implemented. Package boundaries and initial grants are safeguards, not production isolation or implemented tenant authorization.

## 3 Dependency selection and reproducibility

Python 3.12.14; uv 0.13.1; Hatchling 1.27.0. Direct dependencies are pinned in pyproject.toml, transitive versions/artifact hashes in uv.lock, and Python in .python-version. Use project-local tooling/cache/managed-Python directories if the home directory is read-only. uv sync --locked and uv lock --check passed. No global dependencies were installed.

| Package | Selected version |
|---|---|
| fastapi | 0.143.2 |
| pydantic | 2.14.1 |
| pydantic-settings | 2.16.0 |
| sqlalchemy | 2.0.54 |
| alembic | 1.20.0 |
| psycopg | 3.3.6 |
| uvicorn | 0.54.0 |
| pytest | 9.1.1 |
| httpx | 0.28.1 |
| ruff | 0.17.0 |

Compose uses an immutable official PostgreSQL 16 image digest, recorded in TASK_002_DEPENDENCIES.json. Actual database tests used native PostgreSQL 16.2 from a task-local pgserver 0.1.4 wheel, isolated on a private Unix socket. pgserver is not a project/runtime dependency. Python 3.13/3.14 and other OSes were not tested.

## 4 Automated tests and results

Final full suite: **33 passed, zero failures, errors or skips**.

| Test category | Execution/evidence |
|---|---|
| 28 non-server tests | Actual factory/lifespan/HTTPX paths, settings/secret masking, explicit readiness/dependency fakes, real refused loopback connection, safe errors/logs and AST/import/metadata/head guards |
| 5 real PostgreSQL tests | Native PostgreSQL 16.2: upgrade/repeat-head/downgrade; autogeneration ignores unrelated public table; three non-superuser runtime roles/readiness/grants; private table read denial; session rollback/explicit commit; reachable but unmigrated readiness |
| Live CLI/HTTP smoke | Actual bootstrap/grant scripts, Alembic upgrade/current/offline SQL and Uvicorn subprocess. /health and /ready 200; infrastructure OpenAPI only two operations; unimplemented banking route 404 |
| Lint/format | Ruff check and format --check passed for 35 Python files |
| Reproducibility/config | Locked install and lock check passed; shell script syntax and Compose YAML syntax passed |

All real-role tests connect using separate restricted roles, not just a mocked engine. No SQLite substitute was used. Dependency fakes are explicit in the unit tests; the unavailable-database unit test also makes a genuine failed connection rather than mocking a successful database. Real test probe tables are temporary test-only objects and do not ship as banking models/migrations.

Results/logs: TASK_002_TEST_RESULTS.xml, TASK_002_TEST_OUTPUT.txt, TASK_002_CLI_SMOKE.txt and TASK_002_VERIFICATION.json. Both PostgreSQL and Uvicorn were stopped. No developer database, service or seed is left running. Frozen business tests T01–T16/P01–P10 are not implemented or claimed passed.

## 5 Failures resolved and outstanding limitations

Initial pgserver install attempted under system Python 3.14 had no compatible wheel; isolated Python 3.12 tooling worked. An interrupted dependency download timed out; renewed network access and locked sync succeeded. Initial tests stopped on installed Starlette's deprecated HTTPX TestClient path; direct HTTPX ASGITransport plus explicit lifespan now runs with warnings-as-errors. Initial Ruff findings were corrected. No known foundation test remains failing.

Docker is absent; Podman fails creating its runtime directory on a read-only mount. Compose is supplied and YAML-parsed, but was not executed or validated by a Compose daemon. Role/bootstrap/grant SQL was executed independently against real PostgreSQL. Actual test patch 16.2 differs from the current digest-pinned major-16 Compose image; Compose-image behavior remains to be confirmed on a supported machine. No production deployment, full security isolation, tenant authorization, banking workflows or cross-platform support is claimed.

## 6 Startup instructions

Follow apps/backend/README.md for full copy/configure steps and project-local uv bootstrap. From repository root, configure ignored infra/.env and apps/backend/.env with matching local synthetic credentials, then start PostgreSQL:

```bash
docker compose --env-file infra/.env -f infra/compose.yaml up -d --wait postgres
```

From apps/backend:

```bash
uv sync --locked
uv run --locked alembic upgrade head
```

Then run the documented infra/postgres/grant-runtime.sql command as migration administrator from repository root. Startup readiness stays false until the migration and grants exist. From apps/backend:

```bash
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
uv run --locked pytest -m "not postgres"
```

For real database tests use a dedicated fresh veriq_cedar_test_* database and TEST_DATABASE_ADMIN_URL as described in the backend README, then run pytest without excluding postgres. Missing test URL skips the five marked tests explicitly. Never use a real/customer/development database for destructive migration tests.

## 7 Handoff and next implementation task

CURRENT_STATE.md now records actual source/migration/dependency/test/runtime state and safe Codex/Antigravity re-entry. AGENTS.md reflects explicit Task 002 foundation authorization; previous task/source documents are preserved. Root/backend/infra/onboarding/architecture entry notes point to the implemented foundation and distinguish it from remaining proposals.

Stop for technical review. Recommended next task after explicit authorization: agree the minimum bank-neutral event/adapter/job DTOs, then implement a bounded autonomous event-inbox→suspected incident/investigation-job→bank-status slice with a fake bank adapter and durable restart/deduplication tests. Do not require staff/complaint initiation; retain UNKNOWN and advisory-only AI rules. This is not authorization to implement it now.

## 8 Commands executed

TASK_002_COMMANDS.md records actual commands/results including failed/resumed installs, Python/runtime discovery, mount/container restrictions, lock/sync, lint/format, unit/full PostgreSQL runs, CLI/live HTTP smoke and preservation/package checks. Task-local authoring/test-runtime helpers remain under chat work/task002, outside project deliverables. No system-wide install, source migration, unrelated banking implementation, remote/push, deployment or teammate message occurred.

Implementation references consulted: [uv lock and sync](https://docs.astral.sh/uv/concepts/projects/sync/), [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/), [Pydantic settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/), [SQLAlchemy PostgreSQL dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html), [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html), [pgserver temporary test runtime](https://github.com/orm011/pgserver). Actual verification above comes from executed local checks.

## Appendix Exact changed files

TASK_002_CHANGES.json is authoritative for before/after hashes; local virtualenv/tool/download/database data are excluded. The list below includes modified files and new source/tests/config/report artifacts; original contracts/specifications and previous task reports are not modified.

- .gitignore
- AGENTS.md
- README.md
- apps/backend/.env.example
- apps/backend/.python-version
- apps/backend/README.md
- apps/backend/alembic.ini
- apps/backend/migrations/env.py
- apps/backend/migrations/script.py.mako
- apps/backend/migrations/versions/0001_domain_schemas.py
- apps/backend/pyproject.toml
- apps/backend/src/veriq_cedar/__init__.py
- apps/backend/src/veriq_cedar/cedar/__init__.py
- apps/backend/src/veriq_cedar/cedar/accounts/__init__.py
- apps/backend/src/veriq_cedar/cedar/adapters/__init__.py
- apps/backend/src/veriq_cedar/cedar/base.py
- apps/backend/src/veriq_cedar/cedar/complaints/__init__.py
- apps/backend/src/veriq_cedar/cedar/ledger/__init__.py
- apps/backend/src/veriq_cedar/cedar/simulator/__init__.py
- apps/backend/src/veriq_cedar/cedar/simulator/base.py
- apps/backend/src/veriq_cedar/cedar/transfers/__init__.py
- apps/backend/src/veriq_cedar/integration/__init__.py
- apps/backend/src/veriq_cedar/integration/ports.py
- apps/backend/src/veriq_cedar/main.py
- apps/backend/src/veriq_cedar/platform/__init__.py
- apps/backend/src/veriq_cedar/platform/database/__init__.py
- apps/backend/src/veriq_cedar/platform/database/base.py
- apps/backend/src/veriq_cedar/platform/database/revision.py
- apps/backend/src/veriq_cedar/platform/database/session.py
- apps/backend/src/veriq_cedar/platform/errors.py
- apps/backend/src/veriq_cedar/platform/logging.py
- apps/backend/src/veriq_cedar/platform/settings.py
- apps/backend/src/veriq_cedar/veriq/__init__.py
- apps/backend/src/veriq_cedar/veriq/ai_client/__init__.py
- apps/backend/src/veriq_cedar/veriq/investigations/__init__.py
- apps/backend/src/veriq_cedar/veriq/knowledge/__init__.py
- apps/backend/src/veriq_cedar/veriq/operations/__init__.py
- apps/backend/src/veriq_cedar/veriq/persistence/__init__.py
- apps/backend/src/veriq_cedar/veriq/persistence/base.py
- apps/backend/tests/conftest.py
- apps/backend/tests/test_application.py
- apps/backend/tests/test_boundaries.py
- apps/backend/tests/test_postgres.py
- apps/backend/tests/test_settings.py
- apps/backend/uv.lock
- docs/BACKEND_ARCHITECTURE.md
- docs/TEAM_ONBOARDING.md
- docs/decisions/ADR-003-backend-foundation.md
- docs/handoffs/CURRENT_STATE.md
- docs/handoffs/TASK_002_CHANGES.json
- docs/handoffs/TASK_002_CLI_SMOKE.txt
- docs/handoffs/TASK_002_COMMANDS.md
- docs/handoffs/TASK_002_DEPENDENCIES.json
- docs/handoffs/TASK_002_FILE_INVENTORY.txt
- docs/handoffs/TASK_002_REPORT.md
- docs/handoffs/TASK_002_TEST_OUTPUT.txt
- docs/handoffs/TASK_002_TEST_RESULTS.xml
- docs/handoffs/TASK_002_VERIFICATION.json
- infra/.env.example
- infra/README.md
- infra/compose.yaml
- infra/postgres/010-runtime-roles.sh
- infra/postgres/grant-runtime.sql
