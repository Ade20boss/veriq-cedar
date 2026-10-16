"use client"

import { AlertCircle, CheckCircle2, Database, FileUp, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useState, type ChangeEvent } from "react"
import { veriqApi, type ContextSummary, type Incident, type KnowledgeRelationship, type RouteHealth, type SourceRecord, VeriqApiError } from "@/lib/veriq-api"

const fixtureOrder = ["services.json", "dependencies.csv", "routes.json", "historical_incidents.md", "operations_sop.txt"]
type DataState = "loading" | "ready" | "empty" | "error"

export default function LiveVeriqData({ bankId = "CED" }: { bankId?: string }) {
  const [state, setState] = useState<DataState>("loading")
  const [error, setError] = useState<VeriqApiError | Error | null>(null)
  const [context, setContext] = useState<ContextSummary | null>(null)
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>([])
  const [operations, setOperations] = useState<RouteHealth[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [uploading, setUploading] = useState<string[]>([])
  const [uploadMessage, setUploadMessage] = useState("")

  const load = useCallback(async () => {
    setState("loading")
    setError(null)
    try {
      const [nextSources, nextContext, nextRelationships, nextOperations, nextIncidents] = await Promise.all([
        veriqApi.getSources(bankId), veriqApi.getContext(bankId), veriqApi.getRelationships(bankId), veriqApi.getOperations(bankId), veriqApi.getIncidents(bankId),
      ])
      setSources(nextSources); setContext(nextContext); setRelationships(nextRelationships); setOperations(nextOperations); setIncidents(nextIncidents)
      setState(nextSources.length || nextRelationships.length || nextOperations.length || nextIncidents.length ? "ready" : "empty")
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("The Veriq backend could not be reached."))
      setState("error")
    }
  }, [bankId])

  useEffect(() => { void load() }, [load])

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).sort((a, b) => fixtureOrder.indexOf(a.name) - fixtureOrder.indexOf(b.name))
    event.target.value = ""
    const invalid = selected.find((file) => !fixtureOrder.includes(file.name))
    if (invalid) { setUploadMessage(`${invalid.name} is not one of the five approved onboarding fixtures.`); return }
    const duplicates = selected.find((file) => sources.some((source) => source.filename === file.name))
    if (duplicates) { setUploadMessage(`${duplicates.name} is already registered; duplicate submission was prevented.`); return }
    for (const file of selected) {
      setUploading((items) => [...items, file.name]); setUploadMessage(`Uploading ${file.name}…`)
      try {
        const registration = await veriqApi.uploadSource(file, bankId)
        setUploadMessage(`${file.name}: backend returned ${registration.status}. Refreshing source metadata…`)
        await load()
      } catch (caught) {
        setUploadMessage(`${file.name}: ${caught instanceof Error ? caught.message : "upload failed"}`)
        break
      } finally { setUploading((items) => items.filter((item) => item !== file.name)) }
    }
  }

  return <section className="showcase-section mt-6" aria-live="polite">
    <div className="section-heading"><div><span className="demo-label">Live adapter · bank {bankId}</span><h2>Institutional context</h2><p>Reads the authorized Veriq API through same-origin relative requests. Cedar's private investigator session remains authoritative.</p></div><SecondaryButton icon={RefreshCw} loading={state === "loading"} onClick={() => void load()}>Refresh</SecondaryButton></div>
    {state === "error" && <div className="panel-alert"><AlertCircle /><span><strong>Live Veriq data unavailable.</strong> {error?.message} A missing or forbidden investigator session is not replaced with synthetic backend results.</span></div>}
    {state === "empty" && <div className="panel-alert"><Database /><span><strong>No authorized context returned.</strong> The backend returned an empty projection; this is not evidence that the institution is healthy.</span></div>}
    {state === "ready" && context && <>
      <div className="metric-grid"><MetricCard label="Context version" value={String(context.context_version)} context={`${context.source_count} registered sources`} icon={Database} /><MetricCard label="Entities" value={String(Object.values(context.entity_counts).reduce((sum, value) => sum + value, 0))} context="Backend-reported count" icon={ShieldCheck} /><MetricCard label="Relationships" value={String(relationships.length)} context={`${context.verified_count} verified claims`} icon={CheckCircle2} /><MetricCard label="Incidents" value={String(incidents.length)} context="Persisted suspected records" icon={TriangleAlert} /></div>
      <div className="live-data-grid"><div><h3>Approved sources</h3><p className="muted-copy">Actual source metadata, status and checksums.</p><div className="source-list">{sources.map((source) => <div className="source-row" key={source.source_id}><span><strong>{source.filename}</strong><small>{source.source_id} · {source.checksum_sha256 ? `${source.checksum_sha256.slice(0, 12)}…` : "checksum unavailable"}</small></span><StatusBadge kind={source.status === "FAILED" || source.status === "REJECTED" ? "error" : source.status === "PARSED" || source.status === "ACCEPTED" ? "success" : "warning"}>{source.status}</StatusBadge></div>)}</div></div><div><h3>Register approved fixtures</h3><p className="muted-copy">Upload files from <code>fixtures/onboarding</code> in the approved order. The browser sends no credentials beyond its same-origin session.</p><label className="button button--secondary"><FileUp />{uploading.length ? `Uploading ${uploading[0]}…` : "Choose five fixture files"}<input hidden disabled={uploading.length > 0} multiple type="file" onChange={upload} /></label>{uploadMessage && <p className="field__hint mt-2">{uploadMessage}</p>}</div></div>
      <div className="mt-6"><h3>Operational route snapshot</h3><div className="table-wrap"><table><thead><tr><th>Route</th><th>Service</th><th>Window</th><th>Baseline</th><th>Status</th></tr></thead><tbody>{operations.map((item) => <tr key={item.route_id}><td>{item.route_id}</td><td>{item.service_id ?? "—"}</td><td>{item.window_timeouts}/{item.window_attempts} timeouts</td><td>{item.baseline_timeouts}/{item.baseline_attempts} timeouts</td><td><StatusBadge kind={item.status === "DEGRADED" ? "error" : item.status === "NORMAL" ? "success" : "warning"}>{item.status}</StatusBadge></td></tr>)}</tbody></table></div></div>
      <div className="mt-6"><h3>Documented relationships</h3><p className="muted-copy">Relationships remain DOCUMENTED unless the backend reports another status; no claim is promoted to VERIFIED here.</p><div className="source-list">{relationships.map((relationship) => <div className="source-row" key={relationship.id}><span><strong>{relationship.from_entity_id} → {relationship.type} → {relationship.to_entity_id}</strong><small>{relationship.source_id} · {relationship.evidence_ids.length} evidence references</small></span><StatusBadge kind={relationship.status === "VERIFIED" ? "success" : "warning"}>{relationship.status}</StatusBadge></div>)}</div></div>
    </>}
  </section>
}

function SecondaryButton({ children, icon: Icon, loading, onClick }: { children: React.ReactNode; icon: typeof RefreshCw; loading?: boolean; onClick: () => void }) { return <button className="button button--secondary" disabled={loading} onClick={onClick} type="button">{loading ? <LoaderCircle className="spin" /> : <Icon />}{children}</button> }
function MetricCard({ label, value, context, icon: Icon }: { label: string; value: string; context: string; icon: typeof Database }) { return <div className="metric-card"><Icon /><span>{label}</span><strong>{value}</strong><small>{context}</small></div> }
function StatusBadge({ children, kind }: { children: React.ReactNode; kind: "success" | "warning" | "error" }) { return <span className={`status-badge status-badge--${kind}`}>{children}</span> }
