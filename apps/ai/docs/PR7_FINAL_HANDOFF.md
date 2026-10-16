# PR #7 final AI handoff — 16 October 2026

Owner: AI service / review by Daniel. This PR changes **only apps/ai**.
It does not implement backend orchestration, database jobs, customer publication,
status authority, or the proposed A3 case-free incident endpoint. PR #8
(feat/veriq-ai-orchestration-a2) owns backend orchestration.

## Security

Live evaluator accepts **literal** http://127.0.0.1:PORT and http://[::1]:PORT
origins only. Arbitrary --url destinations, credentials in URLs, DNS hostnames
(including localhost), non-loopback interfaces and non-origin URL components are
rejected **before** reading the internal key or opening HTTP. HTTPX disables
redirect following and ambient proxy settings; health must return exactly 200.
The mode header is a mode check, not an authentication or destination trust
mechanism. Remote evaluation requires separate design/approval; no implicit
allowlist is provided. Tests include off-host redirect attempts and untrusted
--url requests; secrets must never be committed to reports.

## Task005/006 evidence shape

Review of PR #8 confirmed these actual bank-authorized kinds:
TRANSFER_STATE, TRANSFER_STAGE, ROUTE_METRIC_SNAPSHOT,
CUSTOMER_REPORT, DOCUMENTED_RELATIONSHIP.

MockProvider now understands DEBIT_POSTED and RESPONSE_TIMEOUT as bank *stages*
rather than recipient/payment finality. Matching G2 route snapshots may support
a tentative response-path hypothesis, with exact eligible evidence IDs.
Task005 metric snapshots contain attempts/timeouts only; baseline rates are
not invented. CUSTOMER_REPORT is unverified and cannot be cited as support.
DOCUMENTED_RELATIONSHIP remains topology documentation, never a verified
root cause. Unrelated Birch/G3 metrics cannot be attributed to Elm/G2.

fixtures/case_task005_shape.json is a **synthetic reconstruction** following
the actual Task005/006 bundle schema and published sample flows, not a
captured private bank/production request. The existing six-scenario acceptance
suite is unchanged; run the additional shape case explicitly.

## Actual verification evidence

From the project owner's Fedora reports *before this correction*:
- Offline six-scenario mock suite: 6 PASS.
- Whole AI suite after earlier hardening: 87 PASS, 1 dependency deprecation warning.
- Live Groq evaluator: extract_unknown_alias.json PASS HTTP 200, and
  case_unknown.json PASS HTTP 200. These are distinct single-fixture executions,
  not a six-scenario live run.
- Earlier live full evaluation: extract_incident PASS, case_unknown rejected
  AI_INVALID_OUTPUT, extract_dependency PASS, extract_unknown_alias missing
  Bluefin, extract_prompt_injection PASS, case_confirmed rate-limited.
  Both previously failing individual cases later passed after prompt changes.
- Provider quota, full live coverage, comprehensive semantic accuracy and
  actual Task006 production-like bundle/live-model behavior are NOT certified.
  No claim that Groq's recipient-status answer is bank-authoritative.

Locally reconstructed test workspace (Python 3.13, Python client without
real Groq/PostgreSQL): full regression tests PASS (76 total, including
18 security/evidence-shape tests); offline six-case evaluation 6 PASS;
Task005-shaped additional case PASS. This workspace copies source snapshots,
not the exact Fedora checkout. Fedora full pytest and Task005 case still need
independent execution on the head commit.

## Operator verification

From apps/ai:

    python -m pytest -q
    python evaluate_provider.py --mode offline --suite full
    python evaluate_provider.py --mode offline --case case_task005_shape.json

For an authorized adult Groq operator with an already provisioned private
service, restart the local AI service and run the single-fixture evaluator.
Start with the new shape fixture. Capture only the normal sanitized evaluator
report (no --save-synthetic-responses). On 429/model limit, stop and record
BLOCKED rather than repeatedly retrying. Run additional synthetic fixtures
only if quota allows. Never share the local .env, provider key or service key.

Provider mode mock remains explicitly synthetic and **not** a measured LLM
capability. AI findings are unapproved; Cedar status remains authoritative
and UNKNOWN for the S2 scenario.

## PR #8 compatibility and remaining limitations

- PR #8 uses the exact v1.0 /internal/ai/analyze-case endpoint with allowed
  evidence IDs, verified_for_purpose and permitted bank data. No new wire keys.
- The mock response now contains source-backed observations and tentative
  hypotheses instead of empty lists for the documented Task005 shape.
- Backend persistence and independent response validation in PR #8 are not
  tested by this AI-only PR. Daniel/Codex should run their own integration
  smoke and cross-service DB checks after reviewing this branch.
- No automatic publication, authorization bypass, evidence reclassification,
  financial finality inference or A3 endpoint is introduced.
