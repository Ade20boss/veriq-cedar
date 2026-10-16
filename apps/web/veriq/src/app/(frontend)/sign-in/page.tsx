import { Database, GitBranch, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SignInForm } from "../components/sign-in-form"
import { appAuth, getPostLoginPath } from "@/lib/app-auth"

export const dynamic = "force-dynamic"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string | string[] }>
}) {
  const query = await searchParams
  const invitation =
    typeof query.invitation === "string" ? query.invitation : undefined
  const user = await appAuth.getCurrentUser()
  if (user) redirect(getPostLoginPath(user, invitation))

  return (
    <main className="grid min-h-screen bg-[var(--canvas)] lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--brand-navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div className="relative z-10">
          <div
            className="veriq-logo mb-20 brightness-0 invert"
            aria-label="Veriq"
          >
            <img alt="Veriq" src="/veriq-logo.png" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
            Institutional intelligence
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Connected oversight for high-stakes operations.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Bring monitoring, investigations, evidence, and independent review
            into one accountable workspace.
          </p>
        </div>
        <div className="relative z-10 grid gap-3 sm:grid-cols-3">
          {[
            [Database, "Connected evidence"],
            [GitBranch, "Traceable decisions"],
            [ShieldCheck, "Controlled access"],
          ].map(([Icon, label]) => (
            <div
              className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur"
              key={label as string}
            >
              <Icon className="mb-3 size-5 text-teal-300" />
              <span className="text-sm font-semibold">{label as string}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="veriq-logo mb-12 lg:hidden" aria-label="Veriq">
            <img alt="Veriq" src="/veriq-logo.png" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--teal-text)]">
            Authorized access
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-navy)]">
            Sign in to your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Use the credentials issued by your institution. Your workspace and
            permitted workflows are selected after authentication.
          </p>

          {invitation && (
            <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--info-border)] bg-[var(--info-bg)] px-4 py-3 text-sm text-[var(--info)]">
              Sign in to continue your institution invitation.
            </div>
          )}

          <SignInForm invitation={invitation} />

          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-[var(--border)]" />
            Preview
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Link
            className="flex h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white text-sm font-semibold text-[var(--brand-navy)] transition hover:bg-slate-50"
            href="/demo"
          >
            Explore synthetic demo data
          </Link>

          <p
            className="mt-8 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--text-secondary)]"
            id="account-help"
          >
            Self-service registration and password recovery are not enabled.
            Contact your Veriq workspace administrator for access or credential
            support.
          </p>
        </div>
      </section>
    </main>
  )
}
