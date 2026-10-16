import "server-only"

import config from "@payload-config"
import { cookies } from "next/headers"
import { getPayload, type AuthenticatedUser } from "payload"

const APP_SESSION_COOKIE = "app-session"

export type AppMembership = {
  institutionId: string
  institutionName: string
  role: string
  setupState: string
}

export type AppUser = AuthenticatedUser & {
  appRole?: string | null
  displayName?: string | null
  memberships?: AppMembership[] | null
  status?: "active" | "inactive" | null
}

export class AppAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = "AppAuthError"
    this.status = status
  }
}

export function createAppAuth(appUserCollection: "users") {
  async function getCurrentUser(): Promise<AppUser | null> {
    const token = (await cookies()).get(APP_SESSION_COOKIE)?.value
    if (!token) return null

    const payload = await getPayload({ config })
    const authHeaders = new Headers({ Authorization: `JWT ${token}` })
    const { user } = await payload.auth({ headers: authHeaders })

    if (!user || user.collection !== appUserCollection) return null

    const appUser = user as AppUser
    return appUser.status === "inactive" ? null : appUser
  }

  async function login(email: string, password: string): Promise<AppUser> {
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: appUserCollection,
      data: { email, password },
      overrideAccess: false,
    })

    if (!result.token || !result.user) {
      throw new AppAuthError("Sign in could not be completed.")
    }

    const user = result.user as AppUser
    if (user.status === "inactive") {
      throw new AppAuthError("This account is inactive.", 403)
    }

    const cookieStore = await cookies()
    cookieStore.set(APP_SESSION_COOKIE, result.token, {
      expires: result.exp ? new Date(result.exp * 1000) : undefined,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return user
  }

  async function register({
    displayName,
    email,
    password,
  }: {
    displayName: string
    email: string
    password: string
  }) {
    const payload = await getPayload({ config })
    await payload.create({
      collection: appUserCollection,
      context: { appRegistration: true },
      data: {
        appRole: "member",
        displayName,
        email,
        memberships: [],
        password,
        status: "active",
      },
      draft: false,
      overrideAccess: false,
    })

    const verificationRequired = Boolean(
      payload.collections[appUserCollection].config.auth.verify,
    )

    if (verificationRequired) {
      return { state: "verification-pending" as const }
    }

    const user = await login(email, password)
    return { state: "authenticated" as const, user }
  }

  async function logout() {
    ;(await cookies()).delete(APP_SESSION_COOKIE)
  }

  return { getCurrentUser, login, logout, register }
}

export const appAuth = createAppAuth("users")

export function getPostLoginPath(user: AppUser, invitation?: string | null) {
  if (invitation) {
    return `/invitations/accept?token=${encodeURIComponent(invitation)}`
  }

  const memberships = user.memberships ?? []
  if (memberships.length === 0) return "/onboarding/institution"
  if (memberships.length > 1) return "/select-workspace"

  const membership = memberships[0]
  if (membership.setupState !== "complete") {
    return `/onboarding/${membership.setupState}?institutionId=${encodeURIComponent(membership.institutionId)}`
  }

  return `/w/${encodeURIComponent(membership.institutionId)}/overview`
}
