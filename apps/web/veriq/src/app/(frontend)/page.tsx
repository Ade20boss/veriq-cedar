import { appAuth, getPostLoginPath } from "@/lib/app-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const user = await appAuth.getCurrentUser()
  redirect(user ? getPostLoginPath(user) : "/sign-in")
}
