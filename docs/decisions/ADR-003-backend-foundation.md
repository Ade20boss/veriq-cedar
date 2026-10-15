# ADR 003 Backend foundation implementation

15 October 2026. Status: implemented under explicit Task 002 authorization; technical review pending. This authorizes no v1.1 business endpoint or financial behavior.

Use Python 3.12.14, project-local uv 0.13.1, exact direct pins and uv.lock with hashes. Hatchling 1.27.0 builds the src-layout package. uv sync --locked and uv lock --check enforce reviewed metadata/lock consistency. The lock supports other declared Python versions but only 3.12.14 was executed here.

Use an app factory/lifespan, sync SQLAlchemy 2 engines/sessions and psycopg 3. Sync infrastructure handlers run via FastAPI's worker handling. Each Cedar/Veriq/simulator dependency has its own engine/sessionmaker and credentials; migration settings are separate and not runtime fields. Sessions do not auto-commit; closing rolls back uncommitted work. No global unrestricted business session and no runtime create_all.

Initial Alembic revision creates only cedar/veriq/cedar_private schemas and revokes PUBLIC schema access; administrator-owned migration metadata remains public.alembic_version. Bootstrap role creation and post-migration runtime USAGE/version-SELECT grants are explicit local infra scripts. No business tables, per-table DML defaults, banking records or financial ledger are created. Autogeneration is restricted to owned schemas; downgrade uses no CASCADE.

Health is database-independent; readiness checks every runtime connection, expected revision and own-schema usage. Infrastructure OpenAPI is /infra/openapi.json; banking OpenAPI files are unchanged and business routes unregistered. The public error envelope matches approved Error structure. Application JSON logs omit raw request URLs/query/body and exception text; Uvicorn runs with --no-access-log.

Neutral integration protocols are generic extension points only, with no proposed DTO implementation. Static tests reject Veriq imports of Cedar and framework/domain dependencies in ports. Shared process/packages do not provide production isolation. Minimal real role grants were tested, not full tenant/auth isolation.

Tests use HTTPX ASGITransport and explicit app lifespan. Real PostgreSQL 16.2 supplied by task-local pgserver binaries was used because Docker is absent and Podman runtime storage is read-only. The project does not depend on pgserver; Compose uses an official PostgreSQL 16 digest. Five real database tests, 28 other tests and a live Uvicorn/Alembic/role-script smoke passed. See Task 002 report for exact versions/results and limitations.
