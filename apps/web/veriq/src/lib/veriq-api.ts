export type SourceStatus = "UPLOADED" | "PARSED" | "STAGED" | "ACCEPTED" | "REJECTED" | "FAILED"

export type SourceRecord = {
  source_id: string
  filename: string
  source_kind: string
  status: SourceStatus
  accepted_claims: number
  flagged_claims: number
  checksum_sha256?: string
}

export type SourceRegistration = {
  source_id: string
  status: string
  job_id: string
}
export type ContextSummary = {
  bank_id: string
  context_version: number
  entity_counts: Record<string, number>
  relationship_counts: Record<string, number>
  source_count: number
  candidate_count: number
  verified_count: number
  updated_at: string
}
export type KnowledgeRelationship = {
  id: string
  bank_id: string
  from_entity_id: string
  to_entity_id: string
  type: string
  status: "CANDIDATE" | "DOCUMENTED" | "OBSERVED" | "VERIFIED" | "REJECTED"
  evidence_ids: string[]
  source_id: string
}
export type RouteHealth = {
  route_id: string
  service_id?: string
  window_attempts: number
  window_timeouts: number
  baseline_attempts: number
  baseline_timeouts: number
  status: "NORMAL" | "DEGRADED" | "INSUFFICIENT_DATA"
}
export type Incident = {
  id: string
  bank_id: string
  route_id: string
  status: string
  first_observed_at?: string
  last_observed_at?: string
  finding_summary?: string
  evidence_ids: string[]
  case_ids: string[]
}
export type CaseInvestigation = {
  case_id: string
  status: "REQUESTED" | "EVIDENCE_READY" | "AI_PENDING" | "FINDINGS_READY" | "EVIDENCE_READY_AI_UNAVAILABLE" | "REVIEWED" | "RESOLVED"
  financial_outcome: "UNKNOWN" | "CREDIT_CONFIRMED" | "FAILURE_CONFIRMED" | "REVERSAL_POSTED"
  evidence: EvidenceRecord[]
  incident_ids: string[]
  ai_result: AIInvestigationOutput | null
}
export type EvidenceRecord = {
  id: string
  source_system: string
  kind: string
  observed_at: string
  occurred_at: string
  citation: string
  verified_for_purpose: boolean
  data: Record<string, unknown>
}
export type AIObservation = {
  text: string
  evidence_ids: string[]
}
export type AIHypothesis = {
  text: string
  evidence_ids: string[]
  alternatives: string[]
}
export type AIInvestigationOutput = {
  case_id: string
  financial_outcome: CaseInvestigation["financial_outcome"]
  observations: AIObservation[]
  hypotheses: AIHypothesis[]
  unknowns: string[]
  recommended_checks: string[]
  customer_safe_update_draft: string
}

export class VeriqApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "VeriqApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  })
  const body = (await response.json().catch(() => null)) as {
    error?: {
      code?: string
      message?: string
    }
  } | T | null
  if (!response.ok) {
    const error =
      body && typeof body === "object" && "error" in body
        ? body.error
        : undefined
    throw new VeriqApiError(
      error?.message || `Veriq request failed (${response.status}).`,
      response.status,
      error?.code,
    )
  }
  return body as T
}

const path = (bankId: string, suffix: string) =>
  `/v1/veriq/banks/${encodeURIComponent(bankId)}${suffix}`

export const veriqApi = {
  getSources: (bankId = "CED") =>
    request<SourceRecord[]>(path(bankId, "/sources")),
  getContext: (bankId = "CED") =>
    request<ContextSummary>(path(bankId, "/context")),
  getRelationships: (bankId = "CED") =>
    request<KnowledgeRelationship[]>(path(bankId, "/relationships")),
  getOperations: (bankId = "CED") =>
    request<RouteHealth[]>(path(bankId, "/operations")),
  getIncidents: (bankId = "CED") =>
    request<Incident[]>(path(bankId, "/incidents")),
  getIncident: (incidentId: string, bankId = "CED") =>
    request<Incident>(
      path(bankId, `/incidents/${encodeURIComponent(incidentId)}`),
    ),
  getCase: (caseId: string, bankId = "CED") =>
    request<CaseInvestigation>(
      path(bankId, `/cases/${encodeURIComponent(caseId)}`),
    ),
  uploadSource: (file: File, bankId = "CED") => {
    const form = new FormData()
    form.append("file", file)
    form.append("source_kind", "PITCH_FIXTURE")
    return request<SourceRegistration>(path(bankId, "/sources"), {
      method: "POST",
      body: form,
      headers: {},
    })
  },
}
