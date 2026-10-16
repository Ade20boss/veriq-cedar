import VeriqApp from "../../../components/veriq-app"
import { appAuth } from "@/lib/app-auth"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ institutionId: string; view?: string[] }>
}) {
  const user = await appAuth.getCurrentUser()
  if (!user) redirect("/sign-in")

  const { institutionId } = await params
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
