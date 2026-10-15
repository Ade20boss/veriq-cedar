# Integrated pitch backend — actual status

15 October 2026; pitch 16 October morning. **P0 implemented and tested.** Deterministic source parsing, proactive G0, Cedar S2 and automatic evidence-backed case investigation work together against PostgreSQL. AI extraction/analysis and later status reveal are **not integrated**. Do not claim those features or verified causality in the pitch.

## Git and environment

Existing checkout: /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. Origin https://github.com/Ade20boss/veriq-cedar.git. Branch feat/pitch-backend-g2 from main bf9eced36ea02f8f3d38d9e6eb4d65246643ea4a after GitHub confirmed PR1/G0, PR2/AI, PR4/frontend and PR3/G1 merged. No stacked dependency or automatic merge. Final chat records exact feature SHA/PR; use git rev-parse HEAD and git ls-remote origin refs/heads/feat/pitch-backend-g2 to verify. Frontend and AI implementations, original contracts/specs and migrations0001–0003 are unchanged.

Python3.12.14/FastAPI/SQLAlchemy/Alembic/PostgreSQL retained. Added pinned python-multipart0.0.32 runtime; PyYAML6.0.3/jsonschema4.26.0 dev dependencies for actual contract validation; uv.lock now42packages. No new queue, framework or graph database.

## Functional endpoints

All paths below use the accepted contracts/openapi.yaml shapes. Backend localhost:8000; use same-origin relative URLs through the local proxy for browsers. Customer and investigator have **separate opaque tokens** despite the frozen cookie name cedar_demo_session.

| Method / path | Authorization | Actual response / behavior |
|---|---|---|
| GET /v1/cedar/accounts/me | Customer | Account, owned NGN balance |
| GET /v1/cedar/banks | Customer | Bank[] fictional reference data |
| POST /v1/cedar/name-enquiries | Customer | NameEnquiryResult, 200 |
| POST /v1/cedar/transfers | Customer | Transfer, 201; Idempotency-Key >=8 chars; G1 retained |
| GET /v1/cedar/transfers/{transferId} | Owner | Transfer current known state |
| POST /v1/cedar/complaints | Customer/transfer owner | Complaint, 201; atomically stored with durable outbox, no Veriq/AI call |
| GET /v1/cedar/complaints/{caseId} | Owner | Complaint, 200; OPEN, empty safe updates, never invented financial conclusion |
| GET /v1/veriq/banks/{bankId}/operations | Bank investigator | RouteHealth[] from latest G0 receipts; stale/undersampled => INSUFFICIENT_DATA |
| GET /v1/veriq/banks/{bankId}/incidents | Bank investigator | Incident[] persisted SUSPECTED records and evidence IDs |
| GET /v1/veriq/banks/{bankId}/incidents/{incidentId} | Bank investigator | Incident, 200; linked case IDs from actual investigations |
| GET /v1/veriq/banks/{bankId}/cases/{caseId} | Bank investigator | Investigation, 200; caller-authoritative financial outcome, actual evidence, ai_result=null |
| POST /v1/veriq/banks/{bankId}/cases/{caseId}/investigate | Bank investigator | ActionAccepted {id,status}, 202; refresh/coalesce bank projection; never required for first investigation |
| POST /v1/veriq/banks/{bankId}/sources | Bank investigator | Multipart file + source_kind; SourceRegistration, 202 |
| GET /v1/veriq/banks/{bankId}/sources | Bank investigator | SourceListItem[]; checksum included |
| GET /v1/veriq/banks/{bankId}/context | Bank investigator | ContextSummary actual DB counts/version/time |
| GET /v1/veriq/banks/{bankId}/relationships | Bank investigator | KnowledgeRelationship[] DOCUMENTED, source/evidence-backed |
| GET /v1/veriq/banks/{bankId}/sources/{sourceId}/claims | Bank investigator | AIClaim[] currently empty: no AI extraction was called |

Health/readiness/generated route metadata remain /health, /ready, /infra/openapi.json. No public session minting, staff operations, assertion/case approval, source download, operator reveal or v1.1 endpoints. All17business operation IDs and multipart request metadata were checked against the frozen contract. Missing investigator cookie401; customer/foreign-bank token403 on Veriq; cross-owner case/transfer404. Case read is404 until outbox acceptance completes; keep the G2 worker running and poll rather than fabricating a card. POST JSON/same-origin checks remain; source POST uses bounded multipart and origin check. Responses no-store.

## PostgreSQL-backed features and authority

Migration0004_pitch_g2 adds Cedar complaints/complaint_outbox and Veriq investigator_sessions, case_event_receipts, case_investigations, context_versions, knowledge_sources/entities/relationships. Nine new tables; total32. G0 job table is extended with a distinct nullable case subject FK and an exclusive subject/kind check. CASE_ANALYSIS uses the existing Worker claim, lease/generation fencing, bounded retry and stale-revision checks. No second analysis job engine. Explicit grants preserve domain separation: no Veriq Cedar/private SQL access and no investigator session minting at runtime. Original source bytes/checksum/identity, complaint facts/outbox originals and case receipts are protected against mutation; delivery cursors alone update.

Complaint intake commits independently of Veriq/AI. Sender dispatch is at least once with queued/retry/expired leases; receiver deduplicates bank/event identity using canonical JSON fingerprint. Same ID/different content is rejected. Case UUID differs from internal investigation UUID and operational incident UUID. Authorized Cedar adapter exports only current sender state, immutable stage events, exact route/service, times and customer report (unverified report). Core Veriq imports no Cedar ORM/repository and cannot query private data. The raw permitted case projection is durable; job retries do not lose evidence.

Automatic investigation preserves Cedar financial_outcome. Correlation requires same bank/route/service, an actual supporting G0 incident receipt, and transfer time in that five-minute metric window or the following five minutes; receipt must have been observed by the case snapshot. This narrow demo correlation policy is recorded, not a causal conclusion. Birch wording never links G3 to G2. Institutional relationship evidence includes source ID/locator/SHA provenance and observed cutoff. AI disabled yields EVIDENCE_READY_AI_UNAVAILABLE and ai_result=null; no customer communications are published.

Sources: exact five fixtures in fixtures/onboarding. Upload **services.json first**, then dependencies.csv, routes.json, historical_incidents.md, operations_sop.txt. Structured files use the documented small JSON/CSV shapes in those real files. Dependencies/routes require registered endpoints. Source originals are stored as bounded UTF-8 bytes with SHA256, identity, bank, timestamp and durable parser-job ID/state. Deterministic parsing completes transactionally; a bad structured source remains FAILED with no partial context. Identical bank+filename+kind+checksum returns the original source/job/version, not duplicate edges. A rejected malformed file needs corrected content/new checksum; automatic retry after later inventory is not implemented.

Unstructured originals remain UPLOADED with internal AI_UNAVAILABLE state and method NONE; claims/counts are not faked. Relationship trust is DOCUMENTED, not VERIFIED. Context version/counts are actual persisted state: the pitch obtains five sources, seven entities, ten documented relationships, version5 and zero verified claims. Maximum file262144bytes; total multipart280000bytes, one file/one source_kind field. Only the five named UTF-8 adapters are implemented; no PDF/OCR, prior_complaints.csv or baseline_metrics.jsonl import yet.

## PR #5 review corrections

The reviewed dependency adapter now accepts only `USES` (BANK → SERVICE) and `CONNECTS_TO` (SERVICE → BANK). The route adapter alone emits `ORIGINATES_AT` (ROUTE → BANK), `USES` (ROUTE → SERVICE) and `DESTINATION` (ROUTE → BANK). Inventory and unstructured adapters cannot emit relationships. Unsupported types, case variants, `CAUSED_BY`, route-only types in dependency CSV, missing endpoints and wrong endpoint kinds fail the entire structured parse savepoint. The original/checksum/FAILED parser record remains durable; no partial entities/relationships are accepted and prior context is preserved. All accepted topology remains DOCUMENTED with original source provenance. This tightens the deterministic adapters without changing the v1.0 wire contract or asserting causality.

Complaint delivery emits JSON `complaint_delivery.completed` records after the state transaction commits. Allowed fields are generated delivery ID, generation, attempt count, delivery state and a fixed error code. Classification uses exception types only: `DELIVERY_DATABASE_ERROR`, `DELIVERY_TIMEOUT`, `DELIVERY_UNAVAILABLE`, `DELIVERY_FORBIDDEN`, `DELIVERY_REJECTED`, or `DELIVERY_UNEXPECTED_ERROR`. Exception messages, tracebacks, reports, payloads, secrets and DSNs are never included. Retry logs are WARNING; terminal DEAD_LETTER logs are ERROR. An exhausted crashed lease logs `ATTEMPTS_EXHAUSTED`; a stale completion logs `STALE_ACK` rather than claiming it changed state. Retain these logs: classifications are log diagnostics, not a new database column; outbox state/attempts/generation remain durable and join to logs by delivery ID.

The existing five-attempt budget, exponential backoff, sixty-second leases and generation fencing remain. Fixing an outage allows the next due retry to succeed; DEAD_LETTER does not restart automatically. Deliberate administrator maintenance may requeue a single bank-scoped dead-letter delivery with a fresh bounded attempt budget after correcting its cause, preserving its event ID/payload and generation. The recovery test exercises that controlled metadata change, including receiver-commit/ack-loss deduplication; no new public recovery endpoint or automatic unbounded replay was introduced. No migration or grant change is needed for these corrections.

## Run tonight

Use apps/backend/README.md for uv bootstrap and ignored local environment files. From apps/backend:

```bash
uv sync --locked
uv run --locked alembic upgrade head
```

Then reapply infra/postgres/grant-runtime.sql as the database administrator with the existing explicit cedar_role/veriq_role/simulator_role variables (full Compose command is in the backend README). Runtime URLs must use their restricted roles; MIGRATION_DATABASE_URL is private CLI/migration only. Docker remains unavailable in this execution environment; tests used isolated native PostgreSQL16.2, not SQLite. Compose config is preserved but not daemon-tested here.

On a **fresh disposable migrated/granted** database, one command executes all four acts:

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 replay
```

It refuses existing source/metric/transfer state and never resets arbitrary data. It privately seeds Ada10000000kobo/S2, provisions temporary customer/staff sessions, uses actual multipart/HTTP handlers and neutral worker, asserts results and removes replay sessions. Resulting demo data remains. Actual run output is TASK_005_PITCH_REPLAY.json; identifiers are generated real DB records, not hardcoded live IDs.

Interactive API and background work, each a separate process:

```bash
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
uv run --locked python -m veriq_cedar.composition.g2 worker
uv run --locked python -m veriq_cedar.composition.g1 worker
```

G2 worker dispatches complaints and processes incident/case/status jobs automatically. G1 worker recovers interrupted payment dispatch. G0 telemetry producer remains its existing synthetic adapter; replay ingests it automatically. No investigate button or staff session gates the workers.

Provision interactive disposable identities locally (private admin URL, ENVIRONMENT=test):

```bash
uv run --locked python -m veriq_cedar.composition.g1 seed --scenario S2
uv run --locked python -m veriq_cedar.composition.g1 mint-session --customer CED-CUST-001 --cookie-file /tmp/ada.session.json
uv run --locked python -m veriq_cedar.composition.g2 staff-session --cookie-file /tmp/investigator.session.json
```

Files are exclusive mode0600, Git-ignored *.session.json; tokens expire after one hour. Never paste them into chat, source or NEXT_PUBLIC variables. Do not reuse the customer's token for staff. There is no complete login/refresh/revocation journey; this private local provisioning is intentional limited demo auth.

## Usaamah: wiring instructions

Frontend implementation is untouched. Existing apps are apps/web/cedarBank and apps/web/Cedar Bank Operations Design. Run customer Next dev on3000 and staff on3001 using their existing scripts. Optional external Caddy arrangement: `caddy run --config infra/pitch/Caddyfile` from repository root; customer browser http://localhost:8080 and staff http://localhost:8081. Both proxy /v1/*, /infra/*, /health and /ready to backend8000, other paths to their own frontend. Default Host is preserved, so existing origin checks can succeed without CORS/auth bypass. The Caddy config is supplied but Caddy/frontends were **not launched or browser-tested** in this backend task.

Use **relative** /v1/... fetch URLs with credentials:'same-origin'. Do not call backend8000 directly from frontend3000 or call AI/database from the browser. Install the privately provisioned cookie using local browser developer tools (not public JS/session endpoints): customer token with Path=/v1/cedar, staff token with Path=/v1/veriq, same frozen name cedar_demo_session. Use SameSite=Strict and HttpOnly where supported; production requires HTTPS/Secure and a reviewed server login. Distinct cookie paths let customer/staff tokens coexist; alternatively use isolated browser profiles. This manual step means the frontend authentication journey is not finished.

Request examples (IDs come from real previous responses/replay):

```json
{"bank_id":"ELM","account_id":"ELM-ACC-009"}
```

POST name-enquiries returns {bank_id,account_id,beneficiary_name,verified_in_simulation}. POST transfers with Idempotency-Key and:

```json
{"beneficiary_bank_id":"ELM","beneficiary_account_id":"ELM-ACC-009","amount_kobo":5000000}
```

Transfer success fields are exactly {id,reference,amount_kobo,beneficiary_bank_id,beneficiary_account_id,processing_stage,financial_outcome,last_evidence_id,created_at,updated_at}. For S2 display RESPONSE_TIMEOUT/UNKNOWN; never show failure/reversal or confirmed credit. POST complaints body is {"transfer_id": returnedTransfer.id,"description":"My fictional transfer timed out; please investigate."}. Complaint result is exactly {id,reference,transfer_id,customer_report,status,customer_safe_updates,created_at}. Use that returned id as caseId; never substitute incident/investigation IDs.

For uploads use FormData with file and source_kind='PITCH_FIXTURE'; let the browser set the multipart Content-Type boundary. SourceRegistration returns {source_id,status,job_id}. GET case returns {case_id,status,financial_outcome,evidence,incident_ids,ai_result}; evidence has the exact EvidenceRecord fields in the canonical contract, ai_result is null. GET operations example from the real replay: {route_id:'ROUTE-CED-ELM-G2',service_id:'G2',window_attempts:25,window_timeouts:7,baseline_attempts:100,baseline_timeouts:2,status:'DEGRADED'}. Birch returns G3/25/1/100/2/NORMAL. Actual full JSON response examples are in TASK_005_PITCH_REPLAY.json and the frozen schema file. Show unavailable AI and raw-document pending status, not generated narratives.

## Actual verification and disclosures

120 backend tests passed in71.66seconds (75real PostgreSQL,45non-server), including all100 original PR tests plus20 review regressions (13 PostgreSQL and7 fixed-classification unit tests); no failures/errors/skips. New tests exercise all new response DTOs against accepted OpenAPI, real operational projections, bank/customer staff separation, complaint offline persistence/ownership, automatic case work, concurrent replay dedupe, expiry/recovery/fencing, G2 temporal/route correlation, Birch rejection, UNKNOWN, provenance, source checksum/upload bounds/parse rollback/dedup/context and unstructured non-extraction. Prior exact route/table assertions were extended only for authorized additions; proactive-before-complaint now asserts zero complaint rows, not table absence. Existing financial/private-role checks remain intact.

Separate unchanged AI suite rerun after corrections:66passed in3.02seconds, one existing Starlette TestClient deprecation warning, run from apps/ai using backend Python -m pytest. No backend AI integration is inferred from passing those tests. Review corrections were verified by the full suite, including adversarial adapter semantics/atomic rollback, safe classified retry/dead-letter logs, bounded recovery and stale-sender fencing; full four-act smoke repeated successfully. Migration upgrade/current/check/offline SQL and explicit role scripts passed. Live Uvicorn ready/auth/read projection and private investigator CLI/worker startup passed. All temporary PostgreSQL/Uvicorn/workers stopped and private cookie files deleted. Ruff check/format80 Python files and uv lock check passed.

Known gaps: no extraction/analyze-case integration or AI result storage; no P1 financial status verification/reveal; no human approvals/customer publishing; no staff operations/case assignment; no production auth/RLS/process isolation/supervision; manual browser-cookie wiring not complete UI integration. Case reanalysis coalesces unchanged bank projections; context-only refresh/AI rerun is not implemented. Two source documents remain unextracted; no historical cause is verified. Customer complaint stays OPEN with no automatic customer message. Do not pitch a resolved transfer or live AI inference. Migration downgrade removes G2 data/case jobs; use only disposable databases, never automatic production recovery.

## Pitch order

1. Upload the five actual files; query version5/seven entities/ten documented edges and show Cedar→G2→Elm provenance.
2. Start the existing metric adapter; show G2 degradation/SUSPECTED incident and normal G3 before any complaint.
3. Ada transfers5000000kobo to Elm; one balanced debit, balance5000000, RESPONSE_TIMEOUT/UNKNOWN.
4. Register complaint; show durable customer-owned record and automatically created, distinct Veriq case investigation with13 evidence references, supported G2 link, UNKNOWN and explicit AI unavailable.

Stop after feature PR for review. No source/API proposal files were approved or rewritten. Next separate authorized task should wire the secure frontend journey and/or validated private AI integration; later reveal requires authoritative banking evidence, never an inferred frontend transition.

For an interactive frontend ACT II on an already seeded/onboarded database, emit a fresh permitted synthetic metric batch without resetting anything (from apps/backend): `ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g2 telemetry`. Keep g2 worker running. The detector automatically creates/reuses the G2 incident; this command supplies telemetry, not a manually inserted incident or staff investigation trigger. Metrics age truthfully: after ten minutes the operations endpoint reports INSUFFICIENT_DATA; emit another batch near the pitch rather than displaying stale data as current. This is a one-shot fictional source, not a continuous production monitor.
