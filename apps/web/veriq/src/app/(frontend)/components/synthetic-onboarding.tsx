"use client"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Database,
  FileCheck2,
  KeyRound,
  LoaderCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type Step = "institution" | "connection" | "permissions" | "sync" | "knowledge"
type Institution = { id: string; name: string; type: string; country: string }

const STORAGE_KEY = "veriq.synthetic-demo.v1"
const institutions: Institution[] = [
  { id: "cedar-demo", name: "Cedar Bank — Demo Workspace", type: "Commercial bank", country: "Nigeria" },
  { id: "northstar-demo", name: "Northstar Research Institute", type: "Research institution", country: "United Kingdom" },
]
const stages = [
  "Establishing connection",
  "Validating authorization",
  "Discovering permitted services",
  "Registering operational sources",
  "Verifying connection health",
  "Finalizing integration",
]
const knowledge = [
  ["Services", "services.json"],
  ["Dependencies", "dependencies.csv"],
  ["Payment Routes", "routes.json"],
  ["Historical Incidents", "historical_incidents.md"],
  ["Operational Procedures", "operations_sop.txt"],
] as const

function readState() {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>
  } catch {
    return {}
  }
}

function saveState(value: Record<string, unknown>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readState(), ...value }))
}

function stepFor(value: string | undefined): Step {
  return ["institution", "connection", "permissions", "sync", "knowledge"].includes(value ?? "")
    ? (value as Step)
    : "institution"
}

export default function SyntheticOnboarding({ requestedStep }: { requestedStep: string }) {
  const [step, setStep] = useState<Step>(stepFor(requestedStep))
  const [selected, setSelected] = useState<Institution | null>(null)
  const [institutionType, setInstitutionType] = useState("")
  const [country, setCountry] = useState("")
  const [email, setEmail] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [syncStage, setSyncStage] = useState(-1)
  const [syncFailed, setSyncFailed] = useState(false)
  const [knowledgeReady, setKnowledgeReady] = useState(false)

  useEffect(() => {
    const state = readState()
    const saved = institutions.find((item) => item.id === state.institutionId)
    if (saved) setSelected(saved)
    if (typeof state.institutionType === "string") setInstitutionType(state.institutionType)
    if (typeof state.country === "string") setCountry(state.country)
    if (typeof state.email === "string") setEmail(state.email)
    if (state.authorizationAcknowledged === true) setAuthorized(true)
    if (state.knowledgeReady === true) setKnowledgeReady(true)
  }, [])

  useEffect(() => {
    if (step !== "sync" || syncStage >= stages.length - 1 || syncFailed) return
    const timer = window.setTimeout(() => setSyncStage((value) => value + 1), 750)
    return () => window.clearTimeout(timer)
  }, [step, syncStage, syncFailed])

  const selectedId = selected?.id ?? "cedar-demo"
  const progress = useMemo(() => ["institution", "connection", "permissions", "sync", "knowledge"].indexOf(step), [step])
  const go = (next: Step) => {
    setStep(next)
    window.history.pushState({}, "", `/onboarding/${next}?mode=synthetic${selected ? `&institutionId=${selected.id}` : ""}`)
  }

  const chooseInstitution = () => {
    if (!selected || !institutionType || !country || !email || !authorized) return
    saveState({ institutionId: selected.id, institutionName: selected.name, institutionType, country, email, authorizationAcknowledged: true })
    go("connection")
  }

  const startSync = () => {
    saveState({ connector: "synthetic-demo", permissionsAcknowledged: true })
    setSyncFailed(false)
    setSyncStage(0)
    go("sync")
  }

  const finishKnowledge = () => {
    saveState({ knowledgeReady: true, onboardingComplete: true })
    setKnowledgeReady(true)
    window.location.assign(`/w/${selectedId}/overview?mode=synthetic`)
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <a className="veriq-logo" href="/demo"><img alt="Veriq" src="/veriq-logo.png" /></a>
          <span className="rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--warning)]">Synthetic demo mode</span>
        </header>
        <section className="mb-8 rounded-2xl border border-[var(--info-border)] bg-[var(--info-bg)] p-5 sm:p-6">
          <div className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-[var(--teal-text)]" /><div><strong className="text-sm text-[var(--brand-navy)]">Explicit, institution-scoped setup</strong><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">This walkthrough registers synthetic context only. It does not create production permissions, access a live banking system, or prove institutional ownership.</p></div></div>
        </section>
        <div className="mb-10 grid grid-cols-5 gap-2" aria-label="Onboarding progress">
          {["Institution", "Connection", "Permissions", "Sync", "Knowledge"].map((label, index) => <div key={label} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]"><span className={`grid size-7 place-items-center rounded-full border ${index < progress ? "border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]" : index === progress ? "border-[var(--brand-teal)] bg-[var(--brand-teal)] text-white" : "border-[var(--border-strong)] bg-white"}`}>{index < progress ? <Check className="size-4" /> : index + 1}</span><span className="hidden sm:inline">{label}</span></div>)}
        </div>
        {step === "institution" && <InstitutionStep selected={selected} setSelected={setSelected} institutionType={institutionType} setInstitutionType={setInstitutionType} country={country} setCountry={setCountry} email={email} setEmail={setEmail} authorized={authorized} setAuthorized={setAuthorized} onContinue={chooseInstitution} />}
        {step === "connection" && <ConnectionStep onBack={() => go("institution")} onContinue={() => go("permissions")} />}
        {step === "permissions" && <PermissionStep institution={selected?.name ?? "Selected institution"} onBack={() => go("connection")} onContinue={startSync} />}
        {step === "sync" && <SyncStep stage={syncStage} failed={syncFailed} onRetry={() => { setSyncFailed(false); setSyncStage(0) }} onContinue={() => go("knowledge")} />}
        {step === "knowledge" && <KnowledgeStep ready={knowledgeReady} onBack={() => go("sync")} onContinue={finishKnowledge} />}
      </div>
    </main>
  )
}

function Section({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-8"><span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--teal-text)]">{eyebrow}</span><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>{children}</section>
}

function Actions({ back, next, disabled, onBack, onNext }: { back?: string; next: string; disabled?: boolean; onBack?: () => void; onNext: () => void }) {
  return <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-6">{back && <button className="button button--secondary" onClick={onBack} type="button"><ArrowLeft className="size-4" />{back}</button>}<button className="button button--primary ml-auto" disabled={disabled} onClick={onNext} type="button">{next}<ArrowRight className="size-4" /></button></div>
}

function InstitutionStep({ selected, setSelected, institutionType, setInstitutionType, country, setCountry, email, setEmail, authorized, setAuthorized, onContinue }: { selected: Institution | null; setSelected: (value: Institution) => void; institutionType: string; setInstitutionType: (value: string) => void; country: string; setCountry: (value: string) => void; email: string; setEmail: (value: string) => void; authorized: boolean; setAuthorized: (value: boolean) => void; onContinue: () => void }) {
  return <Section eyebrow="01 · Institution registration" title="Which institution are you setting up?" copy="Choose a synthetic workspace intentionally. An institution name alone never grants membership or proves ownership."><div className="mt-7 grid gap-3 sm:grid-cols-2">{institutions.map((item) => <button key={item.id} className={`rounded-xl border p-4 text-left transition ${selected?.id === item.id ? "border-[var(--brand-teal)] bg-[var(--selected)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`} onClick={() => setSelected(item)} type="button"><span className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg bg-[var(--selected)] text-[var(--teal-text)]"><Database className="size-5" /></span>{selected?.id === item.id && <CheckCircle2 className="size-5 text-[var(--success)]" />}</span><strong className="mt-4 block text-sm text-[var(--brand-navy)]">{item.name}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{item.type} · {item.country}</span></button>)}</div><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="field"><span className="field__label">Institution type</span><select className="input" value={institutionType} onChange={(event) => setInstitutionType(event.target.value)}><option value="">Select type</option><option>Commercial bank</option><option>Research institution</option><option>Financial services provider</option></select></label><label className="field"><span className="field__label">Country / jurisdiction</span><input className="input" placeholder="e.g. Nigeria" value={country} onChange={(event) => setCountry(event.target.value)} /></label><label className="field sm:col-span-2"><span className="field__label">Institutional email</span><input className="input" type="email" placeholder="operations@example.org" value={email} onChange={(event) => setEmail(event.target.value)} /></label></div><label className="mt-6 flex items-start gap-3 text-sm leading-6 text-[var(--text-secondary)]"><input className="mt-1 size-4 accent-[var(--brand-teal)]" type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />I am authorized to configure this synthetic demonstration workspace. This acknowledgement is recorded only in this browser and does not grant production access.</label><Actions next="Review connection methods" disabled={!selected || !institutionType || !country || !email || !authorized} onNext={onContinue} /></Section>
}

function ConnectionStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const options = [["Authorized Banking API", "Requires approved live connector configuration.", KeyRound, false], ["Approved Operational Event Feed", "Requires a verified event-feed integration.", Radio, false], ["Synthetic Demo Connector", "Deterministic synthetic sources for this walkthrough.", Sparkles, true]] as const
  return <Section eyebrow="02 · Connection method" title="How should Veriq receive institution context?" copy="Real connectors remain unavailable until their backend authorization is configured. Select the synthetic connector to continue the demonstration."><div className="mt-7 grid gap-3">{options.map(([title, description, Icon, available]) => <div className={`flex items-start gap-4 rounded-xl border p-4 ${available ? "border-[var(--brand-teal)] bg-[var(--selected)]" : "border-[var(--border)] opacity-65"}`} key={title}><span className="grid size-10 place-items-center rounded-lg bg-white text-[var(--teal-text)]"><Icon className="size-5" /></span><div className="flex-1"><strong className="text-sm text-[var(--brand-navy)]">{title}</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${available ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--canvas)] text-[var(--text-secondary)]"}`}>{available ? "Available" : "Integration required"}</span></div>)}</div><div className="mt-6 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning)]"><strong>Simulation boundary:</strong> no bank OAuth, live API authorization, credentials or settlement actions are used.</div><Actions back="Change institution" next="Review simulated permissions" onBack={onBack} onNext={onContinue} /></Section>
}

function PermissionStep({ institution, onBack, onContinue }: { institution: string; onBack: () => void; onContinue: () => void }) {
  const scopes = ["Read operational payment events", "Read permitted transaction-status information", "Read service-health telemetry", "Read reconciliation events", "Read authorized complaint events"]
  const [ack, setAck] = useState(false)
  return <Section eyebrow="03 · Permission review" title="Review the requested capabilities" copy="These are read-only categories requested by the synthetic connector. No refund, reversal, balance modification or settlement capability is requested."><div className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-xl bg-[var(--canvas)] p-5"><span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Selected institution</span><strong className="mt-2 block text-sm text-[var(--brand-navy)]">{institution}</strong><span className="mt-5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Environment</span><span className="mt-2 inline-flex rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--warning)]">Synthetic demo · simulated</span></div><div className="space-y-2">{scopes.map((scope) => <div className="flex gap-3 rounded-lg border border-[var(--border)] p-3" key={scope}><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--teal-text)]" /><span className="text-sm text-[var(--text-secondary)]">{scope}</span></div>)}</div></div><label className="mt-6 flex items-start gap-3 text-sm leading-6 text-[var(--text-secondary)]"><input className="mt-1 size-4 accent-[var(--brand-teal)]" type="checkbox" checked={ack} onChange={(event) => setAck(event.target.checked)} />I understand these capabilities are simulated for this demo and do not represent verified production authorization.</label><Actions back="Connection method" next="Confirm simulated connection" disabled={!ack} onBack={onBack} onNext={onContinue} /></Section>
}

function SyncStep({ stage, failed, onRetry, onContinue }: { stage: number; failed: boolean; onRetry: () => void; onContinue: () => void }) {
  const complete = stage >= stages.length - 1
  return <Section eyebrow="04 · Synchronization" title="Registering the permitted context" copy="A deterministic sequence is running for the synthetic connector. Backend-reported progress is not being implied."><div className="mt-7 rounded-xl border border-[var(--border)] p-5 sm:p-7"><div className="space-y-0">{stages.map((label, index) => { const done = index < stage; const active = index === stage && !complete; return <div className="flex gap-4" key={label}><div className="flex flex-col items-center"><span className={`grid size-8 place-items-center rounded-full border ${done ? "border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]" : active ? "border-[var(--brand-teal)] bg-[var(--selected)] text-[var(--teal-text)]" : "border-[var(--border-strong)] text-[var(--text-secondary)]"}`}>{done ? <Check className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin" /> : <Circle className="size-3" />}</span>{index < stages.length - 1 && <span className={`my-1 h-8 w-px ${index < stage ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />}</div><div className="pb-5"><strong className={`text-sm ${active ? "text-[var(--brand-navy)]" : "text-[var(--text-secondary)]"}`}>{label}</strong><p className="mt-1 text-xs text-[var(--text-secondary)]">{done ? "Completed" : active ? "Running" : "Waiting"}</p></div></div>})}</div><div className="mt-2 rounded-lg bg-[var(--brand-navy)] p-4 font-mono text-xs leading-6 text-slate-200" aria-live="polite"><div className="mb-2 flex items-center gap-2 font-sans font-semibold text-white"><UploadCloud className="size-4 text-[var(--brand-teal)]" />Technical activity log</div><div>• {stage >= 0 ? "Synthetic connector initialized" : "Waiting to initialize"}</div><div>• {stage >= 2 ? "Permitted source categories discovered" : "Awaiting source discovery"}</div><div>• {complete ? "Synthetic operational sources registered" : "Preparing source registration"}</div></div>{complete && <div className="mt-5 flex gap-3 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm text-[var(--success)]"><CheckCircle2 className="size-5 shrink-0" /><span><strong>Simulation completed.</strong> Synthetic operational sources are ready.</span></div>}{failed && <div className="mt-5 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error)]">The simulated connector paused before completion. No external system was changed.</div>}<div className="mt-6 flex justify-end gap-3">{failed && <button className="button button--secondary" onClick={onRetry} type="button">Retry simulation</button>}{complete && <button className="button button--primary" onClick={onContinue} type="button">Continue to Knowledge Setup<ArrowRight className="size-4" /></button>}</div></div></Section>
}

function KnowledgeStep({ ready, onBack, onContinue }: { ready: boolean; onBack: () => void; onContinue: () => void }) {
  return <Section eyebrow="05 · Institutional knowledge" title="Register the operating context" copy="Synthetic fixture categories are registered for the demonstration. Registration is not the same as human review or verified extraction."><div className="mt-7 grid gap-3 sm:grid-cols-2">{knowledge.map(([category, filename]) => <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4" key={category}><FileCheck2 className="size-5 shrink-0 text-[var(--teal-text)]" /><div className="min-w-0 flex-1"><strong className="block text-sm text-[var(--brand-navy)]">{category}</strong><span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{filename} · synthetic fixture</span></div><span className="rounded-full bg-[var(--success-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--success)]">Registered</span></div>)}</div><div className="mt-6 flex gap-3 rounded-xl border border-[var(--info-border)] bg-[var(--info-bg)] p-4 text-sm text-[var(--text-secondary)]"><FileCheck2 className="size-5 shrink-0 text-[var(--info)]" /><span><strong className="text-[var(--brand-navy)]">Readiness:</strong> sources registered, provenance retained, human review still required before institutional conclusions are approved.</span></div><Actions back="Synchronization" next={ready ? "Enter Intelligence Overview" : "Register knowledge and enter workspace"} onBack={onBack} onNext={onContinue} /></Section>
}
