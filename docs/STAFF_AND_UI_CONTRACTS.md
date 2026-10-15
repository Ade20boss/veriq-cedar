# Proposed staff and UI integration contract

Task 001.1 design proposal. The minimum review candidate is contracts/proposals/openapi-v1.1.proposed.yaml. A separately labelled secondary preview contains optional additions; the route tables below inventory both. docs/MINIMUM_DEMO_SCOPE.md and PRIORITY_MATRIX.json identify which routes are actually in the 26-addition P0 recommendation. Baseline customer and Veriq APIs remain accepted references. New routes and common error/CSRF amendments are proposed only. Cedar operations works independently of Veriq; automatic investigation is a backend responsibility.

## Authentication and scope

Proposed POST /v1/auth/sessions accepts demo_actor_id and demo_secret, returning SessionView with identity, bank, server-mapped roles/department/permissions, expiry and CSRF token, and setting the existing cedar_demo_session cookie. No client-selected role or bank grants. Demo credentials are local synthetic fixture configuration, never real bank credentials or committed secrets. GET /v1/auth/session returns current session/CSRF; DELETE revokes and clears it. All responses use Cache-Control:no-store. Proposed fixed session TTL is 8 hours, no silent privilege renewal; role revocation invalidates session server-side. Exact fixture credentials/lifetime policy need review.

Cookie: HttpOnly, SameSite=Lax, Secure except explicit local HTTP, Path=/, no Domain override by default. Prefer per-frontend same-origin proxy to backend with deliberate host/cookie routing; do not rely on cookies isolating different localhost ports. Permit only explicit customer/staff origins and credentialed CORS where needed, never wildcard origins. JSON-only login plus exact Origin checking prevents login cross-site request forgery; authenticated browser mutations require session-bound X-CSRF-Token and Origin checks. This includes legacy mutations only in the proposed draft. Same staff cookie does not imply Veriq permission. No browser adapter/AI key.

| Persona (illustrative) | Proposed permissions | Limits |
|---|---|---|
| Ada/customer | authenticated CUSTOMER self-service | own account/transfers/cases; no staff/Veriq/operator routes |
| Bob/branch support | cedar.customer.read, cedar.transactions.read, cedar.cases.read/create/update | scoped branch/customer lookup/intake/interactions; no broad Veriq access |
| Sarah/digital support | same support rights; communications.publish if explicitly granted | own department queues and approved customer updates; escalates existing work, cannot approve Veriq findings by support role alone |
| Michael/payment analyst + investigator | bank inquiry/case rights plus veriq.read/review/verify when granted | separate Veriq membership required; cannot set outcomes or post reversals through review |
| Grace/supervisor | cedar.cases.assign and permitted case/publication rights | assigns/escalates; no financial evidence mutation or automatic access to all workbench evidence |
| Demo operator | demo.operate | seed/replay/arm/reveal only in synthetic mode; no customer role masquerade |

These are proposed capability mappings, not asserted staff accounts. Backend checks bank/department/customer/purpose scope on every lookup; customer-only endpoints require CUSTOMER identity even if a staff session is present. Existing Veriq reviews also need explicit review permission and operator endpoints demo.operate. Do not rely solely on operation tags or navigation hiding. Read access is audited. Out-of-scope IDs return 404; invalid/absent session 401; authenticated wrong role/CSRF/origin 403.

## Minimal Cedar APIs

All paths below are proposed additions; rows for customer lists/timeline/history, formal resolution, result-detail and integration-health are SECONDARY. Other staff rows are P0. Paths use `/v1/cedar/staff` unless stated. Existing customer create/get complaint and transfer endpoints stay intact.

| Need | Proposed route(s) and behavior |
|---|---|
| Customer history/cases | GET /v1/cedar/transfers and GET /v1/cedar/complaints; cursor pages and own records only |
| Safe transaction history | GET /v1/cedar/transfers/{transferId}/timeline; safe observed events with factual outcome at observation |
| Customer communications | GET /v1/cedar/complaints/{caseId}/communications; only published records |
| Customer lookup/360 | GET /customers?q=... and GET /customers/{customerId}; masked search plus authorized synthetic profile/account summaries, use transaction/case filters for history |
| Transaction inquiry/exceptions | GET /transactions with bounded reference/customer/date/outcome filters; GET /transactions/{transferId} returns transfer + permitted sender evidence/route/case/investigation refs; UNKNOWN filter is the minimal exception queue |
| Case queues/intake | GET /cases with status/assignee/department/customer/transfer filters; POST /cases persists branch/phone/support case plus durable event and returns StaffCase |
| Case detail/history | GET /cases/{bankCaseId}, GET /cases/{bankCaseId}/activity; activity includes actor/action/reason/evidence/audit reference |
| Interactions | POST /cases/{bankCaseId}/interactions; append note/channel to an existing bank case, with audited version check |
| Assignment/escalation | POST /cases/{bankCaseId}/assignment or /escalations; scoped permitted actor/department, reason and expected_version |
| Communication workflow | GET/POST /cases/{bankCaseId}/communications; POST .../{communicationId}/publish validates evidence and human permission, audits approval/publication |
| Resolution | POST /cases/{bankCaseId}/resolution; eligible evidence and reason required, no financial mutation; UNKNOWN financial dispute cannot be closed as confirmed success/failure |
| Veriq status/results | GET /investigation-results (including incident-first records without cases), GET /investigation-results/{investigationId}; bank-owned permitted inbox projection |
| Connector health | GET /integration-health; last event/result and pending/failed deliveries, no secrets |

Do not add a separate Start Investigation requirement to case intake or case detail. Existing Veriq POST .../cases/{caseId}/investigate remains an optional manual re-investigation compatibility route, returning its legacy ActionAccepted shape. New stable-ID manual run endpoint is below. A Cedar support user needing specialist work assigns/escalates; Michael's authorized action is review or additional verification. New cases always emit the automatic trigger independently of that handoff.

Cedar owns customer/staff complaint records. `bank_case_id == Complaint.id == legacy {caseId}` is the explicit mapping; no use of a Veriq investigation ID as a bank case ID. StaffCase contains the baseline Complaint under complaint plus routing/version/integration projection. Customer and staff must retrieve the same persisted record. `Transfer.id` maps to adapter bank_transaction_id; source/export IDs retain stable mapping. Veriq generates independent investigation_id, run_id, incident_id and job_id. Legacy GET Veriq .../cases/{caseId} projects the latest primary case investigation into its existing Investigation response and never returns a route investigation in its place.

## Veriq queue and knowledge additions

| Need | Proposed routes under /v1/veriq/banks/{bankId} |
|---|---|
| Automatically created work | GET /investigations filtered by subject_type/origin/case/incident/status and GET /investigations/{investigationId} |
| Optional re-investigation (SECONDARY new endpoint; legacy route remains) | POST /investigations/{investigationId}/runs; reason, expected_version and idempotency; returns 202 with investigation/run/job IDs |
| Human review | POST /investigations/{investigationId}/reviews; APPROVE_ADVISORY_FINDINGS, REJECT or REQUEST_MORE_EVIDENCE; never payment finality |
| Verification | GET/POST /investigations/{investigationId}/verification-requests; bank transaction + TRANSACTION_STATUS, reason, expected version; policy-authorized asynchronous receipt |
| Durable job progress (SECONDARY; P0 polls investigation status) | GET /jobs/{jobId}; sanitized state/attempt/error code only |
| Entities/labels | GET /entities with cursor/query/type; label, aliases, source/evidence refs; existing /relationships continues as typed edges |
| Source progress (SECONDARY; P0 polls source list) | GET /sources/{sourceId}/jobs/{jobId}; source/job ownership and permission checked |
| Persisted assertions | GET /assertions?source_id=...&status=...; separate AssertionView with assertion_id, raw claim, persisted trust/relation status, evidence/provenance/run metadata |
| Chunks/provenance (SECONDARY HTTP; typed port is P0) | GET /sources/{sourceId}/chunks; immutable source/chunk IDs, exact text, line interval/checksum/locator |

Existing source /claims stays AIClaim[]; do not alter the closed AIClaim shape to make the review UI work. Existing assertion review uses new AssertionView.assertion_id; source_claim_id preserves extraction-local identity. Existing relationship IDs resolve via KnowledgeEntityView.entity_id. Candidate entities with unresolved identity are not silently merged.

## Bank result delivery and UI behavior

A trusted in-process adapter implements typed delivery; secondary proposed private HTTP transport is POST /internal/cedar/banks/{bankId}/investigation-results. Authenticate a bank/purpose-scoped X-Bank-Adapter-Key; validate payload/approval scope, persist bank inbox then ack delivery_id/revision/status. Browser clients never call it. Incoming stale revisions are ignored with a receipt, not overwritten; differing content for one delivery ID is a 409 conflict. Result fields include distinct IDs, original trigger, initiation time, lifecycle/review state, evidence refs/gaps, reviewed approved_findings and synchronization state/time. They do not contain arbitrary internal prompts or private evidence.

Status/evidence-only progress is delivered before approval. Findings appear in approved_findings only after valid human review and permission filtering; customer_safe_update_draft is not a published bank message. Cedar staff APIs read the inbox even when Veriq is temporarily unreachable. Redelivery and failed synchronization are visible. Backend-authoritative financial outcome still comes from Cedar transaction inquiry, not the result envelope. Staff UI reads both without inferring causation.

Poll active lists/details at 1–2 seconds with backoff and last-sync indicators for the demo. Automatic worker jobs are independent of polling. Workbench links use a known authorized investigation ID and reauthorize on navigation; no arbitrary external link execution. Show an unknown/degraded integration state distinctly from an empty queue.

## Precise provenance and AI coordination

Canonical proposed chunk locator is the exact chunk_id string `{source_id}:chunk:{zero-padded-index}`. Stable indexing applies only within one immutable source checksum; changed source content gets a new source/version identity and never reuses old chunk IDs. SourceChunk records original line_start/line_end and chunk checksum; operational source_locator is `record:{source_record_id}` and chunk_id is null. AI output source_locator must match a supplied chunk_id and quoted_evidence must be an exact nonempty substring of that chunk. Preserve original UTF-8 text/line endings in stored source; record normalization if parsing creates a derivative. Existing historical example locators are not silently reinterpreted as new sources.

Backend attaches bank/source/run/actor/checksum/time/access policy and computes an evidence-bundle digest. Model run identifiers remain backend metadata rather than extra keys in old AI outputs. Source evidence is proof of what the source says, not automatically verified bank fact. NormalizedEvidence wraps unchanged EvidenceRecord plus provenance; AI receives only eligible record fields and the backend retains the wrapper. Financial verification also requires source type/purpose/semantic eligibility, not just verified_for_purpose=true.

Proposed POST /internal/ai/analyze-incident adds case-free AIIncidentInput/Output; it has no case_id or route financial_outcome. Four legacy case/extraction root schemas remain unchanged. Habeeb must review this new endpoint, evidence subset and source locator convention. If incident AI is unavailable, automatic evidence investigation proceeds and reports degraded state. No hidden case creation or fake IDs to fit analyze-case.

## Mutation, errors and deferred scope

New staff/manual mutations require Idempotency-Key (minimum 8), resource version and reason where specified, with idempotency scoped by bank/actor/operation/key and request digest. Same request returns stored receipt; different request under same key is 409. Event/delivery ports deduplicate their envelope IDs independent of HTTP retries. Version conflicts return 409; no blind overwrites.

Error body is the existing `{error:{code,message}}`; validation uses 422 with field errors described safely in message until a versioned extension is approved. 400 malformed input, 401 session/key failure, 403 role/purpose/origin/CSRF, 404 absent/out-of-scope, 409 state/idempotency/version conflict, 503 unavailable dependency. Successful durable intake returns 201/202 even if later analysis is unavailable. Retry/dead-letter state belongs in persisted progress, never falsely in a successful financial outcome. No general-purpose set-outcome endpoint exists.

All new list endpoints use bounded cursor pages `{items,next_cursor}`, stable ordering and snapshot-aware opaque cursors. Staff/filter authorization is evaluated server-side, including on subsequent pages. No arbitrary unbounded customer search/export. Errors/CORS/session/CSRF must be aligned with retained frontend clients before enabling the amendment.

Defer customer notification delivery, PIN/step-up authorization, detailed reconciliation, correction approval state machines, staff directories/rostering and advanced supervisors. Basic assignment targets may be seeded permitted actor IDs for P0; do not create a workforce management API. Dashboard can use scoped case/result/exception lists; this draft does not promise SLA metrics, notification delivery or a new analytics engine.

## Minimal transport simplification

P0 bank event/result ports are typed in-process calls backed by durable inbox/outbox; their optional private HTTP transports are secondary. Staff polls result list, whose items contain the full permitted projection; a separate result-detail endpoint is unnecessary for the first demo. Source list polling already reports processing state. Workbench investigation status carries enough progress without a separate job endpoint. Existing manual case-investigate supports optional re-investigation; new general run APIs remain secondary.

P0 customer UI uses baseline account/banks/name enquiry/create/get transfer/create/get complaint and the baseline customer_safe_updates string list. On publishing a structured CustomerCommunication, Cedar mirrors approved text into that existing customer-safe list in the same bank transaction. This explicit compatibility projection gives the retained complaint view truthful updates without requiring a new customer endpoint. Structured customer history APIs remain secondary. Preserve other customer screen designs, but do not claim unwired history/notification/PIN flows are integrated. No extra frontend truth or local balance/status mutations.

For P0, a new complaint uses a server-seeded bank department queue based on intake channel; no automatic workforce optimization. Assignee IDs are from seeded permitted staff, validated server-side. Staff-created P0 cases are transfer-related; general banking complaint categories and correction state machines remain secondary requirements. Formal bank case closure is deferred while customer transfer status/approved update can still be demonstrated truthfully.
