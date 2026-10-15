# VERIQ + CEDAR
## Usaamah — Frontend Build Specification v1.1

**Owner:** Usaamah · **Workstream:** Frontend · **Status:** Team implementation handoff · **Date:** 15 October 2026  
**Primary stack:** Next.js + TypeScript; one web application with distinct Cedar and Veriq experiences  
**Project:** One unified hackathon demo, two acts, one simulated Cedar environment  
**Canonical references:** `Veriq_Cedar_Engineering_Specification_v1.0.md`, `Veriq_Cedar_API_Contract_v1.0.yaml`, `Veriq_Cedar_Demo_Contract_v1.0.json`.

> **Yes, Cedar has a real interactive customer app** within the simulation: the user signs into a *synthetic* account, sees a server-backed balance, looks up a fictional beneficiary, initiates a transfer, sees an unresolved outcome, submits a complaint, and later sees a confirmed outcome. There are no real-money rails, real customers or real NIBSS calls. Never fake these state changes exclusively in the frontend.

## 1. The product and why the two interfaces exist

**Cedar** is a fictional Nigerian digital bank. Its app is the *customer experience*, not the intelligence product. **Veriq** is the separate intelligence platform consumed by bank investigators and the demo operator. The UX must visibly connect them: evidence gathered from Cedar during onboarding is reused in Veriq's investigation of a later Cedar transfer.

**Cedar customer job:** Send a synthetic interbank transfer, understand the status truthfully, and report a problem without repeating known transfer information.

**Veriq investigator job:** View Cedar's uploaded sources and constructed context, observe changing route health, inspect a suspected incident, see a customer case with evidence and AI hypotheses, and record authorized human decisions.

**Demo operator job:** Trigger an authorized synthetic scenario, seed/replay events, and later reveal a simulated bank-authorized status response; never perform those actions as an ordinary customer.

## 2. Repository and ownership

- Work primarily under `apps/web/` in the shared `veriq-cedar/` monorepo. Coordinate changes to `contracts/` with Daniel and Habeeb; do not silently alter API field names.
- Use one Next.js application with distinct route groups/layouts: `/cedar/*` for customer banking and `/veriq/*` for bank intelligence. A restricted `/demo/*` operator surface may share the Veriq shell but must enforce role checks on the backend.
- Keep API calls in typed client modules (`lib/api/cedar`, `lib/api/veriq`, `lib/api/demo`), not scattered through components. Read base URLs from environment variables.
- Use the OpenAPI source as the authority for actual request/response shapes; generate TypeScript types where practical. Mocks must exactly match contract schemas and must be replaceable by the real API client.
- Do not create ledger calculations, incident detection or financial outcome inference in React. Display authoritative server data and permitted derived presentation only.

## 3. Required Cedar customer experience (P0)

| Screen | User can do | Exact behavior to demonstrate | Data source |
|---|---|---|---|
| Demo sign-in / session entry | Select or sign into a seeded synthetic Cedar customer | Session produces a server-enforced customer identity; never choose someone else's account client-side | Auth/session agreement — see contract gaps |
| Account home | View name, NGN balance, actions, recent activity if API supports it | Balance comes from backend; display kobo as NGN, do not calculate debit locally as authoritative | `GET /v1/cedar/accounts/me` |
| Send money | Choose Elm or Birch; input account; request name enquiry; enter amount and narration | Must resolve fictional recipient before confirmation; the hero amount is ₦50,000 (5,000,000 kobo) | `GET /v1/cedar/banks`, `POST /v1/cedar/name-enquiries` |
| Transfer confirmation | Review recipient bank/account/name and amount, submit once | Create/preserve an idempotency key for retry; disable duplicate action while pending; backend controls scenario | `POST /v1/cedar/transfers` |
| Transfer details | Review actual debit and processing/result state | For response loss show **UNKNOWN / Awaiting confirmation**, NOT `FAILED`, `REVERSED`, or a fake ETA | `GET /v1/cedar/transfers/{transferId}` |
| Report a problem | Select known transfer and describe what happened | Pass transfer ID automatically, create a persisted case even when AI fails | `POST /v1/cedar/complaints` |
| Complaint tracking | Check case reference, status and customer-safe updates | Display only customer-permitted updates; refresh or poll; later render confirmed credit after authorized evidence | `GET /v1/cedar/complaints/{caseId}` + transfer details |

**Suggested customer copy:** On response loss, say *“Your account was debited. We're still confirming the final transfer outcome.”* Never instruct the sender to repeat the transfer solely because the gateway timed out.

### Customer interaction states

- Show loading, success, validation error, network error, duplicate-submission retry, and session-expired states.
- For name enquiry failures, do not let the user confirm a beneficiary whose identity was not resolved.
- For transfer creation timeouts between the browser and Cedar API, retry using the **same idempotency key** after retrieving/checking status. Do not create a new transfer on an ambiguous client timeout.
- For complaint creation, show the real case reference returned by the backend and provide a route back to its status page.
- Label all Cedar identities, balances and transactions **SIMULATED** where appropriate.

## 4. Required Veriq bank intelligence experience (P0)

| Screen / component | Visible content and interactions | Contract |
|---|---|---|
| Veriq onboarding | Choose Cedar, upload available source files, see source processing states, parse/extraction outcome and citations | `POST/GET /v1/veriq/banks/{bankId}/sources` |
| Source claims/review | Source text/locator, extracted subject–predicate–object, proposed status, ambiguity, accept/reject/request more evidence with reason | `GET /sources/{sourceId}/claims`, `POST /assertions/{assertionId}/review` |
| Living context | Entity types, documented/observed/candidate/verified relationships, current states, historical incidents, sources and uncertainty | `GET /context`, `GET /relationships` and approved entity-label contract |
| Operational overview | Elm/G2 and Birch/G3 routes, baseline vs recent attempts and timeouts, route status, suspected incidents and timestamps | `GET /operations`, `GET /incidents` |
| Incident details | Route signature, suspected state, linked cases and cited evidence; approve/reject with justification | `GET /incidents/{incidentId}`, `POST /incidents/{incidentId}/review` |
| Investigator case | Complaint summary, linked transfer, evidence timeline, known facts, unknowns, AI hypotheses, alternative explanations, next checks, reviewer decision | `GET /cases/{caseId}`, `POST /cases/{caseId}/investigate`, `POST /cases/{caseId}/review` |
| Demo controls (operator only) | Reset, seed, start the stream, arm/run hero scenario, reveal later authorized status query | `/v1/demo/*` endpoints; NEVER in customer role |

**Living context UI design:** Start with clear *tables + provenance side panel*; add an interactive relationship graph if it improves comprehension. A decorative static graph is unacceptable. Graph nodes/edges must come from Veriq API records; selecting an edge must show its source ID, evidence IDs, timestamps and verification status. Context summary `entity_counts` is not a full entity list; do not fabricate entity names from it.

**Uncertainty UI:** Use clearly different language for *documented*, *observed*, *candidate*, *verified*, *rejected* and *unknown*. Do not style the AI hypothesis as a confirmed root cause. On a case, `financial_outcome` is separate from incident status. An incident can be suspected while the beneficiary is eventually confirmed credited.

## 5. Single demo, precise visible sequence

| Beat | Usaamah's UI action | Must actually happen in the backend |
|---|---|---|
| 1 | Enter Veriq/Cedar onboarding and upload `services.json`, `dependencies.csv`, `routes.json`, `historical_incidents.md`, `operations_sop.txt` | Uploads and source registration run; extracted claims stored with locators |
| 2 | Inspect extracted candidates, review a source-backed edge and show Veriq context | Backend validates claim/relationship; provenance survives |
| 3 | Start operational stream; show Elm/G2 degradation and Birch/G3 normal | Detector receives 7 timeouts / 25 Elm attempts versus 2 / 100 historical, creates one SUSPECTED incident **before complaint** |
| 4 | Switch to Cedar customer, sign in, name-enquire Elm beneficiary, submit ₦50,000 | Cedar ledger posts one debit, simulated Elm privately credits, gateway response is dropped |
| 5 | Show transfer marked UNKNOWN; file complaint | Cedar persists case; no AI-based failure conclusion |
| 6 | Switch to Veriq investigator case; inspect evidence and AI findings | Investigator API returns eligible evidence IDs, related route context, uncertainty and recommended checks |
| 7 | Operator triggers later authorized status evidence | `/v1/demo/transfers/{transferId}/reveal-status` causes Cedar status pathway to emit eligible evidence, NOT direct UI mutation |
| 8 | Return to Cedar customer case and transfer view | Final outcome is now CREDIT_CONFIRMED from backend, not React state |

**One recorded demo** with these two connected acts in the same Cedar state; don't create two disconnected demos, re-seed between acts or promise multiple submission videos.

## 6. Non-negotiable API conventions

- Existing canonical prefixes: `/v1/cedar`, `/v1/veriq`, `/v1/demo`; AI private endpoints are **never called from the browser**.
- `amount_kobo` is an integer. Render ₦50,000 for value `5000000` using a display formatter. No floating-point money arithmetic.
- Honor exact enums from the OpenAPI document. In particular `UNKNOWN`, `CREDIT_CONFIRMED`, `FAILURE_CONFIRMED`, `REVERSAL_POSTED` are financial-outcome values; `SUSPECTED` is an incident status.
- Authentication is server-enforced. Customer can see only owned account, transfer and complaint; investigators see bank-authorized cases; operator controls must not leak to customers.
- Use normalized error feedback based on `{ error: { code, message } }` where supplied. Handle 401/403/404/409/422 appropriately.
- Read backend host/port from configuration. The old OpenAPI document's NestJS localhost port is a technology assumption, not an immutable externally published interface. Daniel will confirm the FastAPI base URL.
- Do not add new browser-facing routes to the shared OpenAPI without an agreed ADR/contract update.

## 7. Contract gaps that Daniel must resolve early (not permission to invent routes)

1. The API contract defines a session cookie but **does not define a login/session issuance route**. Decide demo session/role flow with Daniel before wiring sign-in.
2. It defines `GET /transfers/{transferId}` but not a **transaction history list endpoint**. Home's “recent activity” must be deferred, seeded from approved read data, or added through contract amendment.
3. `GET /context` returns **summary counts**, while `/relationships` contains IDs but not human-readable entity labels. Agree an entity-detail/list API or approved response extension if a full exploratory graph is required.
4. Source upload returns `job_id`, but there is no separate job-status route in v1.0. Use approved source listing polling for P0 or request a job-status contract amendment.
5. The API's `AIClaim` return type does not include the persisted assertion identifier/status needed by review UI; Daniel must confirm the mapping or amend it before implementing clickable review.

Log these as cross-team integration decisions. Until resolved, build stable mock screens but do not pretend the missing API already exists.

## 8. Deliverables and acceptance criteria

**P0 deliverables**

- Next.js app with Cedar customer and Veriq investigator/demo route groups, reusable components and readable responsive UI.
- Typed API client and contract-valid mocks; no direct browser→AI or browser→database access.
- Customer transfer, UNKNOWN-state display, complaint submission/tracking, and later CREDIT_CONFIRMED view backed by actual API.
- Veriq source upload, candidate claims/review, context view with source provenance, route overview, suspected incident and investigator case.
- Clear synthetic-environment labels, role-aware navigation, loading/error/empty states.

**Must-pass UI tests / demonstrations**

- A Cedar customer cannot navigate to a different customer's transfer/case even by modifying route IDs.
- A timeout is never displayed as confirmed failure; never imply another transfer should be sent.
- No hardcoded state transition on demo click: refresh after a new event returns persisted state.
- AI unavailable: customer complaint still saves and investigator evidence remains visible.
- Birch's unrelated complaint is not shown under the G2 incident.
- Known source attribution/relationship verification state is visible and readable.
- Basic accessibility: labels, keyboard operation, meaningful status text and mobile layout.

## 9. Implementation sequence for independent parallel work

1. **F0:** Read three canonical contracts, align on Cedar/Veriq routes, create typed mocks and a frontend screen map.
2. **F1:** Build both visual shells and role-separated navigation with fixture-driven components.
3. **F2:** Implement Cedar accounts, name enquiry, transfer, unknown-outcome and complaint flow against mocks; add UI tests.
4. **F3:** Implement Veriq onboarding, claims review, context table/graph, monitoring and case views against mocks.
5. **F4:** Connect to Daniel's API module-by-module; run the full two-act demonstration with realistic timing and failure handling.

**Out of scope for P0:** Real online banking, native mobile app, cards, billers, OTP delivery, push notifications, long-form chatbot, heavy graph-visualization performance tuning, and external bank branding.

## 10. What to report to the team

At each milestone provide: branch/commit, screens and routes finished, API calls used, mock-data assumptions, screenshots/video (if convenient), tests run, blockers, and every desired contract change. Do not report a mock view as live-integrated.

**Definition of done:** Usaamah can demonstrate both Cedar and Veriq experiences in a single app, with truthful financial status, traceable institutional context, permitted user actions and an uninterrupted shared scenario—without frontend-invented banking facts.
