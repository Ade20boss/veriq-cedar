# Veriq + Cedar engineering rules

These instructions apply to every coding tool and all paths. The repository/specs/contracts/tests and durable handoffs govern work; conversation memory is not a substitute. Follow the current authorized task, and record conflicts rather than inventing requirements.

## Current scope

Task 004 authorizes the bounded Cedar financial G1 slice on feat/cedar-financial-core-g1 from latest main: fictional customers/accounts/reference data, balanced append-only ledger, scoped idempotent transfers, durable sender dispatch, restricted S0/S2 synthetic network, the five accepted customer endpoints, private CLI demo sessions/seed/replay, migrations/grants/tests/docs. Preserve G0 and merged AI work. Commit/push and open a PR to main after verification; do not merge. No complaints, staff, Veriq case investigations, AI calls, reveal/status-query endpoint, reversals, reconciliation, full scenario suite, frontend or proposed v1.1 API implementation. No implementation commits directly to main.

## Recover before editing

Read README.md, docs/handoffs/CURRENT_STATE.md, latest task report, relevant docs/specs, canonical contracts and ADRs. Inspect git status, diff, branch and recent commits; handle an unborn branch without assuming history exists. Confirm exact approved task, known failures and unresolved decisions. Continue the existing repository; never generate a replacement. On stopping, update CURRENT_STATE with task, branch/commit, changes, migration/seed state, exact tests/results, uncommitted state, blockers and next safe action. Do not claim tests that were not run.

## Architecture and ownership

Backend: Python 3/FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Pydantic, pytest/HTTPX. One modular Cedar/Veriq backend. AI: Habeeb's separate advisory FastAPI service. Frontend: preserve Usaamah's customer Next.js design; rebuild Cedar staff UI around bank workflows; independently authorized Veriq workbench may share staff deployment. apps/web is a legacy reservation, not final structure. Do not import source without supplied repositories and explicit migration approval. Daniel owns backend/integration; coordinate changes outside your assigned area and preserve teammate edits. Shared contracts/fixtures need affected-owner review. No unsolicited refactoring, unnecessary microservices, queues, graph DB or system-wide dependencies.

## Non-negotiable behavior

- All banks, identities, balances and metrics are synthetic; no real credentials/customer data/payments/NIBSS access.
- Money is integer kobo. Every journal has at least two balanced entries, posted atomically with transfer/balance/outbox changes. Entries are append-only; reversals are new compensating journals. Concurrent retries with one scoped idempotency key produce one intended transfer/debit.
- Processing stage and financial outcome are distinct. Debited + timeout stays UNKNOWN until eligible authorized evidence; no timeout-based failure or reversal. Conflicting evidence opens review.
- Cedar private simulator truth and recipient ledger never enter Veriq queries, AI bundles, web builds, public errors or logs. Enforce and test actual restricted PostgreSQL roles, schema grants and allowlisted export paths. One process is not isolation from full process compromise.
- Backend owns authorization, persistence, authoritative financial operations and permitted context construction. AI cannot write truth, decide credit/reversal or fetch privileged data. Validate case/source identity, schema, evidence IDs, exact quotes and unchanged input financial_outcome before accepting advice.
- Customer ownership, investigator bank scope and operator permissions are enforced server-side. No browser→AI/database access; no secrets in NEXT_PUBLIC_ variables or commits.
- Persist complaints even if AI is unavailable; preserve eligible evidence and explicit degraded investigation state.
- Claims/relationships retain source, locator, time, extraction/run provenance and separate trust status. AI suggestions remain candidates; source claims are not independently verified cause. Do not merge unknown aliases by names alone.
- Raw sources/events are immutable. Store occurred_at and observed_at; historical views cannot include later-observed knowledge. Re-ingestion/replay is idempotent.
- Detector uses exact frozen thresholds and route/time/evidence correlation; Birch wording never links it to G2 alone. One active suspected incident per signature; no invented root cause.
- One demo, two acts, same persisted Cedar context. S2 is deterministic: 5000000 kobo, Elm/G2, UNKNOWN before authorized reveal and CREDIT_CONFIRMED only via allowed status evidence. Never reset between acts or fake frontend transitions. Clearly label mocks/fallbacks and simulated metrics.

## Contract and collaboration rules

Keep original v1.0 sources unchanged. contracts/openapi.yaml governs wire shapes; contracts/demo.json governs seed truth/order. ADR-001 authorizes stack migration and local development metadata only. Preserve exact paths, field names, enums, optional/null semantics, headers and resource/array response shapes. No extra schema_version or review metadata in closed objects without accepted amendment. contracts/proposals/openapi-v1.1.proposed.yaml is a review candidate only. Gap resolutions in docs/CONTRACT_REVIEW.md require review; never treat proposed paths as live or accepted.

For changes affecting interfaces, financial outcomes, source authority, access or demo order, record old rule, proposal, reason, affected owners and tests; obtain affected-owner approval before implementing dependent changes. Do not fabricate signoff. Do not message teammates through tools without user authorization. Feature branches and focused reviewable PRs protect main; do not force-push, discard edits, merge/publish or create remotes without applicable authorization.

## Verification and handoff

Run checks appropriate to actual changes. Later implementation retains T01–T16, PostgreSQL concurrency/role checks, AI grounding/UNKNOWN checks and joint live API replay. Record environment constraints and failures honestly. Keep secrets, local environments, uploaded data and generated caches out of Git. Before stopping, inspect contract/private-truth/ownership changes and update the handoff. Task 002 backend foundation is complete. Task 004 stops after the G1 feature PR/report; further business behavior and frontend screens require a new authorized task.

## Task 001.1 binding corrections

- Operational ingestion/detection/investigation workers run independently of complaints and staff sessions. Validated anomaly creates a suspected incident and automatic durable INCIDENT investigation. Complaint intake durably triggers automatic BANK_CASE work and evidence-backed incident correlation. Sarah/Michael never gate routine initiation.
- Distinguish bank_case_id, incident_id, investigation_id, run_id and job_id. Route incident findings cannot establish any individual financial outcome. Manual verification/re-investigation/escalation/review remain permitted through authorized commands.
- Veriq core consumes bank-neutral ports only; no Cedar ORM/repository imports, direct SQL or private credential dependency. Cedar implements normalized source/event/evidence/metrics/status/case/result ports. Shared Python process is not security isolation.
- Cedar owns its operational cases, staff assignments/interactions/communications and financial truth; Veriq owns its context/incidents/investigations. Staff consumes a permitted versioned result inbox. Bank workflows survive Veriq/AI outage; customer publishing requires approval.
- Preserve customer design; rebuild staff interface from relevant workflow requirements. Old React/Vite inventories are not verified current Next.js behavior. No frontend migration or code import in this task.
- Read docs/REPOSITORY_ARCHITECTURE.md, BANK_ADAPTER_CONTRACT.md, EVENT_PROCESSING.md, FRONTEND_ALIGNMENT.md, STAFF_AND_UI_CONTRACTS.md and proposal README when continuing. Markdown is canonical; frozen source documents and canonical contracts stay unchanged.

Current scope clarification: the Cedar Operations attachment is a proposed requirements source, not authorization to build every module. Read docs/MINIMUM_DEMO_SCOPE.md from repository root for the 26-addition P0 proposal and the 13 excluded secondary operations. Canonical APIs are unchanged; Task 003 authorized internal G0; Task 004 authorizes only the G1 subset described above. The remaining P0/secondary HTTP proposals are still unapproved.
