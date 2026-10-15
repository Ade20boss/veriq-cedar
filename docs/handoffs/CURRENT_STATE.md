# Veriq Cedar current engineering handoff

Task 002-GIT, 15 October 2026 (Africa/Lagos). Existing monorepo published; GitHub collaboration configured. GitHub setup only: no business source, proposed contract approval or frontend migration performed. Stop after final setup-documentation push and report.

## Checkout and publication

Working checkout: /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. It is the original verified writable repository; the optional ~/Projects relocation remains blocked and no replacement repository was initialized.

Origin: https://github.com/Ade20boss/veriq-cedar.git
GitHub: https://github.com/Ade20boss/veriq-cedar
Branch: main, tracking origin/main.
Initial successfully pushed implementation/publication commit: a483b0ffc336431cccc4343c26046b5303a3275b.
GitHub main and its recursive tree were verified against that commit (115 initial files).

This handoff is part of the subsequent setup-documentation commit. Obtain the containing/current commit with `git rev-parse HEAD` or `git log -1 --oneline`, and compare to `git ls-remote origin refs/heads/main`; do not mistake the initial publication checkpoint above for a later documentation HEAD. The final setup report records the final verified HEAD. Commit/push this handoff normally; no force-push or remote overwrite is authorized.

## Authentication, access and main protection

Official GitHub CLI 2.102.0 was installed task-locally, archive checksum verified, and browser OAuth confirmed Ade20boss with repository admin/write access. No password/token was requested in chat. CLI authentication configuration is outside the checkout; only this repository's Git credential helper was configured. Tokens/credentials/environment/cache files are not committed. Other developers use their own normal GitHub authentication.

GitHub confirmed new write invitations (HTTP 201) for Habeeb / Hbboss226 (canonical HBboss226) and Usaamah / Barry1003. Both were confirmed in the pending invitation list; neither is claimed accepted. Invitees must accept GitHub's invitation before write access is active. No admin permissions were granted to them.

GitHub confirmed main protection (HTTP 200): require pull requests; required_approving_review_count=0; no mandatory status checks; no Code Owner gate; enforce_admins=false; force-pushes/deletions disabled. Owner/admin maintenance remains possible. Team review expectations for contract/cross-workstream changes remain documented even though the formal approval minimum is zero. No CI workflow/check was invented.

## Workstreams and re-entry

Daniel: feat/backend-foundation, primary apps/backend. Habeeb: feat/ai-foundation, primary apps/ai. Usaamah: feat/frontend-foundation, Cedar Customer/Operations/Veriq frontend; actual directories/import remain subject to the agreed migration plan. These are documented starting branches, not pre-created remote branches. Developers create/push their own feature branches and PR against main.

Clone https://github.com/Ade20boss/veriq-cedar.git, read AGENTS/README/TEAM_ONBOARDING and current specs/contracts, inspect status/log, switch from updated main to the assigned feature branch. Use `git push -u origin HEAD` and `gh pr create --base main --fill` after an authorized change/commit. Reuse the same checkout with Codex or Antigravity; do not regenerate the project or discard teammate changes.

Pre-publication review verified original specification hashes, accepted/proposed contract bytes, 115 intended initial files, no symlinks and no credential-pattern matches. .gitignore excludes environments, caches, builds and secret .env files; placeholder .env.example files are intentional. Frozen Markdown hard line breaks were preserved rather than normalizing source documents. No application tests were rerun for this Git/docs-only task; Task 002 results below remain the last implementation verification.

## Verified implementation

apps/backend now has pyproject.toml, exact dependency pins/uv.lock/.python-version, ignored local .venv, example environment, app factory/lifespan, validated secret settings, domain-scoped PostgreSQL engines and non-autocommitting sessions, distinct metadata bases, schema-only Alembic migration/config/template, infrastructure error/logging foundation, seven generic neutral integration ports and tests. Cedar/Veriq business namespaces contain no business implementation. infra has digest-pinned local Compose, role bootstrap and explicit runtime grant scripts.

GET /health returns ok independent of database. GET /ready requires all three runtime connections, migration 0001_domain_schemas and own-schema USAGE; returns sanitized 503 if not ready. /infra/openapi.json exposes only those two operations. No /v1 business or proposed staff/auth/investigation route is implemented. No ledger/table/fixture/seed/AI service/frontend was created. Proactive behavior and financial/advisory boundaries remain future business invariants.

## Environment and migration state

Tested Python 3.12.14, uv 0.13.1; direct versions recorded in TASK_002_DEPENDENCIES.json and backend README/lock. .venv is local and ignored, no global package install. Runtime settings read CEDAR_DATABASE_URL, VERIQ_DATABASE_URL and SIMULATOR_DATABASE_URL; only Alembic reads MIGRATION_DATABASE_URL. Runtime grants are own-schema USAGE and migration-table SELECT, no blanket DML or cross-domain access.

Real tests used isolated PostgreSQL 16.2 native binaries from task-local pgserver 0.1.4, Unix socket only. Temporary test schemas/roles/probe tables were exercised and cleaned between tests. CLI smoke applied migration/role grants in a disposable test database. Database and Uvicorn were stopped afterwards. No developer database or service is left running; apply setup from apps/backend/README.md for a new run. Test runtime/data/logs remain only under the chat work/task002 directory, not project deliverables. Compose is provided but not run here: no Docker, Podman initialization blocked by read-only runtime path.

## Tests and commands

33 tests passed, zero failures/errors/skips in final full run, including five real PostgreSQL tests and 28 non-server tests. Real checks cover upgrade/head repeat/downgrade, autogeneration ignoring unrelated schema tables, all-three-role readiness/privileges, denied private reads, session rollback/explicit commit and unmigrated readiness. Non-server tests include explicit DB fakes, real loopback connection refusal, environment/errors/logs and static import boundaries. HTTPX is used directly with lifespan; no deprecated Starlette TestClient compatibility path.

Live CLI smoke passed role bootstrap + grant scripts, Alembic upgrade/current/offline SQL, Uvicorn startup and real HTTP health/ready, plus 404 for unimplemented banking route. Ruff lint/format checks passed; uv lock --check and locked sync passed. All accepted/proposed contracts, source archives and earlier task reports remain unchanged. Exact commands, tests, files and failures/resolutions are in TASK_002_REPORT.md, TASK_002_COMMANDS.md and TASK_002_VERIFICATION.json. Business tests T01–T16/P01–P10 are not implemented/run.

## Open issues and next safe task

No known failing foundation tests. Compose execution and cross-version/OS support not verified. This foundation is not production security isolation; tenant/auth/business grants/real bank protocols remain future work. Original v1.1 additions still proposed. Existing frontend source/branch/migration approval remains unavailable; no frontend changes made.

Technical lead reviews Task 002. Recommended next task after explicit authorization: review the minimum bank-neutral event/adapter/job DTOs, then implement the autonomous event-inbox→incident/investigation-job→permitted bank-status slice with a fake adapter, restart/deduplication/AI-down checks, independent of complaints/staff sessions. No further implementation should start automatically from this handoff.

## Resume with Codex or Antigravity

Open the same checkout. Read AGENTS, backend README, this handoff, Task 002 report, original contracts/specs and relevant proposed architecture. Inspect Git status and TASK_002_CHANGES hashes; preserve uncommitted files. Use locked dependencies, run the appropriate unit/real PostgreSQL checks and keep distinct runtime/migration credentials. Do not recreate the app or treat proposed v1.1 routes as approved.
