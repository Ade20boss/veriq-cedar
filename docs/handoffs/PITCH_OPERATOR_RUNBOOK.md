# Pitch operator runbook — Task007

Use this checkout, not an alternative backend from PR#9. Main tested: `7983ec8de7d9a83ee5bc4f3f7582103a369ccf08` (PR#7 merged). All identities, transfers and telemetry are fictional. Findings are advisory; FINDINGS_READY is neither human review nor financial resolution.

## Setup and disposable verification

1. Install backend with Python3.12 and `uv sync --locked` from `apps/backend`. Backend README contains the pinned uv bootstrap. In `apps/ai`, create a separate environment and install `requirements.txt` plus `requirements-dev.txt` for AI tests. This verification used the backend's locked environment with the AI-required dotenv already installed; no AI dependencies were changed.
2. Copy `infra/.env.example` and `apps/backend/.env.example` to their ignored `.env` counterparts. Replace placeholders privately, keeping three runtime roles separate from the migrator. Never put service keys in frontend variables. Use a **fresh disposable** database. Do not reset an existing volume or shared database.
3. From root: `docker compose --env-file infra/.env -f infra/compose.yaml up -d --wait postgres`. Docker was unavailable here; verification used task-local native PostgreSQL16.2 on a private Unix socket. Compose itself remains unexecuted in this environment.
4. From backend: `uv run --locked alembic upgrade head`, `uv run --locked alembic current`, `uv run --locked alembic check`. Expected head `0005_case_ai`, no new upgrade operations. From root reapply grants:

```bash
docker compose --env-file infra/.env -f infra/compose.yaml exec -T postgres \
  psql -U veriq_cedar_migrator -d veriq_cedar \
  -v cedar_role=cedar_runtime -v veriq_role=veriq_runtime \
  -v simulator_role=simulator_runtime < infra/postgres/grant-runtime.sql
```

5. Export the four database URLs from private configuration into the shell; `ENVIRONMENT=test`. The verifier consumes exported values, not just the dotenv file. From backend run `uv run --locked python scripts/verify_integration.py`. This refuses occupied backend/AI ports and existing replay data, never resets a database, creates private temporary sessions, launches API/G1/G2/actual mock AI, proves outage/retry/recovery and prints only a sanitized JSON summary. It terminates its child services and deletes temporary logs/session files at exit. Do not run Python with `-O` because verification uses assertions. Ports default8000/8002; optional `INTEGRATION_AI_PORT` selects another checked free AI port. `CADDY_BINARY=/absolute/path/to/caddy` also verifies the existing gateway routes on8080/8081 (admin2019). `VERIFY_CUSTOMER_FRONTEND=true` additionally checks a separately running customer shell through the gateway; this is not a claim of UI integration.

This command first runs the existing AI-disabled four-act replay, then creates a new complaint for the same timed-out transfer through real HTTP. It deliberately leaves AI offline for the first attempt and starts mock AI for the durable retry. It does not backfill the older AI-disabled case or create a second debit. G1 remains alive alongside G2; the deterministic S2 transfer may be dispatched synchronously by the existing transfer command. The summary records polling observations, not every intermediate state.

## Persistent manual process sequence

After the same migration/grant/private environment setup, use separate terminals. These are existing commands; the automated verifier starts/stops equivalent processes itself, so do not run both modes simultaneously.

- On a fresh disposable DB, from backend: `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 replay`. It initializes sources/telemetry/S2/complaint and proves the four acts with AI disabled. Its raw developer output contains a fictional complaint: keep it private, do not publish it as an integration artifact.
- Provision separate cookies from backend: `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g1 mint-session --cookie-file /private/customer.session.json`; `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 staff-session --cookie-file /private/staff.session.json`. Parent directory must exist. Files are exclusive0600; staff expires in one hour. No login HTTP API exists. Use tokens only in the respective session cookie, with `/v1/cedar` and `/v1/veriq` paths when installing browser cookies. Do not commit files, paste tokens in chat or put them in command arguments/access logs.
- AI terminal, from `apps/ai`: privately set `INTERNAL_SERVICE_KEY`, `LLM_PROVIDER=mock`, empty `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`; run its environment's `python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --no-access-log`.
- Backend runtime terminals: export only the three restricted database URLs, no migrator URL; privately set `AI_ENABLED=true`, `AI_BASE_URL=http://127.0.0.1:8002`, matching `AI_SERVICE_KEY`, `AI_TIMEOUT_SECONDS=5`. From backend run `uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log`, `uv run --locked python -m veriq_cedar.composition.g1 worker`, and `uv run --locked python -m veriq_cedar.composition.g2 worker` separately. No staff action starts routine investigations. Non-loopback AI origins require exact `AI_TRUSTED_ORIGINS` JSON allowlisting and protected DNS/egress/TLS configuration; redirects and ambient HTTP proxies remain disabled.
- Optional synthetic telemetry refresh, from backend: `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 telemetry`. Never represent it as actual bank telemetry. The initial replay already injected the baseline.
- Customer terminal: `pnpm --dir apps/web/cedarBank install --frozen-lockfile`, then `pnpm --dir apps/web/cedarBank dev --hostname 127.0.0.1 --port 3000` from root.
- Operations terminal: `pnpm --dir 'apps/web/Cedar Bank Operations Design' install --frozen-lockfile`, then `pnpm --dir 'apps/web/Cedar Bank Operations Design' dev --hostname 127.0.0.1 --port 3001`. This install was **blocked here** by pnpm11's release-age policy for locked `node-releases@2.0.59`; do not silently bypass the policy or change Usaamah's lockfile.
- Gateway terminal from root: `caddy run --config infra/pitch/Caddyfile --adapter caddyfile`. Customer origin `http://localhost:8080`, Operations `http://localhost:8081`. Existing config forwards `/v1/*`, `/infra/*`, `/health`, `/ready` to8000 and other paths to3000/3001, without exposing AI. Use the localhost hostname consistently for gateway/cookie origins. No blanket CORS workaround.

## Demonstration and limits

With a privately provisioned customer cookie, submit a **new** complaint to existing `POST /v1/cedar/complaints` for the actual S2 transfer ID. G2 automatically delivers the complaint, assembles evidence, commits CASE_AI then calls AI outside the transaction. Poll existing authenticated `GET /v1/veriq/banks/CED/cases/{caseId}` with the investigator cookie. Expect source-backed observations, tentative hypotheses/alternatives, unknowns and checks, explicit MOCK_PROVIDER label, durable ai_result, UNKNOWN and no customer publication. The verifier automates these actual API operations safely.

Frontend integration is **not complete**: customer `src/lib/api.ts` returns stub arrays/nulls/echoed complaint input and mock sign-in; changing NEXT_PUBLIC_API_BASE_URL alone does not connect it. Operations `src/App.tsx` uses local role/screen data and has no investigator HTTP client. Usaamah owns wiring existing APIs/cookies/loading/degraded states and advisory result rendering. No frontend changes were made. Customer shell HTTP200 does not prove a customer banking journey; Operations shell was not started because its locked install was rejected. Do not call this a fully integrated browser pitch.

Stop only the processes you started. Preserve DB evidence if needed; never perform a shared-data reset. Retry recovery happens automatically after the cause is corrected while attempts remain. DEAD_LETTER requires deliberate scoped maintenance retaining snapshot/fencing, not an unrestricted reset. AI-disabled/unavailable operation keeps complaints/evidence durable. No public re-investigation/status-reveal endpoint is added here.

## Exact S2 snapshot for AI-owner evaluation

Task007 follow-up adds optional `--request-artifact /new/path/request.json` to the same disposable verifier. After successful mock/persistence checks it writes the exact permitted immutable v1.0 request, including genuine IDs and the explicitly unverified synthetic report, without adding wire fields. Existing output files are refused. No credentials or simulator truth are exported. See [Habeeb's evaluation handoff](task007/S2_AI_EVALUATION_HANDOFF.md) for the checked-in snapshot, digest/provenance and local-service submission instructions. No PostgreSQL is required to evaluate this already-exported self-contained payload.
