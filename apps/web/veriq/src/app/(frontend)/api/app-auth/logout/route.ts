import { appAuth } from "@/lib/app-auth"

export async function POST() {
  await appAuth.logout()

  return new Response(null, {
    headers: { Location: "/sign-in" },
    status: 303,
  })
}
