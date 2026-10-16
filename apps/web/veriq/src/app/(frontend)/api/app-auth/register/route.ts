import { appAuth, getPostLoginPath } from "@/lib/app-auth"
import { APP_PASSWORD_MIN_LENGTH } from "@/lib/auth-policy"

type RegistrationBody = {
  agreement?: unknown
  confirmPassword?: unknown
  displayName?: unknown
  email?: unknown
  invitation?: unknown
  password?: unknown
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: RegistrationBody

  try {
    body = ((await request.json()) as RegistrationBody)
  } catch {
    return Response.json(
      { error: { message: "Enter valid registration details." } },
      { status: 400 },
    )
  }

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : ""
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : ""
  const invitation =
    typeof body.invitation === "string" ? body.invitation.trim() : ""

  if (!displayName) {
    return Response.json(
      { error: { field: "displayName", message: "Enter your full name." } },
      { status: 400 },
    )
  }

  if (!emailPattern.test(email)) {
    return Response.json(
      {
        error: { field: "email", message: "Enter a valid work email address." },
      },
      { status: 400 },
    )
  }

  if (password.length < APP_PASSWORD_MIN_LENGTH) {
    return Response.json(
      {
        error: {
          field: "password",
          message: `Password must contain at least ${APP_PASSWORD_MIN_LENGTH} characters.`,
        },
      },
      { status: 400 },
    )
  }

  if (password !== confirmPassword) {
    return Response.json(
      {
        error: {
          field: "confirmPassword",
          message: "Passwords do not match.",
        },
      },
      { status: 400 },
    )
  }

  if (body.agreement !== true) {
    return Response.json(
      {
        error: {
          field: "agreement",
          message:
            "Accept the Terms of Service and Privacy Policy to continue.",
        },
      },
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
    const result = await appAuth.register({ displayName, email, password })

    if (result.state === "verification-pending") {
      return Response.json({ state: result.state })
    }

    return Response.json({
      redirect: getPostLoginPath(result.user, invitation),
      state: "authenticated",
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Account registration could not be completed."
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 400

    return Response.json({ error: { message } }, { status })
  }
}
