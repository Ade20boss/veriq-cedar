# Veriq / Cedar — GitHub Backend, AI and Frontend Integration Audit

**Inspection:** 16 October 2026. **Repository:** [Ade20boss/veriq-cedar](https://github.com/Ade20boss/veriq-cedar). **Scope:** read-only inspection of connected GitHub source, merged PRs and documentation, compared with the team's reported local Codex tests. No local services were executed by this audit.

## Executive decision

The backend is **capable of a genuine synthetic, evidence-grounded demonstration**. The next highest-value work is **version alignment, secure runtime configuration, frontend state mapping and end-to-end browser verification**, not adding unsupported endpoints or rebuilding screens. AI is **optional and was merged on PR #8**; the current Ada case may still legitimately return `ai_result: null` because existing AI-disabled cases are **not backfilled**.

## Verified GitHub publication state (at inspection)

- [PR #8, optional case AI](https://github.com/Ade20boss/veriq-cedar/pull/8) is **merged** (merge SHA `fddeaa18155f5048e62ad9fb5cee4b98d1fb2ae1`, 16 Oct 2026). `main` includes `apps/backend/migrations/versions/0005_case_ai.py`, the new `veriq/ai` code, and the established AI service.
- [PR #6, Cedar frontend](https://github.com/Ade20boss/veriq-cedar/pull/6) remains **open**, remote head `603ab7aa3cf27a849b96fd999b2b08e784979c74`. `feat/frontend-foundation` was five commits ahead and eleven behind `main` when compared. The later tested fixes and demo commits described in the conversation are **local and unpushed according to the Codex reports**; they are not proven present in the PR remote branch.
- `main` currently has Cedar Customer and Cedar Operations, **but not** `apps/web/veriq`; that app appears in the PR #6 branch's changed-file set, while the latest live adapter and Caddy changes were reported as local. Do not assume a fresh clone of `main` reproduces the three-app demo.
- The `main` Caddyfile routes `8080→3000` and `8081→3001`, with `/v1/*` to `8000`. The third `8082` gateway configuration exists in the user's **local** Codex report but is **not in main** at inspection.

## Backend implementation actually present

- **FastAPI** `apps/backend/src/veriq_cedar/main.py` registers protected customer and Veriq routers; `/health` and `/ready` are separate probes.
- **Cedar financial domain:** `GET /v1/cedar/accounts/me`, `GET /v1/cedar/banks`, `POST /v1/cedar/name-enquiries`, `POST /v1/cedar/transfers` with `Idempotency-Key`, `GET /v1/cedar/transfers/{transferId}`, `POST /v1/cedar/complaints`, `GET /v1/cedar/complaints/{caseId}`. Backend remains sole authority for balances, processing stage and financial outcome. `RESPONSE_TIMEOUT` ≠ confirmed failure; outcome stays `UNKNOWN` unless proven otherwise.
- **Veriq institutional knowledge:** `POST/GET /v1/veriq/banks/{bankId}/sources`, source claims read, context and relationships reads. Five approved demo filenames, each up to 256 KiB. Structured services/dependencies/routes parse immediately; historical incidents and SOP originals remain `UPLOADED`, not AI-extracted. Source `202` may still contain `FAILED`; inspect `status`. Structured relationships are `DOCUMENTED` rather than independently verified causality. The current `sources/{sourceId}/claims` route **returns `[]`**.
- **Monitoring / incidents:** `GET /operations`, `GET /incidents`, `GET /incidents/{incidentId}`, under bank-scoped Veriq API. `OperationalRead.operations()` labels observations `INSUFFICIENT_DATA` if outside a **10-minute freshness window** or below the sample thresholds (window attempts <20 or baseline attempts <100). Incident detections are `SUSPECTED`, not verified causes. The private synthetic telemetry producer is independent of document uploads.
- **Case investigation:** customer complaint durable handoff assembles bank-permitted deterministic evidence; `GET /v1/veriq/banks/{bankId}/cases/{caseId}` returns the exact contracted object `{case_id,status,financial_outcome,evidence,incident_ids,ai_result}`. An existing `POST .../cases/{caseId}/investigate` is an authorized refresh command, not a generic AI-trigger endpoint.
- **Auth:** customer and investigator demo tokens share the cookie name `cedar_demo_session` but represent different scoped private credentials; investigator checks token hash, expiry, role `INVESTIGATOR`, and exact `bankId`. These are **not** the Figma/Payload `app-session`, which does not bridge automatically. No real public institution signup/OAuth/connector authorization API is currently implemented.

Sources: [backend README](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/README.md), [pitch API](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/src/veriq_cedar/composition/pitch_api.py), [source ingestion](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/src/veriq_cedar/veriq/knowledge/service.py), [operational read model](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/src/veriq_cedar/veriq/operations/read.py), [investigator authentication](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/src/veriq_cedar/composition/investigator.py), [canonical OpenAPI](https://github.com/Ade20boss/veriq-cedar/blob/main/contracts/openapi.yaml).

## AI: implemented, exposed, and not yet proved

The separate [Habeeb AI service](https://github.com/Ade20boss/veriq-cedar/tree/main/apps/ai) exposes private `POST /internal/ai/extract-knowledge`, private `POST /internal/ai/analyze-case`, and `GET /health`; requests authenticate with a private service key. The provider can be a **deterministic mock** or OpenAI-compatible remote model. This service must **never be called by the browser**.

The newly merged backend AI orchestration creates a separate PostgreSQL `CASE_AI` job after deterministic `CASE_ANALYSIS`, snapshots exact scoped evidence/provenance, performs server-to-server HTTP **outside DB transactions**, validates returned evidence identifiers, case identity, financial outcome and safe wording, then commits results only if revision/digest/lease checks still match. Migration `0005_case_ai` creates `veriq.case_ai_runs`. Failures and absence of the service preserve evidence; there are bounded retries and terminal dead-letter behavior. Neither AI output nor the worker updates financial truth or publishes customer notices.

- Disabled default: backend `AI_ENABLED=false`; when enabled requires private `AI_BASE_URL` + `AI_SERVICE_KEY` matching the service's `INTERNAL_SERVICE_KEY`, with `AI_TIMEOUT_SECONDS` (default 5). Non-loopback destinations require explicit `AI_TRUSTED_ORIGINS` allowlist.
- UI **must** support statuses `AI_PENDING`, `FINDINGS_READY`, `EVIDENCE_READY_AI_UNAVAILABLE` (plus remaining contract statuses), and `ai_result` either null or valid typed output. Display and cite `observations`, `hypotheses`, `unknowns`, `recommended_checks`, and `customer_safe_update_draft` **only as unapproved advisory information**. Preserve `UNKNOWN`.
- **No new public AI endpoint is needed**. Poll existing protected case GET while AI is pending; do not assume an AI result exists or will appear for an old case.
- The team's published final evidence: **195 backend tests passed** (104 real PostgreSQL), **66 AI-service tests passed**, and one cross-service HTTP smoke with the **mock** provider. **No real model quality was evaluated.** The current mock understands **older evidence kinds**, so for the actual Task005 evidence it can return a valid but **sparse** result with empty observations/hypotheses. Display `MOCK_PROVIDER` label/unknowns rather than implying real LLM analysis.
- An AI extraction endpoint exists within Habeeb's service, but backend institutional ingestion **does not yet invoke it or approve claims**. The two unstructured files stay unextracted, and there is no supported browser→AI or generic document extraction flow.
- No implemented incident-specific AI endpoint, generalized bank connector, human review write or final customer publication/status reveal should be claimed.

Sources: [merged PR #8](https://github.com/Ade20boss/veriq-cedar/pull/8), [backend AI integration handoff](https://github.com/Ade20boss/veriq-cedar/blob/main/docs/handoffs/AI_BACKEND_INTEGRATION_STATUS.md), [AI service README](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/ai/README.md), [AI service route code](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/ai/app/main.py), [worker](https://github.com/Ade20boss/veriq-cedar/blob/main/apps/backend/src/veriq_cedar/veriq/investigations/worker.py), [contract Investigation schema](https://github.com/Ade20boss/veriq-cedar/blob/main/contracts/openapi.yaml).

## Frontend integration priorities

| Priority | Frontend responsibility | Authoritative source / expected behavior |
|---|---|---|
| P0 | Preserve customer transfer and complaint correctness, including Daniel's four race/recovery fixes | Cedar customer APIs; local reports have dynamic 4+1 regression tests but remote PR #6 has not yet received the new commits |
| P0 | Secure bank-scope/session and never equate Payload workspace membership to investigator permission | Existing investigator cookie and server-enforced `bankId`; explicit Cedar demo only |
| P0 | Use exactly contracted case shape and all AI statuses | `GET /v1/veriq/banks/CED/cases/{caseId}`; nullable `ai_result`, `incident_ids` may be empty |
| P0 | Sync deployed/local code, migrations, worker, DB grants and Caddy | Main has 0005; local runtime must be checked, not inferred from remote GitHub |
| P1 | Show five actual source states/context metrics/relationships | Source API and knowledge data, not hardcoded values; claims remain empty |
| P1 | Show route health truthfully | Operations API; `INSUFFICIENT_DATA` on stale telemetry, operator-only refresh if approved |
| P1 | Show real incidents and exact authorized case details without stale-case rendering | Incident/case endpoints; evidence reference matching, no invented link |
| P1 | Add conditional AI panel that handles absent/pending/sparse/mock outputs | Existing `ai_result` and `status`; no direct AI request from frontend |
| P1 | Keep Veriq presentation separate from Cedar Operations and clearly distinguish backend-connected synthetic vs local mock | No fraudulent "bank connected" or AI claim |
| P2 | Real institutional registration, invitation, consent, connector health/sync, generalized knowledge extraction, review decisions, reports | Requires owner-approved new backend contracts; do not implement as live now |

## Operational launch and verification checklist

1. **Before code changes:** `git fetch origin`, inspect `git status`, `git branch -vv`, `git log`, compare local commits against merged main and remote PR #6. Preserve the local Veriq/Cedar/infra/demo commits. Since PR #6 is behind main and includes Veriq files, plan a safe Cedar-only reviewable patch/PR and separate Veriq PR if required; avoid destructive reset/rebase/force-push.
2. Ensure runtime **PostgreSQL 16** is available with migrations through **0005_case_ai**, reapply explicit `infra/postgres/grant-runtime.sql` for new tables, and require backend `GET /ready` to pass. Migration and grants require explicit owner authorization and safe database backup/checks; never reset a shared DB.
3. Start the **FastAPI API at 8000** and the **separate g2 worker**. The worker is essential for durable complaint delivery and optional case-AI jobs; API startup alone is not a substitute.
4. Start the **AI service at 8001** only if explicitly opting into the optional AI demonstration. With mock provider, label output synthetic; do not expose the service key. Configure the **backend worker**, not the frontend, with `AI_ENABLED=true`, verified internal origin/trust, matching service key and supported timeout. If AI is not required or cannot be safely configured, keep disabled and show evidence/AI unavailable honestly.
5. Start all frontends and Caddy using the verified **local** routing for 8080 (customer), 8081 (operations), 8082 (Veriq). The GitHub main Caddyfile does not yet include 8082; keep the local verified config but safely commit/review it when publishing.
6. Provision customer/investigator cookies through approved private operator procedures (sessions expire after one hour) before recording, never visible in video or code. Verify both positive reads and cross-role 401/403 denials.
7. Test existing source counts, context relationships and route outcomes. `INSUFFICIENT_DATA` is an honest freshness state; run private telemetry producer only in an approved disposable demo environment and only with owner consent.
8. Test existing Ada transfer and matching complaint IDs without creating duplicate transactions; verify `RESPONSE_TIMEOUT` and `UNKNOWN`, evidence length and no automatic incident link. For **new** AI-enabled cases, wait/poll and distinguish `FINDINGS_READY` from verified conclusion; don't expect previous case to reanalyze automatically.
9. Run Cedar frontend TypeScript/lint/build, 5 dynamic regression tests, backend/AI suites (if env permits), real API authorization checks and an **authenticated browser** flow. Browser auth/click E2E has not been demonstrated by the local reports; do not claim it passed.
10. Push to a reviewed feature branch only after inspecting staged secrets, branch history, CI and teammate changes. GitHub main currently lacks the latest Veriq app and Caddy demo changes.

## Final verdict

**Backend/AI foundation:** source-confirmed, substantial and tested in documented environments. **Full local runtime:** previous Codex reports indicate a functioning three-app demo but this GitHub audit cannot inspect the user's running processes or private configuration. **Next work:** synchronize Git history and deployment revisions, verify migrations/worker, implement conditional AI data display against the existing case GET, maintain exact authorization and origin boundaries, and run one authenticated cross-app browser rehearsal.

No live model result, production bank authorization, automatic customer resolution or secure public session integration has been proved; keep these clearly labeled as future work.
