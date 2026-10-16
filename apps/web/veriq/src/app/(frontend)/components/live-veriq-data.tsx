"use client"

import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileUp,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import {
  veriqApi,
  type ContextSummary,
  type Incident,
  type KnowledgeRelationship,
  type RouteHealth,
  type SourceRecord,
} from "@/lib/veriq-api"
import { runSourceUploadBatch, sha256File } from "./source-upload-runtime.js"

type DataState = "loading" | "ready" | "empty" | "error"

export default function LiveVeriqData({ bankId = "CED" }: { bankId?: string }) {
  const [state, setState] = useState<DataState>("loading")
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [context, setContext] = useState<ContextSummary | null>(null)
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>(
    [],
  )
  const [operations, setOperations] = useState<RouteHealth[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const uploadInFlight = useRef(false)
  const requestGeneration = useRef(0)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    const generation = ++requestGeneration.current
    if (loaded.current) setRefreshing(true)
    else setState("loading")
    setError(null)
    try {
      const [
        nextSources,
        nextContext,
        nextRelationships,
        nextOperations,
        nextIncidents,
      ] = await Promise.all([
        veriqApi.getSources(bankId),
        veriqApi.getContext(bankId),
        veriqApi.getRelationships(bankId),
        veriqApi.getOperations(bankId),
        veriqApi.getIncidents(bankId),
      ])
      if (generation !== requestGeneration.current) return
      setSources(nextSources)
      setContext(nextContext)
      setRelationships(nextRelationships)
      setOperations(nextOperations)
      setIncidents(nextIncidents)
      loaded.current = true
      setState(
        nextSources.length ||
          nextRelationships.length ||
          nextOperations.length ||
          nextIncidents.length
          ? "ready"
          : "empty",
      )
    } catch (caught) {
      if (generation !== requestGeneration.current) return
      setError(
        caught instanceof Error
          ? caught
          : new Error("The Veriq backend could not be reached."),
      )
      if (!loaded.current) setState("error")
      throw caught
    } finally {
      if (generation === requestGeneration.current) setRefreshing(false)
    }
  }, [bankId])

  useEffect(() => {
    loaded.current = false
    void load().catch(() => {})
    return () => {
      requestGeneration.current += 1
    }
  }, [load])

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (uploadInFlight.current) return
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (!selected.length) return
    uploadInFlight.current = true
    setUploading(true)
    setUploadMessage("Checking selected files…")
    try {
      const result = await runSourceUploadBatch(selected, {
        existingSources: sources,
        fingerprint: sha256File,
        upload: (file: File) => veriqApi.uploadSource(file, bankId),
        refresh: load,
        onProgress: setUploadMessage,
      })
      setUploadMessage(result.message)
    } finally {
      uploadInFlight.current = false
      setUploading(false)
    }
  }

  return (
    <section className="showcase-section mt-6" aria-live="polite">
      <div className="section-heading">
        <div>
          <span className="demo-label">Live adapter · bank {bankId}</span>
          <h2>Institutional context</h2>
          <p>
            Reads the authorized Veriq API through same-origin relative
            requests. Cedar&apos;s private investigator session remains
            authoritative.
          </p>
        </div>
        <SecondaryButton
          icon={RefreshCw}
          loading={refreshing || state === "loading"}
          onClick={() => void load().catch(() => {})}
        >
          Refresh
        </SecondaryButton>
      </div>
      {state === "loading" && (
        <div className="panel-alert">
          <LoaderCircle className="spin" />
          <span>Loading authorized institutional context…</span>
        </div>
      )}
      {error && (
        <div className="panel-alert">
          <AlertCircle />
          <span>
            <strong>Live Veriq data unavailable.</strong> {error.message} A
            missing or forbidden investigator session is not replaced with
            synthetic backend results.
          </span>
        </div>
      )}
      {state === "empty" && (
        <div className="panel-alert">
          <Database />
          <span>
            <strong>No sources or operational records registered yet.</strong>{" "}
            An authorized investigator can submit an approved source below. An
            empty projection is not evidence that the institution is healthy.
          </span>
        </div>
      )}
      {(state === "ready" || state === "empty") && (
        <div className="live-data-grid mt-6">
          <div>
            <h3>Approved sources</h3>
            <p className="muted-copy">
              Actual backend source metadata, status and checksums.
            </p>
            <div className="source-list">
              {sources.length ? (
                sources.map((source) => (
                  <div className="source-row" key={source.source_id}>
                    <span>
                      <strong>{source.filename}</strong>
                      <small>
                        {source.source_id} ·{" "}
                        {source.checksum_sha256
                          ? `${source.checksum_sha256.slice(0, 12)}…`
                          : "checksum unavailable"}
                      </small>
                    </span>
                    <StatusBadge
                      kind={
                        source.status === "FAILED" ||
                        source.status === "REJECTED"
                          ? "error"
                          : source.status === "PARSED" ||
                              source.status === "ACCEPTED"
                            ? "success"
                            : "warning"
                      }
                    >
                      {source.status}
                    </StatusBadge>
                  </div>
                ))
              ) : (
                <p className="muted-copy">
                  No sources returned for this institution.
                </p>
              )}
            </div>
          </div>
          <div>
            <h3>Register approved fixtures</h3>
            <p className="muted-copy">
              Only authorized investigators can upload the five supported
              fixture filenames. Select files from{" "}
              <code>fixtures/onboarding</code>; existing identical files are
              skipped. HTTP 202 alone is not registration success.
            </p>
            <label className="button button--secondary">
              <FileUp />
              {uploading ? "Processing selected files…" : "Choose source files"}
              <input
                hidden
                disabled={uploading}
                multiple
                type="file"
                onChange={(event) => void upload(event)}
              />
            </label>
            {uploadMessage && (
              <p className="field__hint mt-2" role="status">
                {uploadMessage}
              </p>
            )}
          </div>
        </div>
      )}
      {state === "ready" && context && (
        <>
          <div className="metric-grid mt-6">
            <MetricCard
              label="Context version"
              value={String(context.context_version)}
              context={`${context.source_count} registered sources`}
              icon={Database}
            />
            <MetricCard
              label="Entities"
              value={String(
                Object.values(context.entity_counts).reduce(
                  (sum, value) => sum + value,
                  0,
                ),
              )}
              context="Backend-reported count"
              icon={ShieldCheck}
            />
            <MetricCard
              label="Relationships"
              value={String(relationships.length)}
              context={`${context.verified_count} verified claims`}
              icon={CheckCircle2}
            />
            <MetricCard
              label="Incidents"
              value={String(incidents.length)}
              context="Persisted suspected records"
              icon={TriangleAlert}
            />
          </div>
          <div className="mt-6">
            <h3>Operational route snapshot</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Service</th>
                    <th>Window</th>
                    <th>Baseline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((item) => (
                    <tr key={item.route_id}>
                      <td>{item.route_id}</td>
                      <td>{item.service_id ?? "—"}</td>
                      <td>
                        {item.window_timeouts}/{item.window_attempts} timeouts
                      </td>
                      <td>
                        {item.baseline_timeouts}/{item.baseline_attempts}{" "}
                        timeouts
                      </td>
                      <td>
                        <StatusBadge
                          kind={
                            item.status === "DEGRADED"
                              ? "error"
                              : item.status === "NORMAL"
                                ? "success"
                                : "warning"
                          }
                        >
                          {item.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6">
            <h3>Documented relationships</h3>
            <p className="muted-copy">
              Relationships remain DOCUMENTED unless the backend reports another
              status; no claim is promoted to VERIFIED here.
            </p>
            <div className="source-list">
              {relationships.map((relationship) => (
                <div className="source-row" key={relationship.id}>
                  <span>
                    <strong>
                      {relationship.from_entity_id} → {relationship.type} →{" "}
                      {relationship.to_entity_id}
                    </strong>
                    <small>
                      {relationship.source_id} ·{" "}
                      {relationship.evidence_ids.length} evidence references
                    </small>
                  </span>
                  <StatusBadge
                    kind={
                      relationship.status === "VERIFIED" ? "success" : "warning"
                    }
                  >
                    {relationship.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function SecondaryButton({
  children,
  icon: Icon,
  loading,
  onClick,
}: {
  children: React.ReactNode
  icon: typeof RefreshCw
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      className="button button--secondary"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      {loading ? <LoaderCircle className="spin" /> : <Icon />}
      {children}
    </button>
  )
}
function MetricCard({
  label,
  value,
  context,
  icon: Icon,
}: {
  label: string
  value: string
  context: string
  icon: typeof Database
}) {
  return (
    <div className="metric-card">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{context}</small>
    </div>
  )
}
function StatusBadge({
  children,
  kind,
}: {
  children: React.ReactNode
  kind: "success" | "warning" | "error"
}) {
  return (
    <span className={`status-badge status-badge--${kind}`}>{children}</span>
  )
}
