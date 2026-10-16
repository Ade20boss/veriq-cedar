import { AuthPageShell } from "../../components/auth-page-shell"
import { appAuth } from "@/lib/app-auth"
import { MailCheck } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const query = await searchParams
  const token = typeof query.token === "string" ? query.token : ""
  const user = await appAuth.getCurrentUser()
  if (!user) {
    redirect(
      token ? `/sign-in?invitation=${encodeURIComponent(token)}` : "/sign-in",
    )
  }

  return (
    <AuthPageShell eyebrow="Invitation" title="Continue institution access">
      <div className="mt-7 flex items-start gap-4 rounded-[var(--radius-control)] border border-[var(--info-border)] bg-[var(--info-bg)] p-4">
        <MailCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-[var(--info)]"
        />
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {token
            ? "Your invitation context is preserved. Invitation acceptance will be enabled when the institution workflow is connected."
            : "No invitation reference was supplied. Ask your institution administrator to resend the invitation."}
        </p>
      </div>
      <Link
        className="mt-7 inline-block text-sm font-semibold text-[var(--teal-text)] hover:underline"
        href="/select-workspace"
      >
        Continue to workspace selection
      </Link>
    </AuthPageShell>
  )
}
