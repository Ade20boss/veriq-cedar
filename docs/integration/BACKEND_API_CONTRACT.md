# Backend API contract for frontend integration

This is a coordination document. `contracts/openapi.yaml` is the accepted wire contract. Existing routes below are **OBSERVED**. The `/api/v1` endpoints in the proposal section are **PROPOSED** and require backend-owner approval.

## Common rules

- Use JSON and `{ "error": { "code": "...", "message": "..." } }` for errors.
- Scope resources from the authenticated session; never trust a browser-supplied tenant ID.
- Use opaque IDs and UTC ISO-8601 timestamps.
- Money is integer minor units (`amount_kobo` for NGN).
- Use cursor pagination (`limit` plus opaque `cursor`) for collections.
- Require idempotency keys for retried durable commands.
- Keep financial outcome separate from processing stage, investigation status, incident lifecycle and job status.

## Existing implemented endpoints

| Method/path | Auth | Status | Frontend use |
|---|---|---|---|
| `GET /v1/cedar/accounts/me` | Cedar customer session | Implemented | Customer balance/account |
| `GET /v1/cedar/banks` | Cedar customer session | Implemented | Recipient bank selector |
| `POST /v1/cedar/name-enquiries` | Customer + same-origin POST | Implemented | Beneficiary review |
| `POST /v1/cedar/transfers` | Customer + `Idempotency-Key` | Implemented | Transfer submit |
| `GET /v1/cedar/transfers/{transferId}` | Owner | Implemented | Status/details refresh |
| `POST /v1/cedar/complaints` | Transfer owner | Implemented | Complaint submission |
| `GET /v1/cedar/complaints/{caseId}` | Complaint owner | Implemented | Known complaint refresh |
| `GET /v1/veriq/banks/{bankId}/operations` | Bank investigator | Implemented | Route health |
| `GET /v1/veriq/banks/{bankId}/incidents[/{incidentId}]` | Bank investigator | Implemented | Incident reads |
| `GET /v1/veriq/banks/{bankId}/cases/{caseId}` | Bank investigator | Implemented | Exact case investigation |
| `POST .../cases/{caseId}/investigate` | Bank investigator | Implemented | Accepted refresh command |
| `POST/GET .../sources` | Bank investigator | Implemented | Source upload/list |
| `GET .../context`, `GET .../relationships` | Bank investigator | Implemented | Knowledge projections |

S2 returns `processing_stage=RESPONSE_TIMEOUT` and `financial_outcome=UNKNOWN`. The frontend must not infer failure, credit, refund or reversal.

## Proposed API surface

These proposals support the product brief and are not current functionality.

### Authentication and institution access

| Method/path | Purpose/permission | Request/response |
|---|---|---|
| `POST /api/v1/auth/register` | Public registration | `{email,password,name}` → `201 User` |
| `POST /api/v1/auth/sessions` | Sign in | credentials → `201 SessionInfo`, HttpOnly cookie |
| `DELETE /api/v1/auth/sessions/current` | Sign out | `204` |
| `GET /api/v1/auth/me` | Current identity | User plus memberships |
| `GET /api/v1/institutions` | Authorized institutions | Cursor memberships |
| `POST /api/v1/institutions` | Create; owner policy | `{name,synthetic}` → Institution |
| `GET/PATCH /api/v1/institutions/{id}` | Read/update; member/admin | Institution with optimistic `version` |
| `GET /api/v1/institutions/{id}/members` | Membership list | Cursor memberships |
| `POST /api/v1/institutions/{id}/invitations` | Invite; admin | `{email,role}` → Invitation |

### Integrations, sync and knowledge

| Method/path | Purpose |
|---|---|
| `GET /api/v1/institutions/{id}/connectors` | Connector methods/scopes |
| `POST /api/v1/institutions/{id}/connections` | Create authorized connection |
| `POST /api/v1/connections/{id}/authorization` | Begin provider authorization |
| `GET /api/v1/connections/{id}` | Health and scopes |
| `POST /api/v1/connections/{id}/sync` | Idempotent sync command → 202 Job |
| `GET /api/v1/jobs/{jobId}` | Job status/progress/error code |
| `DELETE /api/v1/connections/{id}` | Revoke connection |
| `POST /api/v1/institutions/{id}/knowledge/sources` | Multipart source → 202 job |
| `GET /api/v1/institutions/{id}/knowledge/sources` | Source list |
| `GET /api/v1/knowledge/sources/{sourceId}` | Source processing/provenance |
| `GET /api/v1/institutions/{id}/knowledge/search?q=` | Approved knowledge search |

### Monitoring, incidents and investigations

| Method/path | Purpose |
|---|---|
| `GET /api/v1/institutions/{id}/monitoring/summary` | Current KPI/health projection |
| `GET /api/v1/institutions/{id}/monitoring/events` | Filtered operational events |
| `GET /api/v1/institutions/{id}/monitoring/anomalies` | Anomaly signals |
| `GET /api/v1/institutions/{id}/incidents` | Incident list |
| `GET /api/v1/incidents/{incidentId}` | Incident detail |
| `PATCH /api/v1/incidents/{incidentId}` | Lifecycle update with version/reason |
| `GET /api/v1/institutions/{id}/investigations` | Investigation list |
| `POST /api/v1/institutions/{id}/investigations` | Create from incident/case |
| `GET /api/v1/investigations/{id}` | Investigation detail |
| `POST /api/v1/investigations/{id}/evidence-collection` | Idempotent evidence job |
| `POST /api/v1/investigations/{id}/findings` | Submit source-backed finding |
| `POST /api/v1/investigations/{id}/report` | Queue report generation |

### Reviews and audit

| Method/path | Purpose |
|---|---|
| `GET /api/v1/institutions/{id}/reviews` | Pending/recent reviews |
| `POST /api/v1/reviews/{reviewId}/claim` | Atomic reviewer claim |
| `POST /api/v1/reviews/{reviewId}/decision` | Approve/change/reject with version |
| `GET /api/v1/reviews/{reviewId}/history` | Immutable decision history |
| `GET /api/v1/institutions/{id}/audit-events` | Filtered audit events |
| `GET /api/v1/reports/{reportId}` | Approved report retrieval |

Example proposed investigation response:

~~~json
{
  "id": "inv_01JDEMO",
  "institution_id": "inst_cedar_demo",
  "status": "EVIDENCE_READY_AI_UNAVAILABLE",
  "financial_outcome": "UNKNOWN",
  "incident_id": "inc_g2_001",
  "evidence_ids": ["gateway/event-123/OBSERVED_TIMEOUT"],
  "ai_hypotheses": [],
  "version": 4,
  "updated_at": "2026-10-16T00:05:56Z"
}
~~~

Recommended errors: 400 validation, 401 session, 403 permission, 404 invisible resource, 409 version/idempotency conflict, 422 semantic validation, 429 rate limit, 503 unavailable dependency. Every command should return a stable code and request ID.

**NEEDS CONFIRMATION:** final namespace, identity provider, pagination envelope, role vocabulary, event transport, report format, and whether proposed institution APIs belong to this FastAPI service or another backend. No proposed endpoint is evidence that it exists.

