# Task 003 executed commands

Commands were executed in the existing checkout or the surrounding chat directory. Task-local orchestration is under work/task003, outside Git; credentials and database data are never committed.

- git status --short --branch; git remote -v; git log --oneline -3: clean main and supplied origin.
- git fetch origin main; git rev-list --left-right --count HEAD...origin/main: 0/0.
- git switch -c feat/proactive-incident-g0 origin/main: requested feature branch.
- Read AGENTS, root/backend README, current handoff/latest report, BACKEND_ARCHITECTURE, BANK_ADAPTER_CONTRACT, EVENT_PROCESSING, approved demo and proposed InvestigationTrigger/IncidentInvestigation/JobView/OperationalEventEnvelope schemas.
- Task-local native PostgreSQL initdb --auth-local=trust --auth-host=reject, Unix socket only; created dedicated veriq_cedar_test_g0. Temporary role passwords generated in memory. No production/developer DB used.
- alembic upgrade 0001_domain_schemas; alembic revision --autogenerate --rev-id 0002_proactive_g0 -m 'Persist proactive incident G0 and permitted Cedar inbox'; alembic downgrade base: initial revision generation, then manual constraint review/cleanup.
- apps/backend/.venv/bin/pytest apps/backend/tests -m 'not postgres' -q: initial 37 passed, 18 deselected; later full suite includes final 38 non-server checks.
- python3 work/task003/run_tests.py: starts isolated server, executes backend .venv/bin/pytest tests -v --junitxml=<work/task003/all-tests.xml>, runs smoke and stops server in finally. Initial setup failed when server had been launched in a previous execution boundary; corrected wrapper. First full run: 54 pass/one migration-check failure; next 58 pass; final **61 pass, no skips** after additional boundary cases.
- Smoke: infra/postgres/010-runtime-roles.sh; alembic upgrade head/current/check; psql -v cedar_role=cedar_runtime -v veriq_role=veriq_runtime -v simulator_role=simulator_runtime -f infra/postgres/grant-runtime.sql; alembic upgrade head --sql. All passed against actual PostgreSQL.
- Smoke: .venv/bin/python -m veriq_cedar.composition.g0 replay --fixture <absolute contracts/demo.json> with ENVIRONMENT=test and restricted runtime URLs: passed; same command a second time returned expected exit2/reset refusal. .venv/bin/python -m veriq_cedar.composition.g0 worker: actual process stayed running, then intentionally terminated.
- .venv/bin/ruff check --fix src tests migrations and ruff format during authoring; final ruff check src tests migrations and ruff format --check src tests migrations: passed, 48 Python files.
- work/task002/tools/bin/uv lock --check --project outputs/veriq-cedar/apps/backend --cache-dir work/task002/uv-cache: passed, existing 35-package lock unchanged.
- Task-local authenticated gh api repos/Ade20boss/veriq-cedar --jq '{full_name,default_branch,permissions}': existing supplied repository/main and write access confirmed. No new authentication, invitation or settings changes.

Publication commands (performed after staging review): git diff --check; stage only the manifest's project files; git diff --cached --name-status; git commit -m 'Implement proactive G0 incident detection and durable investigations'; git push -u origin feat/proactive-incident-g0; gh pr create --base main --head feat/proactive-incident-g0 with reviewed title/body file; verify remote branch and PR state. Final chat report records actual publication outcome, not an inferred success.
