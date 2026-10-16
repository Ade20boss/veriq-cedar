import { AuthPageShell } from "../../components/auth-page-shell"
import { appAuth } from "@/lib/app-auth"
import { ArrowRight, Building2 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import SyntheticOnboarding from "../../components/synthetic-onboarding"

export const dynamic = "force-dynamic"

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>
  searchParams: Promise<{ institutionId?: string | string[]; mode?: string | string[] }>
}) {
  const { step } = await params
  const query = await searchParams
  const mode = typeof query.mode === "string" ? query.mode : ""
  if (mode === "synthetic") return <SyntheticOnboarding requestedStep={step} />
  const user = await appAuth.getCurrentUser()
  if (!user) redirect("/sign-in")

  const institutionId =
    typeof query.institutionId === "string" ? query.institutionId : ""
  const membership = (user.memberships ?? []).find(
    (item) => item.institutionId === institutionId,
  )

  return (
    <AuthPageShell
      eyebrow="Workspace setup"
      title="Complete institution access"
    >
      <div className="mt-7 flex items-start gap-4 rounded-[var(--radius-control)] border border-[var(--info-border)] bg-[var(--info-bg)] p-4">
        <Building2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-[var(--info)]"
        />
        <div>
          <strong className="text-sm text-[var(--brand-navy)]">
            {membership?.institutionName ?? "Institution onboarding"}
          </strong>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            The{" "}
            <span className="font-semibold">{step.replaceAll("-", " ")}</span>{" "}
            step is ready for your workspace administrator to configure. No
            access is granted until setup is complete.
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--teal-text)] hover:underline"
          href="/select-workspace"
        >
          Review available workspaces
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </AuthPageShell>
  )
}
