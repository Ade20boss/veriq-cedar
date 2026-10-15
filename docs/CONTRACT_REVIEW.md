# Task 001.1 contract reconciliation

Status: precise proposals for review, not approved HTTP changes. Owner has confirmed proactive behavior and the Python architecture direction; affected owners have not yet approved the detailed schemas. Accepted contracts/openapi.yaml and contracts/demo.json remain byte-for-byte unchanged from Task 001. Frozen original specifications remain intact.

The minimum-demo review candidate is contracts/proposals/openapi-v1.1.proposed.yaml, version 1.1.0-proposed.1: 49 paths, 54 operations, 93 shared schemas. It retains all baseline routes, methods, operationIds, 27 original schemas and success response shapes, adding 26 proposed P0 operations. The secondary preview adds another 13 operations for discussion only; it is not the minimum amendment. Explicit proposed compatibility changes are Error bodies/404/409/503 documentation and CSRF headers on legacy browser mutations. The incident AI endpoint is new. Adoption needs review; do not overwrite accepted contracts from generated FastAPI output.

## Resolutions of earlier C01–C10 and new requirements

| ID | Proposed precise resolution | Review required |
|---|---|---|
| C01 Sessions | Add /v1/auth/sessions POST and /v1/auth/session GET/DELETE; server-mapped demo identity/roles/department/permissions, existing cookie name, expiry, CSRF and explicit Origin policy | Daniel + Usaamah; seeded identities/TTL and local two-app proxy setup |
| C02 History | Secondary proposal: owned transfer/complaint cursor lists and safe transfer timeline; P0 reuses existing transfer detail and complaint receipt/detail | Daniel + Usaamah; filters/cursor and visible timeline semantics |
| C03 Entity labels | Add bank-scoped /entities; entity_id resolves existing relationship endpoints; do not mutate ContextSummary/KnowledgeRelationship | Daniel + Usaamah + Habeeb; identity/alias/provenance rules |
| C04 Source jobs | P0 retains existing source-list polling; detailed source-job endpoint is secondary | Daniel + Usaamah; source/job states |
| C05 Review IDs | Add GET /assertions returning AssertionView; assertion_id is existing review path ID, source_claim_id links AI claim_id; keep /claims raw shape | All three; persisted trust/source review semantics |
| C06 Metadata | Drop blanket extra-field insertion; define timestamps/versions explicitly only on new DTOs; keep old closed shapes unchanged | All three; approve narrative clarification rather than changing every response |
| C07 Errors | Attach existing Error envelope and 404/409/503 semantics; add browser CSRF migration explicitly in draft | All three; fixtures/client handling and compatibility plan |
| C08 Events | Typed event-envelope variants tie event_type to allowed payload; version 1.1; required source_record_id/schema_version/payload, optional correlation refs; source-scoped dedupe and exact content digest | Daniel + Habeeb; metric/raw event accounting, lateness/watermarks, valid bank capabilities |
| C09 Provenance | Immutable SourceChunk IDs as exact AI locators; quoted substring checks; NormalizedEvidence wrapper retains bank/source/record/checksum/access/purpose and backend run metadata | Daniel + Habeeb; old examples preserved as historical sources, no AI root schema changes |
| C10 Missing views | StaffCase embeds baseline Complaint and Cedar routing/version; source-backed StaffTransaction provides inquiry; incident/case-specific InvestigationView plus trigger/evidence/review lifecycle | Daniel + Usaamah; no fake case IDs or route-level outcome |
| C11 Staff operations | P0 staff lookup/inquiry/case queues/intake/interactions/assignment/escalation and communication draft/publish/history; formal case-resolution endpoint is secondary | Daniel + Usaamah; minimum support-to-specialist workflow, permission matrix and deferred scope |
| C12 Proactive runs | Automatic OPERATIONAL_ANOMALY and CUSTOMER_COMPLAINT jobs; INCIDENT/BANK_CASE are distinct subjects, new evidence coalesces runs, manual commands optional | Daniel + Habeeb + Usaamah; durable dedupe/fencing/retry defaults and trigger visibility |
| C13 Bank integration | Neutral bank ports and Cedar result inbox; private events/result transport, idempotent revision delivery and health | Daniel; purpose/role/database restrictions and outage recovery, both frontend consumers |
| C14 Incident AI | Add private analyze-incident with real incident_id, permitted evidence/context/metrics and advisory output; no financial_outcome or fabricated case | Habeeb + Daniel; provider limits and evaluation fixtures; evidence-only path must remain autonomous |
| C15 Financial authority | No new financial setter; Cedar alone validates eligible status/reversal evidence; staff requests verification through policy; route findings never establish transfer finality | All three; UNKNOWN/late/contradictory/authorized reveal tests |
| C16 Frontend direction | Retain customer design; rebuild staff operations, separate workbench permissions; preferred customer/staff apps with distinct clients | Usaamah + Daniel; existing repos/branches and migration approval missing; no source imported |

Every entry is proposed resolved in design, pending approval. Do not confuse an articulated solution with a frozen contract. Original Team Build v1.1 docs/ADR are preserved historical inputs; new owner correction/operations feedback governs current proposals where they conflict.

## Scope and integration rules

Cedar owns case ID and customer communication; Veriq owns incident/investigation IDs and advisory reviews. One bank case can link a distinct case investigation and an existing incident investigation. The staff inbox can show automatic route investigation before cases exist. The old case investigate endpoint becomes optional manual re-investigation semantics in the draft; it never gates automation. Source assertion approval does not establish verified cause.

Frontend-to-backend remains cookie/session/permissions; no browser-to-AI or adapter keys. Backend-to-AI remains X-Internal-Service-Key and closed Pydantic-equivalent schemas. AI evidence must be in the current allowed bundle; case outcome must exactly equal Cedar's input. Proposed incident AI has no case identity/finality. Operational ingestion uses private bank capability or equivalent typed in-process port, not a staff session. Core cannot directly query Cedar models/tables. Shared process is logical modularity with tested constraints, not production isolation.

Minimum P0 covers customer integration, staff lookup/transactions/cases/interactions/basic assignment/escalation, result progress/approved communications and workbench automatic investigation/review. Knowledge gap endpoints complete existing onboarding requirements. Defer notifications, advanced workforce/approvals/reconciliation and PIN/step-up protocol; no need to implement all old prototype screens. See STAFF_AND_UI_CONTRACTS.md for route map and permission proposals.

## Approval and remaining questions

Approve/revise the full candidate or record a selected P0 subset before any application implementation. Confirm synthetic role/capability matrix and session/Origin/CSRF policy; case correlation time-window and detector late-event watermarks; job/AI timeout and bounded retry defaults; service adapter capability ownership; review versus customer-publication permissions; incident AI endpoint acceptance; exact source locator/version policy; cursor consistency and result retention. Source repositories/branches and explicit migration permission are still missing. No technical or team signoff beyond the user's stated direction is claimed.

Usaamah can build baseline-valid mocks now in his own separately authorized task; proposed typed fixtures may be used as clearly labelled review mocks, not live/API-approved integration. Habeeb can review schema pairs independently; no DB access. Neither workstream's implementation is authorized by this documentation task. Detailed schema smoke results and limitations are in the Task 001.1 report.

## Owner scope clarification

The attached Cedar Operations specification is a proposed requirements source for reconciliation, not implementation authorization. Preserve/integrate the customer frontend, redesign staff UI, maintain an independent Veriq workbench, proactive processing and the adapter boundary. docs/MINIMUM_DEMO_SCOPE.md is the recommended P0 selection; the 13 secondary routes are excluded from the minimum OpenAPI candidate. No source scaffolding or application functionality is permitted before revised review.
