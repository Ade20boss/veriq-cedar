import { AuthPageShell } from "../components/auth-page-shell"
import { appAuth } from "@/lib/app-auth"
import { ArrowRight, Building2 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SelectWorkspacePage() {
  const user = await appAuth.getCurrentUser()
  if (!user) redirect("/sign-in")

  const memberships = user.memberships ?? []
  if (memberships.length === 0) redirect("/onboarding/institution")

  return (
    <AuthPageShell eyebrow="Authorized institutions" title="Choose a workspace">
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        Your access and operating role are applied separately in each
        institution.
      </p>
      <div className="mt-7 grid gap-3">
        {memberships.map((membership) => {
          const path =
            membership.setupState === "complete"
              ? `/w/${encodeURIComponent(membership.institutionId)}/overview`
              : `/onboarding/${membership.setupState}?institutionId=${encodeURIComponent(membership.institutionId)}`

          return (
            <Link
              className="group flex items-center gap-4 rounded-[var(--radius-control)] border border-[var(--border)] p-4 transition hover:border-[var(--focus)] hover:bg-[var(--selected)]"
              href={path}
              key={membership.institutionId}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-[var(--selected)] text-[var(--teal-text)]">
                <Building2 aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm text-[var(--brand-navy)]">
                  {membership.institutionName}
                </strong>
                <span className="mt-0.5 block text-xs capitalize text-[var(--text-secondary)]">
                  {membership.role.replaceAll("-", " ")}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 text-[var(--text-secondary)] transition group-hover:translate-x-0.5"
              />
            </Link>
          )
        })}
      </div>
      <form action="/api/app-auth/logout" className="mt-7" method="post">
        <button
          className="text-sm font-semibold text-[var(--teal-text)] hover:underline"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </AuthPageShell>
  )
}
