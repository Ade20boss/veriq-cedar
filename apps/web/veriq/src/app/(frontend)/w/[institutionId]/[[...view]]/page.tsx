import VeriqApp from "../../../components/veriq-app"
import { appAuth } from "@/lib/app-auth"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ institutionId: string; view?: string[] }>
  searchParams: Promise<{ mode?: string | string[] }>
}) {
  const { institutionId } = await params
  const query = await searchParams
  const mode = typeof query.mode === "string" ? query.mode : ""
  if (mode === "synthetic" && ["cedar-demo", "northstar-demo"].includes(institutionId)) {
    return (
      <>
        <div className="fixed inset-x-0 top-0 z-[100] flex min-h-9 items-center justify-center bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950 shadow-sm">
          Synthetic workspace walkthrough. Live Cedar panels, when opened, require a separate authorized investigator session.
        </div>
        <div className="pt-9">
          <VeriqApp initialInstitution={institutionId === "cedar-demo" ? "Cedar Bank — Demo Workspace" : "Northstar Research Institute"} />
        </div>
      </>
    )
  }

  const user = await appAuth.getCurrentUser()
  if (!user) redirect("/sign-in")

  const membership = (user.memberships ?? []).find(
    (item) => item.institutionId === institutionId,
  )
  if (!membership) notFound()
  if (membership.setupState !== "complete") {
    redirect(
      `/onboarding/${membership.setupState}?institutionId=${encodeURIComponent(membership.institutionId)}`,
    )
  }

  return <VeriqApp initialInstitution={membership.institutionName} />
}
