# Task 004 executed verification / publication commands

Existing checkout under outputs/veriq-cedar; environment-only helpers under chat work/task004, never staged. No token/password/cookie contents are recorded.

- git status --short --branch; git log -3 --oneline; git remote -v: existing clean G0 checkout/origin.
- git fetch origin main; authenticated gh pr view1/2 --json state,mergedAt,mergeCommit: both merged; latest main87e062539ba453bd9a99be70fa4386cea634bd86.
- git switch -c feat/cedar-financial-core-g1 origin/main: clean requested branch, no new repository or merge.
- Read AGENTS/current handoff, engineering spec accounting/workflow/scenarios, ADR001–003, canonical account/bank/name/transfer/cookie contract, demo fixture and current backend/tests/grants.
- Native initdb --auth-local=trust --auth-host=reject, Unix socket only; disposable veriq_cedar_test_g1 and separate veriq_cedar_test_replay_s0/s2. Actual separate nonsuperuser roles; no SQLite/production database.
- Alembic upgrade current head0002; revision --autogenerate --rev-id0003_financial_g1 -m 'Cedar financial core and restricted network'; explicit reviewed SQL checks/functions/triggers and downgrade dependency ordering added to that migration. Original revisions unchanged.
- python3 work/task004/run_tests.py -x -q during implementation: first privilege failure (fixed narrow lock function); intermediate86passed before added guards; later import/format issues corrected. Final `python3 work/task004/run_tests.py -x -q`: **91passed**, zero skipped; wrapper invokes backend .venv/bin/pytest tests -x -q --junitxml=<work/task004/all-tests.xml>, then CLI smoke, and stops server in finally.
- Actual smoke: infra/postgres/010-runtime-roles.sh, alembic upgrade head/current/check, psql explicit grant-runtime.sql variables, alembic upgrade head --sql in fresh scenario databases. All passed; no pending autogenerate operations.
- Actual `python -m veriq_cedar.composition.g1 replay --scenario S0` and S2 under restricted runtime URLs, private migration URL for CLI setup only. Actual G0 replay first in S2 database. Duplicate replay refused, seed repeated preserved balance; private mint-session wrote mode0600 file; arm outside test mode refused.
- Actual Uvicorn create_app --factory --no-access-log subprocess: /health200, /ready200, anonymous /accounts/me401, authenticated stored-cookie /accounts/me200 with5000000 balance/no-store. Separate G1 worker started/polled and was intentionally stopped. All services stopped; cookie files deleted after smoke.
- Ruff check --fix/format during authoring; final `.venv/bin/ruff check src tests migrations` and `ruff format --check src tests migrations`: passed63files. `uv lock --check --project outputs/veriq-cedar/apps/backend --cache-dir work/task002/uv-cache`: passed, existing35-package lock unchanged. `git diff --check` passed; no apps/ai/frontend/contracts/specs changes.

After artifact/secret/staging review: stage only TASK_004_FILES.txt paths, git diff --cached --check, git commit -m 'Implement Cedar G1 balanced financial core and restricted synthetic transfers', git push -u origin feat/cedar-financial-core-g1, gh pr create --base main --head feat/cedar-financial-core-g1 with reviewed --body-file; verify SHA/remote/PR. Final chat report records actual publication outcome. No force push/main implementation/automatic merge.
