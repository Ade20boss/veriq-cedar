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
  status: "SUSPECTED" | "CONFIRMED" | "REJECTED" | "CLOSED"
  first_observed_at: string
  finding_summary: string
  evidence_ids: string[]
  case_ids: string[]
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

export type Investigation = {
  case_id: string
  status: "REQUESTED" | "EVIDENCE_READY" | "AI_PENDING" | "FINDINGS_READY" | "EVIDENCE_READY_AI_UNAVAILABLE" | "REVIEWED" | "RESOLVED"
  financial_outcome: "UNKNOWN" | "CREDIT_CONFIRMED" | "FAILURE_CONFIRMED" | "REVERSAL_POSTED"
  evidence: EvidenceRecord[]
  incident_ids: string[]
  ai_result: unknown | null
}

export type SourceListItem = {
  source_id: string
  filename: string
  source_kind: string
  status: "UPLOADED" | "PARSED" | "STAGED" | "ACCEPTED" | "REJECTED" | "FAILED"
  accepted_claims: number
  flagged_claims: number
  checksum_sha256?: string
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
  valid_from?: string | null
}

export class VeriqApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
    this.name = "VeriqApiError"
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...init.headers },
    })
  } catch {
    throw new VeriqApiError(0, "BACKEND_UNAVAILABLE", "Veriq is currently unavailable.")
  }
  if (!response.ok) {
    let body: { error?: { code?: string; message?: string } } = {}
    try { body = await response.json() } catch { /* sanitized fallback */ }
    throw new VeriqApiError(response.status, body.error?.code ?? "REQUEST_FAILED", body.error?.message ?? "The Veriq request could not be completed.")
  }
  return response.json() as Promise<T>
}

const base = "/v1/veriq/banks/CED"

export const veriqApi = {
  operations: () => request<RouteHealth[]>(`${base}/operations`),
  incidents: () => request<Incident[]>(`${base}/incidents`),
  incident: (id: string) => request<Incident>(`${base}/incidents/${encodeURIComponent(id)}`),
  investigation: (caseId: string) => request<Investigation>(`${base}/cases/${encodeURIComponent(caseId)}`),
  sources: () => request<SourceListItem[]>(`${base}/sources`),
  context: () => request<ContextSummary>(`${base}/context`),
  relationships: () => request<KnowledgeRelationship[]>(`${base}/relationships`),
  uploadSource: (file: File) => {
    const body = new FormData()
    body.append("file", file)
    body.append("source_kind", "PITCH_FIXTURE")
    return request<{ source_id: string; status: string; job_id: string }>(`${base}/sources`, { method: "POST", body })
  },
}
