# Minimum demo scope and proposed API amendment

Status: recommended P0 selection for review only. The Cedar Operations specification is a proposed requirements document, not approval to implement every listed feature. This task creates documentation and schema drafts only.

## P0 behavior and reused interfaces

Keep the existing Cedar customer design and replace its financial local state with baseline APIs in a future authorized task. Retain account/banks/name enquiry/create/get transfer/create/get complaint, investigator source upload/list/claims/review/context/relationships/operations/incidents and guarded operator controls. Baseline success DTOs stay unchanged. The existing optional case-investigate endpoint becomes a manual re-investigation compatibility action in the draft; it never initiates routine work.

Automatically detect and investigate a qualifying G2 anomaly before any complaint/staff action. A later complaint automatically gets targeted case work and an evidence-backed link to the earlier incident. Bank case, incident, investigation, run and job IDs stay separate. Staff read progress, assign/escalate, verify and review. Route hypotheses never establish transfer finality.

## Recommended 26 additions

| Group | Added operations | Why required for this demo |
|---|---:|---|
| Demo session lifecycle | 3 | server identity/permissions, CSRF and sign-out |
| Staff customer lookup and basic profile | 2 | locate synthetic customer and permitted account context |
| Staff transaction search and detail | 2 | find transfer/reference and inspect eligible sender evidence |
| Bank case queue/intake/detail/activity/interactions/assignment/escalation | 7 | shared persisted customer/branch case and Sarah-to-Michael workflow |
| Structured staff communications list/draft/publish | 3 | approved, auditable customer-safe update |
| Cedar investigation-result inbox list | 1 | consume progress/approved findings, including incident-before-case |
| Veriq automatic list/detail/review and verification create/list | 5 | Michael receives automatic work, inspects it and requests authorized checks |
| Entity labels and persisted assertion list | 2 | resolve existing onboarding/claim review ID gaps without altering old DTOs |
| Case-free incident AI analysis | 1 | grounded incident analysis without fabricated bank cases; Habeeb review required |

P0 OpenAPI: contracts/proposals/openapi-v1.1.proposed.yaml (49 paths, 54 operations including all 28 baseline operations). 93 shared components include port schemas and secondary DTOs; unused schemas do not add P0 routes. All endpoint/permission/session changes still require review.

## P0 contracts without extra HTTP routes

Bank-neutral source/event/evidence/metrics/status/case/result ports are required. In a modular hackathon backend they can be typed in-process interfaces with durable inbox/outbox and independent domain transactions. Private HTTP transports are optional secondary proposals. Incident/job/status/result DTOs are concrete schemas even when no separate HTTP job or transport route is needed.

Use baseline source-list polling for ingestion state; use investigation detail/list for run progress; use result-list items for Cedar integration detail. Publish structured bank communication and atomically mirror its approved text to baseline Complaint.customer_safe_updates, so customer view works without an added customer communications endpoint. Manual reinvestigation can use the existing case endpoint; the new general run endpoint is secondary.

## Secondary API proposals excluded from P0

| Method | Route |
|---|---|
| GET | `/v1/cedar/transfers` |
| GET | `/v1/cedar/complaints` |
| GET | `/v1/cedar/transfers/{transferId}/timeline` |
| GET | `/v1/cedar/complaints/{caseId}/communications` |
| POST | `/v1/cedar/staff/cases/{bankCaseId}/resolution` |
| GET | `/v1/cedar/staff/investigation-results/{investigationId}` |
| GET | `/v1/cedar/staff/integration-health` |
| GET | `/v1/veriq/banks/{bankId}/sources/{sourceId}/chunks` |
| GET | `/v1/veriq/banks/{bankId}/sources/{sourceId}/jobs/{jobId}` |
| POST | `/v1/veriq/banks/{bankId}/investigations/{investigationId}/runs` |
| GET | `/v1/veriq/banks/{bankId}/jobs/{jobId}` |
| POST | `/internal/veriq/banks/{bankId}/events` |
| POST | `/internal/cedar/banks/{bankId}/investigation-results` |

These 13 operations appear only in contracts/proposals/openapi-v1.1.secondary.proposed.yaml (broader preview, 67 operations total). They reconcile legitimate longer-term requirements but must not expand the demo implementation automatically. The extended preview shares the P0 schemas and operations exactly.

Also defer customer notifications delivery, step-up/PIN protocol, advanced workforce assignment/rostering, correction approval state machines, detailed reconciliation, complex supervision, advanced dashboards/SLAs, new bank connectors and production deployment. Their appearance in the supplied requirements is not authorization or an accepted API.

## Review choices

Approve/revise the 26 additions, permission matrix and explicit legacy CSRF/error changes, or select a still smaller subset and record the visible demo tradeoff. Confirm adapter export policy, correlation/time-window handling, retry/lease defaults, incident AI shape, source locators and customer-message approval. Retain three distinct user experiences and two proposed frontend deployments. Source import/migration stays blocked on repositories and Usaamah approval. No implementation begins until revised contracts are reviewed and a later task authorizes it.
