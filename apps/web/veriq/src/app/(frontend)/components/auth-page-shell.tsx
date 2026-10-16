import { ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

type AuthPageShellProps = {
  children: ReactNode
  eyebrow: string
  title: string
}

export function AuthPageShell({
  children,
  eyebrow,
  title,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="veriq-logo" aria-label="Veriq">
            <img alt="Veriq" src="/veriq-logo.png" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--teal-text)]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Secure workspace
          </div>
        </div>
        <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-menu)] sm:p-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--teal-text)]">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-3xl">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </main>
  )
}
