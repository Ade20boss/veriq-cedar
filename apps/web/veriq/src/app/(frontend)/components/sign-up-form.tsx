"use client"

import { APP_PASSWORD_MIN_LENGTH } from "@/lib/auth-policy"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

type FieldName = "agreement" | "confirmPassword" | "displayName" | "email" | "password"

type SignUpFormProps = {
  invitation?: string
}

type FormErrors = Partial<Record<FieldName, string>>
type FormStatus = "default" | "error" | "submitting" | "success" | "verification"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpForm({ invitation }: SignUpFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreement, setAgreement] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<FormStatus>("default")

  function validate() {
    const nextErrors: FormErrors = {}

    if (!displayName.trim()) nextErrors.displayName = "Enter your full name."
    if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid work email address."
    }
    if (password.length < APP_PASSWORD_MIN_LENGTH) {
      nextErrors.password = `Use at least ${APP_PASSWORD_MIN_LENGTH} characters.`
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password."
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }
    if (!agreement) {
      nextErrors.agreement =
        "Accept the Terms of Service and Privacy Policy to continue."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    if (!validate()) {
      setStatus("error")
      return
    }

    setStatus("submitting")

    try {
      const response = await fetch("/api/app-auth/register", {
        body: JSON.stringify({
          agreement,
          confirmPassword,
          displayName,
          email,
          invitation,
          password,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result = (await response.json()) as {
        error?: { field?: FieldName; message?: string }
        redirect?: string
        state?: "authenticated" | "verification-pending"
      }

      if (!response.ok) {
        const errorMessage =
          result.error?.message ||
          "Account registration could not be completed."
        if (result.error?.field) {
          setErrors((current) => ({
            ...current,
            [result.error?.field as FieldName]: errorMessage,
          }))
        }
        setMessage(errorMessage)
        setStatus("error")
        return
      }

      if (result.state === "verification-pending") {
        setStatus("verification")
        return
      }

      if (!result.redirect) {
        setMessage("Your account was created. Sign in to continue.")
        setStatus("success")
        return
      }

      setStatus("success")
      await new Promise((resolve) => window.setTimeout(resolve, 650))
      router.push(result.redirect)
      router.refresh()
    } catch {
      setMessage("Veriq could not reach the registration service. Try again.")
      setStatus("error")
    }
  }

  if (status === "verification") {
    return (
      <div
        aria-live="polite"
        className="mt-8 rounded-[var(--radius-card)] border border-[var(--info-border)] bg-[var(--info-bg)] p-5 text-[var(--info)]"
      >
        <Mail aria-hidden="true" className="mb-3 size-5" />
        <h3 className="font-semibold">Verify your email to continue</h3>
        <p className="mt-2 text-sm leading-6">
          Your account was created, but authentication is pending email
          verification. Follow the instructions from your configured Veriq email
          service.
        </p>
      </div>
    )
  }

  return (
    <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label
          className="block text-sm font-semibold text-[var(--text)]"
          htmlFor="displayName"
        >
          Full name
        </label>
        <div className="relative">
          <UserRound
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            aria-describedby={
              errors.displayName ? "displayName-error" : undefined
            }
            aria-invalid={Boolean(errors.displayName)}
            autoComplete="name"
            className="h-12 w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-slate-400"
            id="displayName"
            name="displayName"
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Alex Morgan"
            required
            value={displayName}
          />
        </div>
        {errors.displayName && (
          <p className="text-xs text-[var(--error)]" id="displayName-error">
            {errors.displayName}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
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
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
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
        {errors.email && (
          <p className="text-xs text-[var(--error)]" id="email-error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          className="block text-sm font-semibold text-[var(--text)]"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            aria-describedby="password-guidance password-error"
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            className="h-12 w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white pl-10 pr-11 text-sm text-[var(--text)]"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={passwordVisible ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--nav-hover)] hover:text-[var(--text)]"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        <p
          className="text-xs leading-5 text-[var(--text-secondary)]"
          id="password-guidance"
        >
          Minimum {APP_PASSWORD_MIN_LENGTH} characters. Use a unique password or
          passphrase.
        </p>
        {errors.password && (
          <p className="text-xs text-[var(--error)]" id="password-error">
            {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          className="block text-sm font-semibold text-[var(--text)]"
          htmlFor="confirmPassword"
        >
          Confirm password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            className="h-12 w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--text)]"
            id="confirmPassword"
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type={passwordVisible ? "text" : "password"}
            value={confirmPassword}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-[var(--error)]" id="confirmPassword-error">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--text-secondary)]">
          <input
            aria-describedby={errors.agreement ? "agreement-error" : undefined}
            aria-invalid={Boolean(errors.agreement)}
            checked={agreement}
            className="mt-0.5 size-4 shrink-0 accent-[var(--brand-teal)]"
            name="agreement"
            onChange={(event) => setAgreement(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            I acknowledge the{" "}
            <a
              className="font-semibold text-[var(--teal-text)] hover:underline"
              href="#terms-notice"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              className="font-semibold text-[var(--teal-text)] hover:underline"
              href="#terms-notice"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.agreement && (
          <p className="text-xs text-[var(--error)]" id="agreement-error">
            {errors.agreement}
          </p>
        )}
      </div>

      {message && (
        <div
          aria-live="polite"
          className={`rounded-[var(--radius-control)] border px-4 py-3 text-sm ${
            status === "success"
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
              : "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error)]"
          }`}
          role={status === "success" ? "status" : "alert"}
        >
          {message}
        </div>
      )}

      {status === "success" && !message && (
        <div
          aria-live="polite"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success)]"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Account created. Preparing your workspace…
        </div>
      )}

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand-navy)] px-4 text-sm font-semibold !text-white transition hover:bg-[var(--brand-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting" || status === "success"}
        type="submit"
      >
        {status === "submitting" ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            Create account
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[var(--teal-text)] hover:underline"
          href={
            invitation
              ? `/sign-in?invitation=${encodeURIComponent(invitation)}`
              : "/sign-in"
          }
        >
          Sign in
        </Link>
      </p>

      <p
        className="text-xs leading-5 text-[var(--text-secondary)]"
        id="terms-notice"
      >
        Terms and privacy documents are provided by your Veriq administrator.
      </p>
    </form>
  )
}
