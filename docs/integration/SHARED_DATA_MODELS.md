# Shared data models

These are proposed integration types except where marked **OBSERVED**. Closed accepted response objects must remain exactly as defined in `contracts/openapi.yaml`.

## Conventions

IDs are opaque strings. `institution_id` is server-derived scope. Timestamps are UTC ISO-8601. Money is integer kobo. `financial_outcome`, investigation status, incident status, anomaly state and job status are separate enums.

## Identity and tenancy

~~~ts
type User = { id: string; email: string; display_name: string; status: "ACTIVE"|"PENDING"|"DISABLED" }
type Role = "OWNER"|"ADMIN"|"ANALYST"|"INVESTIGATOR"|"REVIEWER"|"AUDITOR"
type Permission = string
type Institution = { id: string; display_name: string; synthetic: boolean; readiness: "ONBOARDING"|"READY"|"SUSPENDED"; version: number }
type InstitutionMembership = { id: string; institution_id: string; user_id: string; role: Role; permissions: Permission[]; status: "INVITED"|"ACTIVE"|"SUSPENDED" }
type Invitation = { id: string; institution_id: string; email: string; role: Role; expires_at: string; status: "PENDING"|"ACCEPTED"|"EXPIRED"|"REVOKED" }
~~~

## Integrations and knowledge

~~~ts
type IntegrationConnector = { id: string; name: string; synthetic: boolean; methods: string[]; scopes: string[] }
type ConnectorAuthorization = { id: string; connection_id: string; status: "PENDING"|"AUTHORIZED"|"DENIED"|"REVOKED"; scopes: string[] }
type ConnectionSession = { id: string; institution_id: string; connector_id: string; status: "PENDING"|"HEALTHY"|"DEGRADED"|"FAILED"|"REVOKED"; last_checked_at?: string }
type SynchronizationTask = { id: string; connection_id: string; status: "QUEUED"|"RUNNING"|"COMPLETED"|"FAILED"; progress?: number; error_code?: string; started_at?: string; finished_at?: string }
type OperationalDataSource = { id: string; institution_id: string; source_kind: string; filename: string; checksum_sha256: string; status: "UPLOADED"|"PARSING"|"ACCEPTED"|"FAILED"; observed_at: string }
type InstitutionalKnowledgeSource = OperationalDataSource
type KnowledgeRecord = { id: string; source_id: string; institution_id: string; text: string; locator: string; trust: "CANDIDATE"|"DOCUMENTED"|"VERIFIED"|"REJECTED" }
type KnowledgeVersion = { id: string; source_id: string; version: number; checksum_sha256: string; created_at: string }
~~~

## Operations and investigations

~~~ts
type OperationalEvent = { id: string; institution_id: string; route_id?: string; service_id?: string; occurred_at: string; observed_at: string; event_type: string; payload: Record<string, unknown>; source_id: string }
type TransactionStatusObservation = { id: string; transfer_id: string; processing_stage: string; financial_outcome: FinancialOutcome; observed_at: string; evidence_id: string }
type FinancialOutcome = "UNKNOWN"|"CREDIT_CONFIRMED"|"FAILURE_CONFIRMED"|"REVERSAL_POSTED"
type AnomalySignal = { id: string; institution_id: string; state: "OPEN"|"ACKNOWLEDGED"|"DISMISSED"|"EXPIRED"; signature: string; detected_at: string; evidence_ids: string[] }
type MonitoringRule = { id: string; institution_id: string; name: string; enabled: boolean; version: number }
type Incident = { id: string; institution_id: string; status: "SUSPECTED"|"ACTIVE"|"CONTAINED"|"RESOLVED"|"REJECTED"; anomaly_ids: string[]; evidence_ids: string[]; version: number }
type CustomerCase = { id: string; institution_id: string; transfer_id?: string; customer_report: string; status: "OPEN"|"INVESTIGATING"|"WAITING_FOR_EVIDENCE"|"RESOLVED"; safe_updates: string[] }
type Investigation = { id: string; institution_id: string; case_id?: string; incident_id?: string; status: "REQUESTED"|"EVIDENCE_READY"|"AI_PENDING"|"FINDINGS_READY"|"EVIDENCE_READY_AI_UNAVAILABLE"|"REVIEWED"|"RESOLVED"; financial_outcome: FinancialOutcome; evidence_ids: string[]; version: number }
~~~

## Evidence, AI, reviews and audit

~~~ts
type EvidenceProvenance = { source_id: string; locator: string; quote?: string; occurred_at?: string; observed_at: string; extraction_run_id?: string }
type EvidenceRecord = { id: string; institution_id: string; kind: string; data: Record<string, unknown>; provenance: EvidenceProvenance; verified_for_purpose: boolean }
type AIHypothesis = { id: string; investigation_id: string; statement: string; confidence?: number; evidence_ids: string[]; status: "CANDIDATE"|"ACCEPTED"|"REJECTED" }
type Recommendation = { id: string; investigation_id: string; text: string; status: "DRAFT"|"SUBMITTED"|"APPROVED"|"REJECTED" }
type ReviewItem = { id: string; investigation_id: string; status: "PENDING"|"CLAIMED"|"APPROVED"|"CHANGES_REQUESTED"|"REJECTED"; claimed_by?: string; version: number }
type ReviewDecision = { id: string; review_id: string; reviewer_id: string; decision: "APPROVED"|"CHANGES_REQUESTED"|"REJECTED"; comment?: string; decided_at: string }
type AuditEvent = { id: string; institution_id: string; actor_id?: string; action: string; resource_type: string; resource_id: string; occurred_at: string; metadata: Record<string, string> }
type InvestigationReport = { id: string; investigation_id: string; status: "QUEUED"|"GENERATING"|"READY"|"FAILED"; version: number; approved_at?: string; download_url?: string }
~~~

## Relationships and source of truth

`Institution` and membership come from identity/tenancy. Customer account/transfer/outcome comes from Cedar. Operational events, incidents, investigations, evidence, reviews and audit events come from backend services. AI hypotheses are candidates only. The frontend may cache projections but may not authoritatively mutate these domains.

~~~mermaid
erDiagram
  INSTITUTION ||--o{ MEMBERSHIP : has
  INSTITUTION ||--o{ DATA_SOURCE : owns
  DATA_SOURCE ||--o{ OPERATIONAL_EVENT : supplies
  OPERATIONAL_EVENT ||--o{ ANOMALY : informs
  ANOMALY ||--o{ INCIDENT : contributes_to
  INCIDENT ||--o{ INVESTIGATION : starts
  CUSTOMER_CASE ||--o{ INVESTIGATION : requests
  INVESTIGATION ||--o{ EVIDENCE : cites
  INVESTIGATION ||--o{ AI_HYPOTHESIS : proposes
  INVESTIGATION ||--o{ REVIEW_ITEM : submits
  REVIEW_ITEM ||--o{ REVIEW_DECISION : records
~~~

**Mismatch to resolve:** frontend `CaseRecord.id` is a display case key while backend distinguishes complaint case, investigation, incident and transfer IDs. Preserve explicit fields; do not alias by label.

