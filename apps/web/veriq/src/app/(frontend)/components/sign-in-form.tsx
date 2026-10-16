"use client"

import { ArrowRight, LockKeyhole, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

type SignInFormProps = {
  invitation?: string
}

export function SignInForm({ invitation }: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/app-auth/login", {
        body: JSON.stringify({ email, invitation, password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result = (await response.json()) as {
        error?: { message?: string }
        redirect?: string
      }

      if (!response.ok || !result.redirect) {
        setError(result.error?.message || "Sign in could not be completed.")
        return
      }

      router.push(result.redirect)
      router.refresh()
    } catch {
      setError("Veriq could not reach the authentication service. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="block text-sm font-semibold text-[var(--text)]"
          htmlFor="email"
        >
          Work email
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            autoComplete="email"
            className="h-12 w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-slate-400"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@institution.org"
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            className="block text-sm font-semibold text-[var(--text)]"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            className="text-xs font-semibold text-[var(--teal-text)] hover:underline"
            href="/sign-in#account-help"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            autoComplete="current-password"
            className="h-12 w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--text)]"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
      </div>

      {error && (
        <div
          aria-live="polite"
          className="rounded-[var(--radius-control)] border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand-navy)] px-4 text-sm font-semibold !text-white transition hover:bg-[var(--brand-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Signing in…" : "Sign in securely"}
        {!submitting && <ArrowRight aria-hidden="true" className="size-4" />}
      </button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Need an account?{" "}
        <Link
          className="font-semibold text-[var(--teal-text)] hover:underline"
          href="/sign-in#account-help"
        >
          Request access
        </Link>
      </p>
    </form>
  )
}
