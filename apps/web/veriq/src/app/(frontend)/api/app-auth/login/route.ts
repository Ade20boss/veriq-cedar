import { AppAuthError, appAuth, getPostLoginPath } from "@/lib/app-auth"

type LoginBody = {
  email?: unknown
  invitation?: unknown
  password?: unknown
}

export async function POST(request: Request) {
  let body: LoginBody

  try {
    body = ((await request.json()) as LoginBody)
  } catch {
    return Response.json(
      { error: { message: "Enter a valid email and password." } },
      { status: 400 },
    )
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const invitation =
    typeof body.invitation === "string" ? body.invitation.trim() : ""

  if (!email || !email.includes("@")) {
    return Response.json(
      { error: { field: "email", message: "Enter a valid email address." } },
      { status: 400 },
    )
  }

  if (!password) {
    return Response.json(
      { error: { field: "password", message: "Enter your password." } },
      { status: 400 },
    )
  }

  if (invitation.length > 512) {
    return Response.json(
      { error: { message: "The invitation reference is invalid." } },
      { status: 400 },
    )
  }

  try {
    const user = await appAuth.login(email, password)
    return Response.json({
      redirect: getPostLoginPath(user, invitation),
    })
  } catch (error) {
    const status = error instanceof AppAuthError ? error.status : 401
    const message =
      error instanceof Error ? error.message : "Sign in could not be completed."

    return Response.json({ error: { message } }, { status })
  }
}
