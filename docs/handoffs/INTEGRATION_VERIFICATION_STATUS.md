# Task007 integration verification — 16 October 2026

Repository `https://github.com/Ade20boss/veriq-cedar`, existing writable checkout `/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`. Branch `feat/integration-verification-a3` starts from synchronized main **7983ec8de7d9a83ee5bc4f3f7582103a369ccf08**, GitHub-confirmed merged PR#7. PR#8's implementation is canonical. PR#9 (`feat/backend-ai-case-worker`, a7a5548c3790ba708de9cecb11f9938f5aaf3dce) remained OPEN and was not incorporated. The tree was clean before branch creation. No second repository or shared-data reset.

## Narrow fix

The initial actual-service connected test failed while the offline case passed: the updated mock emits “A source-backed service relationship is documented, not a verified cause.” The backend's lexical causal check mistook the explicit denial for a confirmation, leaving the connected case degraded rather than FINDINGS_READY. `veriq/ai/safety.py` now exempts only an assertion immediately preceded by `not` with an optional article. Later affirmative statements still fail. Eight adversarial negation/affirmation examples and the actual updated mock's nonempty grounded findings are covered. No financial text validator, outcome authority, worker, contract, migration, frontend or AI source changed. Lexical checking remains defense in depth, not semantic proof.

## Executed verification

| Verification | Actual result |
| --- | --- |
| Focused real-service and negation tests | 10 passed, 193 deselected, 19.27s |
| Full backend suite | **203 passed**, 179.26s; zero failures/errors/skips |
| Database split | 104 real PostgreSQL tests; 99 non-server tests |
| Updated unchanged AI service tests | **105 passed**, 4.98s; one existing Starlette TestClient deprecation warning |
| Actual mock offline evaluator | Full six fixtures PASS; separate Task005-shape fixture PASS |
| Lint/format | Ruff passed;91 Python files formatted, including new verifier |
| Reproducible dependencies | `uv lock --check --offline`:42 packages, no dependency changes |
| Migrations/grants | Fresh native PostgreSQL16.2; upgrade through0005_case_ai, current/check, offline SQL, explicit reviewed runtime grants, private-read denials, replay refusal all passed |
| Optional live model | **SKIPPED**: no local AI dotenv or exported approved provider/key/model configuration; no Groq request made |

The real-PG failure matrix in test_ai_orchestration covers offline/timeout/overall deadline, raw401/429/503 and the actual service's503 MODEL_RATE_LIMITED /502 MODEL_AUTH_FAILED envelopes, malformed/oversized/closed-schema violations, foreign/invented/unverified-report evidence, wrong identity/outcome, unsafe financial/causal text and invalid provider mode. These injected HTTP failures use MockTransport with real persisted/granted PostgreSQL state; they are not claims of actual upstream-provider execution. The envelope fixture executes the actual unchanged AI handler/provider with upstream HTTP simulated. Tests assert unchanged deterministic evidence/UNKNOWN, no accepted AI result on failure, safe structured codes, RETRY_WAIT, bounded exhaustion/DEAD_LETTER recovery, immutable snapshots and stale revision/lease/generation rejection. Actual subprocess tests separately exercise a missing listener and actual connected mock service. No customer publication occurs.

Full suite and smoke evidence are in [task007](task007/). The XML reports identify the executed tests; no tests marked passing were skipped. Commands and runtime details follow in [TASK_007_COMMANDS.md](TASK_007_COMMANDS.md). [Pitch operator runbook](PITCH_OPERATOR_RUNBOOK.md) gives setup, exact terminals, ports and limitations.

## Frontend and environment limits

No Docker available; native PostgreSQL used on a fresh private socket/database. Docker Compose wasn't executed. Default AI port8001 already had an unrelated listener; it was left untouched. Controlled integration uses8002, backend8000, customer3000, gateway8080/8081 (Caddy admin2019). Caddy2.11.7 was obtained from its official release as a task-local executable, checked against published asset SHA256 `727b91701a392de6ebc5027509f548bf39979e5216340d0faed8fa5e69c84f8b`; no system install.

Customer frozen dependency install initially failed on network fetch, then succeeded on bounded retry; its Next16.4.0 shell returned HTTP200. Frontends were tested in temporary copies to prevent Next.js generation from changing Usaamah's files. Operations frozen install was rejected by pnpm11.25.0 release-age policy: `node-releases@2.0.59` published2026-10-15T08:10:27Z, inside its24-hour cutoff at the time. Policy was not bypassed; Operations server on3001 was **not started or verified**. Initial pnpm cache permissions were handled using task-local cache/data directories.

Usaamah's precise integration ownership:

- `apps/web/cedarBank/src/lib/api.ts`: line3 defaults to localhost4000; lines7–25 return mock sign-in, empty lists, null lookups and echoed complaint input, without HTTP. Setting a base URL cannot make these implementations live.
- `apps/web/Cedar Bank Operations Design/src/App.tsx`: local role/screen/fixture state, no backend investigator fetch/client or persisted ai_result handling. Wire the existing authenticated investigator API, cookies, polling/degraded states and synthetic/advisory findings presentation. Do not infer human approval from FINDINGS_READY.

The backend API demonstration is distinct from a working browser banking journey. No fully integrated customer/Operations browser pitch is claimed. Production login/session issuance, process supervision, deployment/egress hardening, source extraction and semantic model-quality evaluation remain outside this task. A successful mock or one future live request cannot establish causality or financial finality.

## Actual separate-process result

The final verifier passed with fresh PostgreSQL, API8000, standalone G1/G2, updated actual AI mock8002 and the unchanged Caddy gateway. Five persisted sources (three PARSED, two UPLOADED/unextracted), seven entities, ten documented relationships; G2 DEGRADED incident before complaint, G3 NORMAL. One balanced5000000kobo debit, RESPONSE_TIMEOUT and UNKNOWN. Disabled case176e885b-04e9-437d-b27c-496521c6f317 retained deterministic evidence with null ai_result.

Fresh HTTP complaint case **f0f0fb48-aa59-44ba-bad4-d388abc8781b**, investigationdcf6be26-12e4-4af3-a662-1245e0240fbe, CASE_AI job3601a342-2307-4679-92fa-333d4f5d36d0, run159af68e-1722-44bf-8022-a1b00b35efa2, revision1. Polling observed REQUESTED→AI_PENDING→EVIDENCE_READY_AI_UNAVAILABLE→FINDINGS_READY. Offline first attempt persisted AI_UNAVAILABLE/RETRY_WAIT/attempt1/generation1; starting actual mock AI recovered automatically to SUCCEEDED on attempt2, with no manual investigation request.

Actual result: **9 observations,1 tentative hypothesis,2 unknowns,1 recommended check**, explicit MOCK_PROVIDER label and private provider_mode=mock. Thirteen actual persisted evidence records cover TRANSFER_STATE, TRANSFER_STAGE, CUSTOMER_REPORT (unverified, never cited as an accepted fact), ROUTE_METRIC_SNAPSHOT and DOCUMENTED_RELATIONSHIP. Accepted citations belonged to eligible submitted evidence; request evidence matched the persisted case evidence exactly; durable result equalled existing case GET ai_result. Sanitized source/evidence IDs and request digest are in [runtime-result.json](task007/runtime-result.json); no reports, raw findings, private simulator truth, URLs with credentials or service keys are included.

Customer complaint delivery SUCCEEDED; customer_safe_updates remained empty and financial_outcome UNKNOWN. Anonymous investigator access401 and customer-cookie investigator access403. Both gateway readiness routes passed; authenticated gateway investigator result matched durable ai_result, and customer frontend shell through8080 returned200. Both workers remained alive through completion. Verifier stopped its API/workers/mock AI/Caddy, removed private temporary session files/logs, and the wrapper stopped its PG cluster/socket. Database test evidence remains disposable; do not mistake expired test session rows for production session management. Operations frontend and live Groq remain the explicit unverified items above.

Next safe action: review this focused feature PR; do not auto-merge. Usaamah should resolve the dependency-policy/install issue and wire existing customer/Operations APIs in his own branch. A separately approved live-provider evaluation can follow when protected configuration/quota is available. Resume by reading AGENTS.md/current state/this handoff/runbook, checking branch/status/origin/PR, then using the existing verified checkout and private configuration.

The final repeated standalone replay also restricts the AI child environment to private AI configuration and standard process variables, and the gateway to standard process/XDG variables. Neither receives bank database URLs. This is verification-process credential hygiene, not a claim of production process isolation.

## Task007 follow-up: Habeeb's verification and exact request

Habeeb's updated-main checkout passed backend dependency installation and91non-PostgreSQL tests, with104PostgreSQL tests deselected. Docker/private DB configuration was absent there: those DB checks were not run, and no DB integration failure was reported. Main still has the pre-PR#10 empty observation/hypothesis assertions until review/merge. The same PR#10 branch retains their correction and now verifies exact supported evidence, not merely nonempty output.

The fresh real-PG connected/disconnected smoke passed2tests/201deselected in11.87s. Actual eligible observations cover documented source relationships, sender debit, transfer/gateway timeouts and matching G2 telemetry; hypotheses must cite the same-route timeout/metric with alternatives. The test verifies canonical route ROUTE-CED-ELM-G2 (not the telemetry label elm_g2), G2 service, suspected incident/evidence references, persisted immutable request/result versus existing investigator GET, neutral draft/no publication and explicit rejection of fabricated recipient-credit prose or CREDIT_CONFIRMED. Disconnected null-result/AI_UNAVAILABLE/RETRY_WAIT coverage is unchanged.

A fresh separate-process export created synthetic S2 caseeb83cd1f-9929-443a-a0f3-75b5155035e8, automatically recovering after an actual missing AI listener on attempt2. Its exact bank-authorized v1.0 request is [s2-ai-request.v1.json](task007/s2-ai-request.v1.json), with [snapshot/file digests and provenance](task007/s2-ai-request.provenance.json) and [sanitized runtime results](task007/request-export-runtime.json). Canonical schema/independent DTO validation and matching immutable snapshot digest passed. Genuine IDs/flags/citations/relationships/incident context remain unchanged; the only report is literal synthetic verifier input flagged unverified. Credentials and simulator truth are excluded. Re-submission to the actual merged AI mock via TestClient returned200 and passed independent backend validation:9observations/1hypothesis/2unknowns/1check, UNKNOWN. The actual prose/citations were inspected; no Groq call or AI-quality certification is claimed.

[Habeeb's handoff](task007/S2_AI_EVALUATION_HANDOFF.md) explains how to use the self-contained exported body with mock and his approved Groq configuration without a local PostgreSQL installation. Existing AI service/evaluator/fixtures, production worker/persistence, financial logic, migrations and contracts were not changed. Optional snapshot export was added only to the existing disposable verification script, refusing overwrite. Continue on the same feature PR; do not modify PR#9 or auto-merge.

Final follow-up regression: `python3 work/task007-review/run_tests.py -q` passed **203 tests in157.04s** (104realPostgreSQL/99non-server; zero failures/errors/skips). Migration upgrade/current/check/offlineSQL, reviewed grants/private denials, disabled four-act replay/refusal/telemetry/auth/worker smoke passed again. Ruff check/format91files and git diff--check passed. Evidence: `task007/review-backend-tests.xml`, `.txt`, `review-focused-tests.xml`, `.txt`, and `review-migration-grant-smoke.txt`. This follow-up changes only tests, the existing disposable verifier's optional snapshot export and handoff artifacts/docs; no production application logic. Same PR#10, normal follow-up push, no automatic merge; exact SHA in final publication response/Git history.
