import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
} from "react"
import { ChevronLeft, LoaderCircle } from "lucide-react"

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  loading?: boolean
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading && <LoaderCircle size={18} className="spin" />}
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string
  onBack?: () => void
  action?: ReactNode
}) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span className="header-spacer" />
      )}
      <strong>{title}</strong>
      <span className="header-action">{action}</span>
    </header>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Completed" ||
    status === "Credit confirmed" ||
    status === "Outcome verified"
      ? "success"
      : status === "Failed"
        ? "error"
        : status === "Processing" || status === "Evidence review"
          ? "info"
          : "warning"
  return <span className={`status status-${tone}`}>{status}</span>
}

export function CedarMark({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      <span>Cedar</span>
    </div>
  )
}
