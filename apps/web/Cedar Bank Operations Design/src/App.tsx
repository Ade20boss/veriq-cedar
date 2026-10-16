"use client"

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  VeriqApiError,
  veriqApi,
  type ContextSummary,
  type Incident,
  type Investigation,
  type KnowledgeRelationship,
  type RouteHealth,
  type SourceListItem,
} from "./lib/veriq-api"

type RoleKey = "sarah" | "michael" | "bob" | "grace"
type Screen = "signin" | "loading" | "app"

type Employee = {
  name: string
  initials: string
  role: string
  department: string
  id: string
  email: string
  access: string[]
}

const employees: Record<RoleKey, Employee> = {
  sarah: {
    name: "Sarah Bello",
    initials: "SB",
    role: "Digital Support Agent",
    department: "Customer Experience · Digital Support",
    id: "CB-DS-0412",
    email: "sarah.bello@cedar.demo",
    access: [
      "workspace",
      "queue",
      "customers",
      "transactions",
      "complaints",
      "notifications",
      "profile",
    ],
  },
  michael: {
    name: "Michael Eze",
    initials: "ME",
    role: "Investigation Officer",
    department: "Risk Operations · Investigations",
    id: "CB-RI-0286",
    email: "michael.eze@cedar.demo",
    access: [
      "workspace",
      "queue",
      "customers",
      "transactions",
      "payments",
      "exceptions",
      "veriq",
      "notifications",
      "profile",
    ],
  },
  bob: {
    name: "Bob Okafor",
    initials: "BO",
    role: "Branch Customer Service Officer",
    department: "Retail Banking · Branch Operations",
    id: "CB-BR-0194",
    email: "bob.okafor@cedar.demo",
    access: [
      "workspace",
      "queue",
      "customers",
      "transactions",
      "complaints",
      "notifications",
      "profile",
    ],
  },
  grace: {
    name: "Grace Adeyemi",
    initials: "GA",
    role: "Complaints Supervisor",
    department: "Customer Experience · Resolution",
    id: "CB-CS-0071",
    email: "grace.adeyemi@cedar.demo",
    access: [
      "workspace",
      "queue",
      "customers",
      "transactions",
      "complaints",
      "team",
      "audit",
      "notifications",
      "profile",
    ],
  },
}

const navGroups = [
  {
    label: "Workspace",
    items: [
      ["workspace", "My Workspace", "grid"],
      ["queue", "My Work Queue", "inbox"],
    ],
  },
  {
    label: "Customer operations",
    items: [
      ["customers", "Customer 360", "users"],
      ["transactions", "Transaction Inquiry", "search"],
      ["complaints", "Complaints & Disputes", "message"],
    ],
  },
  {
    label: "Payment operations",
    items: [
      ["payments", "Payment Monitoring", "pulse"],
      ["exceptions", "Exceptions", "alert"],
    ],
  },
  {
    label: "Management",
    items: [
      ["team", "Team & Assignments", "team"],
      ["audit", "Approvals & Audit", "check"],
    ],
  },
  {
    label: "Connected intelligence",
    items: [["veriq", "Veriq Intelligence", "shield"]],
  },
]

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c.5-4 2.5-6 6-6s5.5 2 6 6" />
        <circle cx="17" cy="7" r="2" />
        <path d="M16 13c3 0 4.5 2 5 5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    message: (
      <>
        <path d="M4 5h16v12H9l-5 4z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    pulse: (
      <>
        <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2.8 20h18.4z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    team: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2.5 20c.4-4 2.2-6 5.5-6 3.4 0 5.2 2 5.5 6M14 15c3.8-.7 6 1 6.5 4" />
      </>
    ),
    check: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="m8 12 3 3 6-7" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.6 3 7.7 7.5 9.5 4.5-1.8 7.5-4.9 7.5-9.5V6z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeoff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.2 2.8M6.3 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H4v16h6" />
        <path d="m15 8 4 4-4 4M8 12h11" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.5 2.5 0 1 1 3.7 2.2c-1 .6-1.4 1.2-1.4 2.3M12 17h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function CedarLogo({
  light = false,
  compact = false,
}: {
  light?: boolean
  compact?: boolean
}) {
  return (
    <div className={`cedar-logo ${light ? "light" : ""}`}>
      <svg
        className="logo-mark"
        width="40"
        height="44"
        viewBox="0 0 40 44"
        aria-hidden="true"
      >
        <rect x="1" y="20" width="10" height="22" rx="4" fill="currentColor" />
        <rect x="15" y="3" width="10" height="39" rx="4" fill="currentColor" />
        <rect x="29" y="10" width="10" height="32" rx="4" fill="currentColor" />
      </svg>
      {!compact && <span className="logo-word">Cedar</span>}
    </div>
  )
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

function SignIn({ onSignIn }: { onSignIn: (role: RoleKey) => void }) {
  const [selected, setSelected] = useState<RoleKey>("sarah")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [email, setEmail] = useState(employees.sarah.email)
  const [password, setPassword] = useState("cedar-demo")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const selectEmployee = (key: RoleKey) => {
    setSelected(key)
    setEmail(employees[key].email)
    setPassword("cedar-demo")
    setError("")
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError("Enter the demonstration employee ID or email and password.")
      return
    }
    setSubmitting(true)
    window.setTimeout(() => onSignIn(selected), 650)
  }

  return (
    <main className="signin-page">
      <section className="signin-brand">
        <div className="brand-top">
          <CedarLogo light />
        </div>
        <div className="brand-message">
          <div className="brand-rule" />
          <p className="eyebrow">Cedar Bank Operations</p>
          <h1>
            Banking operations,
            <br />
            rooted in trust.
          </h1>
          <p>
            A secure workspace for Cedar employees to support customers and
            coordinate daily banking operations.
          </p>
        </div>
        <div className="brand-security">
          <Icon name="shield" size={17} />
          <span>Protected staff environment</span>
        </div>
        <div className="brand-texture" aria-hidden="true" />
      </section>
      <section className="signin-form-wrap">
        <div className="mobile-brand">
          <CedarLogo />
        </div>
        <div className="signin-form-box">
          <div className="form-heading">
            <p className="eyebrow teal">Employee access</p>
            <h2>Welcome back</h2>
            <p>Sign in to continue to Cedar Bank Operations.</p>
          </div>
          <div className="demo-box">
            <div className="demo-heading">
              <span>Demonstration employees</span>
              <small>LOCAL ROLE PREVIEW · NOT AUTHENTICATION</small>
            </div>
            <div className="demo-users">
              {(Object.keys(employees) as RoleKey[]).map((key) => {
                const person = employees[key]
                return (
                  <button
                    type="button"
                    className={`demo-user ${
                      selected === key ? "selected" : ""
                    }`}
                    key={key}
                    onClick={() => selectEmployee(key)}
                  >
                    <span className="avatar small">{person.initials}</span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                    </span>
                    <span className="radio" />
                  </button>
                )
              })}
            </div>
          </div>
          <form onSubmit={submit}>
            <Field label="Employee ID or email" error={error}>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                autoComplete="username"
                aria-invalid={!!error}
              />
            </Field>
            <Field label="Password">
              <div className="password-input">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <Icon name={passwordVisible ? "eyeoff" : "eye"} />
                </button>
              </div>
            </Field>
            <div className="form-meta">
              <label>
                <input type="checkbox" /> Keep me signed in on this device
              </label>
              <button type="button">Need help?</button>
            </div>
            <Button
              type="submit"
              className="signin-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="button-spinner" /> Signing in securely…
                </>
              ) : (
                "Sign in to Cedar"
              )}
            </Button>
          </form>
          <p className="legal">
            This prototype uses fictional demonstration identities only. Never
            enter real banking credentials. Role selection is a visual
            simulation; production authorization must be enforced by Cedar&apos;s
            backend.
          </p>
        </div>
      </section>
    </main>
  )
}

function LoadingScreen({ employee }: { employee: Employee }) {
  return (
    <main className="loading-screen">
      <div className="loading-orbit">
        <span />
        <span />
        <div className="loading-logo">
          <CedarLogo light compact />
        </div>
      </div>
      <div className="loading-copy">
        <h1>Preparing your Cedar workspace</h1>
        <p>Connecting to your secure staff session…</p>
      </div>
      <div className="loading-user">
        <span className="avatar small">{employee.initials}</span>
        <span>
          <strong>{employee.name}</strong>
          <small>{employee.role}</small>
        </span>
      </div>
    </main>
  )
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: string
}) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  )
}

function FinancialOutcomeBadge({
  outcome,
  compact = false,
}: {
  outcome: string
  compact?: boolean
}) {
  const normalized = outcome.toLowerCase()
  const kind = normalized.includes("unknown")
    ? "unknown"
    : normalized.includes("recipient credit")
      ? "confirmed"
      : normalized.includes("failure")
        ? "failure"
        : "reversal"
  const icon =
    kind === "unknown"
      ? "help"
      : kind === "confirmed"
        ? "check"
        : kind === "failure"
          ? "close"
          : "pulse"
  return (
    <span className={`outcome-badge ${kind} ${compact ? "compact" : ""}`}>
      <span className="outcome-symbol">
        <Icon name={icon} size={compact ? 12 : 13} />
      </span>
      {outcome}
    </span>
  )
}

function MetricCard({
  label,
  value,
  meta,
  tone = "",
  onClick,
}: {
  label: string
  value: string
  meta: string
  tone?: string
  onClick?: () => void
}) {
  return (
    <button className={`metric-card ${tone}`} onClick={onClick}>
      <span>{label}</span>
      <div>
        <strong>{value}</strong>
        <Icon name="arrow" />
      </div>
      <small>{meta}</small>
    </button>
  )
}

const roleMetrics: Record<RoleKey, {
  assigned: string
  queue: string
  exceptions: string
  attention: string
}> = {
  sarah: { assigned: "12", queue: "28", exceptions: "3", attention: "5" },
  michael: { assigned: "8", queue: "14", exceptions: "7", attention: "4" },
  bob: { assigned: "6", queue: "19", exceptions: "1", attention: "2" },
  grace: { assigned: "15", queue: "34", exceptions: "4", attention: "9" },
}

const cases = [
  {
    id: "CMP-10501",
    customer: "Ada Nwankwo",
    initials: "AN",
    subject: "Elm Bank transfer not received",
    status: "Investigating",
    tone: "info",
    priority: "High",
    updated: "6 min ago",
  },
  {
    id: "CMP-10482",
    customer: "Amina Yusuf",
    initials: "AY",
    subject: "Card debit not recognised",
    status: "Investigating",
    tone: "info",
    priority: "High",
    updated: "12 min ago",
  },
  {
    id: "CMP-10477",
    customer: "Chinedu Okoro",
    initials: "CO",
    subject: "Transfer recipient not credited",
    status: "Awaiting response",
    tone: "warning",
    priority: "Medium",
    updated: "34 min ago",
  },
  {
    id: "CMP-10461",
    customer: "Temitope Balogun",
    initials: "TB",
    subject: "Duplicate POS debit",
    status: "Action required",
    tone: "danger",
    priority: "High",
    updated: "1 hr ago",
  },
  {
    id: "CMP-10439",
    customer: "Musa Abdullahi",
    initials: "MA",
    subject: "Account restriction enquiry",
    status: "In review",
    tone: "neutral",
    priority: "Normal",
    updated: "Yesterday",
  },
]

type ComplaintRecord = {
  id: string
  customer: string
  customerRef: string
  initials: string
  subject: string
  category: string
  status: string
  tone: string
  priority: string
  received: string
  updated: string
  transaction: string
  amount: string
  officer: string
  queue: "assigned" | "department" | "unassigned"
  target: string
  targetTone: string
  channel: string
  description: string
  recipientBank?: string
  customerSafeUpdate?: string
  veriq?: {
    reference: string
    origin: string
    status: string
    initiated: string
    incident: string
    evidence: string
    finding: string
    synced: string
  }
}

const complaintRecords: ComplaintRecord[] = [
  {
    id: "CMP-10501",
    customer: "Ada Nwankwo",
    customerRef: "CED-CUST-001",
    initials: "AN",
    subject: "Elm Bank transfer not received",
    category: "Transfer dispute",
    status: "Investigating",
    tone: "info",
    priority: "High",
    received: "10 Jun 2025 · 09:28",
    updated: "6 min ago",
    transaction: "TXN-88420500",
    amount: "₦50,000.00",
    officer: "Sarah Bello",
    queue: "assigned",
    target: "2h 14m remaining",
    targetTone: "warning",
    channel: "Mobile in-app support",
    recipientBank: "Elm Bank",
    description:
      "Customer reports that her ₦50,000 transfer to an Elm Bank account was debited from Cedar, but the recipient had not received value when she contacted support.",
    customerSafeUpdate:
      "Elm Bank confirmed recipient credit at 11:42 WAT through separately authorized evidence. Cedar's approved response can now confirm delivery while the original complaint and interaction history remain unchanged.",
    veriq: {
      reference: "VQ-INV-77305",
      origin: "Automated payment route monitoring",
      status: "Investigation running",
      initiated: "10 Jun 2025 · 09:16",
      incident: "Elm Bank route response delay · INC-341",
      evidence: "Route telemetry available · financial evidence pending",
      finding:
        "A delayed response was observed on the Elm Bank route. Veriq identified the route incident before the complaint was submitted; Cedar must still use approved financial evidence for the customer outcome.",
      synced: "10 Jun 2025 · 09:31 WAT",
    },
  },
  {
    id: "CMP-10388",
    customer: "Ada Nwankwo",
    customerRef: "CED-CUST-001",
    initials: "AN",
    subject: "Debit card delivery enquiry",
    category: "Card delivery",
    status: "Resolved",
    tone: "success",
    priority: "Normal",
    received: "22 May 2025 · 14:08",
    updated: "19 days ago",
    transaction: "Not linked",
    amount: "—",
    officer: "Sarah Bello",
    queue: "department",
    target: "Completed",
    targetTone: "success",
    channel: "Mobile in-app support",
    description:
      "Customer requested an update on a replacement debit-card delivery. Delivery information was provided and acknowledged.",
  },
  {
    id: "CMP-10482",
    customer: "Amina Yusuf",
    customerRef: "CUS-208194",
    initials: "AY",
    subject: "Card debit not recognised",
    category: "Card transaction dispute",
    status: "Investigating",
    tone: "info",
    priority: "High",
    received: "10 Jun 2025 · 08:42",
    updated: "12 min ago",
    transaction: "TXN-88420195",
    amount: "₦48,500.00",
    officer: "Sarah Bello",
    queue: "assigned",
    target: "1h 42m remaining",
    targetTone: "warning",
    channel: "Mobile in-app support",
    description:
      "Customer reports that she does not recognise a card-not-present debit to LAGOON DIGITAL. Her physical card remains in her possession and she has not shared her card details.",
    veriq: {
      reference: "VQ-INV-77291",
      origin: "Automated card monitoring",
      status: "Investigation running",
      initiated: "10 Jun 2025 · 08:44",
      incident: "Possible shared merchant compromise · INC-334",
      evidence: "Route and merchant evidence available",
      finding:
        "Permitted finding: transaction shares a merchant route with an active monitoring cluster. This does not establish the complaint outcome.",
      synced: "10 Jun 2025 · 09:18 WAT",
    },
  },
  {
    id: "CMP-10477",
    customer: "Chinedu Okoro",
    customerRef: "CUS-117503",
    initials: "CO",
    subject: "Transfer recipient not credited",
    category: "Transfer dispute",
    status: "Awaiting response",
    tone: "warning",
    priority: "Medium",
    received: "10 Jun 2025 · 07:55",
    updated: "34 min ago",
    transaction: "TXN-88419773",
    amount: "₦125,000.00",
    officer: "Sarah Bello",
    queue: "assigned",
    target: "3h 20m remaining",
    targetTone: "success",
    channel: "Email",
    description:
      "Customer states the beneficiary has not received the transfer. Cedar shows a gateway timeout and the financial outcome is not yet confirmed.",
    veriq: {
      reference: "VQ-INV-77264",
      origin: "Operational monitoring",
      status: "Investigation running",
      initiated: "10 Jun 2025 · 07:49",
      incident: "NIP route latency · INC-329",
      evidence: "Route telemetry available",
      finding:
        "A route delay was observed. Recipient credit remains unconfirmed and must be verified through Cedar's payment evidence.",
      synced: "10 Jun 2025 · 09:11 WAT",
    },
  },
  {
    id: "CMP-10461",
    customer: "Temitope Balogun",
    customerRef: "CUS-882140",
    initials: "TB",
    subject: "Duplicate POS debit",
    category: "POS dispute",
    status: "Action required",
    tone: "danger",
    priority: "High",
    received: "9 Jun 2025 · 16:21",
    updated: "1 hr ago",
    transaction: "TXN-88410220",
    amount: "₦32,800.00",
    officer: "Unassigned",
    queue: "unassigned",
    target: "26m remaining",
    targetTone: "danger",
    channel: "Branch visit",
    description:
      "Customer reports two debits after one successful POS purchase. The merchant receipt reflects a single approved purchase.",
  },
  {
    id: "CMP-10439",
    customer: "Musa Abdullahi",
    customerRef: "CUS-401172",
    initials: "MA",
    subject: "Account restriction enquiry",
    category: "Account access",
    status: "In review",
    tone: "neutral",
    priority: "Normal",
    received: "9 Jun 2025 · 11:08",
    updated: "Yesterday",
    transaction: "Not linked",
    amount: "—",
    officer: "Bob Okafor",
    queue: "department",
    target: "12h remaining",
    targetTone: "success",
    channel: "Branch visit",
    description:
      "Customer requested an explanation of an account restriction after identity documents were updated at the branch.",
  },
  {
    id: "CMP-10418",
    customer: "Ngozi Nwosu",
    customerRef: "CUS-729044",
    initials: "NN",
    subject: "Cash withdrawal not received",
    category: "ATM dispute",
    status: "Escalated",
    tone: "danger",
    priority: "High",
    received: "8 Jun 2025 · 19:42",
    updated: "Yesterday",
    transaction: "TXN-88398211",
    amount: "₦80,000.00",
    officer: "Michael Eze",
    queue: "department",
    target: "Target breached",
    targetTone: "danger",
    channel: "Contact centre",
    description:
      "Customer reports the ATM did not dispense cash although the account was debited. Terminal evidence is under review.",
  },
]

const paymentExceptions = [
  {
    transaction: "TXN-88420500",
    customer: "Ada Nwankwo",
    type: "Gateway response timeout",
    amount: "₦50,000.00",
    route: "ROUTE-CED-ELM-G2",
    channel: "Mobile transfer",
    age: "2h 31m",
    outcome: "Outcome Unknown",
    outcomeTone: "warning",
    verification: "Human verification pending",
    complaint: "CMP-10501",
    veriq: "INC-341 · Elm Bank route delay",
  },
  {
    transaction: "TXN-88419773",
    customer: "Chinedu Okoro",
    type: "Gateway response timeout",
    amount: "₦125,000.00",
    route: "NIP-CED-014",
    channel: "Mobile transfer",
    age: "1h 31m",
    outcome: "Outcome Unknown",
    outcomeTone: "warning",
    verification: "Awaiting beneficiary confirmation",
    complaint: "CMP-10477",
    veriq: "INC-329 · Route latency",
  },
  {
    transaction: "TXN-88418831",
    customer: "Ifeoma Umeh",
    type: "Pending external confirmation",
    amount: "₦265,400.00",
    route: "NIP-CED-008",
    channel: "Web transfer",
    age: "48m",
    outcome: "Outcome Unknown",
    outcomeTone: "warning",
    verification: "Network confirmation pending",
    complaint: "None",
    veriq: "No linked incident",
  },
  {
    transaction: "TXN-88410220",
    customer: "Temitope Balogun",
    type: "Possible duplicate presentment",
    amount: "₦32,800.00",
    route: "POS-ISW-221",
    channel: "POS",
    age: "17h",
    outcome: "Recipient Credit Confirmed",
    outcomeTone: "success",
    verification: "Both debit messages received",
    complaint: "CMP-10461",
    veriq: "Evidence sync unavailable",
  },
  {
    transaction: "TXN-88399104",
    customer: "Kelechi Obi",
    type: "Reversal confirmation pending",
    amount: "₦18,750.00",
    route: "WEB-PAY-031",
    channel: "Web checkout",
    age: "22h",
    outcome: "Reversal Posted",
    outcomeTone: "info",
    verification: "Cedar ledger reversal verified",
    complaint: "None",
    veriq: "INC-316 · Resolved",
  },
]

type CustomerRecord = {
  name: string
  reference: string
  initials: string
  account: string
  status: string
  statusTone: string
  type: string
  verification: string
  verificationTone: string
  phone: string
  since: string
}

const customerRecords: CustomerRecord[] = [
  {
    name: "Ada Nwankwo",
    reference: "CED-CUST-001",
    initials: "AN",
    account: "CED-ACC-001 · •••• 4821",
    status: "Active",
    statusTone: "success",
    type: "Individual",
    verification: "Identity verified",
    verificationTone: "success",
    phone: "+234 ••• ••• 1842",
    since: "March 2021",
  },
  {
    name: "Amina Yusuf",
    reference: "CUS-208194",
    initials: "AY",
    account: "CED-ACC-194 · •••• 0318",
    status: "Active",
    statusTone: "success",
    type: "Individual",
    verification: "Identity verified",
    verificationTone: "success",
    phone: "+234 ••• ••• 6031",
    since: "July 2022",
  },
  {
    name: "Chinedu Okoro",
    reference: "CUS-117503",
    initials: "CO",
    account: "CED-ACC-503 · •••• 7720",
    status: "Active",
    statusTone: "success",
    type: "Individual",
    verification: "Review current",
    verificationTone: "info",
    phone: "+234 ••• ••• 9754",
    since: "November 2020",
  },
  {
    name: "Temitope Balogun",
    reference: "CUS-882140",
    initials: "TB",
    account: "CED-ACC-140 · •••• 4412",
    status: "Restricted",
    statusTone: "warning",
    type: "Individual",
    verification: "Document review",
    verificationTone: "warning",
    phone: "+234 ••• ••• 1180",
    since: "January 2023",
  },
  {
    name: "Northstar Supplies",
    reference: "CED-BIZ-044",
    initials: "NS",
    account: "CED-BIZ-ACC-044 · •••• 8806",
    status: "Active",
    statusTone: "success",
    type: "Business",
    verification: "Business verified",
    verificationTone: "success",
    phone: "+234 ••• ••• 9044",
    since: "August 2019",
  },
]

type InquiryTransaction = {
  reference: string
  customer: string
  customerRef: string
  sourceAccount: string
  beneficiary: string
  beneficiaryRef: string
  amount: string
  date: string
  dateIso: string
  channel: string
  stage: string
  outcome: string
  route: string
  sendingInstitution: string
  receivingInstitution: string
  complaint: string
  exception: string
  veriq: string
  scenario?: string
}

const inquiryTransactions: InquiryTransaction[] = [
  {
    reference: "TXN-88420500",
    customer: "Ada Nwankwo",
    customerRef: "CED-CUST-001",
    sourceAccount: "CED-ACC-001",
    beneficiary: "Nneka Eze",
    beneficiaryRef: "ELM-ACC-009",
    amount: "₦50,000.00",
    date: "10 Jun 2025 · 09:12",
    dateIso: "2025-06-10",
    channel: "Mobile transfer",
    stage: "External confirmation pending",
    outcome: "Outcome Unknown",
    route: "ROUTE-CED-ELM-G2",
    sendingInstitution: "Cedar Bank",
    receivingInstitution: "Elm Bank",
    complaint: "CMP-10501",
    exception: "Gateway response timeout",
    veriq: "VQ-INV-77305",
    scenario: "S2-CREDITED-RESPONSE-LOST",
  },
  {
    reference: "TXN-88420195",
    customer: "Amina Yusuf",
    customerRef: "CUS-208194",
    sourceAccount: "CED-ACC-194",
    beneficiary: "LAGOON DIGITAL",
    beneficiaryRef: "MERCHANT-442",
    amount: "₦48,500.00",
    date: "10 Jun 2025 · 08:31",
    dateIso: "2025-06-10",
    channel: "Card",
    stage: "Authorization received",
    outcome: "Outcome Unknown",
    route: "CARD-CED-014",
    sendingInstitution: "Cedar Bank",
    receivingInstitution: "Merchant acquirer",
    complaint: "CMP-10482",
    exception: "Card dispute review",
    veriq: "VQ-INV-77291",
  },
  {
    reference: "TXN-88419773",
    customer: "Chinedu Okoro",
    customerRef: "CUS-117503",
    sourceAccount: "CED-ACC-503",
    beneficiary: "Ifeanyi Okoro",
    beneficiaryRef: "BIR-ACC-122",
    amount: "₦125,000.00",
    date: "10 Jun 2025 · 07:47",
    dateIso: "2025-06-10",
    channel: "Mobile transfer",
    stage: "Status enquiry sent",
    outcome: "Outcome Unknown",
    route: "ROUTE-CED-BIR-G1",
    sendingInstitution: "Cedar Bank",
    receivingInstitution: "Birch Bank",
    complaint: "CMP-10477",
    exception: "Gateway response timeout",
    veriq: "VQ-INV-77264",
  },
  {
    reference: "TXN-88410220",
    customer: "Temitope Balogun",
    customerRef: "CUS-882140",
    sourceAccount: "CED-ACC-140",
    beneficiary: "Apex Stores",
    beneficiaryRef: "POS-TERM-882",
    amount: "₦32,800.00",
    date: "9 Jun 2025 · 16:14",
    dateIso: "2025-06-09",
    channel: "POS",
    stage: "Presentment received",
    outcome: "Recipient Credit Confirmed",
    route: "POS-ISW-221",
    sendingInstitution: "Cedar Bank",
    receivingInstitution: "Merchant acquirer",
    complaint: "CMP-10461",
    exception: "Possible duplicate presentment",
    veriq: "Not linked",
  },
  {
    reference: "TXN-88399104",
    customer: "Northstar Supplies",
    customerRef: "CED-BIZ-044",
    sourceAccount: "CED-BIZ-ACC-044",
    beneficiary: "Vendor Settlement",
    beneficiaryRef: "ELM-BIZ-220",
    amount: "₦18,750.00",
    date: "9 Jun 2025 · 10:03",
    dateIso: "2025-06-09",
    channel: "Web transfer",
    stage: "Reversal completed",
    outcome: "Reversal Posted",
    route: "WEB-PAY-031",
    sendingInstitution: "Cedar Bank",
    receivingInstitution: "Elm Bank",
    complaint: "None",
    exception: "Reversal confirmation",
    veriq: "Not linked",
  },
]

function Sidebar({
  employee,
  active,
  navigate,
  open,
  close,
}: {
  employee: Employee
  active: string
  navigate: (id: string) => void
  open: boolean
  close: () => void
}) {
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <CedarLogo light />
          <button
            className="close-sidebar"
            onClick={close}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([id, label, icon]) => {
                const allowed = employee.access.includes(id)
                return (
                  <button
                    key={id}
                    className={`${active === id ? "active" : ""} ${
                      !allowed ? "locked" : ""
                    }`}
                    aria-label={
                      allowed ? label : `${label} — access restricted`
                    }
                    title={allowed ? undefined : "Access restricted"}
                    onClick={() => {
                      navigate(id)
                      close()
                    }}
                  >
                    <Icon name={icon} />
                    <span>{label}</span>
                    {!allowed && (
                      <span className="nav-restricted-mark">
                        <Icon name="lock" size={13} />
                        <span className="sr-only">Access restricted</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => navigate("notifications")}>
            <Icon name="bell" />
            <span>Notifications</span>
            <b>3</b>
          </button>
          <button onClick={() => navigate("profile")}>
            <Icon name="users" />
            <span>Staff Profile</span>
          </button>
          <button onClick={() => navigate("signout")}>
            <Icon name="logout" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={close}
        />
      )}
    </>
  )
}

function Topbar({
  employee,
  toggleNav,
  toggleNotifications,
  navigate,
}: {
  employee: Employee
  toggleNav: () => void
  toggleNotifications: () => void
  navigate: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const results = query.trim()
    ? complaintRecords
        .filter((item) =>
          `${item.customer} ${item.customerRef} ${item.id} ${item.transaction}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 4)
    : []
  const openResult = (id: string) => {
    const result = complaintRecords.find((item) => item.id === id)
    navigate(
      employee.access.includes("complaints") || !result
        ? `complaint:${id}`
        : `transaction:${result.transaction}`,
    )
    setQuery("")
    setSearchOpen(false)
  }
  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={toggleNav}
        aria-label="Open navigation"
      >
        <Icon name="menu" />
      </button>
      <div className="global-search-wrap">
        <div className="global-search">
          <Icon name="search" />
          <input
            placeholder="Search customers, transactions or cases"
            aria-label="Global search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) openResult(results[0].id)
              if (event.key === "Escape") setSearchOpen(false)
            }}
          />
          <kbd>⌘ K</kbd>
        </div>
        {searchOpen && query.trim() && (
          <div className="global-results">
            <div className="global-results-label">
              <span>Simulated Cedar records</span>
              <button onClick={() => setSearchOpen(false)} aria-label="Close">
                <Icon name="close" size={14} />
              </button>
            </div>
            {results.length ? (
              results.map((item) => (
                <button key={item.id} onClick={() => openResult(item.id)}>
                  <span className="avatar tiny">{item.initials}</span>
                  <span>
                    <strong>{item.customer}</strong>
                    <small>
                      {item.id} · {item.transaction}
                    </small>
                  </span>
                  <Badge tone={item.tone}>{item.status}</Badge>
                </button>
              ))
            ) : (
              <div className="global-no-results">
                <Icon name="search" size={20} />
                <span>
                  <strong>No matching Cedar records</strong>
                  <small>
                    Try a customer, complaint or transaction reference.
                  </small>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="top-actions">
        <button className="help-button">
          <Icon name="help" />
          <span>Help centre</span>
        </button>
        <button
          className="notification-button"
          onClick={toggleNotifications}
          aria-label="Open notifications"
        >
          <Icon name="bell" />
          <i />
        </button>
        <div className="employee-chip">
          <span className="avatar">{employee.initials}</span>
          <span>
            <strong>{employee.name}</strong>
            <small>{employee.role}</small>
          </span>
          <Icon name="down" size={15} />
        </div>
      </div>
    </header>
  )
}

function NotificationPanel({ close }: { close: () => void }) {
  return (
    <div className="panel-scrim" onClick={close}>
      <aside
        className="notification-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h2>Notifications</h2>
            <p>3 unread updates</p>
          </div>
          <button onClick={close} aria-label="Close notifications">
            <Icon name="close" />
          </button>
        </div>
        <div className="panel-tabs">
          <button className="active">All</button>
          <button>Assigned to me</button>
        </div>
        <div className="notification-list">
          <article className="unread">
            <span className="notice-icon">
              <Icon name="message" />
            </span>
            <div>
              <strong>Ada replied on CMP-10501</strong>
              <p>
                Customer confirmed the Elm Bank recipient details for the
                ₦50,000 transfer.
              </p>
              <small>6 minutes ago</small>
            </div>
          </article>
          <article className="unread">
            <span className="notice-icon amber">
              <Icon name="clock" />
            </span>
            <div>
              <strong>Case approaching response target</strong>
              <p>CMP-10461 is due for an update within 45 minutes.</p>
              <small>21 minutes ago</small>
            </div>
          </article>
          <article>
            <span className="notice-icon">
              <Icon name="team" />
            </span>
            <div>
              <strong>Queue assignment updated</strong>
              <p>Two card dispute cases were assigned to your queue.</p>
              <small>Yesterday</small>
            </div>
          </article>
        </div>
        <Button variant="secondary">View notification centre</Button>
      </aside>
    </div>
  )
}

function Workspace({
  role,
  employee,
  navigate,
}: {
  role: RoleKey
  employee: Employee
  navigate: (id: string) => void
}) {
  const metrics = roleMetrics[role]
  const displayCases = role === "michael" ? cases.slice().reverse() : cases
  return (
    <>
      <div className="breadcrumb">
        <span>Workspace</span>
        <Icon name="chevron" size={13} />
        <strong>My Workspace</strong>
      </div>
      <section className="page-heading">
        <div>
          <p className="eyebrow teal">Tuesday, 10 June 2025</p>
          <h1>Good morning, {employee.name.split(" ")[0]}</h1>
          <p>
            {employee.role} · {employee.department}
          </p>
        </div>
        <div className="demo-label">
          <i /> Fictional demonstration data
        </div>
      </section>
      <section className="metrics-grid" aria-label="Work overview">
        <MetricCard
          label="My assigned cases"
          value={metrics.assigned}
          meta={
            role === "sarah" ? "3 updated since yesterday" : "2 updated today"
          }
          onClick={() => navigate("queue")}
        />
        <MetricCard
          label="Department queue"
          value={metrics.queue}
          meta="Across your permitted queues"
          onClick={() => navigate("queue")}
        />
        <MetricCard
          label="Payment exceptions"
          value={metrics.exceptions}
          meta="Require operational review"
          tone="amber"
          onClick={() => navigate("exceptions")}
        />
        <MetricCard
          label="Requiring attention"
          value={metrics.attention}
          meta="Response target approaching"
          tone="red"
          onClick={() => navigate("queue")}
        />
      </section>
      <div className="workspace-grid">
        <section className="content-card cases-card">
          <div className="card-header">
            <div>
              <h2>My assigned cases</h2>
              <p>Prioritised work currently assigned to you</p>
            </div>
            <Button variant="text" onClick={() => navigate("queue")}>
              View work queue <Icon name="arrow" size={16} />
            </Button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayCases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="case-id">{item.id}</strong>
                      <small>{item.subject}</small>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar tiny">{item.initials}</span>
                        <strong>{item.customer}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge tone={item.tone}>{item.status}</Badge>
                    </td>
                    <td>
                      <span
                        className={`priority ${item.priority.toLowerCase()}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>{item.updated}</td>
                    <td>
                      <button
                        className="row-arrow"
                        aria-label={`Open ${item.id}`}
                        onClick={() => navigate(`complaint:${item.id}`)}
                      >
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="workspace-side">
          <section className="content-card quick-card">
            <div className="card-header">
              <div>
                <h2>Quick access</h2>
                <p>Start a common task</p>
              </div>
            </div>
            <button onClick={() => navigate("customers")}>
              <span className="quick-icon">
                <Icon name="users" />
              </span>
              <span>
                <strong>Customer Search</strong>
                <small>Find and verify a customer</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button onClick={() => navigate("transactions")}>
              <span className="quick-icon">
                <Icon name="search" />
              </span>
              <span>
                <strong>Transaction Inquiry</strong>
                <small>Inspect a bank transaction</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button onClick={() => navigate("register-complaint")}>
              <span className="quick-icon">
                <Icon name="message" />
              </span>
              <span>
                <strong>New Complaint</strong>
                <small>Record a customer issue</small>
              </span>
              <Icon name="arrow" />
            </button>
          </section>
          <section className="notice-card">
            <div className="notice-top">
              <span>
                <Icon name="bell" />
              </span>
              <small>Operational notice</small>
            </div>
            <h3>Scheduled card network maintenance</h3>
            <p>
              Intermittent delays may affect card status updates between
              01:00–02:30 WAT tonight.
            </p>
            <button>
              Read notice <Icon name="arrow" size={15} />
            </button>
          </section>
        </aside>
        <section className="content-card activity-card">
          <div className="card-header">
            <div>
              <h2>Recent case activity</h2>
              <p>Updates across your assigned work</p>
            </div>
            <Button variant="text">View all activity</Button>
          </div>
          <div className="timeline">
            <div>
              <i className="timeline-dot teal" />
              <span>
                <strong>Customer response received</strong>
                <p>
                  Amina Yusuf uploaded supporting information to{" "}
                  <b>CMP-10482</b>.
                </p>
                <small>12 minutes ago</small>
              </span>
            </div>
            <div>
              <i className="timeline-dot navy" />
              <span>
                <strong>Case assigned to you</strong>
                <p>
                  Grace Adeyemi assigned <b>CMP-10477</b> for follow-up.
                </p>
                <small>34 minutes ago</small>
              </span>
            </div>
            <div>
              <i className="timeline-dot amber" />
              <span>
                <strong>Response target approaching</strong>
                <p>
                  <b>CMP-10461</b> requires an update within 45 minutes.
                </p>
                <small>1 hour ago</small>
              </span>
            </div>
          </div>
        </section>
        <section className="content-card outcomes-card">
          <div className="card-header">
            <div>
              <h2>Payment outcome guide</h2>
              <p>Use verified outcomes, not channel messages</p>
            </div>
          </div>
          <div className="outcome-list">
            <FinancialOutcomeBadge outcome="Outcome Unknown" />
            <FinancialOutcomeBadge outcome="Recipient Credit Confirmed" />
            <FinancialOutcomeBadge outcome="Failure Confirmed" />
            <FinancialOutcomeBadge outcome="Reversal Posted" />
          </div>
          <p className="outcome-note">
            <Icon name="help" size={17} /> A payment timeout is not evidence
            that a transaction failed. Confirm the financial outcome before
            advising a customer.
          </p>
        </section>
      </div>
    </>
  )
}

function CustomerDirectory({ navigate }: { navigate: (id: string) => void }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All statuses")
  const [type, setType] = useState("All customer types")
  const [verification, setVerification] = useState("All verification states")
  const [page, setPage] = useState(1)
  const filtered = customerRecords.filter(
    (customer) =>
      (!search ||
        `${customer.name} ${customer.reference} ${customer.account}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (status === "All statuses" || customer.status === status) &&
      (type === "All customer types" || customer.type === type) &&
      (verification === "All verification states" ||
        customer.verification === verification),
  )
  const pageSize = 3
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const resetFilters = () => {
    setSearch("")
    setStatus("All statuses")
    setType("All customer types")
    setVerification("All verification states")
    setPage(1)
  }
  return (
    <>
      <div className="breadcrumb">
        <span>Customer operations</span>
        <Icon name="chevron" size={13} />
        <strong>Customer 360</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Authorized customer access</p>
          <h1>Customer directory</h1>
          <p>
            Find a Cedar customer using only the information required for your
            operational task.
          </p>
        </div>
        <div className="demo-label">
          <i /> Deterministic simulated records
        </div>
      </section>
      <section className="content-card operations-table-card">
        <div className="directory-toolbar">
          <div className="filter-search directory-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Search customer directory"
              placeholder="Search name, customer reference or masked account"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <span className="directory-count">
            {filtered.length} simulated customers
          </span>
        </div>
        <div className="filter-bar">
          <select
            aria-label="Account status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Restricted</option>
            <option>Dormant</option>
          </select>
          <select
            aria-label="Customer type"
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setPage(1)
            }}
          >
            <option>All customer types</option>
            <option>Individual</option>
            <option>Business</option>
          </select>
          <select
            aria-label="Verification state"
            value={verification}
            onChange={(event) => {
              setVerification(event.target.value)
              setPage(1)
            }}
          >
            <option>All verification states</option>
            <option>Identity verified</option>
            <option>Business verified</option>
            <option>Review current</option>
            <option>Document review</option>
          </select>
          <Button variant="text" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table className="operations-table customer-directory-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Masked account</th>
                  <th>Account status</th>
                  <th>Customer type</th>
                  <th>Verification</th>
                  <th>Relationship</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr
                    key={customer.reference}
                    className="clickable-row"
                    onClick={() => navigate(`customer:${customer.reference}`)}
                  >
                    <td>
                      <div className="customer-cell">
                        <span className="avatar tiny">{customer.initials}</span>
                        <span>
                          <strong>{customer.name}</strong>
                          <small>{customer.reference}</small>
                        </span>
                      </div>
                    </td>
                    <td>{customer.account}</td>
                    <td>
                      <Badge tone={customer.statusTone}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td>{customer.type}</td>
                    <td>
                      <Badge tone={customer.verificationTone}>
                        {customer.verification}
                      </Badge>
                    </td>
                    <td>Since {customer.since}</td>
                    <td>
                      <button
                        className="row-arrow"
                        aria-label={`Open ${customer.name}`}
                      >
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state compact">
            <span className="state-icon">
              <Icon name="users" size={25} />
            </span>
            <h2>No customers match this view</h2>
            <p>
              Check the reference or clear the account and verification filters.
            </p>
            <Button variant="secondary" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {visible.length} of {filtered.length} simulated records
          </span>
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <Icon name="chevron" size={13} />
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <Icon name="chevron" size={13} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function CustomerProfile({
  customer,
  role,
  approvedEvidence,
  navigate,
}: {
  customer: CustomerRecord
  role: RoleKey
  approvedEvidence: boolean
  navigate: (id: string) => void
}) {
  const [tab, setTab] = useState("Overview")
  const transactions = inquiryTransactions.filter(
    (item) => item.customerRef === customer.reference,
  )
  const complaints = complaintRecords.filter(
    (item) => item.customerRef === customer.reference,
  )
  const canViewBalance = role !== "michael"
  const profileTabs =
    role === "michael"
      ? ["Overview", "Accounts", "Transactions"]
      : ["Overview", "Accounts", "Transactions", "Complaints", "Interactions"]
  const renderTransactions = () => (
    <div className="table-wrap">
      <table className="profile-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Date</th>
            <th>Institution</th>
            <th>Amount</th>
            <th>Processing stage</th>
            <th>Financial outcome</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const outcome =
              item.reference === "TXN-88420500" && approvedEvidence
                ? "Recipient Credit Confirmed"
                : item.outcome
            return (
              <tr key={item.reference}>
                <td>
                  <strong className="case-id">{item.reference}</strong>
                  <small>{item.channel}</small>
                </td>
                <td>{item.date}</td>
                <td>{item.receivingInstitution}</td>
                <td>{item.amount}</td>
                <td>
                  {item.reference === "TXN-88420500" && approvedEvidence
                    ? "External confirmation received"
                    : item.stage}
                </td>
                <td>
                  <FinancialOutcomeBadge outcome={outcome} compact />
                </td>
                <td>
                  <button
                    className="row-arrow"
                    aria-label={`Open ${item.reference}`}
                    onClick={() => navigate(`transaction:${item.reference}`)}
                  >
                    <Icon name="arrow" size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
  return (
    <>
      <div className="breadcrumb">
        <button onClick={() => navigate("customers")}>Customer 360</button>
        <Icon name="chevron" size={13} />
        <strong>{customer.reference}</strong>
      </div>
      <section className="customer-profile-heading">
        <div className="customer-profile-identity">
          <span className="avatar profile-avatar">{customer.initials}</span>
          <div>
            <p className="eyebrow teal">Customer profile</p>
            <h1>{customer.name}</h1>
            <p>
              {customer.reference} · {customer.type} · Customer since{" "}
              {customer.since}
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <Badge tone={customer.statusTone}>{customer.status}</Badge>
          <Badge tone={customer.verificationTone}>
            {customer.verification}
          </Badge>
        </div>
      </section>
      <div className="profile-tabs" role="tablist">
        {profileTabs.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Transactions" && <span>{transactions.length}</span>}
            {item === "Complaints" && <span>{complaints.length}</span>}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="customer-overview-grid">
          <section className="content-card profile-section">
            <div className="card-header">
              <div>
                <h2>Identity summary</h2>
                <p>Minimum operational customer information</p>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <span>Customer reference</span>
                <strong>{customer.reference}</strong>
              </div>
              <div>
                <span>Masked phone</span>
                <strong>{customer.phone}</strong>
              </div>
              <div>
                <span>Customer type</span>
                <strong>{customer.type}</strong>
              </div>
              <div>
                <span>Verification</span>
                <strong>{customer.verification}</strong>
              </div>
            </div>
          </section>
          <section className="content-card profile-section account-overview">
            <div className="card-header">
              <div>
                <h2>Primary account</h2>
                <p>Access is role-scoped and logged</p>
              </div>
            </div>
            <div className="account-overview-body">
              <span>Account reference</span>
              <strong>{customer.account.split(" · ")[0]}</strong>
              <small>{customer.account.split(" · ")[1]}</small>
              <div className="balance-line">
                <span>Simulated available balance</span>
                {canViewBalance ? (
                  <strong>₦284,650.25</strong>
                ) : (
                  <span className="balance-restricted">
                    <Icon name="lock" size={13} /> Not available for this role
                  </span>
                )}
              </div>
            </div>
          </section>
          <section className="content-card profile-transactions">
            <div className="card-header">
              <div>
                <h2>Recent transactions</h2>
                <p>Processing stage and outcome are shown separately</p>
              </div>
              <Button variant="text" onClick={() => setTab("Transactions")}>
                View all
              </Button>
            </div>
            {transactions.length ? (
              renderTransactions()
            ) : (
              <div className="inline-empty">No recent transactions</div>
            )}
          </section>
          <section className="content-card profile-notice">
            <div className="card-header">
              <div>
                <h2>Operational notice</h2>
                <p>Relevant to current servicing</p>
              </div>
            </div>
            <div className="profile-notice-body">
              <Icon name="help" size={18} />
              <p>
                A route timeout is not evidence of payment failure. Use the
                separately approved response before communicating Ada&apos;s
                financial outcome.
              </p>
            </div>
          </section>
        </div>
      )}
      {tab === "Accounts" && (
        <section className="content-card profile-tab-card">
          <div className="card-header">
            <div>
              <h2>Customer accounts</h2>
              <p>Masked account information</p>
            </div>
          </div>
          <div className="account-row">
            <span className="quick-icon">
              <Icon name="grid" size={17} />
            </span>
            <div>
              <strong>{customer.account.split(" · ")[0]}</strong>
              <small>
                Personal current account · {customer.account.split(" · ")[1]}
              </small>
            </div>
            <Badge tone={customer.statusTone}>{customer.status}</Badge>
            {canViewBalance ? (
              <strong>₦284,650.25</strong>
            ) : (
              <span className="muted-value">Balance restricted</span>
            )}
          </div>
        </section>
      )}
      {tab === "Transactions" && (
        <section className="content-card profile-tab-card">
          <div className="card-header">
            <div>
              <h2>Transaction history</h2>
              <p>Simulated recent Cedar records</p>
            </div>
          </div>
          {transactions.length ? (
            renderTransactions()
          ) : (
            <div className="empty-state compact">
              <h2>No transactions in this fixture</h2>
            </div>
          )}
        </section>
      )}
      {tab === "Complaints" && (
        <section className="content-card profile-tab-card">
          <div className="card-header">
            <div>
              <h2>Complaints</h2>
              <p>Open and resolved Cedar-owned cases</p>
            </div>
          </div>
          {complaints.length ? (
            <div className="profile-list">
              {complaints.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`complaint:${item.id}`)}
                >
                  <span>
                    <strong>{item.subject}</strong>
                    <small>
                      {item.id} · {item.received}
                    </small>
                  </span>
                  <Badge tone={item.tone}>{item.status}</Badge>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <h2>No complaint records</h2>
              <p>This customer has no complaints in the simulated fixture.</p>
            </div>
          )}
        </section>
      )}
      {tab === "Interactions" && (
        <section className="content-card profile-tab-card">
          <div className="card-header">
            <div>
              <h2>Customer interaction history</h2>
              <p>Contact records retained by Cedar</p>
            </div>
          </div>
          <div className="communication-list">
            <article>
              <span className="avatar tiny">SB</span>
              <div>
                <div>
                  <strong>Digital support acknowledgement</strong>
                  <small>10 Jun 2025 · 09:29</small>
                </div>
                <p>
                  Complaint reference and expected response window shared with
                  the customer.
                </p>
              </div>
            </article>
            <article>
              <span className="avatar tiny">{customer.initials}</span>
              <div>
                <div>
                  <strong>Customer in-app message</strong>
                  <small>10 Jun 2025 · 09:28</small>
                </div>
                <p>
                  Customer reported the transfer debit and supplied the Elm Bank
                  beneficiary information.
                </p>
              </div>
            </article>
          </div>
        </section>
      )}
    </>
  )
}

function TransactionInquiry({
  approvedEvidence,
  navigate,
}: {
  approvedEvidence: boolean
  navigate: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [channel, setChannel] = useState("All channels")
  const [stage, setStage] = useState("All processing stages")
  const [outcome, setOutcome] = useState("All financial outcomes")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)
  const records = inquiryTransactions.map((item) =>
    item.reference === "TXN-88420500" && approvedEvidence
      ? {
          ...item,
          stage: "External confirmation received",
          outcome: "Recipient Credit Confirmed",
        }
      : item,
  )
  const filtered = records.filter(
    (item) =>
      (!search ||
        `${item.reference} ${item.customerRef} ${item.customer}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (channel === "All channels" || item.channel === channel) &&
      (stage === "All processing stages" || item.stage === stage) &&
      (outcome === "All financial outcomes" || item.outcome === outcome) &&
      (!fromDate || item.dateIso >= fromDate) &&
      (!toDate || item.dateIso <= toDate),
  )
  const pageSize = 3
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const clear = () => {
    setSearch("")
    setChannel("All channels")
    setStage("All processing stages")
    setOutcome("All financial outcomes")
    setFromDate("")
    setToDate("")
    setPage(1)
  }
  return (
    <>
      <div className="breadcrumb">
        <span>Customer operations</span>
        <Icon name="chevron" size={13} />
        <strong>Transaction Inquiry</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Banking record inquiry</p>
          <h1>Transaction inquiry</h1>
          <p>
            Search Cedar records while keeping processing stage and financial
            outcome distinct.
          </p>
        </div>
        <div className="demo-label">
          <i /> Deterministic simulated records
        </div>
      </section>
      <section className="content-card operations-table-card">
        <div className="transaction-search-panel">
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Transaction or customer reference"
              placeholder="Transaction reference, customer reference or name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <label>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>
        <div className="filter-bar">
          <select
            aria-label="Payment channel"
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value)
              setPage(1)
            }}
          >
            <option>All channels</option>
            <option>Mobile transfer</option>
            <option>Web transfer</option>
            <option>Card</option>
            <option>POS</option>
          </select>
          <select
            aria-label="Processing stage"
            value={stage}
            onChange={(event) => {
              setStage(event.target.value)
              setPage(1)
            }}
          >
            <option>All processing stages</option>
            {[...new Set(records.map((item) => item.stage))].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="Financial outcome"
            value={outcome}
            onChange={(event) => {
              setOutcome(event.target.value)
              setPage(1)
            }}
          >
            <option>All financial outcomes</option>
            <option>Outcome Unknown</option>
            <option>Recipient Credit Confirmed</option>
            <option>Reversal Posted</option>
          </select>
          <Button variant="text" onClick={clear}>
            Clear search
          </Button>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table className="operations-table transaction-inquiry-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Institutions</th>
                  <th>Processing stage</th>
                  <th>Financial outcome</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.reference}
                    className="clickable-row"
                    onClick={() => navigate(`transaction:${item.reference}`)}
                  >
                    <td>
                      <strong className="case-id">{item.reference}</strong>
                      <small>{item.amount}</small>
                    </td>
                    <td>
                      <strong>{item.customer}</strong>
                      <small>{item.customerRef}</small>
                    </td>
                    <td>{item.date}</td>
                    <td>{item.channel}</td>
                    <td>
                      <strong>{item.sendingInstitution}</strong>
                      <small>to {item.receivingInstitution}</small>
                    </td>
                    <td>
                      <span className="processing-stage">{item.stage}</span>
                    </td>
                    <td>
                      <FinancialOutcomeBadge outcome={item.outcome} compact />
                    </td>
                    <td>
                      <button className="row-arrow">
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state compact">
            <span className="state-icon">
              <Icon name="search" size={25} />
            </span>
            <h2>No matching transactions</h2>
            <p>
              Check the references, date range, channel, stage or financial
              outcome.
            </p>
            <Button variant="secondary" onClick={clear}>
              Clear search
            </Button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {visible.length} of {filtered.length} simulated records
          </span>
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <Icon name="chevron" size={13} />
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              <Icon name="chevron" size={13} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function WorkQueue({
  role,
  navigate,
}: {
  role: RoleKey
  navigate: (id: string) => void
}) {
  const [view, setView] = useState<"assigned" | "department" | "unassigned">(
    role === "grace" ? "department" : "assigned",
  )
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState("All priorities")
  const [sort, setSort] = useState("Attention first")
  const complaintItems = complaintRecords
    .filter((item) => item.status !== "Resolved")
    .map((item) => ({
      id: item.id,
      type: "Complaint",
      subject: item.subject,
      customer: item.customer,
      customerRef: item.customerRef,
      transaction: item.transaction,
      priority: item.priority,
      status: item.status,
      officer: item.officer,
      activity: item.updated,
      channel: item.channel,
      queue: item.queue,
      route: `complaint:${item.id}`,
    }))
  const paymentItems = paymentExceptions.map((item, index) => ({
    id: `PAY-EX-${String(index + 1).padStart(3, "0")}`,
    type: "Payment exception",
    subject: item.type,
    customer: item.customer,
    customerRef:
      inquiryTransactions.find(
        (transaction) => transaction.reference === item.transaction,
      )?.customerRef || "Customer reference unavailable",
    transaction: item.transaction,
    priority: index < 2 ? "High" : "Medium",
    status: item.verification,
    officer: index < 3 ? "Michael Eze" : "Unassigned",
    activity: item.age,
    queue: index < 3 ? "assigned" : "department",
    route: `transaction:${item.transaction}`,
  }))
  const roleItems =
    role === "michael"
      ? paymentItems
      : role === "bob"
        ? complaintItems
            .filter(
              (item) =>
                item.officer === "Bob Okafor" ||
                item.channel === "Branch visit",
            )
            .map((item) => ({
              ...item,
              queue: item.officer === "Bob Okafor" ? "assigned" : item.queue,
            }))
        : role === "grace"
          ? complaintItems
          : complaintItems
  const filtered = roleItems
    .filter((item) => item.queue === view)
    .filter(
      (item) =>
        !search ||
        `${item.id} ${item.subject} ${item.customer} ${item.customerRef} ${item.transaction}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .filter(
      (item) => priority === "All priorities" || item.priority === priority,
    )
  const priorityRank: Record<string, number> = { High: 0, Medium: 1, Normal: 2 }
  const visible = [...filtered].sort((a, b) =>
    sort === "Priority"
      ? priorityRank[a.priority] - priorityRank[b.priority]
      : priorityRank[a.priority] - priorityRank[b.priority] ||
        a.activity.localeCompare(b.activity),
  )
  return (
    <>
      <div className="breadcrumb">
        <span>Workspace</span>
        <Icon name="chevron" size={13} />
        <strong>My Work Queue</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Role-aware workload</p>
          <h1>My work queue</h1>
          <p>
            {role === "michael"
              ? "Payment investigations and exceptions assigned to your role."
              : role === "bob"
                ? "Branch customer-service work and customer follow-ups."
                : role === "grace"
                  ? "Supervisory visibility across complaint ownership and escalations."
                  : "Digital support complaints and customer-response work."}
          </p>
        </div>
        <div className="demo-label">
          <i /> Simulated assignments only
        </div>
      </section>
      <section className="queue-summary work-summary">
        <div>
          <span>Assigned to me</span>
          <strong>
            {roleItems.filter((item) => item.queue === "assigned").length}
          </strong>
          <small>Current role workload</small>
        </div>
        <div>
          <span>Department queue</span>
          <strong>
            {roleItems.filter((item) => item.queue === "department").length}
          </strong>
          <small>Permitted team visibility</small>
        </div>
        <div>
          <span>Requiring attention</span>
          <strong>
            {roleItems.filter((item) => item.priority === "High").length}
          </strong>
          <small>High-priority items</small>
        </div>
      </section>
      <section className="content-card operations-table-card">
        <div className="queue-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={view === "assigned"}
            className={view === "assigned" ? "active" : ""}
            onClick={() => setView("assigned")}
          >
            Assigned cases
          </button>
          <button
            role="tab"
            aria-selected={view === "department"}
            className={view === "department" ? "active" : ""}
            onClick={() => setView("department")}
          >
            Department queue
          </button>
          {role === "grace" && (
            <button
              role="tab"
              aria-selected={view === "unassigned"}
              className={view === "unassigned" ? "active" : ""}
              onClick={() => setView("unassigned")}
            >
              Unassigned
            </button>
          )}
        </div>
        <div className="filter-bar">
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              placeholder="Search work item, customer or transaction"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option>All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Normal</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Attention first</option>
            <option>Priority</option>
          </select>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table className="operations-table work-queue-table">
              <thead>
                <tr>
                  <th>Work item</th>
                  <th>Customer</th>
                  <th>Linked transaction</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignment</th>
                  <th>Last activity</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className="clickable-row"
                    onClick={() => navigate(item.route)}
                  >
                    <td>
                      <strong className="case-id">{item.id}</strong>
                      <small>
                        {item.type} · {item.subject}
                      </small>
                    </td>
                    <td>
                      <strong>{item.customer}</strong>
                      <small>{item.customerRef}</small>
                    </td>
                    <td>{item.transaction}</td>
                    <td>
                      <span
                        className={`priority ${item.priority.toLowerCase()}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <Badge
                        tone={
                          item.status.toLowerCase().includes("action") ||
                          item.status.toLowerCase().includes("pending")
                            ? "warning"
                            : "info"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td>{item.officer}</td>
                    <td>{item.activity}</td>
                    <td>
                      <button className="row-arrow">
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state compact">
            <span className="state-icon">
              <Icon name="inbox" size={25} />
            </span>
            <h2>No work items in this view</h2>
            <p>
              Change the queue or clear filters. No assignment was created by
              this prototype.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("")
                setPriority("All priorities")
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  )
}

function ComplaintsQueue({
  role,
  navigate,
}: {
  role: RoleKey
  navigate: (id: string) => void
}) {
  const [queue, setQueue] = useState<"assigned" | "department" | "unassigned">(
    role === "grace" ? "department" : "assigned",
  )
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All categories")
  const [status, setStatus] = useState("All statuses")
  const [sort, setSort] = useState("Newest received")
  const [page, setPage] = useState(1)
  const filtered = complaintRecords
    .filter((item) => item.status !== "Resolved")
    .filter((item) => item.queue === queue)
    .filter(
      (item) =>
        !search ||
        `${item.id} ${item.customer} ${item.customerRef} ${item.transaction}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .filter(
      (item) => category === "All categories" || item.category === category,
    )
    .filter((item) => status === "All statuses" || item.status === status)
  const targetOrder: Record<string, number> = {
    danger: 0,
    warning: 1,
    success: 2,
  }
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "Oldest received")
      return complaintRecords.indexOf(b) - complaintRecords.indexOf(a)
    if (sort === "Service target")
      return targetOrder[a.targetTone] - targetOrder[b.targetTone]
    return complaintRecords.indexOf(a) - complaintRecords.indexOf(b)
  })
  const pageSize = 2
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <div className="breadcrumb">
        <span>Customer operations</span>
        <Icon name="chevron" size={13} />
        <strong>Complaints & Disputes</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Complaint management</p>
          <h1>Complaints queue</h1>
          <p>
            Review customer reports, ownership, interactions and response
            targets.
          </p>
        </div>
        <div className="heading-actions">
          <div className="demo-label">
            <i /> Fictional demonstration data
          </div>
          {role !== "grace" && (
            <Button onClick={() => navigate("register-complaint")}>
              <span className="button-plus">+</span> Register complaint
            </Button>
          )}
        </div>
      </section>
      <section className="queue-summary">
        <div>
          <span>Assigned to me</span>
          <strong>
            {role === "sarah" ? "12" : role === "grace" ? "4" : "6"}
          </strong>
          <small>Active complaints</small>
        </div>
        <div>
          <span>Department queue</span>
          <strong>{role === "grace" ? "34" : "28"}</strong>
          <small>Across permitted teams</small>
        </div>
        <div>
          <span>Unassigned</span>
          <strong>5</strong>
          <small>Ownership required</small>
        </div>
        <div className="attention">
          <span>Service target at risk</span>
          <strong>{role === "grace" ? "9" : "3"}</strong>
          <small>Due within two hours</small>
        </div>
      </section>
      <section className="content-card operations-table-card">
        <div className="queue-tabs" role="tablist">
          {[
            ["assigned", "Assigned complaints", "12"],
            ["department", "Department queue", "28"],
            ["unassigned", "Unassigned cases", "5"],
          ].map(([id, label, count]) => (
            <button
              key={id}
              role="tab"
              aria-selected={queue === id}
              className={queue === id ? "active" : ""}
              onClick={() => {
                setQueue(id as "assigned" | "department" | "unassigned")
                setPage(1)
              }}
            >
              {label} <span>{count}</span>
            </button>
          ))}
        </div>
        <div className="filter-bar">
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Search complaints"
              placeholder="Search case, customer or transaction"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setPage(1)
            }}
            aria-label="Complaint category"
          >
            <option>All categories</option>
            <option>Card transaction dispute</option>
            <option>Transfer dispute</option>
            <option>POS dispute</option>
            <option>Account access</option>
            <option>ATM dispute</option>
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            aria-label="Complaint status"
          >
            <option>All statuses</option>
            <option>Investigating</option>
            <option>Awaiting response</option>
            <option>Action required</option>
            <option>Escalated</option>
          </select>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value)
              setPage(1)
            }}
            aria-label="Sort complaints"
          >
            <option>Newest received</option>
            <option>Oldest received</option>
            <option>Service target</option>
          </select>
        </div>
        {sorted.length ? (
          <div className="table-wrap">
            <table className="operations-table">
              <thead>
                <tr>
                  <th>Case / category</th>
                  <th>Customer</th>
                  <th>Linked transaction</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Assigned officer</th>
                  <th>Service target</th>
                  <th>Veriq</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className="clickable-row"
                    onClick={() => navigate(`complaint:${item.id}`)}
                  >
                    <td>
                      <strong className="case-id">{item.id}</strong>
                      <small>{item.category}</small>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar tiny">{item.initials}</span>
                        <span>
                          <strong>{item.customer}</strong>
                          <small>{item.customerRef}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{item.transaction}</strong>
                      <small>{item.amount}</small>
                    </td>
                    <td>
                      <Badge tone={item.tone}>{item.status}</Badge>
                    </td>
                    <td>{item.received}</td>
                    <td>{item.officer}</td>
                    <td>
                      <span className={`target ${item.targetTone}`}>
                        <Icon name="clock" size={13} />
                        {item.target}
                      </span>
                    </td>
                    <td>
                      {item.veriq ? (
                        <span className="veriq-indicator">
                          <Icon name="shield" size={13} /> Linked
                        </span>
                      ) : (
                        <span className="muted-value">Not linked</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="row-arrow"
                        aria-label={`Open ${item.id}`}
                      >
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state compact">
            <span className="state-icon">
              <Icon name="search" size={25} />
            </span>
            <h2>No matching complaints</h2>
            <p>
              Try a different case reference, customer name, category or status.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("")
                setCategory("All categories")
                setStatus("All statuses")
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {visible.length} of {sorted.length} simulated records
          </span>
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <Icon name="chevron" size={13} />
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <Icon name="chevron" size={13} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function ComplaintDetail({
  complaint,
  navigate,
  approvedEvidence,
  onApproveEvidence,
}: {
  complaint: ComplaintRecord
  navigate: (id: string) => void
  approvedEvidence: boolean
  onApproveEvidence: () => void
}) {
  const [interaction, setInteraction] = useState("")
  const [savedInteraction, setSavedInteraction] = useState("")
  const [veriqUnavailable, setVeriqUnavailable] = useState(false)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const saveInteraction = () => {
    if (!interaction.trim()) return
    setSavedInteraction(interaction)
    setInteraction("")
  }
  const loadApprovedEvidence = () => {
    setEvidenceLoading(true)
    window.setTimeout(() => {
      onApproveEvidence()
      setEvidenceLoading(false)
    }, 650)
  }
  return (
    <>
      <div className="breadcrumb">
        <button onClick={() => navigate("complaints")}>
          Complaints & Disputes
        </button>
        <Icon name="chevron" size={13} />
        <strong>{complaint.id}</strong>
      </div>
      <section className="case-page-heading">
        <div>
          <div className="case-title-line">
            <p className="eyebrow teal">Complaint case</p>
            <Badge tone={complaint.tone}>{complaint.status}</Badge>
          </div>
          <h1>{complaint.subject}</h1>
          <p>
            {complaint.id} · Reported {complaint.received} · {complaint.channel}
          </p>
        </div>
        <div className="heading-actions">
          <Button variant="secondary">Escalate case</Button>
          <Button>Update status</Button>
        </div>
      </section>
      {savedInteraction && (
        <div className="success-banner">
          <Icon name="check" size={19} />
          <span>
            <strong>Interaction saved to this prototype case</strong>
            <small>
              This demonstration did not change production banking records.
            </small>
          </span>
          <button onClick={() => setSavedInteraction("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <div className="case-layout">
        <div className="case-main">
          <section className="content-card detail-card">
            <div className="card-header">
              <div>
                <h2>Complaint information</h2>
                <p>Customer-reported information owned by Cedar</p>
              </div>
            </div>
            <div className="description-block">
              <span>Customer-reported description</span>
              <p>{complaint.description}</p>
            </div>
            <div className="detail-grid">
              <div>
                <span>Category</span>
                <strong>{complaint.category}</strong>
              </div>
              <div>
                <span>Intake channel</span>
                <strong>{complaint.channel}</strong>
              </div>
              <div>
                <span>Assigned department</span>
                <strong>Customer Experience · Resolution</strong>
              </div>
              <div>
                <span>Assigned employee</span>
                <strong>{complaint.officer}</strong>
              </div>
            </div>
          </section>
          <section className="content-card linked-transaction-card">
            <div className="card-header">
              <div>
                <h2>Linked transaction</h2>
                <p>Transaction evidence retained by Cedar</p>
              </div>
              {complaint.transaction !== "Not linked" && (
                <Button
                  variant="text"
                  onClick={() =>
                    navigate(`transaction:${complaint.transaction}`)
                  }
                >
                  Open transaction <Icon name="arrow" size={15} />
                </Button>
              )}
            </div>
            <div className="transaction-strip">
              <div>
                <span>Transaction reference</span>
                <strong>{complaint.transaction}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{complaint.amount}</strong>
              </div>
              <div>
                <span>Financial outcome</span>
                <FinancialOutcomeBadge
                  outcome={
                    approvedEvidence
                      ? "Recipient Credit Confirmed"
                      : "Outcome Unknown"
                  }
                  compact
                />
              </div>
              <div>
                <span>Evidence state</span>
                <strong>
                  {approvedEvidence
                    ? "Approved response received"
                    : "Operational review required"}
                </strong>
              </div>
            </div>
            <p className="evidence-note">
              <Icon name="help" size={16} /> A gateway timeout is an application
              event, not evidence of payment failure.
            </p>
            {complaint.customerSafeUpdate && (
              <div
                className={`approved-evidence ${
                  approvedEvidence ? "ready" : ""
                }`}
              >
                <div>
                  <span>
                    {approvedEvidence
                      ? "Later approved mock response · 11:42 WAT"
                      : "Later evidence fixture available"}
                  </span>
                  <strong>
                    {approvedEvidence
                      ? "Customer-safe information is ready"
                      : "Initial case view remains UNKNOWN"}
                  </strong>
                  <p>
                    {approvedEvidence
                      ? complaint.customerSafeUpdate
                      : "Load the separately timestamped approved response to demonstrate the later customer-safe state. This does not rewrite complaint history."}
                  </p>
                </div>
                {!approvedEvidence && (
                  <Button
                    variant="secondary"
                    onClick={loadApprovedEvidence}
                    disabled={evidenceLoading}
                  >
                    {evidenceLoading ? (
                      <>
                        <span className="inline-spinner" /> Loading approved
                        response…
                      </>
                    ) : (
                      "Load later approved response"
                    )}
                  </Button>
                )}
              </div>
            )}
          </section>
          <section className="content-card interaction-card">
            <div className="card-header">
              <div>
                <h2>Customer interactions</h2>
                <p>
                  Add contact history to this case without creating a duplicate
                  complaint
                </p>
              </div>
            </div>
            <div className="interaction-composer">
              <label>
                Interaction note
                <textarea
                  value={interaction}
                  onChange={(event) => setInteraction(event.target.value)}
                  placeholder="Record what the customer reported or what was communicated…"
                />
              </label>
              <div>
                <select aria-label="Interaction channel">
                  <option>Phone call</option>
                  <option>Email</option>
                  <option>In-app message</option>
                  <option>Branch visit</option>
                </select>
                <Button
                  onClick={saveInteraction}
                  disabled={!interaction.trim()}
                >
                  Save interaction
                </Button>
              </div>
            </div>
            <div className="communication-list">
              {approvedEvidence && (
                <article className="approved-history">
                  <span className="notice-icon">
                    <Icon name="check" size={16} />
                  </span>
                  <div>
                    <div>
                      <strong>Approved financial evidence recorded</strong>
                      <small>Today, 11:42</small>
                    </div>
                    <p>
                      Elm Bank confirmed recipient credit. The complaint remains
                      available with its full interaction history.
                    </p>
                  </div>
                </article>
              )}
              {savedInteraction && (
                <article>
                  <span className="avatar tiny">SB</span>
                  <div>
                    <div>
                      <strong>Sarah Bello · Internal note</strong>
                      <small>Just now</small>
                    </div>
                    <p>{savedInteraction}</p>
                  </div>
                </article>
              )}
              <article>
                <span className="avatar tiny">{complaint.initials}</span>
                <div>
                  <div>
                    <strong>{complaint.customer} · In-app message</strong>
                    <small>Today, 09:06</small>
                  </div>
                  <p>
                    Customer provided the requested transaction context and
                    confirmed their contact details.
                  </p>
                </div>
              </article>
              <article>
                <span className="avatar tiny">SB</span>
                <div>
                  <div>
                    <strong>Sarah Bello · Acknowledgement sent</strong>
                    <small>Today, 08:48</small>
                  </div>
                  <p>
                    Cedar acknowledged the complaint and shared the case
                    reference and response target.
                  </p>
                </div>
              </article>
            </div>
          </section>
        </div>
        <aside className="case-side">
          <section className="content-card customer-summary">
            <div className="card-header">
              <div>
                <h2>Customer</h2>
                <p>Authorized Cedar customer</p>
              </div>
            </div>
            <div className="customer-identity">
              <span className="avatar">{complaint.initials}</span>
              <span>
                <strong>{complaint.customer}</strong>
                <small>{complaint.customerRef}</small>
              </span>
              <Badge tone="success">Verified</Badge>
            </div>
            <dl>
              <div>
                <dt>Phone</dt>
                <dd>+234 ••• ••• 1842</dd>
              </div>
              <div>
                <dt>Customer since</dt>
                <dd>March 2021</dd>
              </div>
              <div>
                <dt>Identity tier</dt>
                <dd>Tier 3 · Complete</dd>
              </div>
            </dl>
          </section>
          <section className="content-card service-card">
            <div className="card-header">
              <div>
                <h2>Ownership & service target</h2>
              </div>
            </div>
            <div className="service-content">
              <Badge tone={complaint.targetTone}>
                <Icon name="clock" size={13} /> {complaint.target}
              </Badge>
              <div>
                <span>Assigned to</span>
                <strong>{complaint.officer}</strong>
              </div>
              <div>
                <span>Escalation</span>
                <strong>
                  {complaint.status === "Escalated"
                    ? "Supervisor review"
                    : "No active escalation"}
                </strong>
              </div>
            </div>
          </section>
          <section className="content-card veriq-card">
            <div className="veriq-header">
              <span className="veriq-logo">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <h2>Linked Veriq Intelligence</h2>
                <p>Independent investigation service</p>
              </div>
              {complaint.veriq && (
                <button
                  className="simulate-link"
                  onClick={() => setVeriqUnavailable(!veriqUnavailable)}
                  title="Toggle integration state for prototype"
                >
                  {veriqUnavailable ? "Retry" : "Simulate outage"}
                </button>
              )}
            </div>
            {veriqUnavailable ? (
              <div className="integration-unavailable">
                <Icon name="alert" size={23} />
                <strong>Veriq is temporarily unavailable</strong>
                <p>
                  Cedar complaint information remains available. Intelligence
                  will refresh when the connection is restored.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setVeriqUnavailable(false)}
                >
                  Retry connection
                </Button>
              </div>
            ) : complaint.veriq ? (
              <>
                <div className="veriq-status">
                  <Badge
                    tone={
                      complaint.id === "CMP-10501" && approvedEvidence
                        ? "success"
                        : "info"
                    }
                  >
                    {complaint.id === "CMP-10501" && approvedEvidence
                      ? "Authorized evidence ready"
                      : complaint.veriq.status}
                  </Badge>
                  <small>
                    Last sync{" "}
                    {complaint.id === "CMP-10501" && approvedEvidence
                      ? "10 Jun 2025 · 11:43 WAT"
                      : complaint.veriq.synced}
                  </small>
                </div>
                <div className="linked-record-map">
                  <div>
                    <span className="record-type cedar">Cedar</span>
                    <strong>Bank-owned complaint</strong>
                    <small>{complaint.id}</small>
                  </div>
                  <Icon name="chevron" size={13} />
                  <div>
                    <span className="record-type veriq">Veriq</span>
                    <strong>Transaction investigation</strong>
                    <small>{complaint.veriq.reference}</small>
                  </div>
                  <Icon name="chevron" size={13} />
                  <div>
                    <span className="record-type incident">Incident</span>
                    <strong>Operational route incident</strong>
                    <small>{complaint.veriq.incident}</small>
                  </div>
                </div>
                {complaint.id === "CMP-10501" && (
                  <div className="verification-request">
                    <Icon name="users" size={16} />
                    <span>
                      <strong>Human verification request</strong>
                      <small>
                        Confirm receiving-bank evidence before customer
                        communication
                      </small>
                    </span>
                    <Badge tone={approvedEvidence ? "success" : "warning"}>
                      {approvedEvidence ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                )}
                <dl className="veriq-details">
                  <div>
                    <dt>Investigation reference</dt>
                    <dd>{complaint.veriq.reference}</dd>
                  </div>
                  <div>
                    <dt>Origin</dt>
                    <dd>{complaint.veriq.origin}</dd>
                  </div>
                  <div>
                    <dt>Initiated</dt>
                    <dd>{complaint.veriq.initiated}</dd>
                  </div>
                  <div>
                    <dt>Related incident</dt>
                    <dd>{complaint.veriq.incident}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>
                      {complaint.id === "CMP-10501" && approvedEvidence
                        ? "Authorized Elm Bank response available"
                        : complaint.veriq.evidence}
                    </dd>
                  </div>
                </dl>
                <div className="permitted-finding">
                  <span>Latest permitted finding</span>
                  <p>
                    {complaint.id === "CMP-10501" && approvedEvidence
                      ? "Separately authorized evidence confirms recipient credit at Elm Bank. Cedar may use the approved customer-safe response without replacing the complaint record."
                      : complaint.veriq.finding}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="full-width"
                  onClick={() =>
                    navigate(`veriq-workbench:${complaint.veriq?.reference}`)
                  }
                >
                  Open Veriq Workbench <Icon name="arrow" size={15} />
                </Button>
              </>
            ) : (
              <div className="integration-empty">
                <Icon name="shield" size={24} />
                <strong>No linked investigation</strong>
                <p>
                  Cedar can continue managing this complaint independently of
                  Veriq.
                </p>
              </div>
            )}
          </section>
          <section className="content-card mini-timeline">
            <div className="card-header">
              <div>
                <h2>Case activity</h2>
                <p>Latest workflow events</p>
              </div>
            </div>
            <div className="timeline">
              <div>
                <i className="timeline-dot teal" />
                <span>
                  <strong>Customer response received</strong>
                  <small>12 minutes ago</small>
                </span>
              </div>
              <div>
                <i className="timeline-dot navy" />
                <span>
                  <strong>Case assigned to {complaint.officer}</strong>
                  <small>34 minutes ago</small>
                </span>
              </div>
              <div>
                <i className="timeline-dot amber" />
                <span>
                  <strong>Complaint registered</strong>
                  <small>{complaint.received}</small>
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function RegisterComplaint({ navigate }: { navigate: (id: string) => void }) {
  const [step, setStep] = useState(1)
  const [customerSelected, setCustomerSelected] = useState(false)
  const [transactionSelected, setTransactionSelected] = useState(false)
  const [category, setCategory] = useState("")
  const [channel, setChannel] = useState("Branch visit")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const next = () => {
    if (step === 1 && !customerSelected)
      return setError("Select an authorized customer before continuing.")
    if (step === 2 && !transactionSelected)
      return setError("Select a transaction or choose to continue without one.")
    if (step === 3 && (!category || description.trim().length < 20))
      return setError(
        "Choose a category and enter at least 20 characters from the customer's report.",
      )
    setError("")
    setStep((current) => Math.min(4, current + 1))
  }
  if (saved)
    return (
      <div className="saved-state">
        <span className="saved-check">
          <Icon name="check" size={30} />
        </span>
        <p className="eyebrow teal">Mock persistence confirmed</p>
        <h1>Complaint CMP-10503 saved</h1>
        <p>
          The fictional complaint has been added to the prototype queue. No
          production banking record was created or changed.
        </p>
        <div className="saved-summary">
          <div>
            <span>Customer</span>
            <strong>Amina Yusuf · CUS-208194</strong>
          </div>
          <div>
            <span>Transaction</span>
            <strong>TXN-88420195</strong>
          </div>
          <div>
            <span>Intake channel</span>
            <strong>{channel}</strong>
          </div>
        </div>
        <div className="heading-actions">
          <Button variant="secondary" onClick={() => navigate("complaints")}>
            Return to queue
          </Button>
          <Button onClick={() => navigate("complaint:CMP-10482")}>
            Open saved-case example
          </Button>
        </div>
      </div>
    )
  return (
    <>
      <div className="breadcrumb">
        <button onClick={() => navigate("complaints")}>
          Complaints & Disputes
        </button>
        <Icon name="chevron" size={13} />
        <strong>Register complaint</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Branch intake</p>
          <h1>Register a customer complaint</h1>
          <p>
            Search the customer and existing records before creating a new
            complaint.
          </p>
        </div>
        <div className="mock-persistence">
          <Icon name="shield" size={15} />
          Prototype mock persistence
        </div>
      </section>
      <div className="registration-layout">
        <aside className="registration-steps">
          {[
            ["1", "Customer", "Find and authorize"],
            ["2", "Transaction", "Select related record"],
            ["3", "Complaint", "Capture report"],
            ["4", "Review", "Confirm information"],
          ].map(([number, label, detail], index) => (
            <button
              key={number}
              className={`${step === index + 1 ? "active" : ""} ${
                step > index + 1 ? "complete" : ""
              }`}
              onClick={() => step > index + 1 && setStep(index + 1)}
            >
              <span>{step > index + 1 ? "✓" : number}</span>
              <div>
                <strong>{label}</strong>
                <small>{detail}</small>
              </div>
            </button>
          ))}
          <div className="intake-note">
            <Icon name="help" size={17} />
            <p>
              A new interaction on an existing complaint should be recorded on
              that case, not registered as a duplicate.
            </p>
          </div>
        </aside>
        <section className="content-card registration-card">
          {error && (
            <div className="validation-banner">
              <Icon name="alert" size={17} />
              {error}
            </div>
          )}
          {step === 1 && (
            <div className="form-step">
              <div className="step-heading">
                <span>Step 1 of 4</span>
                <h2>Search and select an authorized customer</h2>
                <p>Verify the customer before viewing complaint information.</p>
              </div>
              <label className="form-label">
                Customer name, phone or reference
                <div className="form-search">
                  <Icon name="search" size={17} />
                  <input defaultValue="Amina Yusuf" />
                  <Button variant="secondary">Search</Button>
                </div>
              </label>
              <button
                className={`selection-card ${
                  customerSelected ? "selected" : ""
                }`}
                onClick={() => {
                  setCustomerSelected(true)
                  setError("")
                }}
              >
                <span className="avatar">AY</span>
                <span>
                  <strong>Amina Yusuf</strong>
                  <small>CUS-208194 · +234 ••• ••• 1842</small>
                </span>
                <Badge tone="success">Identity verified</Badge>
                <i>{customerSelected ? "Selected" : "Select"}</i>
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="form-step">
              <div className="step-heading">
                <span>Step 2 of 4</span>
                <h2>Find the related transaction</h2>
                <p>
                  Recent Cedar records for Amina Yusuf. Outcomes remain
                  evidence-based.
                </p>
              </div>
              <div className="transaction-options">
                <button
                  className={transactionSelected ? "selected" : ""}
                  onClick={() => {
                    setTransactionSelected(true)
                    setError("")
                  }}
                >
                  <div>
                    <strong>TXN-88420195</strong>
                    <FinancialOutcomeBadge outcome="Outcome Unknown" compact />
                  </div>
                  <p>LAGOON DIGITAL · Card-not-present</p>
                  <span>₦48,500.00</span>
                  <small>10 Jun 2025 · 08:31</small>
                </button>
                <button>
                  <div>
                    <strong>TXN-88416620</strong>
                    <FinancialOutcomeBadge
                      outcome="Recipient Credit Confirmed"
                      compact
                    />
                  </div>
                  <p>Transfer to M. Ibrahim</p>
                  <span>₦20,000.00</span>
                  <small>9 Jun 2025 · 17:14</small>
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="form-step">
              <div className="step-heading">
                <span>Step 3 of 4</span>
                <h2>Capture the customer report</h2>
                <p>Use the customer&apos;s words and select the intake context.</p>
              </div>
              <div className="duplicate-warning">
                <Icon name="alert" size={19} />
                <div>
                  <strong>Possible related complaint found</strong>
                  <p>
                    CMP-10482 references this transaction and customer. Confirm
                    whether this is a follow-up interaction before registering a
                    new complaint.
                  </p>
                  <button onClick={() => navigate("complaint:CMP-10482")}>
                    Review CMP-10482
                  </button>
                </div>
              </div>
              <div className="form-grid">
                <label className="form-label">
                  Complaint category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="">Select category</option>
                    <option>Card transaction dispute</option>
                    <option>Transfer dispute</option>
                    <option>ATM dispute</option>
                    <option>Account access</option>
                  </select>
                </label>
                <label className="form-label">
                  Intake channel
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value)}
                  >
                    <option>Branch visit</option>
                    <option>Phone call</option>
                    <option>Email</option>
                    <option>In-app support</option>
                  </select>
                </label>
              </div>
              <label className="form-label">
                Customer-reported description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Record what the customer reported without adding an unverified conclusion…"
                />
                <small>{description.length} characters · minimum 20</small>
              </label>
            </div>
          )}
          {step === 4 && (
            <div className="form-step">
              <div className="step-heading">
                <span>Step 4 of 4</span>
                <h2>Review complaint information</h2>
                <p>
                  Confirm the intake record before saving to this prototype.
                </p>
              </div>
              <div className="review-list">
                <div>
                  <span>Customer</span>
                  <strong>Amina Yusuf · CUS-208194</strong>
                  <button onClick={() => setStep(1)}>Edit</button>
                </div>
                <div>
                  <span>Linked transaction</span>
                  <strong>TXN-88420195 · ₦48,500.00</strong>
                  <button onClick={() => setStep(2)}>Edit</button>
                </div>
                <div>
                  <span>Category and channel</span>
                  <strong>
                    {category} · {channel}
                  </strong>
                  <button onClick={() => setStep(3)}>Edit</button>
                </div>
                <div>
                  <span>Customer report</span>
                  <strong>{description}</strong>
                  <button onClick={() => setStep(3)}>Edit</button>
                </div>
              </div>
              <label className="review-confirm">
                <input type="checkbox" defaultChecked />I confirm this is a
                fictional prototype record and no production banking data will
                be changed.
              </label>
            </div>
          )}
          <div className="form-navigation">
            <Button
              variant="secondary"
              onClick={() =>
                step === 1
                  ? navigate("complaints")
                  : setStep((current) => current - 1)
              }
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={step === 4 ? () => setSaved(true) : next}>
              {step === 4 ? "Save complaint" : "Continue"}
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}

function PaymentOperations({
  approvedEvidence,
  navigate,
}: {
  approvedEvidence: boolean
  navigate: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [type, setType] = useState("All exceptions")
  const [networkUnavailable, setNetworkUnavailable] = useState(false)
  const operationalRecords = paymentExceptions.map((item) =>
    item.transaction === "TXN-88420500" && approvedEvidence
      ? {
          ...item,
          outcome: "Recipient Credit Confirmed",
          outcomeTone: "success",
          verification: "Authorized evidence accepted",
        }
      : item,
  )
  const visible = operationalRecords.filter(
    (item) =>
      (!search ||
        `${item.transaction} ${item.customer} ${item.route}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (type === "All exceptions" || item.type === type),
  )
  return (
    <>
      <div className="breadcrumb">
        <span>Payment operations</span>
        <Icon name="chevron" size={13} />
        <strong>Payment Monitoring</strong>
      </div>
      <section className="page-heading operation-heading">
        <div>
          <p className="eyebrow teal">Operational monitoring</p>
          <h1>Payment operations</h1>
          <p>
            Investigate exceptions without changing financial outcomes from
            monitoring signals.
          </p>
        </div>
        <div className="demo-label">
          <i /> Fictional demonstration data
        </div>
      </section>
      <section className="queue-summary payment-summary">
        <div>
          <span>Unresolved transfers</span>
          <strong>14</strong>
          <small>Outcome verification required</small>
        </div>
        <div>
          <span>Gateway timeouts</span>
          <strong>7</strong>
          <small>Not classified as failures</small>
        </div>
        <div>
          <span>Pending confirmations</span>
          <strong>9</strong>
          <small>External responses awaited</small>
        </div>
        <div className="attention">
          <span>Exceptions over 12 hours</span>
          <strong>3</strong>
          <small>Prioritise operational review</small>
        </div>
      </section>
      <div className="operational-callout">
        <Icon name="help" size={18} />
        <p>
          <strong>Monitoring does not set financial outcomes.</strong> Review
          ledger, network and beneficiary evidence before communicating a
          result.
        </p>
      </div>
      <section className="content-card operations-table-card">
        <div className="card-header">
          <div>
            <h2>Active payment exceptions</h2>
            <p>Prioritised by exception age and verification state</p>
          </div>
          <button
            className={`live-indicator ${networkUnavailable ? "offline" : ""}`}
            onClick={() => setNetworkUnavailable(!networkUnavailable)}
            title="Toggle network state for this prototype"
          >
            <i />
            {networkUnavailable
              ? "Connection unavailable"
              : "Monitoring active"}
          </button>
        </div>
        {networkUnavailable && (
          <div className="network-banner">
            <Icon name="alert" size={18} />
            <div>
              <strong>Cedar operations network is unavailable</strong>
              <p>
                Showing evidence last synchronized at 09:18 WAT. Connectivity
                does not change any transaction outcome.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setNetworkUnavailable(false)}
            >
              Retry
            </Button>
          </div>
        )}
        <div className="filter-bar">
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              placeholder="Search transaction, customer or route"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option>All exceptions</option>
            <option>Gateway response timeout</option>
            <option>Pending external confirmation</option>
            <option>Possible duplicate presentment</option>
            <option>Reversal confirmation pending</option>
          </select>
          <select>
            <option>All channels</option>
            <option>Mobile transfer</option>
            <option>POS</option>
            <option>Web checkout</option>
          </select>
          <Button variant="secondary">Export view</Button>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table className="operations-table payment-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Exception</th>
                  <th>Route / channel</th>
                  <th>Age</th>
                  <th>Financial outcome</th>
                  <th>Verification</th>
                  <th>Complaint</th>
                  <th>Veriq incident</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    className="clickable-row"
                    key={item.transaction}
                    onClick={() => navigate(`transaction:${item.transaction}`)}
                  >
                    <td>
                      <strong className="case-id">{item.transaction}</strong>
                      <small>
                        {item.customer} · {item.amount}
                      </small>
                    </td>
                    <td>{item.type}</td>
                    <td>
                      <strong>{item.route}</strong>
                      <small>{item.channel}</small>
                    </td>
                    <td>
                      <span
                        className={`exception-age ${
                          item.age.includes("17") || item.age.includes("22")
                            ? "old"
                            : ""
                        }`}
                      >
                        {item.age}
                      </span>
                    </td>
                    <td>
                      <FinancialOutcomeBadge outcome={item.outcome} compact />
                    </td>
                    <td>{item.verification}</td>
                    <td>
                      {item.complaint === "None" ? (
                        <span className="muted-value">None</span>
                      ) : (
                        <button
                          className="table-link"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`complaint:${item.complaint}`)
                          }}
                        >
                          {item.complaint}
                        </button>
                      )}
                    </td>
                    <td>{item.veriq}</td>
                    <td>
                      <button className="row-arrow">
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state compact">
            <span className="state-icon">
              <Icon name="search" size={25} />
            </span>
            <h2>No matching exceptions</h2>
            <p>Clear the search or exception filter to view active records.</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("")
                setType("All exceptions")
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  )
}

function TransactionEvidence({
  reference,
  approvedEvidence,
  navigate,
}: {
  reference: string
  approvedEvidence: boolean
  navigate: (id: string) => void
}) {
  const transaction =
    inquiryTransactions.find((item) => item.reference === reference) ||
    inquiryTransactions[0]
  const exception = paymentExceptions.find(
    (item) => item.transaction === transaction.reference,
  )
  const isAda = transaction.reference === "TXN-88420500"
  const record = {
    transaction: transaction.reference,
    customer: transaction.customer,
    amount: transaction.amount,
    route: transaction.route,
    channel: transaction.channel,
    age: exception?.age || "Not applicable",
    outcome:
      isAda && approvedEvidence
        ? "Recipient Credit Confirmed"
        : transaction.outcome,
    outcomeTone:
      isAda && approvedEvidence ? "success" : exception?.outcomeTone || "info",
    type: transaction.exception,
    verification:
      isAda && approvedEvidence
        ? "Authorized evidence accepted"
        : exception?.verification || "No active verification request",
    complaint: transaction.complaint,
    veriq: transaction.veriq,
  }
  const [refreshing, setRefreshing] = useState(false)
  const [refreshComplete, setRefreshComplete] = useState(false)
  const refreshEvidence = () => {
    setRefreshing(true)
    setRefreshComplete(false)
    window.setTimeout(() => {
      setRefreshing(false)
      setRefreshComplete(true)
    }, 600)
  }
  return (
    <>
      <div className="breadcrumb">
        <button onClick={() => navigate("transactions")}>
          Transaction Inquiry
        </button>
        <Icon name="chevron" size={13} />
        <strong>{reference}</strong>
      </div>
      <section className="case-page-heading">
        <div>
          <p className="eyebrow teal">Operational evidence</p>
          <h1>Transaction {reference}</h1>
          <p>
            {record.customer} · {record.amount} · {record.channel}
          </p>
        </div>
        <FinancialOutcomeBadge outcome={record.outcome} />
      </section>
      <div className="operational-callout">
        <Icon name="alert" size={18} />
        <p>
          This view supports investigation only. It cannot change payment
          outcomes or post financial adjustments.
        </p>
      </div>
      {refreshComplete && (
        <div className="success-banner">
          <Icon name="check" size={18} />
          <span>
            <strong>Latest permitted evidence retrieved</strong>
            <small>
              Verification data refreshed. No financial outcome was changed.
            </small>
          </span>
          <button onClick={() => setRefreshComplete(false)}>
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      <div className="evidence-layout">
        <section className="content-card detail-card">
          <div className="card-header">
            <div>
              <h2>Transaction summary</h2>
              <p>Cedar transaction record</p>
            </div>
          </div>
          <div className="detail-grid four">
            <div>
              <span>Amount</span>
              <strong>{record.amount}</strong>
            </div>
            <div>
              <span>Route identifier</span>
              <strong>{record.route}</strong>
            </div>
            <div>
              <span>Channel</span>
              <strong>{record.channel}</strong>
            </div>
            <div>
              <span>Processing stage</span>
              <strong>
                {isAda && approvedEvidence
                  ? "External confirmation received"
                  : transaction.stage}
              </strong>
            </div>
            <div>
              <span>Sender</span>
              <strong>
                {transaction.customer} · {transaction.customerRef}
              </strong>
            </div>
            <div>
              <span>Source account</span>
              <strong>{transaction.sourceAccount}</strong>
            </div>
            <div>
              <span>Beneficiary</span>
              <strong>{transaction.beneficiary}</strong>
            </div>
            <div>
              <span>Beneficiary reference</span>
              <strong>{transaction.beneficiaryRef}</strong>
            </div>
            <div>
              <span>Sending institution</span>
              <strong>{transaction.sendingInstitution}</strong>
            </div>
            <div>
              <span>Receiving institution</span>
              <strong>{transaction.receivingInstitution}</strong>
            </div>
            <div>
              <span>Financial outcome</span>
              <FinancialOutcomeBadge outcome={record.outcome} compact />
            </div>
            <div>
              <span>Payment exception</span>
              <strong>{record.type}</strong>
            </div>
            <div>
              <span>Verification request</span>
              <strong>{record.verification}</strong>
            </div>
            <div>
              <span>Linked complaint</span>
              <strong>{record.complaint}</strong>
            </div>
            <div>
              <span>Linked Veriq investigation</span>
              <strong>{record.veriq}</strong>
            </div>
          </div>
        </section>
        <section className="content-card evidence-source-card">
          <div className="card-header">
            <div>
              <h2>Operational evidence</h2>
              <p>
                Evidence sources do not independently determine the financial
                outcome
              </p>
            </div>
          </div>
          <div className="evidence-source-grid">
            <div>
              <span className="evidence-source-icon">
                <Icon name="grid" size={17} />
              </span>
              <div>
                <span>Sender-side Cedar ledger</span>
                <strong>Debit entry recorded</strong>
                <p>
                  {transaction.amount} debit recorded on{" "}
                  {transaction.sourceAccount} at {transaction.date}. A debit
                  alone does not prove recipient credit.
                </p>
              </div>
              <Badge tone="info">Recorded</Badge>
            </div>
            <div>
              <span className="evidence-source-icon">
                <Icon name="pulse" size={17} />
              </span>
              <div>
                <span>Payment gateway</span>
                <strong>{record.type}</strong>
                <p>
                  {record.type.toLowerCase().includes("timeout")
                    ? `Response window exceeded on ${record.route}. This is a gateway event, not a confirmed transaction failure.`
                    : `Operational event recorded on ${record.route}. Review the event alongside ledger and institution evidence.`}
                </p>
              </div>
              <Badge tone="warning">Review required</Badge>
            </div>
          </div>
        </section>
        {isAda && (
          <section className="content-card transaction-veriq-card">
            <div className="card-header">
              <div>
                <h2>Veriq intelligence link</h2>
                <p>
                  Existing automated investigation · separate from Cedar records
                </p>
              </div>
              <Badge tone={approvedEvidence ? "success" : "info"}>
                {approvedEvidence ? "Authorized evidence ready" : "Running"}
              </Badge>
            </div>
            <div className="transaction-veriq-grid">
              <div>
                <span className="record-type incident">Route incident</span>
                <strong>INC-341</strong>
                <p>Delayed responses observed on the Elm Bank payment route.</p>
              </div>
              <div>
                <span className="record-type veriq">
                  Transaction investigation
                </span>
                <strong>VQ-INV-77305</strong>
                <p>
                  Initiated automatically at 09:16 by operational monitoring.
                </p>
              </div>
              <div>
                <span className="record-type cedar">Cedar complaint</span>
                <strong>CMP-10501</strong>
                <p>Submitted by Ada at 09:28 and owned by Cedar.</p>
              </div>
              <div>
                <span className="record-type outcome">Financial outcome</span>
                <FinancialOutcomeBadge outcome={record.outcome} compact />
                <p>
                  {approvedEvidence
                    ? "Recipient credit was confirmed by separately authorized evidence."
                    : "Remains unknown until approved financial evidence is used."}
                </p>
              </div>
            </div>
            <div className="veriq-next-action">
              <span>
                <strong>Permitted next action</strong>
                <small>
                  {approvedEvidence
                    ? "Review the authorized response in the separate Veriq workbench"
                    : "Review route evidence and the pending human verification request"}
                </small>
              </span>
              <Button
                variant="secondary"
                onClick={() => navigate("veriq-workbench:VQ-INV-77305")}
              >
                Open Veriq Workbench <Icon name="arrow" size={15} />
              </Button>
            </div>
          </section>
        )}
        <section className="content-card evidence-timeline">
          <div className="card-header">
            <div>
              <h2>Operational evidence timeline</h2>
              <p>Messages and checks in chronological order</p>
            </div>
          </div>
          <div className="timeline evidence-events">
            <div>
              <i className="timeline-dot teal" />
              <span>
                <strong>Transfer instruction accepted by Cedar</strong>
                <p>Internal validation completed and route selected.</p>
                <small>
                  {isAda ? "10 Jun 2025 · 09:12:04" : "10 Jun 2025 · 07:47:02"}
                </small>
              </span>
            </div>
            <div>
              <i className="timeline-dot amber" />
              <span>
                <strong>Gateway response window exceeded</strong>
                <p>
                  No final response received within the configured application
                  window. Financial outcome remains unknown.
                </p>
                <small>
                  {isAda ? "10 Jun 2025 · 09:12:34" : "10 Jun 2025 · 07:47:32"}
                </small>
              </span>
            </div>
            <div>
              <i className="timeline-dot navy" />
              <span>
                <strong>
                  {isAda
                    ? "Existing Veriq investigation linked"
                    : "Beneficiary confirmation requested"}
                </strong>
                <p>
                  {isAda
                    ? "Automated monitoring created VQ-INV-77305 before Ada contacted Cedar. No employee action initiated it."
                    : `Automated status enquiry sent on route ${record.route}.`}
                </p>
                <small>
                  {isAda ? "10 Jun 2025 · 09:16:08" : "10 Jun 2025 · 07:52:14"}
                </small>
              </span>
            </div>
            {isAda && approvedEvidence && (
              <div>
                <i className="timeline-dot teal" />
                <span>
                  <strong>Authorized receiving-bank evidence accepted</strong>
                  <p>
                    Elm Bank evidence confirms recipient credit. The financial
                    outcome is now separately recorded as Recipient Credit
                    Confirmed.
                  </p>
                  <small>10 Jun 2025 · 11:42:00</small>
                </span>
              </div>
            )}
          </div>
        </section>
        <aside className="content-card evidence-actions">
          <div className="card-header">
            <div>
              <h2>Investigation actions</h2>
              <p>Non-financial operational actions</p>
            </div>
          </div>
          <button onClick={refreshEvidence} disabled={refreshing}>
            <Icon name="pulse" />
            <span>
              <strong>
                {refreshing
                  ? "Refreshing evidence…"
                  : "Refresh network evidence"}
              </strong>
              <small>
                {refreshing
                  ? "Requesting the latest permitted response"
                  : "Request the latest permitted status"}
              </small>
            </span>
            {refreshing ? (
              <span className="inline-spinner" />
            ) : (
              <Icon name="arrow" size={15} />
            )}
          </button>
          <button
            onClick={() =>
              record.complaint !== "None" &&
              navigate(`complaint:${record.complaint}`)
            }
          >
            <Icon name="message" />
            <span>
              <strong>Open linked complaint</strong>
              <small>{record.complaint}</small>
            </span>
            <Icon name="arrow" size={15} />
          </button>
          <button
            onClick={() =>
              navigate(isAda ? "veriq-workbench:VQ-INV-77305" : "veriq")
            }
          >
            <Icon name="shield" />
            <span>
              <strong>Open Veriq Workbench</strong>
              <small>Independent intelligence context</small>
            </span>
            <Icon name="arrow" size={15} />
          </button>
        </aside>
      </div>
    </>
  )
}

function LiveVeriqWorkspace({ openCase }: { openCase: (caseId: string) => void }) {
  type DataState = "loading" | "ready" | "empty" | "error"
  const [operations, setOperations] = useState<RouteHealth[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [sources, setSources] = useState<SourceListItem[]>([])
  const [context, setContext] = useState<ContextSummary | null>(null)
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>([])
  const [caseId, setCaseId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [dataState, setDataState] = useState<DataState>("loading")
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    setDataState("loading")
    setOperations([])
    setIncidents([])
    setSources([])
    setContext(null)
    setRelationships([])
    try {
      const [nextOperations, nextIncidents, nextSources, nextContext, nextRelationships] = await Promise.all([
        veriqApi.operations(),
        veriqApi.incidents(),
        veriqApi.sources(),
        veriqApi.context(),
        veriqApi.relationships(),
      ])
      setOperations(nextOperations)
      setIncidents(nextIncidents)
      setSources(nextSources)
      setContext(nextContext)
      setRelationships(nextRelationships)
      setDataState(
        nextOperations.length || nextIncidents.length || nextSources.length || nextRelationships.length
          ? "ready"
          : "empty",
      )
    } catch (caught) {
      setDataState("error")
      setError(caught instanceof VeriqApiError && caught.status === 401
        ? "An investigator session is required or has expired. Ask the demo operator to provision the private staff cookie."
        : caught instanceof Error ? caught.message : "Veriq data could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => load())
  }, [load])

  const upload = async (file: File) => {
    setUploading(true)
    setError("")
    try {
      const result = await veriqApi.uploadSource(file)
      if (result.status === "FAILED") setError(`${file.name} was accepted but parsing failed.`)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Source upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="external-app-banner">
        <span className="veriq-logo"><Icon name="shield" size={18} /></span>
        <div><strong>Veriq Workbench · Live institutional intelligence</strong><p>Bank-scoped data from the persisted CED context. The selected Cedar employee role is demonstration-only; backend authorization comes from the investigator session and bank scope.</p></div>
        <Button variant="secondary" onClick={() => void load()}>{loading ? "Loading…" : "Refresh"}</Button>
      </div>
      {error && <section className="content-card"><strong>Monitoring unavailable</strong><p>{error} No healthy or empty state is inferred from a failed request.</p></section>}
      {dataState === "empty" && <section className="content-card"><strong>No monitoring observations returned</strong><p>The backend returned an empty projection; this is not evidence that Cedar is healthy.</p></section>}
      <section className="page-heading"><div><p className="eyebrow teal">Operational monitoring</p><h1>Cedar intelligence workspace</h1><p>Current route health, suspected incidents, documented context and exact case lookup.</p></div></section>
      <div className="metrics-grid">
        <MetricCard label="Routes" value={dataState === "ready" && operations.length > 0 ? String(operations.length) : "—"} meta={dataState === "ready" ? (operations.length === 0 ? "No route observations returned" : operations.some((item) => item.status === "DEGRADED") ? "Degraded route observed" : "No current degraded route") : "Unavailable"} />
        <MetricCard label="Incidents" value={dataState === "ready" ? String(incidents.length) : "—"} meta={dataState === "ready" ? "Persisted operational incidents" : "Unavailable"} tone="amber" />
        <MetricCard label="Sources" value={dataState === "ready" ? String(context?.source_count ?? sources.length) : "—"} meta={dataState === "ready" ? `Context version ${context?.context_version ?? 0}` : "Unavailable"} />
        <MetricCard label="Relationships" value={dataState === "ready" ? String(relationships.length) : "—"} meta={dataState === "ready" ? "Documented, not verified" : "Unavailable"} />
      </div>
      <section className="content-card operations-table-card">
        <div className="card-header"><div><h2>Route health</h2><p>{dataState === "error" ? "Unavailable because the backend request failed" : "Stale observations are reported as insufficient data"}</p></div></div>
        {dataState === "ready" && <table className="operations-table"><thead><tr><th>Route</th><th>Service</th><th>Window</th><th>Baseline</th><th>Status</th></tr></thead><tbody>{operations.map((item) => <tr key={item.route_id}><td><strong className="case-id">{item.route_id}</strong></td><td>{item.service_id || "—"}</td><td>{item.window_timeouts}/{item.window_attempts} timeouts</td><td>{item.baseline_timeouts}/{item.baseline_attempts} timeouts</td><td><Badge tone={item.status === "DEGRADED" ? "warning" : item.status === "NORMAL" ? "success" : "neutral"}>{item.status.replace(/_/g, " ")}</Badge></td></tr>)}</tbody></table>}
      </section>
      <section className="content-card operations-table-card">
        <div className="card-header"><div><h2>Incidents</h2><p>{dataState === "error" ? "Unavailable because the backend request failed" : "Threshold crossings are suspected route events, not verified causes"}</p></div></div>
        {dataState === "ready" && <table className="operations-table"><thead><tr><th>ID</th><th>Route</th><th>Status</th><th>Observed</th><th>Cases</th></tr></thead><tbody>{incidents.map((item) => <tr key={item.id}><td><strong className="case-id">{item.id}</strong></td><td>{item.route_id}</td><td>{item.status}</td><td>{new Date(item.first_observed_at).toLocaleString()}</td><td>{item.case_ids.map((id) => <button key={id} className="link-button" onClick={() => openCase(id)}>{id}</button>)}</td></tr>)}</tbody></table>}
      </section>
      <section className="content-card">
        <div className="card-header"><div><h2>Open exact investigation</h2><p>Use the Cedar complaint ID returned to the customer; there is no case-list endpoint.</p></div></div>
        <div className="search-field"><Icon name="search" /><input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Cedar complaint ID" /><Button disabled={!caseId.trim()} onClick={() => openCase(caseId.trim())}>Open case</Button></div>
      </section>
      <section className="content-card operations-table-card">
        <div className="card-header"><div><h2>Institutional sources</h2><p>Upload the five approved pitch fixtures in documented order.</p></div><label className="button secondary">{uploading ? "Uploading…" : "Upload source"}<input hidden type="file" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} /></label></div>
        <table className="operations-table"><thead><tr><th>Filename</th><th>Kind</th><th>Status</th><th>Source ID</th></tr></thead><tbody>{sources.map((item) => <tr key={item.source_id}><td>{item.filename}</td><td>{item.source_kind}</td><td><Badge tone={item.status === "FAILED" ? "error" : item.status === "PARSED" ? "success" : "info"}>{item.status}</Badge></td><td>{item.source_id}</td></tr>)}</tbody></table>
      </section>
    </>
  )
}

function VeriqWorkbench({ reference, navigate }: { reference: string; approvedEvidence: boolean; navigate: (id: string) => void }) {
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const requestSequence = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError("")
    setInvestigation(null)
    try {
      const result = await veriqApi.investigation(reference)
      if (requestId !== requestSequence.current) return
      if (result.case_id !== reference) {
        setError("The returned investigation does not match the requested case.")
        return
      }
      setInvestigation(result)
    } catch (caught) {
      if (requestId !== requestSequence.current) return
      setError(caught instanceof VeriqApiError && caught.status === 404
        ? "This complaint has not reached the Veriq investigation store yet. Keep the G2 worker running and retry shortly."
        : caught instanceof Error ? caught.message : "Investigation could not be loaded.")
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [reference])

  useEffect(() => {
    void Promise.resolve().then(() => load())
    return () => {
      requestSequence.current += 1
    }
  }, [load])

  return (
    <>
      <div className="external-app-banner">
        <span className="veriq-logo"><Icon name="shield" size={18} /></span>
        <div><strong>Veriq Workbench · Separate intelligence platform</strong><p>Cedar remains the system of record for the complaint and financial outcome.</p></div>
        <Button variant="secondary" onClick={() => navigate("veriq")}>Back to Veriq</Button>
      </div>
      <section className="workbench-heading"><div><p className="eyebrow">Investigation workspace</p><h1>{reference}</h1><p>Exact Cedar complaint-linked case</p></div>{investigation && <Badge tone="info">{investigation.status.replace(/_/g, " ")}</Badge>}</section>
      {loading && <LoadingSkeleton />}
      {error && <section className="content-card"><strong>{error}</strong><p>No substitute or fixture case was shown.</p><Button onClick={() => void load()}>Retry</Button></section>}
      {investigation && <div className="workbench-layout">
        <section className="content-card workbench-primary"><div className="card-header"><div><h2>Persisted investigation</h2><p>AI result is {investigation.ai_result === null ? "unavailable" : "present"}</p></div></div><div className="workbench-facts"><div><span>Case ID</span><strong>{investigation.case_id}</strong></div><div><span>Financial outcome</span><strong>{investigation.financial_outcome}</strong></div><div><span>Evidence records</span><strong>{investigation.evidence.length}</strong></div><div><span>Linked incidents</span><strong>{investigation.incident_ids.length}</strong></div></div><div className="workbench-finding"><span>Authority boundary</span><h3>No generated causal conclusion</h3><p>Operational evidence may support correlation, but only Cedar-authorized evidence can establish an individual transfer outcome.</p></div></section>
        <aside className="content-card incident-panel"><div className="card-header"><div><h2>Linked incidents</h2><p>Persisted route-level records</p></div></div>{investigation.incident_ids.length ? investigation.incident_ids.map((id) => <div className="incident-id" key={id}><span className="record-type incident">Suspected incident</span><strong>{id}</strong></div>) : <p>No incident correlation is currently recorded.</p>}</aside>
        <section className="content-card record-separation"><div className="card-header"><div><h2>Evidence</h2><p>Source identity, citation and purpose verification remain distinct</p></div></div><div className="separation-grid">{investigation.evidence.map((item) => <div key={item.id}><span className="record-type veriq">{item.kind}</span><strong>{item.source_system}</strong><p>{item.citation}</p><small>{item.verified_for_purpose ? "Verified for stated purpose" : "Not purpose-verified"}</small></div>)}</div></section>
      </div>}
    </>
  )
}

// Retained only as a visual reference while the live workbench above replaces its route.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyVeriqWorkbench({
  reference,
  approvedEvidence,
  navigate,
}: {
  reference: string
  approvedEvidence: boolean
  navigate: (id: string) => void
}) {
  return (
    <>
      <div className="external-app-banner">
        <span className="veriq-logo">
          <Icon name="shield" size={18} />
        </span>
        <div>
          <strong>Veriq Workbench · Separate intelligence platform</strong>
          <p>
            You followed a permission-scoped link from Cedar Operations. Cedar
            remains the system of record for the customer complaint.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate("complaint:CMP-10501")}
        >
          Return to Cedar case
        </Button>
      </div>
      <section className="workbench-heading">
        <div>
          <p className="eyebrow">Investigation workspace</p>
          <h1>Elm Bank route response delay</h1>
          <p>{reference} · Automated operational monitoring</p>
        </div>
        <Badge tone={approvedEvidence ? "success" : "info"}>
          {approvedEvidence
            ? "Authorized evidence ready"
            : "Investigation running"}
        </Badge>
      </section>
      <div className="workbench-layout">
        <section className="content-card workbench-primary">
          <div className="card-header">
            <div>
              <h2>Investigation summary</h2>
              <p>Permitted intelligence shared with Cedar Operations</p>
            </div>
          </div>
          <div className="workbench-facts">
            <div>
              <span>Investigation reference</span>
              <strong>VQ-INV-77305</strong>
            </div>
            <div>
              <span>Origin</span>
              <strong>Automated payment route monitoring</strong>
            </div>
            <div>
              <span>Initiated</span>
              <strong>10 Jun 2025 · 09:16 WAT</strong>
            </div>
            <div>
              <span>Evidence readiness</span>
              <strong>
                {approvedEvidence
                  ? "Authorized response available"
                  : "Route evidence available · financial evidence pending"}
              </strong>
            </div>
          </div>
          <div className="workbench-finding">
            <span>Latest permitted finding</span>
            <h3>
              {approvedEvidence
                ? "Receiving-bank response obtained"
                : "Route response anomaly observed"}
            </h3>
            <p>
              {approvedEvidence
                ? "Elm Bank returned separately authorized evidence confirming recipient credit at 11:42 WAT. The earlier route delay does not replace Cedar's complaint decision or customer communication process."
                : "A delayed response was observed on ROUTE-CED-ELM-G2. This suspected route incident is not proof that Ada's individual transfer failed. Human verification remains pending."}
            </p>
          </div>
        </section>
        <aside className="content-card incident-panel">
          <div className="card-header">
            <div>
              <h2>Linked operational incident</h2>
              <p>Route-level intelligence</p>
            </div>
          </div>
          <div className="incident-id">
            <span className="record-type incident">
              Operational route incident
            </span>
            <strong>INC-341</strong>
            <p>ROUTE-CED-ELM-G2 · Elm Bank</p>
          </div>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>Monitoring</dd>
            </div>
            <div>
              <dt>First observed</dt>
              <dd>09:12 WAT</dd>
            </div>
            <div>
              <dt>Affected scope</dt>
              <dd>Route responses</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{approvedEvidence ? "11:43 WAT" : "09:31 WAT"}</dd>
            </div>
          </dl>
        </aside>
        <section className="content-card record-separation">
          <div className="card-header">
            <div>
              <h2>Linked records</h2>
              <p>Related context with distinct ownership and meaning</p>
            </div>
          </div>
          <div className="separation-grid">
            <div>
              <span className="record-type veriq">
                Transaction investigation
              </span>
              <strong>VQ-INV-77305</strong>
              <p>Veriq intelligence record</p>
            </div>
            <div>
              <span className="record-type incident">Route incident</span>
              <strong>INC-341</strong>
              <p>Operational anomaly record</p>
            </div>
            <div>
              <span className="record-type cedar">Customer complaint</span>
              <strong>CMP-10501</strong>
              <p>Cedar-owned service record</p>
            </div>
            <div>
              <span className="record-type request">Verification request</span>
              <strong>VR-4418</strong>
              <p>
                Human evidence review ·{" "}
                {approvedEvidence ? "completed" : "pending"}
              </p>
            </div>
            <div>
              <span className="record-type outcome">Financial outcome</span>
              <FinancialOutcomeBadge
                outcome={
                  approvedEvidence
                    ? "Recipient Credit Confirmed"
                    : "Outcome Unknown"
                }
                compact
              />
              <p>
                {approvedEvidence
                  ? "Authorized financial response · 11:42 WAT"
                  : "Awaiting separately authorized evidence"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function FuturePage({
  id,
  allowed,
  navigate,
}: {
  id: string
  allowed: boolean
  navigate: (id: string) => void
}) {
  const item = navGroups.flatMap((g) => g.items).find((x) => x[0] === id)
  const label =
    item?.[1] || (id === "notifications" ? "Notifications" : "Staff Profile")
  const isVeriqAccess = id === "veriq"
  if (!allowed)
    return (
      <div className="state-page restricted-access">
        <div className="state-icon denied">
          <Icon name="lock" size={27} />
        </div>
        <p className="eyebrow teal">Access restricted</p>
        <h1>{isVeriqAccess ? "Veriq workbench access" : `${label} access`}</h1>
        <p>
          {isVeriqAccess
            ? "Your current staff role doesn't include access to the Veriq investigation workbench. Contact your supervisor if additional access is required."
            : `Your current staff role doesn't include access to ${label}. Contact your supervisor if additional access is required.`}
        </p>
        <Button onClick={() => navigate("workspace")}>
          Return to My Workspace
        </Button>
        <small>Reference: CEDAR-RBAC · No banking records were accessed</small>
      </div>
    )
  return (
    <div className="future-page">
      <div className="breadcrumb">
        <span>Operations</span>
        <Icon name="chevron" size={13} />
        <strong>{label}</strong>
      </div>
      <section className="page-heading">
        <div>
          <p className="eyebrow teal">Foundation preview</p>
          <h1>{label}</h1>
          <p>
            This permitted module is ready for a future Cedar Operations phase.
          </p>
        </div>
        <div className="demo-label">
          <i /> Fictional demonstration data
        </div>
      </section>
      <section className="content-card module-placeholder">
        <span className="state-icon">
          <Icon name={item?.[2] || "users"} size={28} />
        </span>
        <h2>{label} page shell</h2>
        <p>
          The application foundation, permission boundary and navigation route
          are in place. Banking workflows have intentionally not been
          implemented in this phase.
        </p>
        <Button variant="secondary" onClick={() => navigate("workspace")}>
          Back to workspace
        </Button>
      </section>
    </div>
  )
}

function RecordNotFound({
  kind,
  reference,
  navigate,
}: {
  kind: string
  reference: string
  navigate: (id: string) => void
}) {
  return (
    <div className="state-page restricted-access">
      <div className="state-icon denied"><Icon name="search" size={27} /></div>
      <p className="eyebrow teal">Record not found</p>
      <h1>Unknown {kind} reference</h1>
      <p>
        <strong>{reference}</strong> is not present in the deterministic Cedar
        fixture. No unrelated record was substituted.
      </p>
      <Button onClick={() => navigate("workspace")}>Return to My Workspace</Button>
    </div>
  )
}

function LoadingSkeleton({
  variant = "table",
}: {
  variant?: "table" | "customer" | "complaints" | "transactions"
}) {
  const rows = variant === "customer" ? 3 : variant === "complaints" ? 5 : 4
  return (
    <div className={`content-card skeleton-card skeleton-${variant}`}>
      <div className="skeleton-heading">
        <span className="skeleton-block title" />
        <span className="skeleton-block action" />
      </div>
      {variant === "customer" && (
        <div className="skeleton-identity">
          <span className="skeleton-block portrait" />
          <div>
            <span className="skeleton-block name" />
            <span className="skeleton-block detail" />
          </div>
        </div>
      )}
      <div
        className="skeleton-rows"
        aria-label={`Loading ${variant} information`}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div className="skeleton-row" key={index}>
            <span className="skeleton-block cell wide" />
            <span className="skeleton-block cell" />
            <span className="skeleton-block cell short" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfirmationDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="dialog-scrim" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="dialog-icon">
          <Icon name="logout" size={22} />
        </span>
        <h2 id="signout-title">Sign out of Cedar Operations?</h2>
        <p>
          Your demonstration session will end and you will return to employee
          sign-in. No banking records will be changed.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            Keep working
          </Button>
          <Button onClick={onConfirm}>Sign out</Button>
        </div>
      </section>
    </div>
  )
}

function AppShell({
  role,
  onSignOut,
  initialActive = "workspace",
}: {
  role: RoleKey
  onSignOut: () => void
  initialActive?: string
}) {
  const employee = employees[role]
  const [active, setActive] = useState(initialActive)
  const [navOpen, setNavOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [adaEvidenceApproved, setAdaEvidenceApproved] = useState(false)
  const loadingTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (loadingTimer.current) window.clearTimeout(loadingTimer.current)
    },
    [],
  )

  const navigate = (id: string) => {
    if (id === "signout") {
      setConfirmSignOut(true)
      return
    }
    setActive(id)
    if (id !== "workspace") {
      setPageLoading(true)
      if (loadingTimer.current) window.clearTimeout(loadingTimer.current)
      loadingTimer.current = window.setTimeout(() => setPageLoading(false), 280)
    } else {
      setPageLoading(false)
    }
  }
  const routePermission = active.startsWith("complaint:")
    ? "complaints"
    : active === "register-complaint"
      ? "complaints"
      : active.startsWith("transaction:")
        ? "transactions"
        : active.startsWith("customer:")
          ? "customers"
          : active.startsWith("veriq-workbench:")
                ? "veriq"
            : active
  const allowed = employee.access.includes(routePermission)
  const navActive =
    active.startsWith("complaint:") || active === "register-complaint"
      ? "complaints"
      : active.startsWith("transaction:")
        ? "payments"
        : active.startsWith("customer:")
          ? "customers"
          : active.startsWith("veriq-workbench:")
            ? "veriq"
            : active
  const skeletonVariant =
    active === "customers" || active.startsWith("customer:")
      ? "customer"
      : active === "complaints" ||
          active === "register-complaint" ||
          active.startsWith("complaint:")
        ? "complaints"
        : active === "transactions" ||
            active === "payments" ||
            active === "exceptions" ||
            active.startsWith("transaction:")
          ? "transactions"
          : "table"
  const renderPage = () => {
    if (active === "workspace")
      return <Workspace role={role} employee={employee} navigate={navigate} />
    if (!allowed)
      return (
        <FuturePage id={routePermission} allowed={false} navigate={navigate} />
      )
    if (active === "queue") return <WorkQueue role={role} navigate={navigate} />
    if (active === "customers") return <CustomerDirectory navigate={navigate} />
    if (active.startsWith("customer:")) {
      const reference = active.split(":")[1]
      const customer = customerRecords.find((item) => item.reference === reference)
      if (!customer)
        return <RecordNotFound kind="customer" reference={reference} navigate={navigate} />
      return (
        <CustomerProfile
          customer={customer}
          role={role}
          approvedEvidence={adaEvidenceApproved}
          navigate={navigate}
        />
      )
    }
    if (active === "transactions")
      return (
        <TransactionInquiry
          approvedEvidence={adaEvidenceApproved}
          navigate={navigate}
        />
      )
    if (active === "complaints")
      return <ComplaintsQueue role={role} navigate={navigate} />
    if (active === "register-complaint")
      return <RegisterComplaint navigate={navigate} />
    if (active.startsWith("complaint:")) {
      const reference = active.split(":")[1]
      const complaint = complaintRecords.find((item) => item.id === reference)
      if (!complaint)
        return <RecordNotFound kind="complaint" reference={reference} navigate={navigate} />
      return (
        <ComplaintDetail
          complaint={complaint}
          navigate={navigate}
          approvedEvidence={complaint.id === "CMP-10501" && adaEvidenceApproved}
          onApproveEvidence={() => setAdaEvidenceApproved(true)}
        />
      )
    }
    if (active === "payments" || active === "exceptions")
      return (
        <PaymentOperations
          approvedEvidence={adaEvidenceApproved}
          navigate={navigate}
        />
      )
    if (active.startsWith("transaction:"))
      return (
        <TransactionEvidence
          reference={active.split(":")[1]}
          approvedEvidence={adaEvidenceApproved}
          navigate={navigate}
        />
      )
    if (active.startsWith("veriq-workbench:"))
      return (
        <VeriqWorkbench
          reference={active.split(":")[1]}
          approvedEvidence={adaEvidenceApproved}
          navigate={navigate}
        />
      )
    if (active === "veriq")
      return <LiveVeriqWorkspace openCase={(caseId) => navigate(`veriq-workbench:${caseId}`)} />
    return <FuturePage id={active} allowed={allowed} navigate={navigate} />
  }
  return (
    <div className="app-shell">
      <Sidebar
        employee={employee}
        active={navActive}
        navigate={navigate}
        open={navOpen}
        close={() => setNavOpen(false)}
      />
      <div className="main-shell">
        <Topbar
          employee={employee}
          toggleNav={() => setNavOpen(true)}
          toggleNotifications={() => setNotifications(true)}
          navigate={navigate}
        />
        <main className="page-content">
          {pageLoading ? (
            <>
              <div className="breadcrumb">
                <span>Operations</span>
                <Icon name="chevron" size={13} />
                <strong>Loading workspace data</strong>
              </div>
              <LoadingSkeleton variant={skeletonVariant} />
            </>
          ) : (
            renderPage()
          )}
        </main>
      </div>
      {notifications && (
        <NotificationPanel close={() => setNotifications(false)} />
      )}
      {confirmSignOut && (
        <ConfirmationDialog
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={onSignOut}
        />
      )}
    </div>
  )
}

export default function App({ initialRoute = "workspace" }: { initialRoute?: string } = {}) {
  const [screen, setScreen] = useState<Screen>("signin")
  const [role, setRole] = useState<RoleKey>("sarah")

  useEffect(() => {
    if (screen !== "loading") return
    const timer = window.setTimeout(() => setScreen("app"), 900)
    return () => window.clearTimeout(timer)
  }, [screen])

  const employee = useMemo(() => employees[role], [role])
  const signIn = (nextRole: RoleKey) => {
    setRole(nextRole)
    setScreen("loading")
  }
  if (screen === "signin") return <SignIn onSignIn={signIn} />
  if (screen === "loading") return <LoadingScreen employee={employee} />
  return (
    <AppShell
      role={role}
      initialActive={initialRoute}
      onSignOut={() => setScreen("signin")}
    />
  )
}
