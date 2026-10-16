"use client"

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  veriqApi,
  type AIInvestigationOutput,
  type CaseInvestigation,
  type Incident,
  type KnowledgeRelationship,
  type RouteHealth,
  VeriqApiError,
} from "@/lib/veriq-api"

function Status({
  children,
  tone,
}: {
  children: ReactNode
  tone: "success" | "warning" | "error" | "neutral"
}) {
  return (
    <span className={`status-badge status-badge--${tone}`}>{children}</span>
  )
}
function ErrorState({
  error,
  onRetry,
}: {
  error: Error | null
  onRetry: () => void
}) {
  return (
    <section className="dashboard-state">
      <AlertCircle />
      <h2>Live Cedar data unavailable</h2>
      <p>
        {error?.message ??
          "The authorized investigator session or backend is unavailable."}{" "}
        No synthetic result is substituted.
      </p>
      <button
        className="button button--secondary"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </section>
  )
}
function Toolbar({
  loading,
  onRefresh,
}: {
  loading: boolean
  onRefresh: () => void
}) {
  return (
    <div className="page-header__actions">
      <button
        className="button button--secondary"
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        {loading ? <LoaderCircle className="spin" /> : <RefreshCw />} Refresh
        live data
      </button>
    </div>
  )
}

export function LiveOperationalMonitoring() {
  const [rows, setRows] = useState<RouteHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await veriqApi.getOperations("CED"))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught
          : new Error("Live operations could not be loaded."),
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  const degraded = rows.filter((row) => row.status === "DEGRADED").length
  const insufficient = rows.filter(
    (row) => row.status === "INSUFFICIENT_DATA",
  ).length
  return (
    <div className="monitoring-page">
      <div className="page-header">
        <div>
          <span className="page-header__eyebrow">Live Cedar demo · CED</span>
          <h1>Operational Monitoring</h1>
          <p>
            Backend-reported route health from the authorized investigator
            projection. No synthetic charts are shown in this live view.
          </p>
        </div>
        <Toolbar loading={loading} onRefresh={() => void load()} />
      </div>
      <div className="panel-alert">
        <ShieldCheck />
        <span>
          <strong>Pre-provisioned demonstration connection.</strong> Synthetic
          banking telemetry is read-only here. The endpoint does not return a
          last-observed timestamp; freshness is limited to this current
          snapshot.
        </span>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={() => void load()} />
      ) : loading ? (
        <section className="dashboard-state">
          <LoaderCircle className="spin" />
          <h2>Loading authorized route health</h2>
        </section>
      ) : (
        <>
          <div className="metric-grid">
            <Metric
              icon={Database}
              label="Routes returned"
              value={String(rows.length)}
              detail="Backend snapshot"
            />
            <Metric
              icon={TriangleAlert}
              label="Degraded"
              value={String(degraded)}
              detail="Backend status"
            />
            <Metric
              icon={Clock3}
              label="Insufficient data"
              value={String(insufficient)}
              detail="No health inference"
            />
          </div>
          <section className="showcase-section mt-6">
            <div className="section-heading">
              <div>
                <h2>Payment route health</h2>
                <p>
                  Cedar → G2 → Elm is shown separately from Cedar → G3 → Birch.
                </p>
              </div>
              <Status tone="neutral">Live API projection</Status>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Service</th>
                    <th>Window observations</th>
                    <th>Baseline observations</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.route_id}>
                      <td>
                        <strong>{row.route_id}</strong>
                      </td>
                      <td>{row.service_id ?? "Not returned"}</td>
                      <td>
                        {row.window_timeouts} timeouts / {row.window_attempts}{" "}
                        attempts
                      </td>
                      <td>
                        {row.baseline_timeouts} timeouts /{" "}
                        {row.baseline_attempts} attempts
                      </td>
                      <td>
                        <Status
                          tone={
                            row.status === "DEGRADED"
                              ? "error"
                              : row.status === "NORMAL"
                                ? "success"
                                : "warning"
                          }
                        >
                          {row.status}
                        </Status>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function LiveIncidents({
  incidentId,
  onOpen,
  onBack,
}: {
  incidentId?: string
  onOpen: (target: string) => void
  onBack: () => void
}) {
  const [rows, setRows] = useState<Incident[]>([])
  const [detail, setDetail] = useState<Incident | null>(null)
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (incidentId) {
        const [next, context] = await Promise.all([
          veriqApi.getIncident(incidentId, "CED"),
          veriqApi.getRelationships("CED"),
        ])
        setDetail(next)
        setRelationships(context)
      } else setRows(await veriqApi.getIncidents("CED"))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught
          : new Error("Live incidents could not be loaded."),
      )
    } finally {
      setLoading(false)
    }
  }, [incidentId])
  useEffect(() => {
    void load()
  }, [load])
  if (error)
    return (
      <div className="incidents-page">
        <ErrorState error={error} onRetry={() => void load()} />
      </div>
    )
  if (loading)
    return (
      <div className="incidents-page">
        <section className="dashboard-state">
          <LoaderCircle className="spin" />
          <h2>Loading authorized incidents</h2>
        </section>
      </div>
    )
  if (incidentId && detail)
    return (
      <div className="incidents-page">
        <div className="page-header">
          <div>
            <span className="page-header__eyebrow">
              Live Cedar demo · incident detail
            </span>
            <h1>{detail.id}</h1>
            <p>
              Backend-returned suspected incident. A suspected operational issue
              is not a confirmed root cause or financial outcome.
            </p>
          </div>
          <Toolbar loading={false} onRefresh={() => void load()} />
        </div>
        <button
          className="button button--secondary"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft />
          Back to incidents
        </button>
        <div className="metric-grid mt-6">
          <Metric
            icon={AlertCircle}
            label="Assessment"
            value={detail.status}
            detail="Backend status"
          />
          <Metric
            icon={FileSearch}
            label="Affected route"
            value={detail.route_id}
            detail="Backend route"
          />
          <Metric
            icon={Database}
            label="Evidence references"
            value={String(detail.evidence_ids.length)}
            detail="Available IDs"
          />
        </div>
        <section className="showcase-section mt-6">
          <div className="section-heading">
            <div>
              <h2>Detection context</h2>
              <p>
                {detail.finding_summary ?? "No finding summary was returned."}
              </p>
            </div>
            <Status tone="warning">Suspected · unverified cause</Status>
          </div>
          <dl className="detail-list">
            <div>
              <dt>First observed</dt>
              <dd>
                {detail.first_observed_at
                  ? new Date(detail.first_observed_at).toLocaleString()
                  : "Not returned"}
              </dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>
                {detail.evidence_ids.length
                  ? detail.evidence_ids.join(", ")
                  : "No evidence references returned"}
              </dd>
            </div>
            <div>
              <dt>Linked cases</dt>
              <dd>
                {detail.case_ids.length
                  ? detail.case_ids.map((id) => (
                      <button
                        className="technical-link"
                        key={id}
                        onClick={() => onOpen(`CASE:${id}`)}
                        type="button"
                      >
                        {id}
                      </button>
                    ))
                  : "No authorized case is linked to this incident"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="showcase-section mt-6">
          <h2>Supported institutional relationships</h2>
          <p className="muted-copy">
            Only backend-returned relationships are displayed; documented
            relationships do not establish causality.
          </p>
          <div className="source-list">
            {relationships
              .filter((item) => item.status === "DOCUMENTED")
              .map((item) => (
                <div className="source-row" key={item.id}>
                  <span>
                    <strong>
                      {item.from_entity_id} → {item.type} → {item.to_entity_id}
                    </strong>
                    <small>{item.source_id}</small>
                  </span>
                  <Status tone="warning">DOCUMENTED</Status>
                </div>
              ))}
          </div>
        </section>
      </div>
    )
  return (
    <div className="incidents-page">
      <div className="page-header">
        <div>
          <span className="page-header__eyebrow">Live Cedar demo · CED</span>
          <h1>Incidents</h1>
          <p>
            Persisted suspected incidents from the authorized Veriq backend. A
            suspected incident remains distinct from a confirmed cause.
          </p>
        </div>
        <Toolbar loading={false} onRefresh={() => void load()} />
      </div>
      {rows.length === 0 ? (
        <section className="dashboard-state">
          <CheckCircle2 />
          <h2>No incidents returned</h2>
          <p>
            An empty projection is not evidence that all routes are healthy.
          </p>
        </section>
      ) : (
        <section className="showcase-section">
          <div className="section-heading">
            <div>
              <h2>Incident registry</h2>
              <p>Backend-returned identifiers and evidence references.</p>
            </div>
            <Status tone="neutral">Live API projection</Status>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Observed</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        className="technical-link"
                        onClick={() => onOpen(`INC:${row.id}`)}
                        type="button"
                      >
                        {row.id}
                      </button>
                    </td>
                    <td>{row.route_id}</td>
                    <td>
                      <Status tone="warning">{row.status}</Status>
                    </td>
                    <td>
                      {row.first_observed_at
                        ? new Date(row.first_observed_at).toLocaleString()
                        : "Not returned"}
                    </td>
                    <td>{row.evidence_ids.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export function LiveCaseInvestigation({
  caseId,
  onBack,
}: {
  caseId?: string
  onBack: () => void
}) {
  const [record, setRecord] = useState<CaseInvestigation | null>(null)
  const [loading, setLoading] = useState(Boolean(caseId))
  const [error, setError] = useState<Error | null>(null)
  const requestGeneration = useRef(0)
  const load = useCallback(async () => {
    if (!caseId) return
    const generation = ++requestGeneration.current
    setLoading(true)
    setError(null)
    setRecord(null)
    try {
      const next = await veriqApi.getCase(caseId, "CED")
      if (generation !== requestGeneration.current) return
      if (next.case_id !== caseId) {
        setError(
          new Error(
            "The backend returned an investigation for a different case.",
          ),
        )
        return
      }
      setRecord(next)
    } catch (caught) {
      if (generation !== requestGeneration.current) return
      setError(
        caught instanceof Error
          ? caught
          : new Error("Authorized case investigation could not be loaded."),
      )
    } finally {
      if (generation === requestGeneration.current) setLoading(false)
    }
  }, [caseId])
  useEffect(() => {
    void load()
    return () => {
      requestGeneration.current += 1
    }
  }, [load])
  useEffect(() => {
    if (record?.status !== "AI_PENDING") return
    const interval = window.setInterval(() => void load(), 2000)
    return () => window.clearInterval(interval)
  }, [load, record?.status])
  if (!caseId)
    return (
      <div className="investigations-page">
        <section className="dashboard-state">
          <FileSearch />
          <h2>No authorized case selected</h2>
          <p>
            Open a case from a live backend incident or complaint-linked route.
            No investigation fixture is fabricated.
          </p>
          <button
            className="button button--secondary"
            onClick={onBack}
            type="button"
          >
            Back to incidents
          </button>
        </section>
      </div>
    )
  if (loading)
    return (
      <div className="investigations-page">
        <section className="dashboard-state">
          <LoaderCircle className="spin" />
          <h2>Loading authorized investigation</h2>
        </section>
      </div>
    )
  if (error || !record)
    return (
      <div className="investigations-page">
        <ErrorState error={error} onRetry={() => void load()} />
      </div>
    )
  const safeAiResult =
    record.ai_result &&
    record.ai_result.case_id === record.case_id &&
    record.ai_result.financial_outcome === record.financial_outcome
      ? record.ai_result
      : null
  const aiLabel =
    record.status === "AI_PENDING"
      ? "AI advisory pending"
      : safeAiResult
        ? "AI advisory available"
        : record.status === "EVIDENCE_READY_AI_UNAVAILABLE"
          ? "AI unavailable"
          : "No AI advisory returned"
  const aiTone =
    record.status === "AI_PENDING"
      ? "warning"
      : safeAiResult
        ? "neutral"
        : "neutral"
  return (
    <div className="investigations-page">
      <div className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Live Cedar demo · authorized case
          </span>
          <h1>{record.case_id}</h1>
          <p>
            Backend-returned case investigation and evidence. Financial outcome
            remains authoritative and separate from processing status.
          </p>
        </div>
      </div>
      <button
        className="button button--secondary"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft />
        Back to incidents
      </button>
      <div className="metric-grid mt-6">
        <Metric
          icon={FileSearch}
          label="Case status"
          value={record.status}
          detail="Backend processing state"
        />
        <Metric
          icon={ShieldCheck}
          label="Financial outcome"
          value={record.financial_outcome}
          detail="Backend-authoritative"
        />
        <Metric
          icon={Database}
          label="Evidence records"
          value={String(record.evidence.length)}
          detail="Returned references"
        />
      </div>
      <section className="showcase-section mt-6">
        <div className="section-heading">
          <div>
            <h2>Evidence</h2>
            <p>
              Evidence is displayed as returned; no AI conclusion is inferred.
            </p>
          </div>
          <Status tone={aiTone}>{aiLabel}</Status>
        </div>
        {record.evidence.length ? (
          <div className="source-list">
            {record.evidence.map((item) => (
              <div className="source-row" key={item.id}>
                <span>
                  <strong>{item.id}</strong>
                  <small>
                    {item.source_system} · {item.kind} ·{" "}
                    {item.verified_for_purpose
                      ? "verified for stated purpose"
                      : "not purpose-verified"}
                  </small>
                </span>
                <Status tone="warning">Source record</Status>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-alert">
            <Database />
            <span>
              No evidence records were returned. No outcome is inferred.
            </span>
          </div>
        )}
      </section>
      <AiAdvisoryPanel
        status={record.status}
        result={safeAiResult}
        outcomeMismatch={record.ai_result !== null && safeAiResult === null}
      />
    </div>
  )
}

function AiAdvisoryPanel({
  status,
  result,
  outcomeMismatch,
}: {
  status: CaseInvestigation["status"]
  result: AIInvestigationOutput | null
  outcomeMismatch: boolean
}) {
  if (status === "AI_PENDING")
    return (
      <section className="showcase-section mt-6">
        <div className="section-heading">
          <div>
            <h2>AI advisory</h2>
            <p>
              Evidence is ready. The browser is polling the existing protected
              case read while backend advisory work remains pending.
            </p>
          </div>
          <Status tone="warning">Pending</Status>
        </div>
      </section>
    )
  if (outcomeMismatch)
    return (
      <section className="showcase-section mt-6">
        <div className="section-heading">
          <div>
            <h2>AI advisory withheld</h2>
            <p>
              The returned advisory did not match this case identity and
              financial outcome, so it is not displayed.
            </p>
          </div>
          <Status tone="warning">Validation required</Status>
        </div>
      </section>
    )
  if (!result)
    return (
      <section className="showcase-section mt-6">
        <div className="section-heading">
          <div>
            <h2>AI advisory</h2>
            <p>
              {status === "EVIDENCE_READY_AI_UNAVAILABLE"
                ? "AI is unavailable; evidence remains available for investigator review."
                : "No advisory result was returned for this investigation."}
            </p>
          </div>
          <Status tone="neutral">Unavailable</Status>
        </div>
      </section>
    )
  return (
    <section className="showcase-section mt-6">
      <div className="section-heading">
        <div>
          <h2>AI advisory</h2>
          <p>
            Advisory information only. It does not change the financial outcome,
            establish cause, or publish a customer update.
          </p>
        </div>
        <Status tone="neutral">Requires investigator review</Status>
      </div>
      <AdvisoryList
        title="Observations"
        items={result.observations.map((item) => ({
          text: item.text,
          evidence: item.evidence_ids,
        }))}
      />
      <AdvisoryList
        title="Hypotheses"
        items={result.hypotheses.map((item) => ({
          text: item.text,
          evidence: item.evidence_ids,
          alternatives: item.alternatives,
        }))}
      />
      <AdvisoryList
        title="Unknowns"
        items={result.unknowns.map((text) => ({ text }))}
      />
      <AdvisoryList
        title="Recommended checks"
        items={result.recommended_checks.map((text) => ({ text }))}
      />
      <div className="panel-alert mt-6">
        <ShieldCheck />
        <span>
          <strong>Customer-safe update draft.</strong>{" "}
          {result.customer_safe_update_draft} This is a draft only; no customer
          communication has been published.
        </span>
      </div>
    </section>
  )
}

function AdvisoryList({
  title,
  items,
}: {
  title: string
  items: Array<{
    text: string
    evidence?: string[]
    alternatives?: string[]
  }>
}) {
  if (!items.length) return null
  return (
    <div className="mt-6">
      <h3>{title}</h3>
      <div className="source-list">
        {items.map((item, index) => (
          <div className="source-row" key={`${title}-${index}`}>
            <span>
              <strong>{item.text}</strong>
              {item.evidence?.length ? (
                <small>Evidence: {item.evidence.join(", ")}</small>
              ) : null}
              {item.alternatives?.length ? (
                <small>Alternatives: {item.alternatives.join("; ")}</small>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="metric-card">
      <div className="metric-card__top">
        <span>{label}</span>
        <Icon />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  )
}
