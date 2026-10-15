# FastAPI backend foundation

Task 002 implements infrastructure only. Banking, ledger, simulator, complaints, context, event workers, investigations, auth and all v1.1 business endpoints remain unimplemented. Accepted contracts are unchanged. Use this existing checkout; do not initialize a replacement repository.

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

The initial migration creates cedar, veriq and cedar_private schemas, revokes PUBLIC schema access and records revision 0001_domain_schemas. It creates no business table or role. The separate grant script grants each runtime role USAGE only on its own schema and SELECT on the Alembic version table. It grants no CREATE or blanket future-table DML. Future migrations must explicitly grant reviewed table privileges. Runtime code never invokes create_all or migrations.

Alembic reads only MIGRATION_DATABASE_URL through separate MigrationSettings; runtime Settings does not contain that field. Autogeneration reflects only the three owned schemas; review generated revisions. `alembic downgrade base` is for a clean disposable foundation database, never an automatic startup/reset action; it uses no CASCADE and refuses to destroy unrelated schema objects. Update the readiness revision constant when adding a migration; a test checks it against Alembic head.

## Run

From apps/backend:

```bash
uv run --locked uvicorn veriq_cedar.main:create_app --factory \
  --host 127.0.0.1 --port 8000 --no-access-log
```

- GET /health: process liveness, no database access.
- GET /ready: checks SELECT 1, migration head and own-schema USAGE under all three runtime connections. Returns 503 with a sanitized error on unavailable/missing-grant/unmigrated database. It does not fix state or create tables.
- GET /infra/openapi.json: infrastructure routes only. This is separate from the original banking contract; /v1 routes are not registered.

Application events are JSON with generated request ID, route template, status and duration; bodies, raw query strings, DSNs and exception text are omitted. Keep `--no-access-log` to disable Uvicorn's separate raw URL access log. Uvicorn lifecycle logs retain its default format. Responses include X-Request-ID. Error bodies use `{error:{code,message}}`. No auth/session credentials are needed for infrastructure probes; no banking routes are exposed.

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

Without TEST_DATABASE_ADMIN_URL, the five marked postgres tests are explicitly skipped. With it they execute real migrations, privilege checks, live readiness and session commit/rollback; no SQLite substitute. The remaining tests use offline configuration, explicit dependency fakes, actual loopback connection refusal, HTTPX ASGI transport with lifespan, and AST import checks. No business tests T01–T16 or investigation workflows are claimed implemented.

## Package boundaries

Cedar and Veriq have separate declarative registries/schema metadata. Veriq imports no Cedar model/repository; generic integration protocols depend only on typing and define no proposed wire DTOs. The composition root owns domain-scoped database dependencies. Shared Python process and these initial grants are not production-grade isolation. Business table privileges, bank/tenant auth and production deployment remain future reviewed work.

See ../../docs/handoffs/CURRENT_STATE.md and TASK_002_REPORT.md for the verified environment, exact changes and next task.
