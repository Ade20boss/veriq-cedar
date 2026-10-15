# Task 006 — optional case AI orchestration

Implementation on `feat/veriq-ai-orchestration-a2`, based on main `0aa03daad28548bd84848e12fd79fe244c7f979c` after GitHub confirmed PR #5 merged. Existing checkout: `/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`. No AI-service/frontend/source-contract changes; no merge authorized. Exact feature SHA/PR is recorded in final chat and can be verified with `git rev-parse HEAD` / `git ls-remote origin refs/heads/feat/veriq-ai-orchestration-a2`.

## Implemented flow

Cedar intake and its atomic outbox remain independent of AI. Existing CASE_ANALYSIS assembles the deterministic bundle first. An AI-configured worker atomically schedules a separate CASE_AI job plus a Veriq-owned immutable input snapshot, then commits the evidence and AI_PENDING state. It uses the existing PostgreSQL Job claim, SKIP LOCKED, sixty-second default lease, owner/generation fence and bounded retry policy. No new queue, public analysis endpoint or incident-AI endpoint exists.

CASE_AI claims a stable typed snapshot in a short transaction, releases its session/row locks, invokes `POST /internal/ai/analyze-case`, then opens a new short transaction. It checks owner/generation/lease, current case/evidence revision, immutable input digest, current bundle digest and persisted bank provenance before saving a result. A superseded revision or expired lease cannot publish an old response. Concurrent/replayed job completion cannot add another accepted result. A crash can repeat a read-only AI request; exactly-once external invocation is not claimed. Only one accepted result is stored for that job/revision.

Migration `0005_case_ai` extends the existing job-subject check and adds `veriq.case_ai_runs`: bank/job/case/revision, request and bundle SHA-256 digests, immutable request JSON, accepted result, service-reported provider mode and timestamps. The input and accepted result are protected against update; the runtime role has no DELETE permission. Total domain tables33 (Veriq14, Cedar17, private2). Reapply explicit runtime grants after migration: only Veriq gets the new table. No cross-domain/private grants are added. Packages and multiple credentials within one process are not isolation from process compromise. The explicit downgrade removes AI jobs/results and clears exposed AI results, preserving deterministic bundles; use only on a disposable database, never as an automatic recovery operation.

## Exact configuration

Use existing ignored private environment files. Backend worker variables:

| Variable | Default / validation |
|---|---|
| AI_ENABLED | false |
| AI_BASE_URL | unset; HTTP(S) origin, no embedded credentials/path/query/fragment; use a trusted private service address |
| AI_SERVICE_KEY | unset; SecretStr, must match AI service INTERNAL_SERVICE_KEY |
| AI_TIMEOUT_SECONDS | 5;0.1–20seconds overall deadline |

Enabled but missing URL/key stays in deterministic mode and emits fixed AI_UNCONFIGURED. No credentials are persisted in the input snapshot or logged. No browser/public frontend environment variable contains the key. HTTPX0.28.1 moved from dev to runtime dependencies; versions otherwise unchanged,42locked packages. The client disables redirects and environment proxy inheritance, bounds request/response to262144bytes and applies an overall asyncio deadline in addition to HTTP inactivity timeouts. It runs synchronously in the standalone worker; request handlers never call or wait for it.

Install/migrate/grant using `apps/backend/README.md`, start the unchanged AI service on8001 with its existing setup and private INTERNAL_SERVICE_KEY, then:

```bash
# Run from apps/backend with private runtime database URLs and matching AI_SERVICE_KEY.
AI_ENABLED=true AI_BASE_URL=http://127.0.0.1:8001 AI_TIMEOUT_SECONDS=5 \
  uv run --locked python -m veriq_cedar.composition.g2 worker
```

The worker initializes structured logging from validated Settings. Use `LLM_PROVIDER=mock` on the AI service for an explicitly synthetic demonstration. A real provider requires the AI service's own private configuration; this task did not run a real model. The API process may run independently of AI settings; it serves stored case results with existing bank-scoped investigator authorization.

## Input and validation

Independent backend Pydantic models mirror the complete frozen v1.0 AI input/output and nested DTOs, with strict JSON types and forbidden extra fields. Canonical `contracts/openapi.yaml` is unchanged; tests validate actual request/Investigation response JSON against it. No import of `apps/ai` schemas or implementation is required at runtime.

Inputs use actual bank/case/outcome from a durable authorized CaseEvent receipt, a defined advisory question, and the persisted deterministic evidence. Sender transfer/state records must match that exact permitted receipt. Unverified CUSTOMER_REPORT remains unverified context and cannot ground an accepted finding. Metric evidence must belong to the same bank/route/service and a linked incident's persisted supporting receipt in the allowed time window/cutoff. DOCUMENTED_RELATIONSHIP evidence must match the bank's persisted edge, source checksum/locator and observed cutoff; its truth is documentation, not verified causality. Unknown/foreign evidence is rejected before the HTTP call.

Known relationships are actual relevant source-backed records in that snapshot. Historical incidents contain only the related persisted operational suspicion records available by the snapshot cutoff, with supporting evidence in the submitted bundle. They are operational history, not extracted historical-document claims. Uploaded historical_incidents.md/operations_sop.txt are still unextracted; no structured history or cause is invented from their text. Exact kinds remain TRANSFER_STATE, TRANSFER_STAGE, CUSTOMER_REPORT, ROUTE_METRIC_SNAPSHOT and DOCUMENTED_RELATIONSHIP.

On response, the backend independently requires matching case ID and unchanged Cedar-authoritative financial outcome. Every observation/hypothesis must cite nonempty eligible IDs actually submitted and verified for that purpose. Additional fields, malformed nesting, blank findings, unsupported modes and ungrounded references fail validation. Conservative independent text checks reject explicit financial finality while UNKNOWN, unsafe financial instructions and asserted verified causality/incident confirmation. These lexical checks are defense in depth, not a semantic proof of every sentence. Findings/hypotheses remain advisory and require human review; no incident, source trust or financial record is modified.

A validated provider draft is replaced with a fixed neutral UNAPPROVED draft. No customer publication code is invoked; Cedar customer_safe_updates remains empty. Mock service mode is persisted privately and labelled in the existing ai_result.unknowns array: `MOCK_PROVIDER: synthetic deterministic result; no external model called.` This preserves the frozen response shape without adding an unapproved provider metadata field. An unknown/missing X-Veriq-AI-Mode header is rejected.

## Failure and recovery

Success sets FINDINGS_READY and exposes only the approved AIInvestigationOutput within the existing Investigation. Offline, timeout,401/403,429, other non200, oversized/malformed/schema-invalid or unsafe outputs preserve the deterministic bundle and null ai_result, with EVIDENCE_READY_AI_UNAVAILABLE. Job retries are durable RETRY_WAIT with fixed safe error codes; retry claim returns AI_PENDING. Five total attempts, exponential backoff and generation fencing are retained. Exhaustion becomes DEAD_LETTER, including a crashed final lease. Fixing a transient failure permits the next due retry; a deliberate scoped maintenance requeue is required after exhaustion, preserving job/snapshot identity and monotonic generation. No automatic infinite retries or data reset.

Logs use fixed events/codes and generated job ID, attempts, generation, job state and allowlisted provider mode. Requests, responses, complaint text, service keys, database URLs and untrusted exception messages are excluded. Invalid outputs are not persisted. Already assembled cases from an AI-disabled worker are not automatically backfilled: an enabled worker schedules AI during deterministic assembly of a new evidence revision. Identical event replay remains idempotent and does not force a new analysis. No context-only rerun or new public retry endpoint was introduced.

## Verification

Final full backend run: **161passed in202.10seconds**, zero failures/errors/skips. **102tests used real PostgreSQL16.2** (30financial,18G0,23pitch,26AI orchestration,5foundation persistence);59used no database server. All123existing tests are retained, with only the authorized migration/table-count additions to exact assertions. New coverage adds26PostgreSQL/HTTP orchestration tests and12settings tests. Separately, all66unchanged AI-service tests passed in4.23seconds with one existing Starlette TestClient deprecation warning. No real model was invoked.

Ruff check and format--check passed for88Python files. `uv lock --check --offline` passed with42packages. Real migration upgrade/current/check/offline SQL, explicit role grants/private-read denial, deterministic four-act replay, repeat refusal, private staff provisioning and live backend auth/worker smoke passed. Migration autogeneration reports no new upgrade operations. All temporary PostgreSQL/HTTP/worker processes were stopped and session files removed. No Docker/Caddy/browser tests were added or claimed. Initial test import and PostgreSQL SQL-NULL/JSON-null migration issues were corrected before this final successful run; no outstanding test failure.

Artifacts: TASK_006_TEST_RESULTS.xml/OUTPUT.txt, TASK_006_AI_TEST_RESULTS.xml/OUTPUT.txt, TASK_006_CLI_SMOKE.txt and TASK_006_PITCH_REPLAY.json. Exact changed files and executed commands are in TASK_006_FILES.txt and TASK_006_COMMANDS.md. The test suite includes full financial/G0/Task005 regressions and new PostgreSQL/HTTP checks for real permitted snapshot construction, out-of-transaction network calls (independent NOWAIT lock probes), approved API exposure, safe drafts, all failure classes, stale revisions, replay/expired leases, immutable snapshots/results and controlled dead-letter recovery.

The separate cross-service smoke launches an actual backend Uvicorn API, the standalone g2 worker and the unchanged AI Uvicorn service on loopback with its deterministic mock provider. Connected mode receives a valid result through real private HTTP, persists and serves it with UNKNOWN unchanged. Unavailable mode runs without an AI listener and verifies null-result evidence remains readable. Processes and temporary grants are cleaned up. The existing four-act CLI separately runs with AI deliberately disabled and remains independent of an external model.

Focused reproduction on a fresh disposable `veriq_cedar_test_*` PostgreSQL database, from apps/backend:

```bash
uv run --locked pytest tests/test_ai_orchestration.py tests/test_ai_settings.py -q
uv run --locked pytest tests -q
# Separate unchanged service suite, from apps/ai:
../backend/.venv/bin/python -m pytest -q
```

Set TEST_DATABASE_ADMIN_URL privately before database tests. The fixtures create/migrate/grant/drop their dedicated test schemas; never target an existing development database. No SQLite is used. Without the environment, PostgreSQL tests skip; such a run is not proof of persistence correctness.

## Provider and frontend limits

Habeeb's current mock checks older kinds SENDER_DEBIT_POSTED, GATEWAY_RESPONSE_TIMEOUT and ROUTE_METRIC. We do not rename Task005 records to manufacture favorable findings. Against real Task005 kinds, the actual mock currently returns empty observations/hypotheses with uncertainty/check recommendations. The backend marks it synthetic and stores exactly that sparse valid result. Rich findings in MockTransport tests are test fixtures for validation, not results attributed to the actual service. Habeeb owns any future mock-kind compatibility or real-provider quality change; that limitation is explicitly handed off for coordination. No AI service file was edited.

Usaamah continues using `GET /v1/veriq/banks/{bankId}/cases/{caseId}` with the existing investigator cookie. Render status, unchanged financial_outcome, evidence, incident_ids and nullable ai_result. Poll while AI_PENDING; show the evidence even when EVIDENCE_READY_AI_UNAVAILABLE. FINDINGS_READY means validated advisory output, not verified cause or financial resolution. Render observations/hypotheses with their evidence references and show mock labels/unknowns. A draft is investigator-only and UNAPPROVED, never a customer notification. No new frontend path/field or browser→AI access is needed. Existing secure same-origin/cookie setup and incomplete browser login remain as documented in the pitch guide.

No real-model invocation, source extraction, financial-status reveal, customer publishing, new authentication or incident-AI integration is claimed. Stop after feature PR for technical review; no auto-merge.
