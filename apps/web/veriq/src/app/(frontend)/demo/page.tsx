import Link from "next/link"

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-10">
        <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--teal-text)]">Veriq · synthetic demonstration</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--brand-navy)]">Set up intelligence for an institution</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Walk through explicit institution selection, a simulated connector, read-only permission review, synchronization and institutional knowledge registration before entering the workspace.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link className="button button--primary" href="/onboarding/institution?mode=synthetic">Start synthetic setup <span aria-hidden="true">→</span></Link><Link className="button button--secondary" href="/sign-in">Use authenticated sign in</Link></div>
        <p className="mt-6 text-xs leading-5 text-[var(--warning)]">Synthetic demo mode — no live institution data, credentials or authenticated backend session is used.</p>
      </div>
    </main>
  )
}
