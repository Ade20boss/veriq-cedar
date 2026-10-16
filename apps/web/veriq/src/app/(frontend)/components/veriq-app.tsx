"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowUpDown,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleDot,
  Clock3,
  ClipboardCheck,
  Copy,
  CreditCard,
  Database,
  Download,
  Eye,
  ExternalLink,
  Filter,
  FileSearch,
  FileText,
  Gauge,
  GitBranch,
  History,
  Inbox,
  Info,
  Link2,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  TriangleAlert,
  UserRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"

type ButtonProps = {
  children: ReactNode
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit"
}

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ")

function PrimaryButton({
  children,
  icon: Icon,
  loading,
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      className="button button--primary"
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading ? <LoaderCircle className="spin" /> : Icon ? <Icon /> : null}
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  icon: Icon,
  loading,
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      className="button button--secondary"
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading ? <LoaderCircle className="spin" /> : Icon ? <Icon /> : null}
      {children}
    </button>
  )
}

function TertiaryButton({
  children,
  icon: Icon,
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <button
      className="button button--tertiary"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {Icon && <Icon />}
      {children}
    </button>
  )
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  badge?: boolean
}) {
  return (
    <button
      aria-label={label}
      className="icon-button"
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon />
      {badge && <span className="notification-dot" />}
    </button>
  )
}

function VeriqLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-label="Veriq"
      className={cx("veriq-logo", compact && "veriq-logo--compact")}
    >
      <img alt="Veriq" src="/veriq-logo.png" />
    </div>
  )
}

function TextInput({
  label,
  placeholder,
  hint,
  error,
  disabled,
}: {
  label: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        aria-describedby={
          hint || error ? `${label.split(" ").join("-")}-help` : undefined
        }
        aria-invalid={Boolean(error)}
        className={cx("input", error && "input--error")}
        disabled={disabled}
        placeholder={placeholder}
      />
      {(hint || error) && (
        <span
          className={cx("field__hint", error && "field__hint--error")}
          id={`${label.split(" ").join("-")}-help`}
        >
          {error || hint}
        </span>
      )}
    </label>
  )
}

function SearchInput({ placeholder = "Search" }: { placeholder?: string }) {
  return (
    <label className="search-input">
      <Search aria-hidden="true" />
      <span className="sr-only">Search</span>
      <input placeholder={placeholder} />
      <kbd>⌘ K</kbd>
    </label>
  )
}

function SelectField({ label }: { label: string }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="select-wrap">
        <select className="input" defaultValue="">
          <option value="" disabled>
            Select a value
          </option>
          <option>Option one</option>
          <option>Option two</option>
        </select>
        <ChevronDown aria-hidden="true" />
      </span>
    </label>
  )
}

function Checkbox({
  label,
  defaultChecked = false,
}: {
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="checkbox">
      <input defaultChecked={defaultChecked} type="checkbox" />
      <span className="checkbox__box">
        <Check />
      </span>
      <span>{label}</span>
    </label>
  )
}

function TextArea({ label }: { label: string }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <textarea
        className="input textarea"
        placeholder="Add optional context…"
        rows={4}
      />
    </label>
  )
}

type StatusKind = "neutral" | "success" | "warning" | "error" | "info"

const statusIcons: Record<StatusKind, LucideIcon> = {
  neutral: CircleHelp,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: XCircle,
  info: Info,
}

function StatusBadge({
  kind,
  children,
}: {
  kind: StatusKind
  children: ReactNode
}) {
  const Icon = statusIcons[kind]
  return (
    <span className={`status-badge status-badge--${kind}`}>
      <Icon /> {children}
    </span>
  )
}

function StandardCard({
  title,
  description,
  children,
  action,
}: {
  title?: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="card">
      {(title || description || action) && (
        <div className="card__header">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  context,
  icon: Icon,
}: {
  label: string
  value: string
  context: string
  icon: LucideIcon
}) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <span>{label}</span>
        <Icon />
      </div>
      <strong>{value}</strong>
      <p>{context}</p>
    </article>
  )
}

function InlineAlert({
  kind,
  title,
  children,
}: {
  kind: StatusKind
  title: string
  children: ReactNode
}) {
  const Icon = statusIcons[kind]
  return (
    <div
      className={`alert alert--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div aria-label="Loading preview" className="skeleton-stack" role="status">
      <span className="skeleton skeleton--short" />
      <span className="skeleton" />
      <span className="skeleton skeleton--medium" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Inbox />
      </span>
      <h3>No preview records</h3>
      <p>
        Records will appear here when this component is connected to a product
        workflow.
      </p>
      <SecondaryButton icon={Plus}>Create preview record</SecondaryButton>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="empty-state empty-state--error">
      <span className="empty-state__icon">
        <AlertCircle />
      </span>
      <h3>Unable to load this section</h3>
      <p>Check the connection and try again. No changes have been lost.</p>
      <SecondaryButton>Try again</SecondaryButton>
    </div>
  )
}

const institutions = [
  "Cedar Bank — Demo Workspace",
  "Northstar Credit Union — Synthetic Demo",
]

function InstitutionSwitcher({
  collapsed = false,
  selected,
  onSelect,
}: {
  collapsed?: boolean
  selected: string
  onSelect: (institution: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <div className="institution-switcher" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cx(
          "institution-trigger",
          collapsed && "institution-trigger--collapsed",
        )}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="institution-trigger__icon">
          <Building2 />
        </span>
        {!collapsed && (
          <span className="institution-trigger__copy">
            <small>Institution</small>
            <strong>{selected || "Select institution"}</strong>
          </span>
        )}
        {!collapsed && <ChevronDown />}
      </button>
      {open && (
        <div
          className={cx(
            "institution-menu",
            collapsed && "institution-menu--collapsed",
          )}
          role="menu"
        >
          <div className="institution-menu__label">Switch institution</div>
          {institutions.map((institution) => (
            <button
              className="institution-option"
              key={institution}
              onClick={() => {
                onSelect(institution)
                setOpen(false)
              }}
              role="menuitem"
              type="button"
            >
              <span className="institution-avatar">
                {institution.charAt(0)}
              </span>
              <span>{institution}</span>
              {selected === institution && <Check />}
            </button>
          ))}
          <div className="institution-menu__divider" />
          <button className="institution-option" role="menuitem" type="button">
            <Plus /> Create institution
          </button>
          <button className="institution-option" role="menuitem" type="button">
            <Inbox /> Accept invitation
          </button>
        </div>
      )}
    </div>
  )
}

type NavItem = { label: string; icon: LucideIcon }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Intelligence Overview", icon: LayoutDashboard },
      { label: "Operational Monitoring", icon: Activity },
      { label: "Incidents", icon: AlertCircle },
      { label: "Investigations", icon: FileSearch },
    ],
  },
  {
    label: "Intelligence & Governance",
    items: [
      { label: "Knowledge Explorer", icon: BookOpen },
      { label: "Review Queue", icon: ClipboardCheck },
      { label: "Audit & Activity", icon: ShieldCheck },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Integrations", icon: SlidersHorizontal },
      { label: "Institution Settings", icon: Settings },
    ],
  },
]

function SidebarNavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cx("sidebar-nav-item", active && "sidebar-nav-item--active")}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      type="button"
    >
      <Icon />
      {!collapsed && <span>{item.label}</span>}
    </button>
  )
}

function AppSidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
  selectedInstitution,
  onSelectInstitution,
  active,
  onNavigate,
}: {
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onMobileClose: () => void
  selectedInstitution: string
  onSelectInstitution: (institution: string) => void
  active: string
  onNavigate: (label: string) => void
}) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="mobile-scrim"
          onClick={onMobileClose}
          type="button"
        />
      )}
      <aside
        className={cx(
          "sidebar",
          collapsed && "sidebar--collapsed",
          mobileOpen && "sidebar--mobile-open",
        )}
      >
        <div className="sidebar__brand">
          <VeriqLogo compact={collapsed} />
          <IconButton
            icon={X}
            label="Close navigation"
            onClick={onMobileClose}
          />
        </div>
        <InstitutionSwitcher
          collapsed={collapsed}
          onSelect={onSelectInstitution}
          selected={selectedInstitution}
        />
        <nav aria-label="Primary navigation" className="sidebar__nav">
          {navGroups.map((group) => (
            <div className="sidebar-nav-group" key={group.label}>
              {!collapsed && (
                <div className="sidebar-nav-group__label">{group.label}</div>
              )}
              {group.items.map((item) => (
                <SidebarNavItem
                  active={active === item.label}
                  collapsed={collapsed}
                  item={item}
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.label)
                    onMobileClose()
                  }}
                />
              ))}
            </div>
          ))}
        </nav>
        <button className="sidebar-collapse" onClick={onCollapse} type="button">
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </aside>
    </>
  )
}

function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <span>Workspace</span>
      <ChevronRight />
      <strong>{current}</strong>
    </nav>
  )
}

function TopBar({
  onMenu,
  current,
}: {
  onMenu: () => void
  current: string
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  return (
    <header className="topbar">
      <div className="topbar__context">
        <IconButton icon={Menu} label="Open navigation" onClick={onMenu} />
        <Breadcrumbs current={current} />
      </div>
      <div className="topbar__actions">
        <SearchInput placeholder="Search Veriq" />
        <IconButton badge icon={Bell} label="Notifications" />
        <div className="profile-menu">
          <button
            aria-expanded={profileOpen}
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
            type="button"
          >
            <span className="profile-avatar">AM</span>
            <span className="profile-copy">
              <strong>Alex Morgan</strong>
              <small>Platform analyst</small>
            </span>
            <ChevronDown />
          </button>
          {profileOpen && (
            <div className="profile-popover">
              <strong>Alex Morgan</strong>
              <span>alex@example.test</span>
              <div />
              <button type="button">
                <UserRound /> Profile settings
              </button>
              <button type="button">
                <CircleHelp /> Help center
              </button>
              <form action="/api/app-auth/logout" className="contents" method="post">
                <button type="submit">
                  <LogOut /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

function Tabs({
  active,
  onChange,
}: {
  active: string
  onChange: (tab: string) => void
}) {
  const tabs = ["Foundations", "Components", "Patterns"]
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={active === tab}
          className={active === tab ? "tabs__tab--active" : ""}
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function DataTable() {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Status</th>
            <th>Updated</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Transaction review policy</strong>
              <span>Preview record · VRQ-0041</span>
            </td>
            <td>Governance</td>
            <td>
              <StatusBadge kind="success">Reviewed</StatusBadge>
            </td>
            <td>12 Mar 2025</td>
            <td>
              <IconButton icon={ChevronRight} label="Open record" />
            </td>
          </tr>
          <tr>
            <td>
              <strong>Cross-channel inquiry</strong>
              <span>Synthetic demonstration content</span>
            </td>
            <td>Investigation</td>
            <td>
              <StatusBadge kind="warning">Needs review</StatusBadge>
            </td>
            <td>10 Mar 2025</td>
            <td>
              <IconButton icon={ChevronRight} label="Open record" />
            </td>
          </tr>
          <tr>
            <td>
              <strong>Access control attestation</strong>
              <span>Preview record · VRQ-0037</span>
            </td>
            <td>Audit</td>
            <td>
              <StatusBadge kind="neutral">Draft</StatusBadge>
            </td>
            <td>08 Mar 2025</td>
            <td>
              <IconButton icon={ChevronRight} label="Open record" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ConfirmationDialog({ onClose }: { onClose: () => void }) {
  return (
    <div aria-modal="true" className="dialog-layer" role="dialog">
      <button
        aria-label="Close dialog"
        className="dialog-scrim"
        onClick={onClose}
        type="button"
      />
      <div className="dialog">
        <span className="dialog__icon">
          <TriangleAlert />
        </span>
        <h2>Confirm demonstration action</h2>
        <p>
          This is a component preview. No institution or operational data will
          be changed.
        </p>
        <div className="dialog__actions">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={onClose}>Confirm action</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function ToastNotification({
  onClose,
  title = "Preview saved",
  message = "Your component preferences were updated.",
}: {
  onClose: () => void
  title?: string
  message?: string
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(timer)
  }, [onClose])
  return (
    <div className="toast" role="status">
      <CheckCircle2 />
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <IconButton icon={X} label="Dismiss notification" onClick={onClose} />
    </div>
  )
}

const swatches = [
  ["Primary navy", "#102447", "brand-navy"],
  ["Brand teal", "#08B5A5", "brand-teal"],
  ["Canvas", "#F7F9FC", "canvas"],
  ["Surface", "#FFFFFF", "surface"],
  ["Primary text", "#172033", "text"],
  ["Secondary text", "#66758C", "text-secondary"],
  ["Neutral border", "#E3E9F0", "border"],
  ["Accessible teal", "#087C73", "teal-text"],
]

function FoundationsView() {
  const [tab, setTab] = useState("Foundations")
  const [dialog, setDialog] = useState(false)
  const [toast, setToast] = useState(false)

  return (
    <div className="foundations">
      <PageHeader
        actions={
          <>
            <SecondaryButton icon={ExternalLink}>
              View guidelines
            </SecondaryButton>
            <PrimaryButton onClick={() => setToast(true)}>
              Save preferences
            </PrimaryButton>
          </>
        }
        description="Centralized tokens, reusable components and interaction patterns for Veriq product teams."
        eyebrow="Design system · v1.0"
        title="UI Foundations"
      />
      <Tabs active={tab} onChange={setTab} />

      {tab === "Foundations" && (
        <div className="section-stack">
          <section className="showcase-section">
            <div className="section-heading">
              <div>
                <h2>Brand colors</h2>
                <p>
                  Core semantic tokens used consistently across the application.
                </p>
              </div>
            </div>
            <div className="swatch-grid">
              {swatches.map(([label, value, token]) => (
                <div className="swatch" key={label}>
                  <span className={`swatch__color swatch__color--${token}`} />
                  <div>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="showcase-section">
            <div className="section-heading">
              <div>
                <h2>Typography</h2>
                <p>
                  Inter provides a clear, neutral hierarchy for
                  information-dense workflows.
                </p>
              </div>
            </div>
            <div className="type-specimen">
              <div>
                <span>Page title · 28/36 semibold</span>
                <p className="type-page">Operational intelligence</p>
              </div>
              <div>
                <span>Section heading · 20/28 semibold</span>
                <p className="type-section">Review and investigation context</p>
              </div>
              <div>
                <span>Card heading · 16/24 semibold</span>
                <p className="type-card">Institutional risk signals</p>
              </div>
              <div>
                <span>Body · 15/24 regular</span>
                <p className="type-body">
                  Veriq helps authorized teams investigate and understand
                  operational information.
                </p>
              </div>
              <div>
                <span>Technical metadata · 13/20 mono</span>
                <p className="type-mono">VRQ-0041 · UPDATED_2025-03-12</p>
              </div>
            </div>
          </section>
          <section className="showcase-section">
            <div className="section-heading">
              <div>
                <h2>Spacing & shape</h2>
                <p>
                  A 4-point spacing scale creates predictable rhythm and
                  alignment.
                </p>
              </div>
            </div>
            <div className="spacing-row">
              {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map((space) => (
                <div className="space-token" key={space}>
                  <span className={`space-token--${space}`} />
                  <strong>{space}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "Components" && (
        <div className="section-stack">
          <StandardCard
            title="Actions"
            description="Consistent intent, hierarchy and interaction states."
          >
            <div className="component-row">
              <PrimaryButton>Primary action</PrimaryButton>
              <SecondaryButton>Secondary action</SecondaryButton>
              <TertiaryButton>Tertiary action</TertiaryButton>
              <PrimaryButton loading>Loading</PrimaryButton>
              <PrimaryButton disabled>Disabled</PrimaryButton>
              <IconButton icon={Settings} label="Settings" />
            </div>
          </StandardCard>
          <StandardCard
            title="Form controls"
            description="Accessible controls with labels, supporting copy and validation."
          >
            <div className="form-grid">
              <TextInput
                hint="Use a clear, recognizable name."
                label="Investigation name"
                placeholder="Enter a name"
              />
              <SelectField label="Review priority" />
              <TextInput
                error="A valid reference is required."
                label="Reference ID"
                placeholder="VRQ-0000"
              />
              <TextInput
                disabled
                label="Institution ID"
                placeholder="Assigned automatically"
              />
              <TextArea label="Context note" />
              <div className="checkbox-stack">
                <span className="field__label">Options</span>
                <Checkbox defaultChecked label="Include supporting records" />
                <Checkbox label="Notify reviewers" />
              </div>
            </div>
          </StandardCard>
          <StandardCard
            title="Status indicators"
            description="Every state pairs color with iconography and text."
          >
            <div className="component-row">
              <StatusBadge kind="neutral">Draft</StatusBadge>
              <StatusBadge kind="success">Reviewed</StatusBadge>
              <StatusBadge kind="warning">Needs review</StatusBadge>
              <StatusBadge kind="error">Action required</StatusBadge>
              <StatusBadge kind="info">In progress</StatusBadge>
              <span className="loading-inline">
                <LoaderCircle className="spin" /> Loading records
              </span>
            </div>
          </StandardCard>
          <StandardCard
            title="Cards & metrics"
            description="Flexible surfaces for grouped content and concise summaries."
          >
            <div className="metric-grid">
              <MetricCard
                context="Synthetic preview content"
                icon={FileSearch}
                label="Open reviews"
                value="—"
              />
              <MetricCard
                context="No institution selected"
                icon={ShieldCheck}
                label="Control coverage"
                value="—"
              />
              <MetricCard
                context="Awaiting product data"
                icon={Activity}
                label="Monitored signals"
                value="—"
              />
            </div>
          </StandardCard>
          <StandardCard
            title="Data table"
            description="Contained horizontal scroll protects the overall page layout."
          >
            <DataTable />
          </StandardCard>
        </div>
      )}

      {tab === "Patterns" && (
        <div className="section-stack">
          <StandardCard
            title="System feedback"
            description="Focused guidance for informational, warning and error conditions."
          >
            <div className="alert-stack">
              <InlineAlert kind="info" title="Preview environment">
                This content is synthetic demonstration data and is not
                connected to a banking institution.
              </InlineAlert>
              <InlineAlert kind="warning" title="Review required">
                Confirm the institution context before beginning an operational
                workflow.
              </InlineAlert>
              <InlineAlert kind="error" title="Connection unavailable">
                The component could not reach its data source. Try again when
                connectivity is restored.
              </InlineAlert>
            </div>
          </StandardCard>
          <div className="states-grid">
            <StandardCard title="Empty state">
              <EmptyState />
            </StandardCard>
            <StandardCard title="Loading state">
              <LoadingSkeleton />
            </StandardCard>
            <StandardCard title="Error state">
              <ErrorState />
            </StandardCard>
          </div>
          <StandardCard
            title="Overlays"
            description="Dialogs and notifications are reserved for important feedback and decisions."
          >
            <div className="component-row">
              <SecondaryButton onClick={() => setDialog(true)}>
                Open confirmation dialog
              </SecondaryButton>
              <SecondaryButton onClick={() => setToast(true)}>
                Show toast notification
              </SecondaryButton>
            </div>
          </StandardCard>
        </div>
      )}
      {dialog && <ConfirmationDialog onClose={() => setDialog(false)} />}
      {toast && <ToastNotification onClose={() => setToast(false)} />}
    </div>
  )
}

type DateRange = "24h" | "7d" | "30d"
type DashboardState =
  | "demo"
  | "loading"
  | "empty"
  | "no-sources"
  | "partial"
  | "stale"
  | "error"
  | "restricted"

type ActivityPoint = {
  label: string
  events: number
  timeouts: number
}

const activityFixtures: Record<DateRange, ActivityPoint[]> = {
  "24h": [
    { label: "00:00", events: 720, timeouts: 7 },
    { label: "02:00", events: 580, timeouts: 5 },
    { label: "04:00", events: 440, timeouts: 4 },
    { label: "06:00", events: 610, timeouts: 7 },
    { label: "08:00", events: 1050, timeouts: 14 },
    { label: "10:00", events: 1320, timeouts: 22 },
    { label: "12:00", events: 1250, timeouts: 18 },
    { label: "14:00", events: 1410, timeouts: 25 },
    { label: "16:00", events: 1510, timeouts: 31 },
    { label: "18:00", events: 1390, timeouts: 24 },
    { label: "20:00", events: 1190, timeouts: 16 },
    { label: "22:00", events: 1010, timeouts: 11 },
  ],
  "7d": [
    { label: "Mon", events: 11840, timeouts: 126 },
    { label: "Tue", events: 12190, timeouts: 138 },
    { label: "Wed", events: 12560, timeouts: 154 },
    { label: "Thu", events: 11980, timeouts: 142 },
    { label: "Fri", events: 13240, timeouts: 171 },
    { label: "Sat", events: 10680, timeouts: 96 },
    { label: "Sun", events: 9860, timeouts: 82 },
  ],
  "30d": [
    { label: "1 Mar", events: 37020, timeouts: 360 },
    { label: "4 Mar", events: 35210, timeouts: 331 },
    { label: "7 Mar", events: 38540, timeouts: 402 },
    { label: "10 Mar", events: 39780, timeouts: 438 },
    { label: "13 Mar", events: 37420, timeouts: 371 },
    { label: "16 Mar", events: 41020, timeouts: 460 },
    { label: "19 Mar", events: 42480, timeouts: 512 },
    { label: "22 Mar", events: 40110, timeouts: 422 },
    { label: "25 Mar", events: 43290, timeouts: 478 },
    { label: "28 Mar", events: 41710, timeouts: 446 },
  ],
}

const dashboardMetrics: Record<
  DateRange,
  { events: string; incidents: string; investigations: string; reviews: string }
> = {
  "24h": {
    events: "12,480",
    incidents: "3",
    investigations: "8",
    reviews: "4",
  },
  "7d": {
    events: "82,350",
    incidents: "3",
    investigations: "8",
    reviews: "4",
  },
  "30d": {
    events: "392,580",
    incidents: "3",
    investigations: "8",
    reviews: "4",
  },
}

type IncidentSeverity = "Critical" | "High" | "Medium" | "Low"
type IncidentLifecycle = "Emerging" | "Active" | "Contained" | "Resolved"

type IncidentRecord = {
  id: string
  title: string
  severity: IncidentSeverity
  lifecycle: IncidentLifecycle
  service: string
  firstDetected: string
  updated: string
  ageHours: number
  owner: string
  anomaly?: string
  investigations: string[]
  summary: string
  trigger: string
  understanding: string
  observedImpact: string
  limitations: string
  signalCount: number
  sourceEventCount: number
  activity?: string[]
}

const initialIncidentRecords: IncidentRecord[] = [
  {
    id: "INC-2026-0031",
    title: "Elevated NIP Transfer Timeout Activity",
    severity: "High",
    lifecycle: "Active",
    service: "NIP Transfer Processing",
    firstDetected: "18 Mar 2026, 09:42",
    updated: "18 Mar 2026, 11:32",
    ageHours: 1,
    owner: "Alex Morgan",
    anomaly: "ANM-2026-0041",
    investigations: ["INV-2026-0087", "INV-2026-0089"],
    summary:
      "Elevated timeout observations were detected across a monitored transfer-processing route.",
    trigger:
      "Configured monitoring rule detected timeout observations above the synthetic demonstration threshold.",
    understanding:
      "Timeout activity exceeded the configured synthetic detection threshold. Final financial outcomes for some related transactions remain unknown.",
    observedImpact:
      "An elevated number of timeout observations affected the monitored transfer-processing route.",
    limitations:
      "Insufficient downstream confirmation data is currently available to determine every related transaction's final status.",
    signalCount: 27,
    sourceEventCount: 42,
  },
  {
    id: "INC-2026-0032",
    title: "Payment Webhook Delivery Delays",
    severity: "Medium",
    lifecycle: "Active",
    service: "Payment Event Webhooks",
    firstDetected: "18 Mar 2026, 07:18",
    updated: "18 Mar 2026, 10:58",
    ageHours: 2,
    owner: "Tomi Adeyemi",
    anomaly: "ANM-2026-0042",
    investigations: ["INV-2026-0088"],
    summary:
      "Operational source records indicate delayed webhook delivery during the observed period.",
    trigger:
      "A delivery-latency rule recorded consecutive delayed webhook observations.",
    understanding:
      "Webhook delivery delays are source-supported; downstream operational impact remains under assessment.",
    observedImpact:
      "Delayed delivery was observed for seven synthetic webhook events.",
    limitations:
      "Available records do not establish transaction failure or customer impact.",
    signalCount: 7,
    sourceEventCount: 18,
  },
  {
    id: "INC-2026-0033",
    title: "Delayed Reconciliation Feed Ingestion",
    severity: "Medium",
    lifecycle: "Active",
    service: "Reconciliation Feed Processing",
    firstDetected: "17 Mar 2026, 22:06",
    updated: "18 Mar 2026, 10:44",
    ageHours: 3,
    owner: "Priya Shah",
    anomaly: "ANM-2026-0043",
    investigations: ["INV-2026-0090"],
    summary:
      "Reconciliation feed ingestion delays were observed within the monitored period.",
    trigger:
      "The simulated reconciliation source exceeded its configured freshness threshold.",
    understanding:
      "Source visibility is delayed. This does not independently indicate a failed banking service.",
    observedImpact:
      "Reconciliation records were available later than the configured monitoring window.",
    limitations:
      "The delayed feed limits timely assessment of reconciliation activity.",
    signalCount: 3,
    sourceEventCount: 8,
  },
  {
    id: "INC-2026-0034",
    title: "Repeated Operational Event Identifiers",
    severity: "Low",
    lifecycle: "Emerging",
    service: "Operational Event Stream",
    firstDetected: "17 Mar 2026, 13:02",
    updated: "17 Mar 2026, 14:18",
    ageHours: 22,
    owner: "Unassigned",
    investigations: [],
    summary:
      "Repeated event identifiers are being assessed to distinguish retries from duplicate records.",
    trigger: "Source validation rule observed repeated event identifiers.",
    understanding:
      "The operational significance has not yet been established.",
    observedImpact: "No confirmed service impact has been established.",
    limitations: "Source retry metadata is incomplete.",
    signalCount: 4,
    sourceEventCount: 4,
  },
  {
    id: "INC-2026-0035",
    title: "Interbank Callback Timing Variance",
    severity: "Medium",
    lifecycle: "Contained",
    service: "Interbank Callback Route",
    firstDetected: "13 Mar 2026, 08:40",
    updated: "16 Mar 2026, 12:16",
    ageHours: 72,
    owner: "David Okafor",
    investigations: ["INV-2026-0093"],
    summary:
      "Elevated callback timing observations were contained through an authorized operational response.",
    trigger: "Route timing threshold exceeded during the monitored interval.",
    understanding:
      "Immediate operational observations returned within threshold; full resolution evidence remains under review.",
    observedImpact: "Elevated callback timing was observed on one route.",
    limitations:
      "Final outcomes for related transactions were not evaluated by this incident.",
    signalCount: 9,
    sourceEventCount: 21,
  },
  {
    id: "INC-2026-0036",
    title: "Historical Event Delivery Gap",
    severity: "Low",
    lifecycle: "Resolved",
    service: "Payment Event Delivery",
    firstDetected: "5 Mar 2026, 15:22",
    updated: "8 Mar 2026, 10:04",
    ageHours: 240,
    owner: "Maya Chen",
    investigations: ["INV-2026-0091"],
    summary:
      "A historical delivery gap was documented as operationally resolved with supporting source evidence.",
    trigger: "Event freshness threshold exceeded.",
    understanding:
      "Source delivery resumed and resolution evidence was reviewed by an authorized analyst.",
    observedImpact:
      "Delayed event visibility was observed during the documented interval.",
    limitations:
      "Resolution of event delivery does not establish financial outcomes for related transactions.",
    signalCount: 5,
    sourceEventCount: 12,
  },
]

type InvestigationStatus =
  | "Initiated"
  | "Analyzing"
  | "Awaiting Review"
  | "In Review"
  | "Closed"
  | "Reopened"

type InvestigationRecord = {
  id: string
  subject: string
  type: "Operational Incident" | "Customer Case"
  related: string
  caseReference?: string
  priority: "High" | "Medium" | "Low"
  status: InvestigationStatus
  investigator: string
  created: string
  updated: string
  ageHours: number
  trigger: string
  objective: string
  service: string
  understanding: string
  evidenceCompleteness: string
  reviewDecision?: string
  requestedChanges?: string
}

const initialInvestigationRecords: InvestigationRecord[] = [
  {
    id: "INV-2026-0087",
    subject: "NIP Timeout Pattern Investigation",
    type: "Operational Incident",
    related: "INC-2026-0031",
    priority: "High",
    status: "Analyzing",
    investigator: "Alex Morgan",
    created: "18 Mar 2026, 09:48",
    updated: "18 Mar 2026, 11:24",
    ageHours: 1,
    trigger:
      "Elevated transfer timeout signals detected from an authorized operational event source.",
    objective:
      "Determine whether the observed timeout pattern is associated with a specific payment route, dependency or operational degradation.",
    service: "NIP transfer route",
    understanding:
      "Timeout observations have been recorded. Final outcomes for some related transactions remain unconfirmed.",
    evidenceCompleteness: "6 of 8 expected source records collected",
  },
  {
    id: "INV-2026-0088",
    subject: "Webhook Delivery Delay Analysis",
    type: "Operational Incident",
    related: "INC-2026-0032",
    priority: "Medium",
    status: "Awaiting Review",
    investigator: "Tomi Adeyemi",
    created: "18 Mar 2026, 07:32",
    updated: "18 Mar 2026, 10:55",
    ageHours: 2,
    trigger: "Delayed payment-event webhook receipts exceeded the observation threshold.",
    objective: "Determine the scope and timing of delayed event delivery.",
    service: "Payment-event webhooks",
    understanding: "Delivery delay is source-supported; downstream impact remains unconfirmed.",
    evidenceCompleteness: "5 of 5 expected records collected",
  },
  {
    id: "INV-2026-0089",
    subject: "Customer Transfer-Status Complaint",
    type: "Customer Case",
    related: "INC-2026-0031",
    caseReference: "CASE-2026-0316",
    priority: "High",
    status: "Analyzing",
    investigator: "Maya Chen",
    created: "17 Mar 2026, 14:12",
    updated: "18 Mar 2026, 09:40",
    ageHours: 4,
    trigger: "Authorized customer complaint event linked to an observed NIP timeout window.",
    objective: "Establish the available source-reported transaction outcome and evidence gaps.",
    service: "NIP customer transfer",
    understanding: "Outcome unknown. Authorized source confirmation has not been received.",
    evidenceCompleteness: "3 of 6 expected records collected",
  },
  {
    id: "INV-2026-0090",
    subject: "Reconciliation Feed Ingestion Review",
    type: "Operational Incident",
    related: "INC-2026-0033",
    priority: "Medium",
    status: "Initiated",
    investigator: "Unassigned",
    created: "17 Mar 2026, 08:21",
    updated: "17 Mar 2026, 16:15",
    ageHours: 20,
    trigger: "Reconciliation feed ingestion exceeded the permitted delay threshold.",
    objective: "Identify the affected feed window and collect source delivery records.",
    service: "Reconciliation ingestion",
    understanding: "A delayed feed observation is recorded; record completeness is still being assessed.",
    evidenceCompleteness: "2 of 6 expected records collected",
  },
  {
    id: "INV-2026-0091",
    subject: "Duplicate Event Identifier Review",
    type: "Operational Incident",
    related: "INC-2026-0034",
    priority: "Low",
    status: "Awaiting Review",
    investigator: "Priya Shah",
    created: "16 Mar 2026, 13:05",
    updated: "17 Mar 2026, 13:44",
    ageHours: 23,
    trigger: "Repeated event identifiers were observed in an authorized operational stream.",
    objective: "Determine whether repetition reflects source retries or record duplication.",
    service: "Operational event stream",
    understanding: "Repeated identifiers are confirmed in source logs; downstream effects are not established.",
    evidenceCompleteness: "7 of 7 expected records collected",
  },
  {
    id: "INV-2026-0092",
    subject: "USSD Status Response Variance",
    type: "Customer Case",
    related: "CASE-2026-0321",
    caseReference: "CASE-2026-0321",
    priority: "Medium",
    status: "In Review",
    investigator: "David Okafor",
    created: "14 Mar 2026, 11:30",
    updated: "16 Mar 2026, 15:20",
    ageHours: 44,
    trigger: "Authorized complaint records contained differing source-reported status messages.",
    objective: "Reconcile available status observations and document unresolved evidence.",
    service: "USSD payment status",
    understanding: "Source statuses differ. No final transaction outcome has been independently verified.",
    evidenceCompleteness: "6 of 7 expected records collected",
  },
  {
    id: "INV-2026-0093",
    subject: "Interbank Callback Timing Analysis",
    type: "Operational Incident",
    related: "INC-2026-0035",
    priority: "High",
    status: "Awaiting Review",
    investigator: "Alex Morgan",
    created: "12 Mar 2026, 10:18",
    updated: "15 Mar 2026, 12:05",
    ageHours: 72,
    trigger: "Callback timing observations exceeded the route-specific operating window.",
    objective: "Document the affected period and evaluate available route evidence.",
    service: "Interbank callback route",
    understanding: "Elevated callback times are source-supported; cause remains unverified.",
    evidenceCompleteness: "8 of 9 expected records collected",
  },
  {
    id: "INV-2026-0094",
    subject: "Reopened Transfer Evidence Review",
    type: "Customer Case",
    related: "CASE-2026-0324",
    caseReference: "CASE-2026-0324",
    priority: "Medium",
    status: "Reopened",
    investigator: "Tomi Adeyemi",
    created: "9 Mar 2026, 09:02",
    updated: "14 Mar 2026, 17:48",
    ageHours: 96,
    trigger: "New source evidence was received after the earlier review was closed.",
    objective: "Evaluate whether the newly received record changes the documented understanding.",
    service: "NIP transfer route",
    understanding: "New evidence is available; prior conclusions are under renewed human review.",
    evidenceCompleteness: "5 of 6 expected records collected",
  },
]

const investigationFixtures = initialInvestigationRecords.slice(0, 3).map((item) => ({
  id: item.id,
  subject: item.subject,
  type: item.type,
  related: item.related,
  status: item.status,
  updated: item.updated,
  investigator: item.investigator,
}))

type ReviewStatus =
  | "Pending"
  | "Claimed / In Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"

type ReviewType =
  | "Investigation Finding"
  | "Operational Conclusion"
  | "Knowledge Change"

type ReviewHistoryEntry = {
  timestamp: string
  actor: string
  action: string
  description: string
  reference?: string
}

type ReviewRecord = {
  id: string
  subject: string
  type: ReviewType
  relatedEntity: string
  investigationId?: string
  relatedIncident?: string
  priority: "High" | "Medium" | "Low"
  submittedBy: string
  assignedReviewer: string
  submittedAt: string
  ageHours: number
  status: ReviewStatus
  objective: string
  conclusion: string
  evidenceSummary: string
  uncertainties: string
  recommendations: string[]
  history: ReviewHistoryEntry[]
  decisionRationale?: string
  decisionAt?: string
}

const initialReviewRecords: ReviewRecord[] = [
  {
    id: "REV-2026-0021",
    subject: "Webhook Delivery Delay Findings",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0088",
    investigationId: "INV-2026-0088",
    relatedIncident: "INC-2026-0032",
    priority: "High",
    submittedBy: "Tomi Adeyemi",
    assignedReviewer: "Nneka Williams",
    submittedAt: "18 Mar 2026, 10:55",
    ageHours: 2,
    status: "Pending",
    objective:
      "Determine the scope and timing of delayed payment-event webhook delivery.",
    conclusion:
      "Available source events support the observation that webhook deliveries were delayed during the investigated period.",
    evidenceSummary:
      "Five authorized webhook delivery and service-health records support the observed delay window.",
    uncertainties:
      "The available evidence does not independently establish every related transaction's final financial outcome.",
    recommendations: [
      "Review source retry timing against delivery receipts.",
      "Continue route-level delivery monitoring.",
      "Document unresolved downstream confirmation gaps.",
    ],
    history: [
      {
        timestamp: "18 Mar 2026, 10:55",
        actor: "Tomi Adeyemi",
        action: "Findings submitted",
        description:
          "Investigation findings and five supporting evidence references were submitted for review.",
        reference: "INV-2026-0088",
      },
    ],
  },
  {
    id: "REV-2026-0022",
    subject: "Duplicate Event Identifier Assessment",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0091",
    investigationId: "INV-2026-0091",
    relatedIncident: "INC-2026-0034",
    priority: "Medium",
    submittedBy: "Priya Shah",
    assignedReviewer: "Nneka Williams",
    submittedAt: "17 Mar 2026, 13:44",
    ageHours: 23,
    status: "Pending",
    objective:
      "Determine whether repeated identifiers reflect source retries or duplicate records.",
    conclusion:
      "Repeated identifiers are present in the authorized event stream and require source retry validation.",
    evidenceSummary:
      "Seven source records preserve the repeated identifiers and ingestion timestamps.",
    uncertainties:
      "Retry metadata remains incomplete and downstream effects have not been established.",
    recommendations: [
      "Request source retry metadata.",
      "Compare ingestion and original observation timestamps.",
    ],
    history: [
      {
        timestamp: "17 Mar 2026, 13:44",
        actor: "Priya Shah",
        action: "Findings submitted",
        description: "Source observations were submitted for accountable review.",
        reference: "INV-2026-0091",
      },
    ],
  },
  {
    id: "REV-2026-0023",
    subject: "USSD Status Response Findings",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0092",
    investigationId: "INV-2026-0092",
    priority: "Medium",
    submittedBy: "David Okafor",
    assignedReviewer: "Unassigned",
    submittedAt: "16 Mar 2026, 15:20",
    ageHours: 44,
    status: "Pending",
    objective:
      "Reconcile differing source-reported status messages and document unresolved evidence.",
    conclusion:
      "Authorized records contain differing status observations for the same masked case context.",
    evidenceSummary:
      "Six of seven expected records are available with traceable provenance.",
    uncertainties:
      "No final transaction outcome has been independently verified.",
    recommendations: [
      "Obtain the missing authorized confirmation record.",
      "Keep customer-case workflow separate from payment outcome.",
    ],
    history: [
      {
        timestamp: "16 Mar 2026, 15:20",
        actor: "David Okafor",
        action: "Findings submitted",
        description: "Findings were submitted with one documented evidence gap.",
        reference: "INV-2026-0092",
      },
    ],
  },
  {
    id: "REV-2026-0024",
    subject: "Interbank Callback Timing Findings",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0093",
    investigationId: "INV-2026-0093",
    relatedIncident: "INC-2026-0035",
    priority: "High",
    submittedBy: "Alex Morgan",
    assignedReviewer: "Jordan Lee",
    submittedAt: "15 Mar 2026, 12:05",
    ageHours: 72,
    status: "Pending",
    objective:
      "Document the affected callback interval and evaluate available route evidence.",
    conclusion:
      "Elevated callback timing is supported by source observations for the reviewed route window.",
    evidenceSummary:
      "Eight of nine expected operational records are available.",
    uncertainties:
      "The observations do not establish a root cause or transaction outcome.",
    recommendations: [
      "Review the missing route confirmation record.",
      "Apply the approved incident escalation procedure if timing recurs.",
    ],
    history: [
      {
        timestamp: "15 Mar 2026, 12:05",
        actor: "Alex Morgan",
        action: "Findings submitted",
        description: "Callback timing findings were submitted for review.",
        reference: "INV-2026-0093",
      },
    ],
  },
  {
    id: "REV-2026-0019",
    subject: "Reopened Transfer Evidence Decision",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0094",
    investigationId: "INV-2026-0094",
    priority: "Medium",
    submittedBy: "Tomi Adeyemi",
    assignedReviewer: "Nneka Williams",
    submittedAt: "10 Mar 2026, 09:10",
    ageHours: 190,
    status: "Approved",
    objective: "Evaluate the source evidence available at the earlier review.",
    conclusion:
      "The submitted observations were supported by the evidence available at that review time.",
    evidenceSummary: "Five traceable source records were reviewed.",
    uncertainties:
      "New evidence may require reassessment; approval did not establish financial outcome.",
    recommendations: ["Reopen review if material new source evidence arrives."],
    decisionRationale:
      "Source-supported observations were appropriately scoped and limitations were documented.",
    decisionAt: "10 Mar 2026, 11:30",
    history: [
      {
        timestamp: "10 Mar 2026, 09:10",
        actor: "Tomi Adeyemi",
        action: "Findings submitted",
        description: "Earlier findings were submitted.",
      },
      {
        timestamp: "10 Mar 2026, 11:30",
        actor: "Nneka Williams",
        action: "Findings approved",
        description:
          "The operational finding was approved with documented limitations.",
      },
    ],
  },
  {
    id: "REV-2026-0020",
    subject: "Customer Transfer Evidence Revision",
    type: "Investigation Finding",
    relatedEntity: "INV-2026-0089",
    investigationId: "INV-2026-0089",
    relatedIncident: "INC-2026-0031",
    priority: "High",
    submittedBy: "Maya Chen",
    assignedReviewer: "Jordan Lee",
    submittedAt: "17 Mar 2026, 16:40",
    ageHours: 19,
    status: "Changes Requested",
    objective: "Document available source-reported transaction status evidence.",
    conclusion:
      "Available records show an unresolved source-reported transfer state.",
    evidenceSummary: "Three of six expected records were available.",
    uncertainties:
      "Authorized downstream confirmation is missing.",
    recommendations: ["Obtain downstream confirmation before resubmission."],
    decisionRationale:
      "The proposed conclusion needs clearer separation between complaint status and transaction outcome.",
    decisionAt: "17 Mar 2026, 18:05",
    history: [
      {
        timestamp: "17 Mar 2026, 16:40",
        actor: "Maya Chen",
        action: "Findings submitted",
        description: "Customer-case findings were submitted.",
      },
      {
        timestamp: "17 Mar 2026, 18:05",
        actor: "Jordan Lee",
        action: "Changes requested",
        description:
          "Additional evidence and clearer outcome limitations were requested.",
      },
    ],
  },
]

function DashboardMetricCard({
  label,
  value,
  context,
  icon: Icon,
  onClick,
}: {
  label: string
  value: string
  context: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button className="dashboard-metric" onClick={onClick} type="button">
      <span className="dashboard-metric__top">
        <span>{label}</span>
        <span className="dashboard-metric__icon">
          <Icon />
        </span>
      </span>
      <strong>{value}</strong>
      <span className="dashboard-metric__context">{context}</span>
      <span className="dashboard-metric__link">
        Open details <ChevronRight />
      </span>
    </button>
  )
}

function OperationalChart({
  range,
  onRangeChange,
}: {
  range: DateRange
  onRangeChange: (range: DateRange) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const points = activityFixtures[range]
  const width = 760
  const height = 280
  const pad = { left: 48, right: 48, top: 24, bottom: 38 }
  const eventMax = Math.max(...points.map((point) => point.events)) * 1.15
  const timeoutMax = Math.max(...points.map((point) => point.timeouts)) * 1.2
  const x = (index: number) =>
    pad.left + (index / (points.length - 1)) * (width - pad.left - pad.right)
  const eventY = (value: number) =>
    pad.top + (1 - value / eventMax) * (height - pad.top - pad.bottom)
  const timeoutY = (value: number) =>
    pad.top + (1 - value / timeoutMax) * (height - pad.top - pad.bottom)
  const eventPath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${eventY(point.events)}`,
    )
    .join(" ")
  const timeoutPath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${timeoutY(point.timeouts)}`,
    )
    .join(" ")
  const areaPath = `${eventPath} L ${x(points.length - 1)} ${height - pad.bottom} L ${x(0)} ${height - pad.bottom} Z`

  return (
    <section className="dashboard-panel chart-panel">
      <div className="dashboard-panel__header">
        <div>
          <h2>Operational Activity</h2>
          <p>Observed event volume and timeout signals use separate scales.</p>
        </div>
        <div aria-label="Chart time window" className="segmented-control">
          {(["24h", "7d", "30d"] as DateRange[]).map((option) => (
            <button
              aria-pressed={range === option}
              className={range === option ? "active" : ""}
              key={option}
              onClick={() => onRangeChange(option)}
              type="button"
            >
              {option === "24h" ? "24 hours" : option === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-legend" aria-label="Chart legend">
        <span><i className="legend-line legend-line--navy" />Payment events <small>left scale</small></span>
        <span><i className="legend-line legend-line--teal" />Timeout signals <small>right scale</small></span>
      </div>
      <div className="chart-container">
        <svg
          aria-label={`Operational activity for the selected ${range} period`}
          className="activity-chart"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 1, 2, 3].map((line) => {
            const y = pad.top + (line / 3) * (height - pad.top - pad.bottom)
            return <line className="chart-gridline" key={line} x1={pad.left} x2={width - pad.right} y1={y} y2={y} />
          })}
          <path className="chart-area" d={areaPath} />
          <path className="chart-line chart-line--events" d={eventPath} />
          <path className="chart-line chart-line--timeouts" d={timeoutPath} />
          {points.map((point, index) => (
            <g key={point.label}>
              <rect
                aria-label={`${point.label}: ${point.events.toLocaleString()} payment events, ${point.timeouts} timeout signals`}
                className="chart-hit-area"
                height={height - pad.top - pad.bottom}
                onFocus={() => setHovered(index)}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                role="button"
                tabIndex={0}
                width={Math.max(28, (width - pad.left - pad.right) / points.length)}
                x={x(index) - 14}
                y={pad.top}
              />
              <circle className="chart-point chart-point--events" cx={x(index)} cy={eventY(point.events)} r={hovered === index ? 5 : 3} />
              <circle className="chart-point chart-point--timeouts" cx={x(index)} cy={timeoutY(point.timeouts)} r={hovered === index ? 5 : 3} />
              <text className="chart-label" textAnchor="middle" x={x(index)} y={height - 12}>
                {point.label}
              </text>
            </g>
          ))}
        </svg>
        {hovered !== null && (
          <div className={cx("chart-tooltip", hovered > points.length / 2 && "chart-tooltip--right")}>
            <strong>{points[hovered].label}</strong>
            <span><i className="legend-line legend-line--navy" />{points[hovered].events.toLocaleString()} payment events</span>
            <span><i className="legend-line legend-line--teal" />{points[hovered].timeouts} timeout signals</span>
          </div>
        )}
      </div>
    </section>
  )
}

function PriorityIncidents({
  onNavigate,
  records,
}: {
  onNavigate: (label: string) => void
  records: IncidentRecord[]
}) {
  const priority = records
    .filter((incident) => incident.lifecycle === "Active")
    .slice(0, 3)
  return (
    <section className="dashboard-panel incident-panel">
      <div className="dashboard-panel__header">
        <div>
          <h2>Priority Incidents</h2>
          <p>Unresolved operational observations</p>
        </div>
        <TertiaryButton onClick={() => onNavigate("Incidents")}>View all</TertiaryButton>
      </div>
      <div className="incident-list">
        {priority.map((incident) => (
          <button
            className="incident-item"
            key={incident.id}
            onClick={() => onNavigate(incident.id)}
            type="button"
          >
            <span className="incident-item__meta">
              <span>{incident.id}</span>
              <StatusBadge kind={incident.severity === "High" ? "error" : "warning"}>
                {incident.severity}
              </StatusBadge>
            </span>
            <strong>{incident.title}</strong>
            <span className="incident-item__details">
              <span><Activity />{incident.service}</span>
              <span><Clock3 />{incident.firstDetected}</span>
            </span>
            <span className="incident-item__footer">
              <span>{incident.lifecycle}</span>
              Open incident <ChevronRight />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function RecentInvestigationsTable({
  onNavigate,
}: {
  onNavigate: (label: string) => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All statuses")
  const [ascending, setAscending] = useState(false)
  const visible = investigationFixtures
    .filter(
      (item) =>
        (status === "All statuses" || item.status === status) &&
        `${item.id} ${item.subject} ${item.related}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      ascending ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id),
    )

  return (
    <section className="dashboard-panel investigations-panel">
      <div className="dashboard-panel__header investigations-heading">
        <div>
          <h2>Recent Investigations</h2>
          <p>Showing the 3 most recently updated of 8 open investigations.</p>
        </div>
        <TertiaryButton onClick={() => onNavigate("Investigations")}>View all investigations</TertiaryButton>
      </div>
      <div className="table-toolbar">
        <label className="table-search">
          <Search />
          <span className="sr-only">Filter investigations</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Filter investigations" value={query} />
        </label>
        <label className="compact-select">
          <Filter />
          <span className="sr-only">Filter by status</span>
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option>All statuses</option>
            <option>Analyzing</option>
            <option>Awaiting Review</option>
            <option>In Review</option>
          </select>
          <ChevronDown />
        </label>
      </div>
      <div className="table-wrap investigations-table">
        <table>
          <thead>
            <tr>
              <th>
                <button onClick={() => setAscending(!ascending)} type="button">
                  Investigation <ArrowUpDown />
                </button>
              </th>
              <th>Type</th>
              <th>Related</th>
              <th>Status</th>
              <th>Last updated</th>
              <th>Assigned</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.subject}</strong><span>{item.id}</span></td>
                <td>{item.type}</td>
                <td><button className="table-link" onClick={() => onNavigate(item.related)} type="button">{item.related}</button></td>
                <td><StatusBadge kind={item.status === "Awaiting Review" ? "warning" : item.status === "Analyzing" ? "info" : "neutral"}>{item.status}</StatusBadge></td>
                <td>{item.updated}</td>
                <td>{item.investigator}</td>
                <td><IconButton icon={ChevronRight} label={`Open ${item.id}`} onClick={() => onNavigate(item.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <div className="table-empty">No investigations match these filters.</div>}
      </div>
    </section>
  )
}

function ReviewSummary({
  onNavigate,
  records,
}: {
  onNavigate: (label: string) => void
  records: ReviewRecord[]
}) {
  const pending = records.filter(
    (item) => item.status === "Pending" || item.status === "Claimed / In Review",
  )
  return (
    <section className="dashboard-panel review-panel">
      <div className="dashboard-panel__header">
        <div>
          <h2>Requires Your Attention</h2>
          <p>{pending.length} review items are awaiting an authorized decision.</p>
        </div>
        <TertiaryButton onClick={() => onNavigate("Review Queue")}>Open Review Queue</TertiaryButton>
      </div>
      <div className="review-list">
        {pending.map((item) => (
          <div className="review-item" key={item.id}>
            <span className={cx("review-item__marker", item.priority === "High" ? "review-item__marker--warning" : "review-item__marker--info")} />
            <div>
              <strong>{item.subject}</strong>
              <p>{item.uncertainties}</p>
              <span>{item.relatedEntity} · Submitted {item.submittedAt}</span>
            </div>
            <SecondaryButton icon={Eye} onClick={() => onNavigate(item.id)}>Open review</SecondaryButton>
          </div>
        ))}
      </div>
    </section>
  )
}

function DashboardLoading() {
  return (
    <div className="dashboard-loading" aria-label="Loading dashboard" role="status">
      <div className="dashboard-metrics">
        {[0, 1, 2, 3].map((item) => <div className="dashboard-skeleton-card" key={item}><LoadingSkeleton /></div>)}
      </div>
      <div className="dashboard-layout">
        <div className="dashboard-panel"><LoadingSkeleton /></div>
        <div className="dashboard-panel"><LoadingSkeleton /></div>
      </div>
    </div>
  )
}

function DashboardStateMessage({
  state,
  onRetry,
  onNavigate,
}: {
  state: Exclude<DashboardState, "demo" | "loading" | "partial" | "stale">
  onRetry: () => void
  onNavigate: (label: string) => void
}) {
  const content = {
    empty: {
      icon: CheckCircle2,
      title: "No operational activity in this period",
      description: "No permitted events, incidents or findings were observed for the selected time range.",
      action: "Change date range",
    },
    "no-sources": {
      icon: SlidersHorizontal,
      title: "Connect an operational source",
      description: "This institution has no configured sources. Add an integration before operational activity can be monitored.",
      action: "Set up integrations",
    },
    error: {
      icon: AlertCircle,
      title: "Operational data could not be loaded",
      description: "The dashboard could not reach its configured sources. Check connectivity or retry.",
      action: "Retry",
    },
    restricted: {
      icon: ShieldCheck,
      title: "Access to operational intelligence is restricted",
      description: "Your current role does not include permission to view this institution's operational activity.",
      action: "View access details",
    },
  }[state]
  const Icon = content.icon
  return (
    <section className="dashboard-state">
      <span><Icon /></span>
      <h2>{content.title}</h2>
      <p>{content.description}</p>
      <PrimaryButton onClick={state === "error" ? onRetry : () => onNavigate(state === "no-sources" ? "Integrations" : "Access details")}>
        {content.action}
      </PrimaryButton>
    </section>
  )
}

function IntelligenceOverview({
  institution,
  onSelectInstitution,
  onNavigate,
  incidentRecords,
  reviewRecords,
}: {
  institution: string
  onSelectInstitution: (institution: string) => void
  onNavigate: (label: string) => void
  incidentRecords: IncidentRecord[]
  reviewRecords: ReviewRecord[]
}) {
  const [range, setRange] = useState<DateRange>("24h")
  const [state, setState] = useState<DashboardState>("demo")
  const [refreshing, setRefreshing] = useState(false)
  const [showRefreshNotice, setShowRefreshNotice] = useState(false)
  const metrics = dashboardMetrics[range]

  const loadRange = (nextRange: DateRange) => {
    setState("loading")
    setRange(nextRange)
    window.setTimeout(() => setState("demo"), 450)
  }

  const refresh = () => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setShowRefreshNotice(true)
    }, 650)
  }

  if (!institution) {
    return (
      <div className="dashboard-page">
        <PageHeader
          description="Monitor operational activity, investigate emerging issues, and track institutional intelligence."
          title="Intelligence Overview"
        />
        <section className="institution-empty">
          <span className="institution-empty__icon"><Building2 /></span>
          <span className="demo-label">No institution selected</span>
          <h2>Select an institution to view intelligence</h2>
          <p>Operational information is always scoped to an institution. No banking data is loaded until you choose a workspace.</p>
          <div>
            <PrimaryButton onClick={() => onSelectInstitution("Cedar Bank — Demo Workspace")}>
              Enter Cedar Bank Demo
            </PrimaryButton>
            <span>Demo · Synthetic data</span>
          </div>
        </section>
      </div>
    )
  }

  const terminalState =
    state === "empty" ||
    state === "no-sources" ||
    state === "error" ||
    state === "restricted"

  return (
    <div className="dashboard-page">
      <PageHeader
        actions={
          <>
            <label className="date-range-control">
              <CalendarDays />
              <span className="sr-only">Dashboard date range</span>
              <select value={range} onChange={(event) => loadRange(event.target.value as DateRange)}>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <ChevronDown />
            </label>
            <SecondaryButton icon={RefreshCw} loading={refreshing} onClick={refresh}>Refresh</SecondaryButton>
          </>
        }
        description="Monitor operational activity, investigate emerging issues, and track institutional intelligence."
        eyebrow="Demo · Synthetic data"
        title="Intelligence Overview"
      />
      <div className="dashboard-context-bar">
        <div>
          <span className="connection-indicator" />
          <strong>Demo environment</strong>
          <span>3 simulated operational sources</span>
          <span>Synthetic activity · synchronized 2 minutes ago</span>
        </div>
        <div>
          <label className="state-preview">
            <span>Preview state</span>
            <select value={state} onChange={(event) => setState(event.target.value as DashboardState)}>
              <option value="demo">Demo data</option>
              <option value="loading">Loading</option>
              <option value="empty">Healthy empty</option>
              <option value="no-sources">No connected sources</option>
              <option value="partial">Partial data</option>
              <option value="stale">Stale data</option>
              <option value="error">Error</option>
              <option value="restricted">Permission restricted</option>
            </select>
            <ChevronDown />
          </label>
          <TertiaryButton onClick={() => onNavigate("Integrations")}>Integrations</TertiaryButton>
        </div>
      </div>

      {state === "partial" && (
        <InlineAlert kind="warning" title="Partial operational data">
          2 of 3 simulated sources are available. Reconciliation feed activity may be incomplete.
        </InlineAlert>
      )}
      {state === "stale" && (
        <InlineAlert kind="warning" title="Synchronization is delayed">
          The latest simulated source update is 2 hours old. Values may not reflect recent activity.
        </InlineAlert>
      )}
      {state === "loading" && <DashboardLoading />}
      {terminalState && (
        <DashboardStateMessage
          onNavigate={onNavigate}
          onRetry={() => setState("demo")}
          state={state}
        />
      )}
      {!terminalState && state !== "loading" && (
        <>
          <div className="dashboard-metrics">
            <DashboardMetricCard context={`Permitted sources · ${range === "24h" ? "last 24 hours" : range === "7d" ? "last 7 days" : "last 30 days"}`} icon={CreditCard} label="Observed Payment Events" onClick={() => onNavigate("Operational Monitoring")} value={metrics.events} />
            <DashboardMetricCard context="Unresolved operational observations" icon={AlertCircle} label="Active Incidents" onClick={() => onNavigate("Incidents")} value={String(incidentRecords.filter((incident) => incident.lifecycle === "Active").length)} />
            <DashboardMetricCard context="Investigations not yet closed" icon={FileSearch} label="Open Investigations" onClick={() => onNavigate("Investigations")} value={metrics.investigations} />
            <DashboardMetricCard context="Authorized decisions required" icon={ClipboardCheck} label="Awaiting Human Review" onClick={() => onNavigate("Review Queue")} value={String(reviewRecords.filter((review) => review.status === "Pending" || review.status === "Claimed / In Review").length)} />
          </div>
          <div className="dashboard-layout">
            <OperationalChart onRangeChange={loadRange} range={range} />
            <PriorityIncidents onNavigate={onNavigate} records={incidentRecords} />
          </div>
          <RecentInvestigationsTable onNavigate={onNavigate} />
          <ReviewSummary onNavigate={onNavigate} records={reviewRecords} />
        </>
      )}
      {showRefreshNotice && (
        <ToastNotification
          message="The deterministic synthetic fixtures were reloaded locally. No bank source was queried."
          onClose={() => setShowRefreshNotice(false)}
          title="Demo data refreshed"
        />
      )}
    </div>
  )
}

type InvestigationSort = "updated" | "created" | "priority" | "status"

function NewInvestigationDialog({
  onClose,
  onCreate,
  nextId,
}: {
  onClose: () => void
  onCreate: (record: InvestigationRecord) => void
  nextId: string
}) {
  const [subject, setSubject] = useState("")
  const [type, setType] =
    useState<InvestigationRecord["type"]>("Operational Incident")
  const [priority, setPriority] =
    useState<InvestigationRecord["priority"]>("Medium")

  const submit = () => {
    if (!subject.trim()) return
    onCreate({
      id: nextId,
      subject: subject.trim(),
      type,
      related: type === "Customer Case" ? "CASE-DEMO-0001" : "MANUAL-DEMO-0001",
      caseReference: type === "Customer Case" ? "CASE-DEMO-0001" : undefined,
      priority,
      status: "Initiated",
      investigator: "Alex Morgan",
      created: "18 Mar 2026, 12:00",
      updated: "18 Mar 2026, 12:00",
      ageHours: 0,
      trigger: "Authorized manual investigation request created in the synthetic demo workspace.",
      objective: "Document the investigation objective and collect source-supported evidence.",
      service: "To be established",
      understanding: "No source-supported operational understanding has been recorded yet.",
      evidenceCompleteness: "0 of 0 expected records defined",
    })
    onClose()
  }

  return (
    <div aria-modal="true" className="dialog-layer" role="dialog">
      <button
        aria-label="Close new investigation dialog"
        className="dialog-scrim"
        onClick={onClose}
        type="button"
      />
      <div className="dialog investigation-create-dialog">
        <div className="modal-heading">
          <div>
            <span className="demo-label">Local demonstration</span>
            <h2>New Investigation</h2>
            <p>This creates a synthetic session record only. No institutional system will be updated.</p>
          </div>
          <IconButton icon={X} label="Close dialog" onClick={onClose} />
        </div>
        <div className="modal-form">
          <label className="field">
            <span className="field__label">Investigation subject</span>
            <input
              autoFocus
              className="input"
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Describe the matter to investigate"
              value={subject}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Investigation type</span>
              <span className="select-wrap">
                <select
                  className="input"
                  onChange={(event) =>
                    setType(event.target.value as InvestigationRecord["type"])
                  }
                  value={type}
                >
                  <option>Operational Incident</option>
                  <option>Customer Case</option>
                </select>
                <ChevronDown />
              </span>
            </label>
            <label className="field">
              <span className="field__label">Priority</span>
              <span className="select-wrap">
                <select
                  className="input"
                  onChange={(event) =>
                    setPriority(
                      event.target.value as InvestigationRecord["priority"],
                    )
                  }
                  value={priority}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <ChevronDown />
              </span>
            </label>
          </div>
        </div>
        <div className="dialog__actions">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton disabled={!subject.trim()} onClick={submit}>
            Create demo investigation
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function InvestigationStatusBadge({
  status,
}: {
  status: InvestigationStatus
}) {
  const kind: StatusKind =
    status === "Awaiting Review" || status === "In Review"
      ? "warning"
      : status === "Analyzing"
        ? "info"
        : status === "Closed"
          ? "success"
          : "neutral"
  return <StatusBadge kind={kind}>{status}</StatusBadge>
}

function InvestigationFilters({
  query,
  onQuery,
  type,
  onType,
  status,
  onStatus,
  priority,
  onPriority,
  investigator,
  onInvestigator,
  onClear,
}: {
  query: string
  onQuery: (value: string) => void
  type: string
  onType: (value: string) => void
  status: string
  onStatus: (value: string) => void
  priority: string
  onPriority: (value: string) => void
  investigator: string
  onInvestigator: (value: string) => void
  onClear: () => void
}) {
  const compactSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
  ) => (
    <label className="investigation-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown />
    </label>
  )

  return (
    <div className="investigation-filters">
      <label className="investigation-search">
        <Search />
        <span className="sr-only">Search investigations</span>
        <input
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search ID, case reference or subject"
          value={query}
        />
      </label>
      {compactSelect("Type", type, onType, [
        "All types",
        "Operational Incident",
        "Customer Case",
      ])}
      {compactSelect("Status", status, onStatus, [
        "All statuses",
        "Initiated",
        "Analyzing",
        "Awaiting Review",
        "In Review",
        "Closed",
        "Reopened",
      ])}
      {compactSelect("Priority", priority, onPriority, [
        "All priorities",
        "High",
        "Medium",
        "Low",
      ])}
      {compactSelect("Investigator", investigator, onInvestigator, [
        "All investigators",
        "Alex Morgan",
        "Tomi Adeyemi",
        "Maya Chen",
        "Priya Shah",
        "David Okafor",
        "Unassigned",
      ])}
      <TertiaryButton onClick={onClear}>Clear filters</TertiaryButton>
    </div>
  )
}

function InvestigationsTable({
  records,
  onOpen,
  sort,
  onSort,
}: {
  records: InvestigationRecord[]
  onOpen: (id: string) => void
  sort: InvestigationSort
  onSort: (sort: InvestigationSort) => void
}) {
  return (
    <>
      <div className="table-wrap investigation-registry-table">
        <table>
          <thead>
            <tr>
              <th>Investigation</th>
              <th>Type</th>
              <th>Related record</th>
              <th><button onClick={() => onSort("priority")} type="button">Priority <ArrowUpDown /></button></th>
              <th><button onClick={() => onSort("status")} type="button">Status <ArrowUpDown /></button></th>
              <th>Assigned investigator</th>
              <th><button onClick={() => onSort("updated")} type="button">Last updated <ArrowUpDown /></button></th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <button className="investigation-subject" onClick={() => onOpen(record.id)} type="button">
                    <strong>{record.subject}</strong>
                    <span>{record.id}</span>
                  </button>
                </td>
                <td>{record.type}</td>
                <td><span className="technical-id">{record.caseReference || record.related}</span></td>
                <td><StatusBadge kind={record.priority === "High" ? "error" : "neutral"}>{record.priority}</StatusBadge></td>
                <td><InvestigationStatusBadge status={record.status} /></td>
                <td>{record.investigator}</td>
                <td>{record.updated}</td>
                <td><IconButton icon={ChevronRight} label={`Open ${record.id}`} onClick={() => onOpen(record.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="investigation-mobile-list">
        {records.map((record) => (
          <button className="investigation-mobile-card" key={record.id} onClick={() => onOpen(record.id)} type="button">
            <span className="investigation-mobile-card__top">
              <span className="technical-id">{record.id}</span>
              <StatusBadge kind={record.priority === "High" ? "error" : "neutral"}>{record.priority}</StatusBadge>
            </span>
            <strong>{record.subject}</strong>
            <span>{record.type} · {record.caseReference || record.related}</span>
            <span className="investigation-mobile-card__bottom">
              <InvestigationStatusBadge status={record.status} />
              <span>{record.investigator}</span>
              <ChevronRight />
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function InvestigationsList({
  institution,
  records,
  onSelectInstitution,
  onOpen,
  onCreate,
}: {
  institution: string
  records: InvestigationRecord[]
  onSelectInstitution: (institution: string) => void
  onOpen: (id: string) => void
  onCreate: (record: InvestigationRecord) => void
}) {
  const [range, setRange] = useState<DateRange>("30d")
  const [query, setQuery] = useState("")
  const [type, setType] = useState("All types")
  const [status, setStatus] = useState("All statuses")
  const [priority, setPriority] = useState("All priorities")
  const [investigator, setInvestigator] = useState("All investigators")
  const [sort, setSort] = useState<InvestigationSort>("updated")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshed, setRefreshed] = useState(false)
  const threshold = range === "24h" ? 24 : range === "7d" ? 168 : 720
  const inRange = records.filter((record) => record.ageHours <= threshold)
  const counts = {
    open: inRange.filter((record) => record.status !== "Closed").length,
    analyzing: inRange.filter((record) => record.status === "Analyzing").length,
    review: inRange.filter(
      (record) =>
        record.status === "Awaiting Review" || record.status === "In Review",
    ).length,
    closed: inRange.filter((record) => record.status === "Closed").length,
  }
  const priorityRank = { High: 0, Medium: 1, Low: 2 }
  const filtered = inRange
    .filter((record) => {
      const haystack =
        `${record.id} ${record.subject} ${record.related} ${record.caseReference || ""}`.toLowerCase()
      return (
        haystack.includes(query.toLowerCase()) &&
        (type === "All types" || record.type === type) &&
        (status === "All statuses" || record.status === status) &&
        (priority === "All priorities" || record.priority === priority) &&
        (investigator === "All investigators" ||
          record.investigator === investigator)
      )
    })
    .sort((a, b) => {
      if (sort === "priority")
        return priorityRank[a.priority] - priorityRank[b.priority]
      if (sort === "status") return a.status.localeCompare(b.status)
      if (sort === "created") return a.created.localeCompare(b.created)
      return a.ageHours - b.ageHours
    })
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRecords = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => setPage(1), [query, type, status, priority, investigator, range])

  const refresh = () => {
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setRefreshed(true)
    }, 600)
  }

  if (!institution) {
    return (
      <div className="investigations-page">
        <PageHeader
          description="Examine operational incidents and customer cases through evidence-backed analysis."
          title="Investigations"
        />
        <section className="institution-empty">
          <span className="institution-empty__icon"><Building2 /></span>
          <span className="demo-label">No institution selected</span>
          <h2>Select an institution to access investigations</h2>
          <p>Investigation records are institution-scoped and are not available outside an authorized workspace.</p>
          <div>
            <PrimaryButton onClick={() => onSelectInstitution("Cedar Bank — Demo Workspace")}>Enter Cedar Bank Demo</PrimaryButton>
            <span>Demo · Synthetic data</span>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="investigations-page">
      <PageHeader
        actions={
          <>
            <label className="date-range-control">
              <CalendarDays />
              <span className="sr-only">Investigation date range</span>
              <select value={range} onChange={(event) => setRange(event.target.value as DateRange)}>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <ChevronDown />
            </label>
            <SecondaryButton icon={RefreshCw} loading={loading} onClick={refresh}>Refresh</SecondaryButton>
            <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>New Investigation</PrimaryButton>
          </>
        }
        description="Examine operational incidents and customer cases through evidence-backed analysis."
        eyebrow="Demo · Synthetic data"
        title="Investigations"
      />
      <div className="investigation-kpis">
        <MetricCard context={`Updated in selected ${range} period`} icon={FileSearch} label="Open Investigations" value={String(counts.open)} />
        <MetricCard context="Source collection and analysis active" icon={Activity} label="Currently Analyzing" value={String(counts.analyzing)} />
        <MetricCard context="Authorized decision required" icon={ClipboardCheck} label="Awaiting Human Review" value={String(counts.review)} />
        <MetricCard context={`Closed in selected ${range} period`} icon={Archive} label="Closed Investigations" value={String(counts.closed)} />
      </div>
      <section className="investigation-list-panel">
        <div className="investigation-list-panel__header">
          <div>
            <h2>Investigation Registry</h2>
            <p>{filtered.length} synthetic records match the current view.</p>
          </div>
          <label className="sort-control">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as InvestigationSort)}>
              <option value="updated">Last updated</option>
              <option value="created">Creation time</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        <InvestigationFilters
          investigator={investigator}
          onClear={() => {
            setQuery("")
            setType("All types")
            setStatus("All statuses")
            setPriority("All priorities")
            setInvestigator("All investigators")
          }}
          onInvestigator={setInvestigator}
          onPriority={setPriority}
          onQuery={setQuery}
          onStatus={setStatus}
          onType={setType}
          priority={priority}
          query={query}
          status={status}
          type={type}
        />
        {loading ? (
          <div className="investigation-list-loading"><LoadingSkeleton /></div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="filtered-empty">
            <Search />
            <h3>No matching investigations</h3>
            <p>Adjust or clear the active filters to see more records.</p>
            <SecondaryButton onClick={() => {
              setQuery("")
              setType("All types")
              setStatus("All statuses")
              setPriority("All priorities")
              setInvestigator("All investigators")
            }}>Clear filters</SecondaryButton>
          </div>
        ) : (
          <InvestigationsTable onOpen={onOpen} onSort={setSort} records={pageRecords} sort={sort} />
        )}
        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
            <div>
              <SecondaryButton disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</SecondaryButton>
              <span>Page {page} of {pageCount}</span>
              <SecondaryButton disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</SecondaryButton>
            </div>
          </div>
        )}
      </section>
      {createOpen && (
        <NewInvestigationDialog
          nextId={`INV-DEMO-${String(Math.max(1, records.length - 7)).padStart(4, "0")}`}
          onClose={() => setCreateOpen(false)}
          onCreate={onCreate}
        />
      )}
      {refreshed && (
        <ToastNotification
          message="The deterministic investigation fixture was reloaded locally. No institutional source was queried."
          onClose={() => setRefreshed(false)}
          title="Demo investigations refreshed"
        />
      )}
    </div>
  )
}

type EvidenceRecord = {
  id: string
  source: string
  type: string
  description: string
  observed: string
  ingested: string
  provenance: string
  availability: "Available" | "Partial" | "Stale"
  related: string
}

const evidenceFixtures: EvidenceRecord[] = [
  {
    id: "EVD-2026-0411",
    source: "Authorized payment event stream",
    type: "Operational event log",
    description: "Timeout observation recorded for the NIP transfer route.",
    observed: "18 Mar 2026, 09:41:22",
    ingested: "18 Mar 2026, 09:41:29",
    provenance: "Original normalized source record",
    availability: "Available",
    related: "TXN-••••-8421",
  },
  {
    id: "EVD-2026-0412",
    source: "NIP response feed",
    type: "Transaction status record",
    description: "Source-reported pending response; final outcome absent.",
    observed: "18 Mar 2026, 09:41:31",
    ingested: "18 Mar 2026, 09:42:04",
    provenance: "Authorized downstream response",
    availability: "Partial",
    related: "TXN-••••-8421",
  },
  {
    id: "EVD-2026-0413",
    source: "Service observability",
    type: "Service-health observation",
    description: "Elevated dependency latency during the affected interval.",
    observed: "18 Mar 2026, 09:40:00",
    ingested: "18 Mar 2026, 09:42:18",
    provenance: "Institution-approved monitoring source",
    availability: "Available",
    related: "SVC-NIP-ROUTE-02",
  },
  {
    id: "EVD-2026-0414",
    source: "Customer complaint intake",
    type: "Customer complaint event",
    description: "Customer reported an unresolved transfer-status message.",
    observed: "18 Mar 2026, 10:08:12",
    ingested: "18 Mar 2026, 10:08:26",
    provenance: "Authorized complaint event",
    availability: "Available",
    related: "CASE-2026-0316",
  },
  {
    id: "EVD-2026-0415",
    source: "Webhook delivery ledger",
    type: "Webhook delivery record",
    description: "Delivery receipt recorded after two source retries.",
    observed: "18 Mar 2026, 09:43:06",
    ingested: "18 Mar 2026, 09:43:08",
    provenance: "Original source delivery record",
    availability: "Available",
    related: "EVT-2026-18422",
  },
  {
    id: "EVD-2026-0416",
    source: "Institutional procedures",
    type: "Approved institutional knowledge",
    description: "Procedure for unresolved interbank transfer status checks.",
    observed: "12 Jan 2026, 08:00:00",
    ingested: "12 Jan 2026, 08:10:00",
    provenance: "Approved knowledge version 3.2",
    availability: "Stale",
    related: "KB-PAY-0032",
  },
]

function EvidenceDrawer({
  evidence,
  onClose,
}: {
  evidence: EvidenceRecord
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copyReference = () => {
    void navigator.clipboard?.writeText(evidence.id)
    setCopied(true)
  }
  return (
    <div aria-modal="true" className="drawer-layer" role="dialog">
      <button aria-label="Close evidence detail" className="drawer-scrim" onClick={onClose} type="button" />
      <aside className="evidence-drawer">
        <div className="drawer-header">
          <div>
            <span className="technical-id">{evidence.id}</span>
            <h2>{evidence.type}</h2>
            <p>Traceable synthetic evidence record</p>
          </div>
          <IconButton icon={X} label="Close evidence drawer" onClick={onClose} />
        </div>
        <div className="drawer-content">
          <InlineAlert kind="info" title="Source status is not independent verification">
            This record reflects the identified source. Veriq has not independently verified a final transaction outcome.
          </InlineAlert>
          <section className="drawer-section">
            <h3>Source identification</h3>
            <dl className="detail-list">
              <div><dt>Source system</dt><dd>{evidence.source}</dd></div>
              <div><dt>Provenance</dt><dd>{evidence.provenance}</dd></div>
              <div><dt>Observed</dt><dd>{evidence.observed}</dd></div>
              <div><dt>Received by Veriq</dt><dd>{evidence.ingested}</dd></div>
              <div><dt>Associated record</dt><dd>{evidence.related}</dd></div>
            </dl>
          </section>
          <section className="drawer-section">
            <div className="drawer-section__heading">
              <h3>Original source fields</h3>
              <span className="demo-label">Synthetic record</span>
            </div>
            <pre className="record-preview">{`{
  "event_reference": "${evidence.id}",
  "observed_at": "${evidence.observed}",
  "source_state": "${evidence.availability.toLowerCase()}",
  "related_reference": "${evidence.related}",
  "final_outcome": null
}`}</pre>
          </section>
          <section className="drawer-section">
            <h3>Veriq-derived interpretation</h3>
            <p>{evidence.description}</p>
            <p className="limitation-note"><TriangleAlert /> Limitation: downstream confirmation is missing and the source observation must not be treated as a verified financial outcome.</p>
          </section>
        </div>
        <div className="drawer-footer">
          <SecondaryButton icon={Copy} onClick={copyReference}>{copied ? "Reference copied" : "Copy reference"}</SecondaryButton>
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        </div>
      </aside>
    </div>
  )
}

function EvidenceExplorer({
  investigationId,
}: {
  investigationId: string
}) {
  const [selected, setSelected] = useState<EvidenceRecord | null>(null)
  const [state, setState] = useState<"available" | "collecting" | "empty" | "stale" | "error">("available")
  const records = investigationId === "INV-DEMO-0001" ? [] : evidenceFixtures
  return (
    <section className="investigation-panel evidence-explorer">
      <div className="investigation-panel__header">
        <div>
          <h2>Evidence Explorer</h2>
          <p>Source records remain traceable to their originating system.</p>
        </div>
        <label className="state-preview evidence-state-preview">
          <span>Preview</span>
          <select value={state} onChange={(event) => setState(event.target.value as typeof state)}>
            <option value="available">Available</option>
            <option value="collecting">Collecting</option>
            <option value="empty">No evidence</option>
            <option value="stale">Stale evidence</option>
            <option value="error">Collection error</option>
          </select>
          <ChevronDown />
        </label>
      </div>
      {state === "collecting" && <div className="evidence-state"><LoadingIndicatorLabel label="Evidence collection in progress" /><LoadingSkeleton /></div>}
      {state === "empty" || records.length === 0 ? (
        <div className="evidence-empty">
          <Database />
          <h3>No evidence records are available</h3>
          <p>No transaction outcome can be inferred from an empty evidence collection.</p>
          <SecondaryButton icon={Paperclip}>Request evidence</SecondaryButton>
        </div>
      ) : state === "error" ? (
        <div className="evidence-empty evidence-empty--error">
          <AlertCircle />
          <h3>Evidence collection failed</h3>
          <p>Source records could not be retrieved. Existing investigation conclusions remain unchanged.</p>
          <SecondaryButton onClick={() => setState("available")}>Retry collection</SecondaryButton>
        </div>
      ) : state !== "collecting" ? (
        <>
          {state === "stale" && (
            <div className="panel-alert">
              <TriangleAlert />
              <span><strong>Some evidence may be stale.</strong> Confirm source freshness before relying on these records.</span>
            </div>
          )}
          <div className="evidence-list">
            {records.map((evidence) => (
              <button className="evidence-row" key={evidence.id} onClick={() => setSelected(evidence)} type="button">
                <span className="evidence-row__icon"><Database /></span>
                <span className="evidence-row__main">
                  <span><strong>{evidence.type}</strong><span className="technical-id">{evidence.id}</span></span>
                  <span>{evidence.description}</span>
                  <span>{evidence.source} · Observed {evidence.observed}</span>
                </span>
                <span className="evidence-row__meta">
                  <StatusBadge kind={evidence.availability === "Available" ? "success" : evidence.availability === "Partial" ? "warning" : "neutral"}>{evidence.availability}</StatusBadge>
                  <span>{evidence.provenance}</span>
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </>
      ) : null}
      {selected && <EvidenceDrawer evidence={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

function LoadingIndicatorLabel({ label }: { label: string }) {
  return <span className="loading-inline"><LoaderCircle className="spin" />{label}</span>
}

function InvestigationTimeline({
  record,
  onEvidence,
}: {
  record: InvestigationRecord
  onEvidence: () => void
}) {
  const submitted =
    record.status === "Awaiting Review" ||
    record.status === "In Review" ||
    record.status === "Closed"
  const events = [
    { time: "09:41", title: "Elevated timeout signals observed", actor: "Authorized operational source", description: "The permitted monitoring source recorded an elevated timeout pattern.", category: "Source observation", icon: Activity, evidence: "EVD-2026-0411" },
    { time: "09:43", title: "Rule-based detection recorded", actor: "Veriq detection service", description: "A documented threshold rule matched the source observations.", category: "System event", icon: CircleDot, evidence: "EVD-2026-0413" },
    { time: "09:48", title: "Investigation opened", actor: "Veriq workflow", description: `${record.id} was opened with status Initiated.`, category: "System event", icon: FileSearch, evidence: null },
    { time: "10:02", title: "Source records collected", actor: "Evidence collection", description: "Relevant operational and transaction-status records were associated.", category: "System event", icon: Database, evidence: "6 records" },
    { time: "10:08", title: "Customer complaint linked", actor: "Alex Morgan", description: "An authorized complaint event was linked without exposing customer identity.", category: "Human action", icon: UserCheck, evidence: "EVD-2026-0414" },
    { time: "10:31", title: "AI-assisted analysis completed", actor: "Veriq analysis service", description: "Unverified hypotheses were generated for investigator validation.", category: "AI analysis", icon: GitBranch, evidence: "2 hypotheses" },
    { time: "11:05", title: "Additional evidence requested", actor: record.investigator, description: "Downstream transaction-status confirmation was requested.", category: "Human action", icon: Paperclip, evidence: null },
    ...(submitted
      ? [{ time: "11:24", title: "Findings submitted for human review", actor: record.investigator, description: "Source-supported findings and limitations were submitted.", category: "Human action", icon: Send, evidence: "Review submission" }]
      : []),
  ]
  return (
    <section className="investigation-panel">
      <div className="investigation-panel__header"><div><h2>Investigation Timeline</h2><p>Chronological source, system, AI and human activity.</p></div></div>
      <ol className="timeline">
        {events.map((event, index) => {
          const Icon = event.icon
          return (
            <li key={`${event.time}-${event.title}`}>
              <span className="timeline__connector" />
              <span className="timeline__icon"><Icon /></span>
              <time>{event.time}<small>18 Mar 2026</small></time>
              <div>
                <span className="timeline__category">{event.category}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <span className="timeline__actor">Source or actor: {event.actor}</span>
                {event.evidence && <button onClick={onEvidence} type="button"><Link2 />{event.evidence}</button>}
              </div>
              {index === events.length - 1 && <span className="sr-only">Current timeline position</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function AIHypothesisCard({
  title,
  explanation,
  evidence,
  missing,
  validation,
}: {
  title: string
  explanation: string
  evidence: string[]
  missing: string
  validation: string
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <article className="hypothesis-card">
      <div className="hypothesis-card__label"><GitBranch />AI-generated hypothesis</div>
      <h3>{title}</h3>
      <p>{explanation}</p>
      <div className="hypothesis-card__status"><StatusBadge kind="warning">Unverified hypothesis</StatusBadge><span>Material uncertainty</span></div>
      <button aria-expanded={expanded} className="hypothesis-expand" onClick={() => setExpanded(!expanded)} type="button">
        {expanded ? "Hide reasoning context" : "Review reasoning context"} <ChevronDown />
      </button>
      {expanded && (
        <div className="hypothesis-details">
          <div><strong>Supporting evidence</strong>{evidence.map((item) => <button className="technical-link" key={item} type="button">{item}</button>)}</div>
          <div><strong>Contradictory or missing evidence</strong><p>{missing}</p></div>
          <div><strong>Suggested validation</strong><p>{validation}</p></div>
          <div><strong>Human review</strong><p>Not yet accepted as a finding.</p></div>
        </div>
      )}
    </article>
  )
}

function AIAnalysisPanel() {
  const [state, setState] = useState<"available" | "unavailable" | "failed">("available")
  return (
    <aside className="investigation-panel ai-panel">
      <div className="investigation-panel__header">
        <div><h2>AI-Assisted Analysis</h2><p>Interpretations require human validation.</p></div>
        <label className="state-preview">
          <span className="sr-only">AI analysis preview state</span>
          <select value={state} onChange={(event) => setState(event.target.value as typeof state)}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown />
        </label>
      </div>
      {state === "unavailable" ? (
        <div className="compact-state"><CircleHelp /><strong>AI analysis unavailable</strong><p>Evidence remains accessible for direct human analysis.</p></div>
      ) : state === "failed" ? (
        <div className="compact-state compact-state--error"><AlertCircle /><strong>Analysis could not be completed</strong><p>No hypothesis was produced or treated as a finding.</p><SecondaryButton onClick={() => setState("available")}>Retry demo analysis</SecondaryButton></div>
      ) : (
        <div className="hypothesis-list">
          <AIHypothesisCard
            evidence={["EVD-2026-0411", "EVD-2026-0413"]}
            explanation="The observed timeout pattern may be associated with intermittent degradation in an upstream routing dependency."
            missing="An authorized downstream confirmation response has not been received."
            title="Payment-routing dependency degradation"
            validation="Compare affected and unaffected route windows and obtain downstream status confirmation."
          />
          <AIHypothesisCard
            evidence={["EVD-2026-0411", "EVD-2026-0415"]}
            explanation="Source retry behavior may have increased event-delivery latency during the observed period."
            missing="The retry record does not establish transaction failure or customer impact."
            title="Source retry amplification"
            validation="Inspect retry timing against source delivery receipts and service-health observations."
          />
          <section className="recommendations">
            <h3>Recommended Next Steps</h3>
            {[
              ["Request downstream transaction-status confirmation", "Resolve the missing final source response.", "Authorization required"],
              ["Compare affected and unaffected payment routes", "Test whether observations are route-specific.", "Analyst action"],
              ["Review institutional incident procedure", "Apply the approved escalation path.", "Reviewer action"],
            ].map(([action, reason, auth], index) => (
              <div key={action}>
                <span>{index + 1}</span>
                <div><strong>{action}</strong><p>{reason}</p><small>EVD-2026-041{index + 1} · {auth}</small></div>
                <button aria-label={`Open recommendation: ${action}`} type="button"><ChevronRight /></button>
              </div>
            ))}
            <p className="recommendation-note">Recommendations do not perform financial actions or modify source records.</p>
          </section>
        </div>
      )}
    </aside>
  )
}

function InvestigationSummaryPanel({ record }: { record: InvestigationRecord }) {
  return (
    <section className="investigation-panel investigation-summary">
      <div className="investigation-panel__header"><div><h2>Investigation Summary</h2><p>Source-supported observations are separated from working interpretations.</p></div><StatusBadge kind="info">Incomplete investigation</StatusBadge></div>
      <div className="summary-grid">
        <div><span>Trigger event</span><p>{record.trigger}</p><small><Database />Source-supported observation</small></div>
        <div><span>Investigation objective</span><p>{record.objective}</p><small><FileSearch />Investigator-defined scope</small></div>
        <div><span>Affected service or route</span><p>{record.service}</p></div>
        <div><span>Related case or incident</span><p className="technical-id">{record.related}</p></div>
        <div className="summary-grid__wide"><span>Current operational understanding</span><p>{record.understanding}</p><small><TriangleAlert />Interpretation remains subject to additional evidence and human review.</small></div>
        <div><span>Evidence completeness</span><p>{record.evidenceCompleteness}</p></div>
        <div><span>Outstanding questions</span><p>What final status was reported downstream, and were unaffected routes observed during the same interval?</p></div>
      </div>
    </section>
  )
}

function TransactionOutcome({ record }: { record: InvestigationRecord }) {
  if (record.type !== "Customer Case") return null
  return (
    <section className="investigation-panel transaction-outcome">
      <div className="investigation-panel__header"><div><h2>Transaction Outcome</h2><p>Separate from the investigation workflow status.</p></div><StatusBadge kind="warning">Outcome Unknown</StatusBadge></div>
      <InlineAlert kind="warning" title="Awaiting authorized source confirmation">
        Available records do not establish a final financial outcome. A closed investigation would not imply that funds were returned.
      </InlineAlert>
      <dl className="detail-list detail-list--grid">
        <div><dt>Customer-case reference</dt><dd>{record.caseReference}</dd></div>
        <div><dt>Masked transaction reference</dt><dd>TXN-••••-8421</dd></div>
        <div><dt>Payment channel</dt><dd>NIP transfer</dd></div>
        <div><dt>Source-reported status</dt><dd>Pending confirmation</dd></div>
        <div><dt>Observed</dt><dd>18 Mar 2026, 09:41</dd></div>
        <div><dt>Related incident</dt><dd>{record.related}</dd></div>
      </dl>
    </section>
  )
}

function ReviewStatusPanel({
  record,
  onSubmit,
  onNavigate,
  onDecision,
  decision,
}: {
  record: InvestigationRecord
  onSubmit: () => void
  onNavigate: (label: string) => void
  onDecision: (decision: string) => void
  decision: string
}) {
  const submitted =
    record.status === "Awaiting Review" || record.status === "In Review"
  return (
    <section className="investigation-panel review-status-panel">
      <div className="investigation-panel__header"><div><h2>Human Review Status</h2><p>Approval applies only to submitted findings, not unverified hypotheses.</p></div><InvestigationStatusBadge status={record.status} /></div>
      <dl className="detail-list detail-list--grid">
        <div><dt>Current review state</dt><dd>{submitted ? record.status : "Not submitted"}</dd></div>
        <div><dt>Submission timestamp</dt><dd>{submitted ? "18 Mar 2026, 11:24" : "Not submitted"}</dd></div>
        <div><dt>Assigned reviewer</dt><dd>{submitted ? "Nneka Williams" : "Unassigned"}</dd></div>
        <div><dt>Supporting evidence</dt><dd>6 records</dd></div>
        <div><dt>Submitted findings</dt><dd>{submitted ? "2 source-supported observations" : "Draft in progress"}</dd></div>
        <div><dt>Outstanding questions</dt><dd>2 unresolved</dd></div>
      </dl>
      <div className="review-actions">
        {!submitted ? (
          <>
            <SecondaryButton icon={Save}>Save draft</SecondaryButton>
            <SecondaryButton icon={Paperclip}>Request evidence</SecondaryButton>
            <PrimaryButton icon={Send} onClick={onSubmit}>Submit findings for review</PrimaryButton>
          </>
        ) : (
          <>
            <SecondaryButton onClick={() => onDecision("Request changes")}>Request changes</SecondaryButton>
            <SecondaryButton onClick={() => onDecision("Reject unsupported conclusions")}>Reject unsupported conclusions</SecondaryButton>
            <PrimaryButton icon={UserCheck} onClick={() => onDecision("Approve findings")}>Approve findings</PrimaryButton>
          </>
        )}
        <TertiaryButton onClick={() => onNavigate("Review Queue")}>Open Review Queue</TertiaryButton>
      </div>
      {decision && (
        <div className="local-decision">
          <CheckCircle2 />
          <span><strong>Local demo decision recorded:</strong> {decision}. No institutional authorization was performed.</span>
        </div>
      )}
      <p className="demo-disclaimer">Demo interactions are stored only in this browser session. No institutional approval is performed.</p>
    </section>
  )
}

function ReportPreview({
  record,
  onClose,
}: {
  record: InvestigationRecord
  onClose: () => void
}) {
  return (
    <div aria-modal="true" className="report-layer" role="dialog">
      <button aria-label="Close report preview" className="drawer-scrim" onClick={onClose} type="button" />
      <article className="report-preview">
        <div className="report-toolbar">
          <div><span className="demo-label">DEMONSTRATION REPORT — SYNTHETIC DATA</span><strong>Investigation report preview</strong></div>
          <div><SecondaryButton disabled icon={Download}>Export unavailable</SecondaryButton><IconButton icon={X} label="Close report" onClick={onClose} /></div>
        </div>
        <div className="report-document">
          <header><VeriqLogo /><span>Generated 18 Mar 2026, 12:00 · Uncertified demonstration</span></header>
          <h1>{record.subject}</h1>
          <p className="report-id">{record.id} · {record.type} · {record.priority} priority</p>
          <section><h2>Scope and trigger</h2><p>{record.trigger}</p><p>{record.objective}</p></section>
          <section><h2>Established source-supported observations</h2><ul><li>Elevated timeout signals were recorded by the authorized event source.</li><li>Service-health observations show increased latency during the affected interval.</li></ul></section>
          <section><h2>Evidence references</h2><p>EVD-2026-0411, EVD-2026-0412, EVD-2026-0413, EVD-2026-0414, EVD-2026-0415, EVD-2026-0416</p></section>
          <section><h2>AI hypotheses — unverified</h2><p>Payment-routing dependency degradation may explain the observed pattern. This is not an established root cause.</p></section>
          <section><h2>Known limitations</h2><p>Authorized downstream confirmation is missing. Final outcomes for related transactions remain unconfirmed.</p></section>
          <section><h2>Human-reviewed conclusions</h2><p>No institutionally approved conclusion is recorded in this demonstration.</p></section>
          <section><h2>Recommendations and review history</h2><p>Request downstream confirmation, compare route windows and follow approved incident procedures. Current workflow status: {record.status}.</p></section>
        </div>
      </article>
    </div>
  )
}

function InvestigationDetail({
  record,
  onBack,
  onUpdate,
  onNavigate,
}: {
  record?: InvestigationRecord
  onBack: () => void
  onUpdate: (record: InvestigationRecord) => void
  onNavigate: (label: string) => void
}) {
  const [tab, setTab] = useState("Overview")
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [notesSaved, setNotesSaved] = useState(false)
  const [evidenceRequested, setEvidenceRequested] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [pendingDecision, setPendingDecision] = useState("")
  const [reviewDecision, setReviewDecision] = useState(
    record?.reviewDecision || "",
  )

  if (!record) {
    return (
      <div className="investigations-page">
        <section className="dashboard-state">
          <span><FileSearch /></span><h2>Investigation not found</h2>
          <p>The requested investigation is unavailable in this institution or your role does not permit access.</p>
          <PrimaryButton onClick={onBack}>Back to Investigations</PrimaryButton>
        </section>
      </div>
    )
  }

  const submit = () => {
    onUpdate({ ...record, status: "Awaiting Review", updated: "18 Mar 2026, 12:00", ageHours: 0 })
    setConfirmSubmit(false)
  }
  const tabs = ["Overview", "Evidence", "Timeline", "Related Records", "Review & Activity"]

  return (
    <div className="investigation-detail-page">
      <button className="back-link" onClick={onBack} type="button"><ChevronRight />Back to Investigations</button>
      <section className="investigation-detail-header">
        <div className="investigation-detail-header__main">
          <div className="investigation-id-row"><span className="technical-id">{record.id}</span><span className="demo-label">Demo · Synthetic data</span></div>
          <h1>{record.subject}</h1>
          <div className="investigation-header-badges">
            <StatusBadge kind="neutral">{record.type}</StatusBadge>
            <StatusBadge kind={record.priority === "High" ? "error" : "neutral"}>{record.priority} priority</StatusBadge>
            <InvestigationStatusBadge status={record.status} />
          </div>
          <dl className="investigation-header-meta">
            <div><dt>Assigned</dt><dd>{record.investigator}</dd></div>
            <div><dt>Created</dt><dd>{record.created}</dd></div>
            <div><dt>Last updated</dt><dd>{record.updated}</dd></div>
            <div><dt>Related record</dt><dd>{record.related}</dd></div>
          </dl>
        </div>
        <div className="investigation-header-actions">
          <div className="assignment-control">
            <SecondaryButton icon={UserPlus} onClick={() => setAssignmentOpen(!assignmentOpen)}>Assign / Reassign</SecondaryButton>
            {assignmentOpen && (
              <div className="assignment-menu">
                <strong>Assign investigator</strong>
                {["Alex Morgan", "Tomi Adeyemi", "Maya Chen", "Priya Shah", "David Okafor"].map((person) => (
                  <button key={person} onClick={() => { onUpdate({ ...record, investigator: person }); setAssignmentOpen(false) }} type="button">
                    <span className="profile-avatar">{person.split(" ").map((part) => part[0]).join("")}</span>{person}{record.investigator === person && <Check />}
                  </button>
                ))}
                <small>Local demo assignment only</small>
              </div>
            )}
          </div>
          <SecondaryButton icon={Paperclip} onClick={() => setEvidenceRequested(true)}>Request Evidence</SecondaryButton>
          <PrimaryButton disabled={record.status === "Awaiting Review" || record.status === "In Review"} icon={Send} onClick={() => setConfirmSubmit(true)}>Submit for Review</PrimaryButton>
          <IconButton icon={MoreHorizontal} label="More actions" />
        </div>
      </section>
      <div className="investigation-tabs" role="tablist">
        {tabs.map((item) => (
          <button aria-selected={tab === item} className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}</button>
        ))}
        <button className="report-action" onClick={() => setReportOpen(true)} type="button"><FileText />Generate Report</button>
      </div>

      {tab === "Overview" && (
        <>
          <InvestigationSummaryPanel record={record} />
          <TransactionOutcome record={record} />
          <div className="investigation-workspace">
            <div className="investigation-primary">
              <EvidenceExplorer investigationId={record.id} />
              <section className="investigation-panel outstanding-panel">
                <div className="investigation-panel__header"><div><h2>Outstanding Questions</h2><p>Questions that prevent a source-supported conclusion.</p></div></div>
                <ul><li>What final transaction status was reported by the authorized downstream source?</li><li>Was the same timeout behavior observed on unaffected payment routes?</li><li>Did source retry timing overlap the service-health degradation window?</li></ul>
              </section>
            </div>
            <AIAnalysisPanel />
          </div>
        </>
      )}
      {tab === "Evidence" && <div className="investigation-workspace"><EvidenceExplorer investigationId={record.id} /><AIAnalysisPanel /></div>}
      {tab === "Timeline" && <div className="investigation-workspace"><InvestigationTimeline onEvidence={() => setTab("Evidence")} record={record} /><AIAnalysisPanel /></div>}
      {tab === "Related Records" && (
        <section className="investigation-panel related-records">
          <div className="investigation-panel__header"><div><h2>Related Records</h2><p>Institution-scoped synthetic relationships.</p></div></div>
          {[record.related, record.caseReference, "TXN-••••-8421", "SVC-NIP-ROUTE-02"].filter(Boolean).map((reference) => (
            <button key={reference} onClick={() => onNavigate(String(reference))} type="button"><Link2 /><span><strong>{reference}</strong><small>Linked source or workflow record</small></span><ChevronRight /></button>
          ))}
        </section>
      )}
      {tab === "Review & Activity" && (
        <div className="review-activity-stack">
          {record.requestedChanges && (
            <InlineAlert kind="warning" title="Reviewer requested changes">
              {record.requestedChanges}
            </InlineAlert>
          )}
          <ReviewStatusPanel
            decision={reviewDecision}
            onDecision={setPendingDecision}
            onNavigate={onNavigate}
            onSubmit={() => setConfirmSubmit(true)}
            record={record}
          />
          <section className="investigation-panel notes-panel">
            <div className="investigation-panel__header"><div><h2>Investigation Notes</h2><p>Session-only analyst notes for the synthetic workspace.</p></div></div>
            <label><span className="field__label">Working note</span><textarea className="input textarea" onChange={(event) => setNotes(event.target.value)} placeholder="Record source-backed observations, open questions or review context…" value={notes} /></label>
            <div><span>{notesSaved ? "Draft saved locally" : "Not yet saved"}</span><SecondaryButton icon={Save} onClick={() => setNotesSaved(true)}>Save draft</SecondaryButton></div>
          </section>
        </div>
      )}

      {evidenceRequested && <ToastNotification message="A local synthetic evidence request was recorded. No source system was contacted." onClose={() => setEvidenceRequested(false)} title="Demo evidence request created" />}
      {reportOpen && <ReportPreview onClose={() => setReportOpen(false)} record={record} />}
      {confirmSubmit && (
        <div aria-modal="true" className="dialog-layer" role="dialog">
          <button aria-label="Cancel review submission" className="dialog-scrim" onClick={() => setConfirmSubmit(false)} type="button" />
          <div className="dialog">
            <span className="dialog__icon"><ClipboardCheck /></span>
            <h2>Submit demo findings for review?</h2>
            <p>This changes only the synthetic session status. It does not perform institutional authorization or approve any AI-generated hypothesis.</p>
            <div className="dialog__actions"><SecondaryButton onClick={() => setConfirmSubmit(false)}>Cancel</SecondaryButton><PrimaryButton onClick={submit}>Submit demo findings</PrimaryButton></div>
          </div>
        </div>
      )}
      {pendingDecision && (
        <div aria-modal="true" className="dialog-layer" role="dialog">
          <button aria-label="Cancel review decision" className="dialog-scrim" onClick={() => setPendingDecision("")} type="button" />
          <div className="dialog">
            <span className="dialog__icon"><UserCheck /></span>
            <h2>Record “{pendingDecision}” in the demo?</h2>
            <p>This records a synthetic client-side review rationale only. It does not constitute institutional approval or alter financial records.</p>
            <label className="field">
              <span className="field__label">Review rationale</span>
              <textarea className="input textarea" placeholder="Document the evidence-backed rationale…" />
            </label>
            <div className="dialog__actions">
              <SecondaryButton onClick={() => setPendingDecision("")}>Cancel</SecondaryButton>
              <PrimaryButton onClick={() => { setReviewDecision(pendingDecision); setPendingDecision("") }}>Record demo decision</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type MonitoringSource =
  | "Payment Event Feed"
  | "Service Health Telemetry"
  | "Reconciliation Event Feed"

type MonitoringAnomaly = {
  id: string
  title: string
  service: string
  source: MonitoringSource
  firstDetected: string
  latestObserved: string
  severity: "High" | "Medium" | "Low"
  method: string
  state: "Under assessment" | "Investigation initiated" | "Monitoring"
  incident?: string
  investigation?: string
  threshold: string
  observed: string
}

type OperationalEvent = {
  id: string
  timestamp: string
  received: string
  source: MonitoringSource
  type:
    | "Transaction status update"
    | "Transfer timeout observation"
    | "Webhook delivery event"
    | "Reconciliation ingestion event"
    | "Service-health observation"
  service: string
  sourceState: string
  anomaly?: string
  investigation?: string
  transaction?: string
  evidence: string
  ageHours: number
}

const monitoringSources: Array<{
  name: MonitoringSource
  state: "Reporting normally" | "Delayed or stale" | "Unavailable"
  latest: string
  environment: string
}> = [
  {
    name: "Payment Event Feed",
    state: "Reporting normally",
    latest: "18 Mar 2026, 11:58:42",
    environment: "Simulated source",
  },
  {
    name: "Service Health Telemetry",
    state: "Reporting normally",
    latest: "18 Mar 2026, 11:57:30",
    environment: "Simulated source",
  },
  {
    name: "Reconciliation Event Feed",
    state: "Delayed or stale",
    latest: "18 Mar 2026, 10:42:18",
    environment: "Simulated source",
  },
]

const monitoringAnomalies: MonitoringAnomaly[] = [
  {
    id: "ANM-2026-0041",
    title: "Elevated NIP transfer timeout observations",
    service: "NIP Transfer Processing",
    source: "Payment Event Feed",
    firstDetected: "18 Mar 2026, 09:41",
    latestObserved: "18 Mar 2026, 11:26",
    severity: "High",
    method: "Configured monitoring rule",
    state: "Investigation initiated",
    incident: "INC-2026-0031",
    investigation: "INV-2026-0087",
    threshold: "More than 18 timeout observations in a rolling 30-minute window",
    observed: "27 timeout observations in the demonstration window",
  },
  {
    id: "ANM-2026-0042",
    title: "Unusual payment webhook delivery delays",
    service: "Payment Event Webhooks",
    source: "Payment Event Feed",
    firstDetected: "18 Mar 2026, 07:18",
    latestObserved: "18 Mar 2026, 10:54",
    severity: "Medium",
    method: "Delivery-latency rule",
    state: "Investigation initiated",
    incident: "INC-2026-0032",
    investigation: "INV-2026-0088",
    threshold: "Delivery latency above 45 seconds for 5 consecutive events",
    observed: "7 consecutive delayed webhook observations",
  },
  {
    id: "ANM-2026-0043",
    title: "Delayed reconciliation event ingestion",
    service: "Reconciliation Feed Processing",
    source: "Reconciliation Event Feed",
    firstDetected: "17 Mar 2026, 22:06",
    latestObserved: "18 Mar 2026, 10:42",
    severity: "Medium",
    method: "Freshness threshold rule",
    state: "Under assessment",
    incident: "INC-2026-0033",
    investigation: "INV-2026-0090",
    threshold: "No new reconciliation event received for 60 minutes",
    observed: "Latest simulated event was 76 minutes old when detected",
  },
]

const operationalEvents: OperationalEvent[] = [
  {
    id: "EVT-2026-18431",
    timestamp: "18 Mar 2026, 11:58:42",
    received: "18 Mar 2026, 11:58:45",
    source: "Payment Event Feed",
    type: "Transaction status update",
    service: "Internal Transfer Processing",
    sourceState: "Source-reported completed",
    transaction: "TXN-••••-9137",
    evidence: "EVD-2026-0431",
    ageHours: 0,
  },
  {
    id: "EVT-2026-18430",
    timestamp: "18 Mar 2026, 11:56:18",
    received: "18 Mar 2026, 11:56:21",
    source: "Payment Event Feed",
    type: "Transfer timeout observation",
    service: "NIP Transfer Processing",
    sourceState: "Timeout observed",
    anomaly: "ANM-2026-0041",
    investigation: "INV-2026-0087",
    transaction: "TXN-••••-8421",
    evidence: "EVD-2026-0411",
    ageHours: 0,
  },
  {
    id: "EVT-2026-18429",
    timestamp: "18 Mar 2026, 11:51:06",
    received: "18 Mar 2026, 11:51:09",
    source: "Service Health Telemetry",
    type: "Service-health observation",
    service: "NIP Transfer Processing",
    sourceState: "Elevated dependency latency",
    anomaly: "ANM-2026-0041",
    investigation: "INV-2026-0087",
    evidence: "EVD-2026-0413",
    ageHours: 0,
  },
  {
    id: "EVT-2026-18428",
    timestamp: "18 Mar 2026, 11:44:52",
    received: "18 Mar 2026, 11:45:31",
    source: "Payment Event Feed",
    type: "Webhook delivery event",
    service: "Payment Event Webhooks",
    sourceState: "Delivered after retry",
    anomaly: "ANM-2026-0042",
    investigation: "INV-2026-0088",
    evidence: "EVD-2026-0415",
    ageHours: 1,
  },
  {
    id: "EVT-2026-18427",
    timestamp: "18 Mar 2026, 10:42:18",
    received: "18 Mar 2026, 10:43:02",
    source: "Reconciliation Event Feed",
    type: "Reconciliation ingestion event",
    service: "Reconciliation Feed Processing",
    sourceState: "Delayed ingestion",
    anomaly: "ANM-2026-0043",
    investigation: "INV-2026-0090",
    evidence: "EVD-2026-0427",
    ageHours: 2,
  },
  {
    id: "EVT-2026-18426",
    timestamp: "18 Mar 2026, 09:41:22",
    received: "18 Mar 2026, 09:41:29",
    source: "Payment Event Feed",
    type: "Transfer timeout observation",
    service: "NIP Transfer Processing",
    sourceState: "Timeout observed",
    anomaly: "ANM-2026-0041",
    investigation: "INV-2026-0087",
    transaction: "TXN-••••-8421",
    evidence: "EVD-2026-0411",
    ageHours: 3,
  },
  {
    id: "EVT-2026-18425",
    timestamp: "17 Mar 2026, 22:06:04",
    received: "17 Mar 2026, 22:06:44",
    source: "Reconciliation Event Feed",
    type: "Reconciliation ingestion event",
    service: "Reconciliation Feed Processing",
    sourceState: "Freshness threshold exceeded",
    anomaly: "ANM-2026-0043",
    investigation: "INV-2026-0090",
    evidence: "EVD-2026-0425",
    ageHours: 14,
  },
  {
    id: "EVT-2026-18424",
    timestamp: "17 Mar 2026, 18:22:12",
    received: "17 Mar 2026, 18:22:15",
    source: "Payment Event Feed",
    type: "Transaction status update",
    service: "Internal Transfer Processing",
    sourceState: "Source-reported pending",
    transaction: "TXN-••••-7720",
    evidence: "EVD-2026-0424",
    ageHours: 18,
  },
  {
    id: "EVT-2026-18423",
    timestamp: "16 Mar 2026, 12:16:08",
    received: "16 Mar 2026, 12:16:11",
    source: "Service Health Telemetry",
    type: "Service-health observation",
    service: "Payment Event Webhooks",
    sourceState: "Normal observation",
    evidence: "EVD-2026-0423",
    ageHours: 48,
  },
  {
    id: "EVT-2026-18422",
    timestamp: "14 Mar 2026, 08:32:11",
    received: "14 Mar 2026, 08:32:14",
    source: "Payment Event Feed",
    type: "Webhook delivery event",
    service: "Payment Event Webhooks",
    sourceState: "Delivered",
    evidence: "EVD-2026-0422",
    ageHours: 100,
  },
]

const monitoringSummary: Record<
  DateRange,
  { events: number; timeouts: number; routes: number; anomalies: number }
> = {
  "24h": { events: 12480, timeouts: 156, routes: 3, anomalies: 3 },
  "7d": { events: 82350, timeouts: 884, routes: 4, anomalies: 3 },
  "30d": { events: 392580, timeouts: 3260, routes: 4, anomalies: 3 },
}

const serviceFixtures = [
  {
    name: "NIP Transfer Processing",
    channel: "NIP transfer",
    source: "Payment Event Feed" as MonitoringSource,
    volume: 6240,
    timeouts: 126,
    latest: "11:56:18",
    state: "Elevated anomalies",
    anomalies: 1,
  },
  {
    name: "Payment Event Webhooks",
    channel: "Event delivery",
    source: "Payment Event Feed" as MonitoringSource,
    volume: 2810,
    timeouts: 30,
    latest: "11:44:52",
    state: "Elevated anomalies",
    anomalies: 1,
  },
  {
    name: "Reconciliation Feed Processing",
    channel: "Reconciliation",
    source: "Reconciliation Event Feed" as MonitoringSource,
    volume: 1960,
    timeouts: 0,
    latest: "10:42:18",
    state: "Degraded source visibility",
    anomalies: 1,
  },
  {
    name: "Internal Transfer Processing",
    channel: "Internal transfer",
    source: "Payment Event Feed" as MonitoringSource,
    volume: 1470,
    timeouts: 0,
    latest: "11:58:42",
    state: "Normal observations",
    anomalies: 0,
  },
]

function MonitoringChart({
  range,
  metric,
  source,
  service,
  anomalies,
  onMetric,
  onAnomaly,
}: {
  range: DateRange
  metric: "events" | "timeouts" | "anomalies"
  source: string
  service: string
  anomalies: MonitoringAnomaly[]
  onMetric: (metric: "events" | "timeouts" | "anomalies") => void
  onAnomaly: (anomaly: MonitoringAnomaly) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const selectedService = serviceFixtures.find((item) => item.name === service)
  const sourceScale =
    selectedService
      ? selectedService.volume / monitoringSummary["24h"].events
      : source === "All sources"
      ? 1
      : source === "Payment Event Feed"
        ? 0.72
        : source === "Service Health Telemetry"
          ? 0.16
          : 0.12
  const base = activityFixtures[range]
  const values = base.map((point, index) => ({
    label: point.label,
    value:
      metric === "events"
        ? Math.round(point.events * sourceScale)
        : metric === "timeouts"
          ? Math.round(point.timeouts * sourceScale)
          : index % Math.max(2, Math.floor(base.length / 3)) === 1
            ? 1
            : 0,
  }))
  const width = 900
  const height = 300
  const left = 54
  const right = 22
  const top = 22
  const bottom = 42
  const max = Math.max(1, ...values.map((point) => point.value)) * 1.18
  const x = (index: number) =>
    left + (index / (values.length - 1)) * (width - left - right)
  const y = (value: number) =>
    top + (1 - value / max) * (height - top - bottom)
  const path = values
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`,
    )
    .join(" ")
  const label =
    metric === "events"
      ? "Observed events"
      : metric === "timeouts"
        ? "Timeout observations"
        : "Anomaly detections"

  return (
    <section className="monitoring-panel monitoring-chart-panel">
      <div className="monitoring-panel__header">
        <div>
          <h2>Payment Activity & Anomaly Trends</h2>
          <p>{label} · selected source coverage</p>
        </div>
        <div className="metric-toggle" role="tablist">
          {[
            ["events", "Event Volume"],
            ["timeouts", "Timeout Signals"],
            ["anomalies", "Anomaly Detections"],
          ].map(([value, text]) => (
            <button
              aria-selected={metric === value}
              className={metric === value ? "active" : ""}
              key={value}
              onClick={() =>
                onMetric(value as "events" | "timeouts" | "anomalies")
              }
              role="tab"
              type="button"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      <div className="monitoring-chart-legend">
        <span><i />{label}</span>
        <span><CircleDot />Clickable anomaly marker</span>
        <strong>Y-axis: {label.toLowerCase()}</strong>
      </div>
      <div className="monitoring-chart-wrap">
        <svg
          aria-label={`${label} for the selected ${range} period, ${source}, and ${service}`}
          className="monitoring-chart"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 1, 2, 3].map((line) => {
            const lineY = top + (line / 3) * (height - top - bottom)
            const tick = Math.round(max * (1 - line / 3))
            return (
              <g key={line}>
                <line className="chart-gridline" x1={left} x2={width - right} y1={lineY} y2={lineY} />
                <text className="chart-label" textAnchor="end" x={left - 9} y={lineY + 4}>{tick.toLocaleString()}</text>
              </g>
            )
          })}
          <path className="monitoring-chart-area" d={`${path} L ${x(values.length - 1)} ${height - bottom} L ${x(0)} ${height - bottom} Z`} />
          <path className="monitoring-chart-line" d={path} />
          {values.map((point, index) => (
            <g key={point.label}>
              <rect
                aria-label={`${point.label}: ${point.value.toLocaleString()} ${label.toLowerCase()}`}
                className="chart-hit-area"
                height={height - top - bottom}
                onFocus={() => setHovered(index)}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                role="button"
                tabIndex={0}
                width={Math.max(30, (width - left - right) / values.length)}
                x={x(index) - 15}
                y={top}
              />
              <circle className="monitoring-chart-point" cx={x(index)} cy={y(point.value)} r={hovered === index ? 5 : 3} />
              <text className="chart-label" textAnchor="middle" x={x(index)} y={height - 14}>{point.label}</text>
            </g>
          ))}
          {anomalies.map((anomaly, index) => {
            const pointIndex = Math.min(values.length - 1, 3 + index * 2)
            return (
              <g
                aria-label={`Open ${anomaly.id}: ${anomaly.title}`}
                className="anomaly-marker"
                key={anomaly.id}
                onClick={() => onAnomaly(anomaly)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    onAnomaly(anomaly)
                }}
                role="button"
                tabIndex={0}
              >
                <line x1={x(pointIndex)} x2={x(pointIndex)} y1={top} y2={height - bottom} />
                <circle cx={x(pointIndex)} cy={y(values[pointIndex].value)} r="8" />
                <text textAnchor="middle" x={x(pointIndex)} y={y(values[pointIndex].value) + 3}>!</text>
              </g>
            )
          })}
        </svg>
        {hovered !== null && (
          <div className={cx("chart-tooltip", hovered > values.length / 2 && "chart-tooltip--right")}>
            <strong>{values[hovered].label}</strong>
            <span><i className="legend-line legend-line--navy" />{values[hovered].value.toLocaleString()} {label.toLowerCase()}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function SourceHealthStrip({
  onNavigate,
  partial,
}: {
  onNavigate: (label: string) => void
  partial: boolean
}) {
  return (
    <section className="source-health-strip">
      <div className="source-health-strip__heading">
        <div><Radio /><span><strong>3 simulated operational sources</strong><small>Latest synthetic event · 11:58:42</small></span></div>
        <TertiaryButton onClick={() => onNavigate("Integrations")}>Integrations</TertiaryButton>
      </div>
      <div className="source-health-list">
        {monitoringSources.map((source) => {
          const displayedState =
            partial && source.name === "Reconciliation Event Feed"
              ? "Unavailable"
              : source.state
          return (
          <div key={source.name}>
            <span className={cx("source-state-dot", displayedState !== "Reporting normally" && "source-state-dot--warning")} />
            <span><strong>{source.name}</strong><small>{source.environment} · {source.latest}</small></span>
            <StatusBadge kind={displayedState === "Reporting normally" ? "success" : displayedState === "Unavailable" ? "error" : "warning"}>{displayedState}</StatusBadge>
          </div>
          )
        })}
      </div>
    </section>
  )
}

function ServiceHealthTable({
  source,
  selectedService,
  onSelect,
}: {
  source: string
  selectedService: string
  onSelect: (service: string) => void
}) {
  const [sort, setSort] = useState<"volume" | "timeouts" | "anomalies">("anomalies")
  const rows = serviceFixtures
    .filter((service) => source === "All sources" || service.source === source)
    .sort((a, b) => b[sort] - a[sort])
  return (
    <section className="monitoring-panel service-health-panel">
      <div className="monitoring-panel__header">
        <div><h2>Service & Route Health</h2><p>Observed service signals are distinct from source availability.</p></div>
        {selectedService !== "All services" && <TertiaryButton onClick={() => onSelect("All services")}>Clear service filter</TertiaryButton>}
      </div>
      <div className="table-wrap monitoring-service-table">
        <table>
          <thead><tr>
            <th>Service or route</th><th>Channel</th><th>Operational source</th>
            <th><button onClick={() => setSort("volume")} type="button">Event volume <ArrowUpDown /></button></th>
            <th><button onClick={() => setSort("timeouts")} type="button">Timeouts <ArrowUpDown /></button></th>
            <th>Latest event</th><th>Monitoring state</th>
            <th><button onClick={() => setSort("anomalies")} type="button">Anomalies <ArrowUpDown /></button></th>
            <th><span className="sr-only">Inspect</span></th>
          </tr></thead>
          <tbody>
            {rows.map((service) => (
              <tr className={selectedService === service.name ? "selected-row" : ""} key={service.name}>
                <td><strong>{service.name}</strong></td><td>{service.channel}</td><td>{service.source}</td>
                <td>{service.volume.toLocaleString()}</td><td>{service.timeouts}</td><td>{service.latest}</td>
                <td><StatusBadge kind={service.state === "Normal observations" ? "success" : service.state === "Elevated anomalies" ? "warning" : "neutral"}>{service.state}</StatusBadge></td>
                <td>{service.anomalies}</td>
                <td><IconButton icon={ChevronRight} label={`Filter by ${service.name}`} onClick={() => onSelect(service.name)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="service-mobile-list">
        {rows.map((service) => (
          <button className={selectedService === service.name ? "selected" : ""} key={service.name} onClick={() => onSelect(service.name)} type="button">
            <span><strong>{service.name}</strong><StatusBadge kind={service.state === "Normal observations" ? "success" : "warning"}>{service.state}</StatusBadge></span>
            <small>{service.channel} · {service.source}</small>
            <span><span>{service.volume.toLocaleString()} events</span><span>{service.timeouts} timeouts</span><span>{service.anomalies} anomalies</span></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function DetectionTrace({
  anomaly,
  onNavigate,
}: {
  anomaly: MonitoringAnomaly
  onNavigate: (label: string) => void
}) {
  const steps = [
    ["Operational event received", "09:41", true, anomaly.source],
    ["Monitoring rule evaluated", "09:42", true, "Synthetic rule engine"],
    ["Anomaly signal recorded", "09:42", true, anomaly.id],
    [
      "Investigation automatically initiated",
      "09:48",
      Boolean(anomaly.investigation),
      anomaly.investigation || "Pending",
    ],
    ["Supporting evidence linked", "10:02", true, "6 records"],
    [
      "Incident assessment updated",
      "10:16",
      Boolean(anomaly.incident),
      anomaly.incident || "Not established",
    ],
    ["Human review completed", "Pending", false, "Not yet completed"],
  ] as const
  return (
    <section className="detection-trace">
      <h3>Detection Trace</h3>
      <p>Pre-seeded synthetic workflow stages for this anomaly.</p>
      <ol>
        {steps.map(([title, time, complete, reference]) => (
          <li className={complete ? "complete" : ""} key={title}>
            <span>{complete ? <Check /> : <CircleDot />}</span>
            <div><strong>{title}</strong><small>{time} · {reference}</small></div>
            {(String(reference).startsWith("INV-") ||
              String(reference).startsWith("INC-")) && (
              <button
                aria-label={`Open ${reference}`}
                onClick={() => onNavigate(String(reference))}
                type="button"
              >
                <ChevronRight />
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

function AnomalyDrawer({
  anomaly,
  onClose,
  onNavigate,
}: {
  anomaly: MonitoringAnomaly
  onClose: () => void
  onNavigate: (label: string) => void
}) {
  const support = operationalEvents.filter(
    (event) => event.anomaly === anomaly.id,
  )
  return (
    <div aria-modal="true" className="drawer-layer" role="dialog">
      <button aria-label="Close anomaly details" className="drawer-scrim" onClick={onClose} type="button" />
      <aside className="evidence-drawer anomaly-drawer">
        <div className="drawer-header">
          <div><span className="technical-id">{anomaly.id}</span><h2>Anomaly Details</h2><p>{anomaly.title}</p></div>
          <IconButton icon={X} label="Close anomaly drawer" onClick={onClose} />
        </div>
        <div className="drawer-content">
          <InlineAlert kind="warning" title="Detected operational anomaly">
            This signal is under assessment. It does not establish a financial failure or a verified root cause.
          </InlineAlert>
          <section className="drawer-section">
            <div className="drawer-section__heading"><h3>Anomaly summary</h3><StatusBadge kind={anomaly.severity === "High" ? "error" : "warning"}>{anomaly.severity}</StatusBadge></div>
            <dl className="detail-list">
              <div><dt>Description</dt><dd>{anomaly.title}</dd></div>
              <div><dt>First detected</dt><dd>{anomaly.firstDetected}</dd></div>
              <div><dt>Latest observed</dt><dd>{anomaly.latestObserved}</dd></div>
              <div><dt>Current state</dt><dd>{anomaly.state}</dd></div>
              <div><dt>Affected service</dt><dd>{anomaly.service}</dd></div>
            </dl>
          </section>
          <section className="drawer-section">
            <h3>Detection explanation</h3>
            <p>A monitoring rule detected observations above the configured demonstration threshold during the selected interval.</p>
            <dl className="detail-list">
              <div><dt>Detection method</dt><dd>{anomaly.method}</dd></div>
              <div><dt>Rule identifier</dt><dd>RULE-DEMO-{anomaly.id.slice(-4)}</dd></div>
              <div><dt>Configured threshold</dt><dd>{anomaly.threshold}</dd></div>
              <div><dt>Observed condition</dt><dd>{anomaly.observed}</dd></div>
            </dl>
            <p className="limitation-note"><TriangleAlert />Detection limitation: the rule identifies an unusual pattern but cannot independently establish cause, customer impact or transaction outcome.</p>
          </section>
          <section className="drawer-section">
            <h3>Supporting observations</h3>
            <div className="drawer-observations">
              {support.map((event) => (
                <div key={event.id}><Database /><span><strong>{event.id}</strong><small>{event.type} · {event.timestamp}</small></span><span className="technical-id">{event.evidence}</span></div>
              ))}
            </div>
          </section>
          <section className="drawer-section relationship-grid">
            <div>
              <span>Related investigation</span>
              <strong>{anomaly.investigation || "Not yet established"}</strong>
              {anomaly.investigation && <SecondaryButton onClick={() => onNavigate(anomaly.investigation!)}>Open Investigation</SecondaryButton>}
            </div>
            <div>
              <span>Related incident</span>
              <strong>{anomaly.incident || "Not yet established"}</strong>
              {anomaly.incident && <SecondaryButton onClick={() => onNavigate(anomaly.incident!)}>View Incident</SecondaryButton>}
            </div>
          </section>
          <DetectionTrace anomaly={anomaly} onNavigate={onNavigate} />
        </div>
      </aside>
    </div>
  )
}

function EventDrawer({
  event,
  onClose,
  onNavigate,
}: {
  event: OperationalEvent
  onClose: () => void
  onNavigate: (label: string) => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div aria-modal="true" className="drawer-layer" role="dialog">
      <button aria-label="Close operational event" className="drawer-scrim" onClick={onClose} type="button" />
      <aside className="evidence-drawer">
        <div className="drawer-header">
          <div><span className="technical-id">{event.id}</span><h2>Operational Event</h2><p>{event.type}</p></div>
          <IconButton icon={X} label="Close event drawer" onClick={onClose} />
        </div>
        <div className="drawer-content">
          <InlineAlert kind="info" title="Authorized source observation">
            Source-reported states are shown as received and are not independently verified financial outcomes.
          </InlineAlert>
          <section className="drawer-section">
            <h3>Event identification</h3>
            <dl className="detail-list">
              <div><dt>Source system</dt><dd>{event.source} · Simulated source</dd></div>
              <div><dt>Event type</dt><dd>{event.type}</dd></div>
              <div><dt>Event timestamp</dt><dd>{event.timestamp}</dd></div>
              <div><dt>Received timestamp</dt><dd>{event.received}</dd></div>
              <div><dt>Source-reported status</dt><dd>{event.sourceState}</dd></div>
              <div><dt>Masked transaction</dt><dd>{event.transaction || "Not applicable"}</dd></div>
              <div><dt>Evidence reference</dt><dd>{event.evidence}</dd></div>
            </dl>
          </section>
          <section className="drawer-section">
            <div className="drawer-section__heading"><h3>Original normalized event fields</h3><span className="demo-label">Synthetic record</span></div>
            <pre className="record-preview">{`{
  "event_id": "${event.id}",
  "source": "${event.source}",
  "event_type": "${event.type}",
  "source_state": "${event.sourceState}",
  "service": "${event.service}",
  "transaction_reference": ${event.transaction ? `"${event.transaction}"` : "null"},
  "verified_financial_outcome": null
}`}</pre>
          </section>
          <section className="drawer-section">
            <h3>Related records</h3>
            <div className="related-pills">
              {event.anomaly && <button type="button">{event.anomaly}</button>}
              {event.investigation && <button onClick={() => onNavigate(event.investigation!)} type="button">{event.investigation}</button>}
              <button type="button">{event.evidence}</button>
            </div>
          </section>
        </div>
        <div className="drawer-footer">
          <SecondaryButton icon={Copy} onClick={() => { void navigator.clipboard?.writeText(event.id); setCopied(true) }}>{copied ? "Identifier copied" : "Copy identifier"}</SecondaryButton>
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        </div>
      </aside>
    </div>
  )
}

function DetectedAnomalies({
  anomalies,
  onSelect,
  onNavigate,
}: {
  anomalies: MonitoringAnomaly[]
  onSelect: (anomaly: MonitoringAnomaly) => void
  onNavigate: (label: string) => void
}) {
  return (
    <section className="monitoring-panel anomalies-panel">
      <div className="monitoring-panel__header"><div><h2>Detected Anomalies</h2><p>Unusual source observations under operational assessment.</p></div><span className="demo-label">{anomalies.length} synthetic signals</span></div>
      {anomalies.length === 0 ? (
        <div className="monitoring-empty"><CheckCircle2 /><h3>No anomaly signals detected</h3><p>No configured detection rule matched the selected period and filters.</p></div>
      ) : (
        <div className="anomaly-list">
          {anomalies.map((anomaly) => (
            <article className="anomaly-card" key={anomaly.id}>
              <div className="anomaly-card__top"><span className="technical-id">{anomaly.id}</span><StatusBadge kind={anomaly.severity === "High" ? "error" : "warning"}>{anomaly.severity}</StatusBadge></div>
              <h3>{anomaly.title}</h3>
              <p>{anomaly.service} · {anomaly.source}</p>
              <dl>
                <div><dt>First detected</dt><dd>{anomaly.firstDetected}</dd></div>
                <div><dt>Latest observed</dt><dd>{anomaly.latestObserved}</dd></div>
                <div><dt>Detection</dt><dd>{anomaly.method}</dd></div>
                <div><dt>Assessment</dt><dd>{anomaly.state}</dd></div>
              </dl>
              <div className="anomaly-card__relationships">
                {anomaly.incident && <button onClick={() => onNavigate(anomaly.incident!)} type="button">{anomaly.incident}</button>}
                {anomaly.investigation && <button onClick={() => onNavigate(anomaly.investigation!)} type="button">{anomaly.investigation}</button>}
              </div>
              <SecondaryButton onClick={() => onSelect(anomaly)}>View anomaly details</SecondaryButton>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function OperationalEventExplorer({
  events,
  range,
  source,
  onSource,
  onSelect,
}: {
  events: OperationalEvent[]
  range: DateRange
  source: string
  onSource: (source: string) => void
  onSelect: (event: OperationalEvent) => void
}) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("All event types")
  const [descending, setDescending] = useState(true)
  const [page, setPage] = useState(1)
  const threshold = range === "24h" ? 24 : range === "7d" ? 168 : 720
  const filtered = events
    .filter(
      (event) =>
        event.ageHours <= threshold &&
        (source === "All sources" || event.source === source) &&
        (type === "All event types" || event.type === type) &&
        `${event.id} ${event.service} ${event.sourceState}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      descending ? a.ageHours - b.ageHours : b.ageHours - a.ageHours,
    )
  const pageSize = 6
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, type, source, range])

  return (
    <section className="monitoring-panel events-panel">
      <div className="monitoring-panel__header"><div><h2>Operational Events</h2><p>Authorized source observations with masked identifiers.</p></div><TertiaryButton onClick={() => { setQuery(""); setType("All event types"); onSource("All sources") }}>Clear filters</TertiaryButton></div>
      <div className="event-filters">
        <label className="investigation-search"><Search /><span className="sr-only">Search operational events</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search event ID, service or state" value={query} /></label>
        <label className="investigation-filter"><span>Event type</span><select onChange={(event) => setType(event.target.value)} value={type}><option>All event types</option><option>Transaction status update</option><option>Transfer timeout observation</option><option>Webhook delivery event</option><option>Reconciliation ingestion event</option><option>Service-health observation</option></select><ChevronDown /></label>
        <label className="investigation-filter"><span>Source</span><select onChange={(event) => onSource(event.target.value)} value={source}><option>All sources</option>{monitoringSources.map((item) => <option key={item.name}>{item.name}</option>)}</select><ChevronDown /></label>
      </div>
      {filtered.length === 0 ? (
        <div className="monitoring-empty"><Inbox /><h3>No operational events received</h3><p>No source observations match the selected range and filters.</p></div>
      ) : (
        <>
          <div className="table-wrap operational-events-table">
            <table>
              <thead><tr><th>Event ID</th><th><button onClick={() => setDescending(!descending)} type="button">Timestamp <ArrowUpDown /></button></th><th>Source</th><th>Event type</th><th>Service / route</th><th>Source-reported state</th><th>Anomaly</th><th>Investigation</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{rows.map((event) => <tr key={event.id}><td><button className="table-link technical-id" onClick={() => onSelect(event)} type="button">{event.id}</button></td><td>{event.timestamp}</td><td>{event.source}</td><td>{event.type}</td><td>{event.service}</td><td>{event.sourceState}</td><td>{event.anomaly || "—"}</td><td>{event.investigation || "—"}</td><td><IconButton icon={ChevronRight} label={`Inspect ${event.id}`} onClick={() => onSelect(event)} /></td></tr>)}</tbody>
            </table>
          </div>
          <div className="event-mobile-list">
            {rows.map((event) => (
              <button key={event.id} onClick={() => onSelect(event)} type="button">
                <span><span className="technical-id">{event.id}</span><small>{event.timestamp}</small></span>
                <strong>{event.type}</strong><p>{event.service} · {event.source}</p>
                <span><StatusBadge kind={event.anomaly ? "warning" : "neutral"}>{event.anomaly ? "Anomaly linked" : "Source event"}</StatusBadge><ChevronRight /></span>
              </button>
            ))}
          </div>
          <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><SecondaryButton disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</SecondaryButton><span>Page {page} of {pages}</span><SecondaryButton disabled={page === pages} onClick={() => setPage(page + 1)}>Next</SecondaryButton></div></div>
        </>
      )}
    </section>
  )
}

type MonitoringPreviewState =
  | "demo"
  | "loading"
  | "healthy-empty"
  | "no-events"
  | "no-sources"
  | "stale"
  | "partial"
  | "error"
  | "restricted"

function OperationalMonitoring({
  institution,
  onSelectInstitution,
  onNavigate,
}: {
  institution: string
  onSelectInstitution: (institution: string) => void
  onNavigate: (label: string) => void
}) {
  const [range, setRange] = useState<DateRange>("24h")
  const [source, setSource] = useState("All sources")
  const [service, setService] = useState("All services")
  const [metric, setMetric] =
    useState<"events" | "timeouts" | "anomalies">("events")
  const [previewState, setPreviewState] =
    useState<MonitoringPreviewState>("demo")
  const [selectedAnomaly, setSelectedAnomaly] =
    useState<MonitoringAnomaly | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<OperationalEvent | null>(
    null,
  )
  const [refreshing, setRefreshing] = useState(false)
  const [refreshed, setRefreshed] = useState(false)

  if (!institution) {
    return (
      <div className="monitoring-page">
        <PageHeader description="Observe payment operations, detect emerging anomalies, and explore source activity." title="Operational Monitoring" />
        <section className="institution-empty">
          <span className="institution-empty__icon"><Gauge /></span><span className="demo-label">No institution selected</span>
          <h2>Select an institution to view monitoring</h2>
          <p>Operational events and anomaly signals are scoped to the currently selected institution.</p>
          <div><PrimaryButton onClick={() => onSelectInstitution("Cedar Bank — Demo Workspace")}>Enter Cedar Bank Demo</PrimaryButton><span>Demo · Synthetic data</span></div>
        </section>
      </div>
    )
  }

  const sourceServices = serviceFixtures.filter(
    (item) => source === "All sources" || item.source === source,
  )
  const filteredServices = sourceServices.filter(
    (item) => service === "All services" || item.name === service,
  )
  const filteredAnomalies = monitoringAnomalies.filter(
    (anomaly) =>
      (source === "All sources" || anomaly.source === source) &&
      (service === "All services" || anomaly.service === service),
  )
  const period = monitoringSummary[range]
  const scale = period.events / monitoringSummary["24h"].events
  const metricValues =
    source === "All sources" && service === "All services"
      ? period
      : {
          events: Math.round(
            filteredServices.reduce((sum, item) => sum + item.volume, 0) * scale,
          ),
          timeouts: Math.round(
            filteredServices.reduce((sum, item) => sum + item.timeouts, 0) *
              scale,
          ),
          routes: filteredServices.filter((item) => item.anomalies > 0).length,
          anomalies: filteredAnomalies.length,
        }
  const refresh = () => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setRefreshed(true)
    }, 650)
  }
  const terminal =
    previewState === "no-events" ||
    previewState === "no-sources" ||
    previewState === "error" ||
    previewState === "restricted"

  return (
    <div className="monitoring-page">
      <PageHeader
        actions={
          <>
            <label className="date-range-control"><CalendarDays /><span className="sr-only">Monitoring date range</span><select value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><ChevronDown /></label>
            <label className="date-range-control source-select-control"><Database /><span className="sr-only">Operational source filter</span><select value={source} onChange={(event) => { setSource(event.target.value); setService("All services") }}><option>All sources</option>{monitoringSources.map((item) => <option key={item.name}>{item.name}</option>)}</select><ChevronDown /></label>
            <SecondaryButton icon={RefreshCw} loading={refreshing} onClick={refresh}>Refresh</SecondaryButton>
          </>
        }
        description="Observe payment operations, detect emerging anomalies, and explore source activity."
        eyebrow="Demo · Synthetic data"
        title="Operational Monitoring"
      />
      <div className="monitoring-state-bar">
        <span>Monitoring state preview</span>
        <select value={previewState} onChange={(event) => setPreviewState(event.target.value as MonitoringPreviewState)}>
          <option value="demo">Synthetic demonstration</option><option value="loading">Loading</option><option value="healthy-empty">Healthy empty</option><option value="no-events">No operational events</option><option value="no-sources">No source configured</option><option value="stale">Stale data</option><option value="partial">Partial source coverage</option><option value="error">Monitoring failure</option><option value="restricted">Permission restricted</option>
        </select><ChevronDown />
      </div>
      {!["no-sources", "restricted", "error", "no-events"].includes(
        previewState,
      ) && (
        <SourceHealthStrip
          onNavigate={onNavigate}
          partial={previewState === "partial"}
        />
      )}
      {previewState === "partial" && <InlineAlert kind="warning" title="Partial source coverage">Reconciliation Event Feed is unavailable in this preview. Payment and service-health observations remain available.</InlineAlert>}
      {previewState === "stale" && <InlineAlert kind="warning" title="Monitoring data is stale">The latest reconciliation event was received at 10:42:18. Service condition cannot be inferred where source visibility is delayed.</InlineAlert>}
      {previewState === "loading" ? (
        <DashboardLoading />
      ) : terminal ? (
        <section className="dashboard-state">
          <span>{previewState === "restricted" ? <ShieldCheck /> : previewState === "error" ? <AlertCircle /> : previewState === "no-sources" ? <SlidersHorizontal /> : <Inbox />}</span>
          <h2>{previewState === "restricted" ? "Monitoring access is restricted" : previewState === "error" ? "Monitoring data could not be loaded" : previewState === "no-sources" ? "No operational source is configured" : "No operational events received"}</h2>
          <p>{previewState === "no-sources" ? "Configure an authorized integration before monitoring source activity." : previewState === "restricted" ? "Your current role does not permit access to this institution's monitoring data." : "Review source availability and retry without assuming service health from missing observations."}</p>
          <PrimaryButton onClick={() => previewState === "no-sources" ? onNavigate("Integrations") : setPreviewState("demo")}>{previewState === "no-sources" ? "Set up integrations" : "Retry demo monitoring"}</PrimaryButton>
        </section>
      ) : (
        <>
          <div className="monitoring-metrics">
            <MetricCard context={`${range === "24h" ? "Last 24 hours" : range === "7d" ? "Last 7 days" : "Last 30 days"} · permitted sources`} icon={CreditCard} label="Observed Payment Events" value={metricValues.events.toLocaleString()} />
            <MetricCard context={`Observations from ${metricValues.events.toLocaleString()} received events`} icon={Clock3} label="Observed Timeout Signals" value={metricValues.timeouts.toLocaleString()} />
            <MetricCard context="Distinct routes with detected anomaly signals" icon={GitBranch} label="Affected Payment Routes" value={String(previewState === "healthy-empty" ? 0 : metricValues.routes)} />
            <MetricCard context="Under assessment or linked to unresolved incidents" icon={AlertCircle} label="Open Anomaly Signals" value={String(previewState === "healthy-empty" ? 0 : metricValues.anomalies)} />
          </div>
          <MonitoringChart anomalies={previewState === "healthy-empty" ? [] : filteredAnomalies} metric={metric} onAnomaly={setSelectedAnomaly} onMetric={setMetric} range={range} service={service} source={source} />
          <ServiceHealthTable onSelect={setService} selectedService={service} source={source} />
          <DetectedAnomalies anomalies={previewState === "healthy-empty" ? [] : filteredAnomalies} onNavigate={onNavigate} onSelect={setSelectedAnomaly} />
          <OperationalEventExplorer events={operationalEvents.filter((event) => service === "All services" || event.service === service)} onSelect={setSelectedEvent} onSource={setSource} range={range} source={source} />
        </>
      )}
      {selectedAnomaly && <AnomalyDrawer anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} onNavigate={onNavigate} />}
      {selectedEvent && <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} onNavigate={onNavigate} />}
      {refreshed && <ToastNotification message="Deterministic synthetic monitoring fixtures were reloaded locally. No live banking source was queried." onClose={() => setRefreshed(false)} title="Demo monitoring refreshed" />}
    </div>
  )
}

function IncidentSeverityBadge({
  severity,
}: {
  severity: IncidentSeverity
}) {
  return (
    <StatusBadge
      kind={
        severity === "Critical" || severity === "High"
          ? "error"
          : severity === "Medium"
            ? "warning"
            : "neutral"
      }
    >
      {severity}
    </StatusBadge>
  )
}

function IncidentLifecycleBadge({
  lifecycle,
}: {
  lifecycle: IncidentLifecycle
}) {
  return (
    <StatusBadge
      kind={
        lifecycle === "Active"
          ? "info"
          : lifecycle === "Emerging"
            ? "warning"
            : lifecycle === "Resolved"
              ? "success"
              : "neutral"
      }
    >
      {lifecycle}
    </StatusBadge>
  )
}

function CreateIncidentDialog({
  nextId,
  onClose,
  onCreate,
}: {
  nextId: string
  onClose: () => void
  onCreate: (incident: IncidentRecord) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [service, setService] = useState("")
  const [severity, setSeverity] = useState<IncidentSeverity>("Medium")
  const [anomaly, setAnomaly] = useState("")
  const [owner, setOwner] = useState("Unassigned")
  const [evidence, setEvidence] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const invalid = submitted && (!title.trim() || !description.trim() || !service)

  const create = () => {
    setSubmitted(true)
    if (!title.trim() || !description.trim() || !service) return
    onCreate({
      id: nextId,
      title: title.trim(),
      severity,
      lifecycle: "Emerging",
      service,
      firstDetected: "18 Mar 2026, 12:00",
      updated: "18 Mar 2026, 12:00",
      ageHours: 0,
      owner,
      anomaly: anomaly || undefined,
      investigations: [],
      summary: description.trim(),
      trigger: anomaly
        ? `Authorized manual triage linked ${anomaly} for assessment.`
        : "Authorized manual incident report created in the synthetic workspace.",
      understanding:
        "Initial assessment is underway. No root cause or financial outcome has been established.",
      observedImpact:
        "Operational significance has not yet been established from available evidence.",
      limitations: evidence
        ? `Initial evidence reference: ${evidence}. Additional source coverage may be required.`
        : "No initial supporting evidence reference was supplied.",
      signalCount: anomaly ? 1 : 0,
      sourceEventCount: 0,
    })
    onClose()
  }

  return (
    <div aria-modal="true" className="dialog-layer" role="dialog">
      <button aria-label="Close incident creation" className="dialog-scrim" onClick={onClose} type="button" />
      <div className="dialog incident-create-dialog">
        <div className="modal-heading">
          <div><span className="demo-label">Local demonstration</span><h2>Create Incident</h2><p>Creates an Emerging synthetic incident only. No banking system is changed.</p></div>
          <IconButton icon={X} label="Close incident creation" onClick={onClose} />
        </div>
        {invalid && <InlineAlert kind="error" title="Required information is missing">Provide a title, description and affected service before creating this demo incident.</InlineAlert>}
        <div className="incident-create-form">
          <label className="field"><span className="field__label">Incident title</span><input autoFocus className="input" onChange={(event) => setTitle(event.target.value)} placeholder="Describe the operational issue" value={title} /></label>
          <label className="field"><span className="field__label">Description</span><textarea className="input textarea" onChange={(event) => setDescription(event.target.value)} placeholder="Record source-supported observations without asserting an unverified cause…" value={description} /></label>
          <div className="form-grid">
            <label className="field"><span className="field__label">Affected service</span><span className="select-wrap"><select className="input" onChange={(event) => setService(event.target.value)} value={service}><option value="">Select service</option>{serviceFixtures.map((item) => <option key={item.name}>{item.name}</option>)}</select><ChevronDown /></span></label>
            <label className="field"><span className="field__label">Severity</span><span className="select-wrap"><select className="input" onChange={(event) => setSeverity(event.target.value as IncidentSeverity)} value={severity}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><ChevronDown /></span></label>
            <label className="field"><span className="field__label">Related anomaly <small>Optional</small></span><span className="select-wrap"><select className="input" onChange={(event) => setAnomaly(event.target.value)} value={anomaly}><option value="">No anomaly selected</option>{monitoringAnomalies.map((item) => <option key={item.id}>{item.id}</option>)}</select><ChevronDown /></span></label>
            <label className="field"><span className="field__label">Assigned owner <small>Optional</small></span><span className="select-wrap"><select className="input" onChange={(event) => setOwner(event.target.value)} value={owner}><option>Unassigned</option><option>Alex Morgan</option><option>Tomi Adeyemi</option><option>Priya Shah</option><option>David Okafor</option><option>Maya Chen</option></select><ChevronDown /></span></label>
          </div>
          <label className="field"><span className="field__label">Initial evidence reference <small>Optional</small></span><input className="input" onChange={(event) => setEvidence(event.target.value)} placeholder="EVD-2026-0000" value={evidence} /></label>
        </div>
        <div className="dialog__actions"><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton onClick={create}>Create demo incident</PrimaryButton></div>
      </div>
    </div>
  )
}

function IncidentsTable({
  incidents,
  onOpen,
}: {
  incidents: IncidentRecord[]
  onOpen: (id: string) => void
}) {
  return (
    <>
      <div className="table-wrap incident-registry-table">
        <table>
          <thead><tr><th>Incident</th><th>Severity</th><th>Lifecycle</th><th>Affected service</th><th>First detected</th><th>Owner</th><th>Investigations</th><th>Last updated</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td><button className="investigation-subject" onClick={() => onOpen(incident.id)} type="button"><strong>{incident.title}</strong><span>{incident.id}</span></button></td>
                <td><IncidentSeverityBadge severity={incident.severity} /></td>
                <td><IncidentLifecycleBadge lifecycle={incident.lifecycle} /></td>
                <td>{incident.service}</td><td>{incident.firstDetected}</td><td>{incident.owner}</td>
                <td>{incident.investigations.length ? incident.investigations.join(", ") : "Not yet linked"}</td>
                <td>{incident.updated}</td><td><IconButton icon={ChevronRight} label={`Open ${incident.id}`} onClick={() => onOpen(incident.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="incident-mobile-list">
        {incidents.map((incident) => (
          <button className="incident-mobile-card" key={incident.id} onClick={() => onOpen(incident.id)} type="button">
            <span><span className="technical-id">{incident.id}</span><IncidentSeverityBadge severity={incident.severity} /></span>
            <strong>{incident.title}</strong><small>{incident.service}</small>
            <span><IncidentLifecycleBadge lifecycle={incident.lifecycle} /><small>{incident.owner}</small><ChevronRight /></span>
          </button>
        ))}
      </div>
    </>
  )
}

function IncidentsList({
  institution,
  incidents,
  onSelectInstitution,
  onOpen,
  onCreate,
}: {
  institution: string
  incidents: IncidentRecord[]
  onSelectInstitution: (institution: string) => void
  onOpen: (id: string) => void
  onCreate: (incident: IncidentRecord) => void
}) {
  const [range, setRange] = useState<DateRange>("30d")
  const [query, setQuery] = useState("")
  const [lifecycle, setLifecycle] = useState("All lifecycle states")
  const [severity, setSeverity] = useState("All severities")
  const [service, setService] = useState("All services")
  const [owner, setOwner] = useState("All owners")
  const [sort, setSort] = useState("Newest first")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [previewState, setPreviewState] = useState<
    "demo" | "empty" | "stale" | "restricted"
  >("demo")
  const threshold = range === "24h" ? 24 : range === "7d" ? 168 : 720
  const availableIncidents = previewState === "empty" ? [] : incidents
  const inRange = availableIncidents.filter(
    (incident) => incident.ageHours <= threshold,
  )
  const counts = {
    active: inRange.filter((incident) => incident.lifecycle === "Active").length,
    emerging: inRange.filter((incident) => incident.lifecycle === "Emerging").length,
    awaiting: inRange.filter(
      (incident) =>
        incident.investigations.length === 0 ||
        incident.owner === "Unassigned",
    ).length,
    resolved: inRange.filter((incident) => incident.lifecycle === "Resolved").length,
  }
  const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const filtered = inRange
    .filter((incident) => {
      const haystack = `${incident.id} ${incident.title} ${incident.service}`.toLowerCase()
      return (
        haystack.includes(query.toLowerCase()) &&
        (lifecycle === "All lifecycle states" || incident.lifecycle === lifecycle) &&
        (severity === "All severities" || incident.severity === severity) &&
        (service === "All services" || incident.service === service) &&
        (owner === "All owners" || incident.owner === owner)
      )
    })
    .sort((a, b) => {
      if (sort === "Highest severity") return severityRank[a.severity] - severityRank[b.severity]
      if (sort === "Oldest first") return b.ageHours - a.ageHours
      return a.ageHours - b.ageHours
    })
  const pageSize = 5
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, lifecycle, severity, service, owner, range])

  if (!institution) {
    return (
      <div className="incidents-page">
        <PageHeader description="Track emerging operational issues, affected services, and investigation progress." title="Incidents" />
        <section className="institution-empty"><span className="institution-empty__icon"><AlertCircle /></span><span className="demo-label">No institution selected</span><h2>Select an institution to access incidents</h2><p>Incident records and response actions are scoped to an authorized institutional workspace.</p><div><PrimaryButton onClick={() => onSelectInstitution("Cedar Bank — Demo Workspace")}>Enter Cedar Bank Demo</PrimaryButton><span>Demo · Synthetic data</span></div></section>
      </div>
    )
  }

  if (previewState === "restricted") {
    return (
      <div className="incidents-page">
        <PageHeader
          description="Track emerging operational issues, affected services, and investigation progress."
          eyebrow="Demo · Synthetic data"
          title="Incidents"
        />
        <section className="dashboard-state">
          <span><ShieldCheck /></span><h2>Incident access is restricted</h2>
          <p>Your current role does not permit access to this institution's incident records or response actions.</p>
          <PrimaryButton onClick={() => setPreviewState("demo")}>Return to demo access</PrimaryButton>
        </section>
      </div>
    )
  }

  const clear = () => {
    setQuery("")
    setLifecycle("All lifecycle states")
    setSeverity("All severities")
    setService("All services")
    setOwner("All owners")
  }
  return (
    <div className="incidents-page">
      <PageHeader
        actions={<><label className="date-range-control"><CalendarDays /><span className="sr-only">Incident detection date range</span><select value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><ChevronDown /></label><SecondaryButton icon={RefreshCw} loading={loading} onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 600) }}>Refresh</SecondaryButton><PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>Create Incident</PrimaryButton></>}
        description="Track emerging operational issues, affected services, and investigation progress."
        eyebrow="Demo · Synthetic data"
        title="Incidents"
      />
      <label className="incident-state-preview"><span>Preview state</span><select value={previewState} onChange={(event) => setPreviewState(event.target.value as typeof previewState)}><option value="demo">Synthetic demonstration</option><option value="empty">Healthy empty</option><option value="stale">Stale operational data</option><option value="restricted">Permission denied</option></select><ChevronDown /></label>
      {previewState === "stale" && <InlineAlert kind="warning" title="Operational data may be stale">The latest simulated source update is 2 hours old. A lack of new observations does not prove that an incident is resolved.</InlineAlert>}
      <div className="incident-metrics">
        <MetricCard context="Operational response and assessment ongoing" icon={AlertCircle} label="Active Incidents" value={String(counts.active)} />
        <MetricCard context="Potential issues currently being assessed" icon={CircleDot} label="Emerging Incidents" value={String(counts.emerging)} />
        <MetricCard context="No linked investigation or assigned owner" icon={FileSearch} label="Awaiting Investigation" value={String(counts.awaiting)} />
        <MetricCard context={`Resolved in selected ${range} period`} icon={CheckCircle2} label="Resolved Incidents" value={String(counts.resolved)} />
      </div>
      <section className="incident-list-panel">
        <div className="incident-list-heading"><div><h2>Incident Registry</h2><p>{filtered.length} institution-scoped synthetic records.</p></div><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest first</option><option>Oldest first</option><option>Highest severity</option><option>Recently updated</option></select><ChevronDown /></label></div>
        <div className="incident-filters">
          <label className="investigation-search"><Search /><span className="sr-only">Search incidents</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, title, service or route" value={query} /></label>
          {[
            ["Lifecycle", lifecycle, setLifecycle, ["All lifecycle states", "Emerging", "Active", "Contained", "Resolved"]],
            ["Severity", severity, setSeverity, ["All severities", "Critical", "High", "Medium", "Low"]],
            ["Service", service, setService, ["All services", ...Array.from(new Set(incidents.map((item) => item.service)))]],
            ["Owner", owner, setOwner, ["All owners", ...Array.from(new Set(incidents.map((item) => item.owner)))]],
          ].map(([label, value, setter, options]) => (
            <label className="investigation-filter" key={String(label)}><span>{String(label)}</span><select onChange={(event) => (setter as (value: string) => void)(event.target.value)} value={String(value)}>{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select><ChevronDown /></label>
          ))}
          <TertiaryButton onClick={clear}>Clear filters</TertiaryButton>
        </div>
        {loading ? <div className="investigation-list-loading"><LoadingSkeleton /></div> : availableIncidents.length === 0 ? <div className="monitoring-empty"><CheckCircle2 /><h3>No incidents in this period</h3><p>No Emerging, Active, Contained or Resolved incidents are available for the selected reporting period.</p></div> : filtered.length === 0 ? <div className="filtered-empty"><Search /><h3>No incidents match these filters</h3><p>Clear or adjust the active filters to view other records.</p><SecondaryButton onClick={clear}>Clear filters</SecondaryButton></div> : <IncidentsTable incidents={rows} onOpen={onOpen} />}
        {!loading && filtered.length > 0 && <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><SecondaryButton disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</SecondaryButton><span>Page {page} of {pages}</span><SecondaryButton disabled={page === pages} onClick={() => setPage(page + 1)}>Next</SecondaryButton></div></div>}
      </section>
      {createOpen && <CreateIncidentDialog nextId={`INC-DEMO-${String(Math.max(1, incidents.length - 5)).padStart(4, "0")}`} onClose={() => setCreateOpen(false)} onCreate={onCreate} />}
    </div>
  )
}

function IncidentLifecycleDialog({
  incident,
  onClose,
  onUpdate,
}: {
  incident: IncidentRecord
  onClose: () => void
  onUpdate: (incident: IncidentRecord, note: string) => void
}) {
  const transitions: Record<IncidentLifecycle, IncidentLifecycle[]> = {
    Emerging: ["Active"],
    Active: ["Contained"],
    Contained: ["Active", "Resolved"],
    Resolved: ["Active"],
  }
  const [next, setNext] = useState<IncidentLifecycle>(
    transitions[incident.lifecycle][0],
  )
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const resolvedNeedsEvidence =
    next === "Resolved" && !evidence.trim() && reason.trim().length < 30
  const invalid = !reason.trim() || resolvedNeedsEvidence

  const confirm = () => {
    setSubmitted(true)
    if (invalid) return
    onUpdate(
      {
        ...incident,
        lifecycle: next,
        updated: "18 Mar 2026, 12:00",
        ageHours: 0,
      },
      `${incident.lifecycle} → ${next}: ${reason.trim()}${evidence ? ` · Evidence ${evidence}` : " · Evidence unavailable explanation recorded"}`,
    )
    onClose()
  }

  return (
    <div aria-modal="true" className="dialog-layer" role="dialog">
      <button aria-label="Cancel lifecycle update" className="dialog-scrim" onClick={onClose} type="button" />
      <div className="dialog lifecycle-dialog">
        <div className="modal-heading"><div><span className="demo-label">Simulated lifecycle change</span><h2>Update Incident Status</h2><p>Lifecycle reflects operational handling, not transaction or financial outcomes.</p></div><IconButton icon={X} label="Close lifecycle dialog" onClick={onClose} /></div>
        {submitted && invalid && <InlineAlert kind="error" title="More transition support is required">{resolvedNeedsEvidence ? "A Resolved transition requires an evidence reference or a detailed explanation of why evidence is unavailable." : "Provide a reason for this lifecycle change."}</InlineAlert>}
        <div className="lifecycle-transition"><div><span>Current</span><IncidentLifecycleBadge lifecycle={incident.lifecycle} /></div><ChevronRight /><div><span>Proposed</span><label className="select-wrap"><select className="input" onChange={(event) => setNext(event.target.value as IncidentLifecycle)} value={next}>{transitions[incident.lifecycle].map((state) => <option key={state}>{state}</option>)}</select><ChevronDown /></label></div></div>
        <div className="modal-form">
          <label className="field"><span className="field__label">Reason for change</span><textarea className="input textarea" onChange={(event) => setReason(event.target.value)} placeholder="Document the source-supported operational rationale…" value={reason} /></label>
          <label className="field"><span className="field__label">Supporting evidence reference <small>{next === "Resolved" ? "Required unless unavailable is explained" : "Optional"}</small></span><input className="input" onChange={(event) => setEvidence(event.target.value)} placeholder="EVD-2026-0000" value={evidence} /></label>
        </div>
        {next === "Resolved" && <InlineAlert kind="warning" title="Resolution has limited operational meaning">Resolving this incident will not reverse payments, refund customers, verify transaction outcomes, change financial records or close related customer cases.</InlineAlert>}
        <div className="dialog__actions"><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton onClick={confirm}>Confirm demo transition</PrimaryButton></div>
      </div>
    </div>
  )
}

function IncidentTimeline({
  incident,
  activity,
  onNavigate,
}: {
  incident: IncidentRecord
  activity: string[]
  onNavigate: (label: string) => void
}) {
  const events = [
    ["09:41", "Monitoring source reports increased timeout observations", "Payment Event Feed", "Source observation", "EVD-2026-0411"],
    ["09:42", "Rule-based monitoring detects an anomaly", "Veriq monitoring", "Automated system event", incident.anomaly || "Detection pending"],
    ["09:42", `${incident.anomaly || "Anomaly signal"} recorded`, "Veriq detection service", "Automated system event", incident.anomaly || "—"],
    ["09:44", `${incident.id} created following authorized triage`, "Incident workflow", "System event", incident.id],
    ["09:48", `${incident.investigations[0] || "Investigation"} linked`, "Alex Morgan", "Human action", incident.investigations[0] || "Pending"],
    ["10:02", "Supporting operational evidence attached", "Evidence collection", "System event", "EVD-2026-0413"],
    ...(incident.investigations[1] ? [["10:08", `Related customer-case investigation ${incident.investigations[1]} associated`, "Maya Chen", "Human action", incident.investigations[1]]] : []),
    ["11:32", `Incident remains ${incident.lifecycle} while assessment continues`, incident.owner, "Current state", incident.lifecycle],
    ...activity.map((description) => ["12:00", "Demo activity recorded", "Current user", "Human action", description]),
  ]
  return (
    <section className="incident-panel">
      <div className="incident-panel__header"><div><h2>Incident Timeline</h2><p>Completed source, system and human actions only.</p></div></div>
      <ol className="timeline incident-timeline">
        {events.map(([time, title, actor, category, reference], index) => (
          <li key={`${title}-${index}`}>
            <span className="timeline__connector" />
            <span className="timeline__icon">{category.includes("Human") ? <UserCheck /> : category.includes("Source") ? <Database /> : <Activity />}</span>
            <time>{time}<small>18 Mar 2026</small></time>
            <div><span className="timeline__category">{category}</span><h3>{title}</h3><p>Actor or source: {actor}</p>{reference && <button onClick={() => String(reference).startsWith("INV-") || String(reference).startsWith("INC-") ? onNavigate(String(reference)) : undefined} type="button"><Link2 />{reference}</button>}</div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ResponseChecklist() {
  const initial = [
    ["Assess originating anomaly", "Completed"],
    ["Confirm affected services", "Completed"],
    ["Assign incident owner", "Completed"],
    ["Link relevant evidence", "In Progress"],
    ["Check related investigations", "In Progress"],
    ["Determine whether escalation is required", "Not Started"],
    ["Record operational conclusion", "Not Started"],
    ["Review resolution evidence", "Blocked"],
  ]
  const [items, setItems] = useState(initial)
  const advance = (index: number) => {
    const current = items[index][1]
    if (current === "Blocked" || current === "Completed") return
    setItems((values) =>
      values.map((item, itemIndex) =>
        itemIndex === index
          ? [item[0], current === "Not Started" ? "In Progress" : "Completed"]
          : item,
      ),
    )
  }
  return (
    <section className="response-checklist">
      <div><h3>Operational Response Checklist</h3><span>{items.filter((item) => item[1] === "Completed").length}/{items.length} completed</span></div>
      <ul>
        {items.map(([label, state], index) => (
          <li key={label}>
            <button aria-label={`${label}: ${state}`} disabled={state === "Blocked" || state === "Completed"} onClick={() => advance(index)} type="button">{state === "Completed" ? <Check /> : state === "Blocked" ? <X /> : <CircleDot />}</button>
            <span><strong>{label}</strong><small>{state}</small></span>
          </li>
        ))}
      </ul>
      <p>Checklist updates are stored locally for this demonstration only.</p>
    </section>
  )
}

function IncidentSummaryPanel({ incident }: { incident: IncidentRecord }) {
  return (
    <section className="incident-panel incident-summary-panel">
      <div className="incident-panel__header"><div><h2>Incident Summary</h2><p>Current source-supported operational assessment.</p></div><IncidentLifecycleBadge lifecycle={incident.lifecycle} /></div>
      <div className="incident-summary-grid">
        <div className="wide"><span>Description</span><p>{incident.summary}</p></div>
        <div><span>Initial detection trigger</span><p>{incident.trigger}</p></div>
        <div><span>Affected service</span><p>{incident.service}</p></div>
        <div className="wide"><span>Current understanding</span><p>{incident.understanding}</p><small><TriangleAlert />No suspected root cause is presented as established.</small></div>
        <div><span>Observed impact</span><p>{incident.observedImpact}</p></div>
        <div><span>Current response owner</span><p>{incident.owner}</p></div>
        <div className="wide limitation"><span>Known limitations</span><p>{incident.limitations}</p></div>
      </div>
    </section>
  )
}

function OperationalImpact({ incident }: { incident: IncidentRecord }) {
  return (
    <section className="incident-panel">
      <div className="incident-panel__header"><div><h2>Operational Impact</h2><p>Observed signals are not confirmed failed transactions.</p></div><StatusBadge kind="warning">Impact under assessment</StatusBadge></div>
      <div className="impact-grid">
        <div><Activity /><span><small>Affected route</small><strong>{incident.service}</strong></span></div>
        <div><Clock3 /><span><small>First detected</small><strong>{incident.firstDetected}</strong></span></div>
        <div><AlertCircle /><span><small>Related signals</small><strong>{incident.signalCount} observations</strong></span></div>
        <div><Database /><span><small>Source events</small><strong>{incident.sourceEventCount} related records</strong></span></div>
        <div><GitBranch /><span><small>Known dependency</small><strong>Authorized payment routing dependency</strong></span></div>
        <div><ShieldCheck /><span><small>Data coverage</small><strong>Downstream confirmation incomplete</strong></span></div>
      </div>
      <InlineAlert kind="info" title="Customer impact is not established">
        Customer impact has not been established from the available source evidence. No monetary loss, refund, failed-transaction total or affected-customer count is inferred.
      </InlineAlert>
    </section>
  )
}

function RelatedInvestigations({
  incident,
  investigations,
  onNavigate,
  onInitiate,
}: {
  incident: IncidentRecord
  investigations: InvestigationRecord[]
  onNavigate: (label: string) => void
  onInitiate: () => void
}) {
  const related = investigations.filter((item) =>
    incident.investigations.includes(item.id),
  )
  return (
    <section className="incident-panel">
      <div className="incident-panel__header"><div><h2>Related Investigations</h2><p>Each investigation retains a distinct purpose and workflow.</p></div></div>
      {related.length === 0 ? (
        <div className="monitoring-empty"><FileSearch /><h3>No investigation is linked</h3><p>Initiating a demo investigation creates a separate synthetic workflow record.</p><PrimaryButton icon={Plus} onClick={onInitiate}>Initiate demo investigation</PrimaryButton></div>
      ) : (
        <div className="related-investigation-list">
          {related.map((item) => (
            <div key={item.id}><span className="technical-id">{item.id}</span><div><strong>{item.subject}</strong><small>{item.type} · {item.investigator} · Updated {item.updated}</small></div><InvestigationStatusBadge status={item.status} /><SecondaryButton onClick={() => onNavigate(item.id)}>Open Investigation</SecondaryButton></div>
          ))}
        </div>
      )}
    </section>
  )
}

function RelatedCustomerCases({
  incident,
  investigations,
  onNavigate,
}: {
  incident: IncidentRecord
  investigations: InvestigationRecord[]
  onNavigate: (label: string) => void
}) {
  const cases = investigations.filter(
    (item) =>
      item.type === "Customer Case" &&
      incident.investigations.includes(item.id),
  )
  if (!cases.length) return null
  return (
    <section className="incident-panel related-cases-panel">
      <div className="incident-panel__header"><div><h2>Related Customer Cases</h2><p>Customer-case workflow remains separate from payment outcome.</p></div></div>
      {cases.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)} type="button"><span><strong>{item.caseReference || "CASE-••••"}</strong><small>Transfer-status complaint · Received 17 Mar 2026</small></span><span><InvestigationStatusBadge status={item.status} /><small>Transaction outcome unknown — awaiting authorized confirmation.</small></span><ChevronRight /></button>
      ))}
    </section>
  )
}

function IncidentContextPanel({
  incident,
  onAssign,
  onLifecycle,
  onNavigate,
}: {
  incident: IncidentRecord
  onAssign: () => void
  onLifecycle: () => void
  onNavigate: (label: string) => void
}) {
  return (
    <aside className="incident-context-panel">
      <section className="incident-panel">
        <div className="incident-panel__header"><div><h2>Incident Context</h2><p>Current response state</p></div></div>
        <dl className="context-list">
          <div><dt>Lifecycle</dt><dd><IncidentLifecycleBadge lifecycle={incident.lifecycle} /></dd></div>
          <div><dt>Severity</dt><dd><IncidentSeverityBadge severity={incident.severity} /></dd></div>
          <div><dt>Owner</dt><dd>{incident.owner}</dd></div>
          <div><dt>Affected service</dt><dd>{incident.service}</dd></div>
          <div><dt>Investigations</dt><dd>{incident.investigations.length}</dd></div>
          <div><dt>Review required</dt><dd>Yes · operational conclusion</dd></div>
        </dl>
        <div className="context-actions"><SecondaryButton icon={UserPlus} onClick={onAssign}>Assign Owner</SecondaryButton><PrimaryButton onClick={onLifecycle}>Update Lifecycle</PrimaryButton>{incident.investigations[0] && <TertiaryButton onClick={() => onNavigate(incident.investigations[0])}>Open investigation summary</TertiaryButton>}</div>
      </section>
      <ResponseChecklist />
    </aside>
  )
}

function IncidentDetail({
  incident,
  investigations,
  onBack,
  onUpdate,
  onNavigate,
  onInitiateInvestigation,
}: {
  incident?: IncidentRecord
  investigations: InvestigationRecord[]
  onBack: () => void
  onUpdate: (incident: IncidentRecord) => void
  onNavigate: (label: string) => void
  onInitiateInvestigation: (incident: IncidentRecord) => void
}) {
  const [tab, setTab] = useState("Overview")
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [lifecycleOpen, setLifecycleOpen] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<MonitoringAnomaly | null>(null)
  const [activity, setActivity] = useState<string[]>(incident?.activity || [])
  const [note, setNote] = useState("")
  const [noteSaved, setNoteSaved] = useState(false)

  if (!incident) {
    return <div className="incidents-page"><section className="dashboard-state"><span><AlertCircle /></span><h2>Incident not found</h2><p>The requested incident is unavailable for this institution or current permission context.</p><PrimaryButton onClick={onBack}>Back to Incidents</PrimaryButton></section></div>
  }
  const anomaly = monitoringAnomalies.find((item) => item.id === incident.anomaly)
  const tabs = ["Overview", "Timeline", "Evidence", "Related Investigations", "Activity"]
  const updateLifecycle = (updated: IncidentRecord, description: string) => {
    onUpdate({
      ...updated,
      activity: [...(incident.activity || []), description],
    })
    setActivity((items) => [...items, description])
  }
  return (
    <div className="incident-detail-page">
      <button className="back-link" onClick={onBack} type="button"><ChevronRight />Back to Incidents</button>
      <section className="incident-detail-header">
        <div><div className="investigation-id-row"><span className="technical-id">{incident.id}</span><span className="demo-label">Demo · Synthetic data</span></div><h1>{incident.title}</h1><div className="investigation-header-badges"><IncidentSeverityBadge severity={incident.severity} /><IncidentLifecycleBadge lifecycle={incident.lifecycle} /></div><dl className="investigation-header-meta"><div><dt>First detected</dt><dd>{incident.firstDetected}</dd></div><div><dt>Last updated</dt><dd>{incident.updated}</dd></div><div><dt>Owner</dt><dd>{incident.owner}</dd></div><div><dt>Affected service</dt><dd>{incident.service}</dd></div></dl></div>
        <div className="incident-header-actions">
          <div className="assignment-control"><SecondaryButton icon={UserPlus} onClick={() => setOwnerOpen(!ownerOpen)}>Assign Owner</SecondaryButton>{ownerOpen && <div className="assignment-menu"><strong>Assign incident owner</strong>{["Alex Morgan", "Tomi Adeyemi", "Priya Shah", "David Okafor", "Maya Chen"].map((owner) => <button key={owner} onClick={() => { const description = `Owner assigned to ${owner}`; onUpdate({ ...incident, owner, updated: "18 Mar 2026, 12:00", activity: [...(incident.activity || []), description] }); setActivity((items) => [...items, description]); setOwnerOpen(false) }} type="button"><span className="profile-avatar">{owner.split(" ").map((part) => part[0]).join("")}</span>{owner}{incident.owner === owner && <Check />}</button>)}<small>Local demo assignment only</small></div>}</div>
          <SecondaryButton onClick={() => setLifecycleOpen(true)}>Update Lifecycle</SecondaryButton>
          <PrimaryButton disabled={!incident.investigations[0]} onClick={() => incident.investigations[0] && onNavigate(incident.investigations[0])}>Open Related Investigation</PrimaryButton>
          <IconButton icon={MoreHorizontal} label="More incident actions" />
        </div>
      </section>
      <div className="investigation-tabs" role="tablist">{tabs.map((item) => <button aria-selected={tab === item} className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}</button>)}</div>

      {tab === "Overview" && <><IncidentSummaryPanel incident={incident} /><div className="incident-workspace"><div className="incident-main"><OperationalImpact incident={incident} />{anomaly && <section className="incident-panel detection-signals"><div className="incident-panel__header"><div><h2>Detection Signals</h2><p>Anomalies that contributed to incident assessment.</p></div></div><button onClick={() => setSelectedAnomaly(anomaly)} type="button"><span><span className="technical-id">{anomaly.id}</span><IncidentSeverityBadge severity={anomaly.severity} /></span><strong>{anomaly.title}</strong><small>{anomaly.source} · {anomaly.method} · {anomaly.firstDetected}</small><span>{anomaly.observed}<ChevronRight /></span></button></section>}<RelatedInvestigations incident={incident} investigations={investigations} onInitiate={() => onInitiateInvestigation(incident)} onNavigate={onNavigate} /><RelatedCustomerCases incident={incident} investigations={investigations} onNavigate={onNavigate} /></div><IncidentContextPanel incident={incident} onAssign={() => setOwnerOpen(true)} onLifecycle={() => setLifecycleOpen(true)} onNavigate={onNavigate} /></div></>}
      {tab === "Timeline" && <div className="incident-workspace"><IncidentTimeline activity={activity} incident={incident} onNavigate={onNavigate} /><IncidentContextPanel incident={incident} onAssign={() => setOwnerOpen(true)} onLifecycle={() => setLifecycleOpen(true)} onNavigate={onNavigate} /></div>}
      {tab === "Evidence" && <div className="incident-workspace"><EvidenceExplorer investigationId={incident.investigations[0] || "INV-DEMO-0001"} /><IncidentContextPanel incident={incident} onAssign={() => setOwnerOpen(true)} onLifecycle={() => setLifecycleOpen(true)} onNavigate={onNavigate} /></div>}
      {tab === "Related Investigations" && <div className="incident-main"><RelatedInvestigations incident={incident} investigations={investigations} onInitiate={() => onInitiateInvestigation(incident)} onNavigate={onNavigate} /><RelatedCustomerCases incident={incident} investigations={investigations} onNavigate={onNavigate} /></div>}
      {tab === "Activity" && <div className="incident-workspace"><div className="incident-main"><IncidentTimeline activity={activity} incident={incident} onNavigate={onNavigate} /><section className="incident-panel notes-panel"><div className="incident-panel__header"><div><h2>Operational Notes</h2><p>Session-only demonstration audit note.</p></div></div><label><span className="field__label">Operational note</span><textarea className="input textarea" onChange={(event) => setNote(event.target.value)} placeholder="Record an evidence-backed response note…" value={note} /></label><div><span>{noteSaved ? "Note added to local activity" : "Not yet saved"}</span><SecondaryButton icon={Save} onClick={() => { if (note.trim()) { const description = `Operational note: ${note.trim()}`; setActivity((items) => [...items, description]); onUpdate({ ...incident, activity: [...(incident.activity || []), description], updated: "18 Mar 2026, 12:00" }); setNoteSaved(true) } }}>Add note</SecondaryButton></div></section></div><IncidentContextPanel incident={incident} onAssign={() => setOwnerOpen(true)} onLifecycle={() => setLifecycleOpen(true)} onNavigate={onNavigate} /></div>}

      {selectedAnomaly && <AnomalyDrawer anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} onNavigate={onNavigate} />}
      {lifecycleOpen && <IncidentLifecycleDialog incident={incident} onClose={() => setLifecycleOpen(false)} onUpdate={updateLifecycle} />}
    </div>
  )
}

type ReviewActor = {
  name: string
  role: string
  canApprove: boolean
}

const reviewActors: ReviewActor[] = [
  { name: "Nneka Williams", role: "Authorized Reviewer", canApprove: true },
  { name: "Alex Morgan", role: "Investigator Preview", canApprove: false },
  { name: "Jordan Lee", role: "Read-only Auditor", canApprove: false },
]

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <StatusBadge
      kind={
        status === "Approved"
          ? "success"
          : status === "Changes Requested"
            ? "warning"
            : status === "Rejected"
              ? "error"
              : status === "Claimed / In Review"
                ? "info"
                : "neutral"
      }
    >
      {status}
    </StatusBadge>
  )
}

function RolePreview({
  actor,
  onChange,
}: {
  actor: ReviewActor
  onChange: (actor: ReviewActor) => void
}) {
  return (
    <label className="review-role-preview">
      <ShieldCheck />
      <span><small>Role preview · Client-side only</small><strong>{actor.name} · {actor.role}</strong></span>
      <select
        aria-label="Review role preview"
        onChange={(event) =>
          onChange(
            reviewActors.find((item) => item.name === event.target.value) ||
              actor,
          )
        }
        value={actor.name}
      >
        {reviewActors.map((item) => (
          <option key={item.name}>{item.name}</option>
        ))}
      </select>
      <ChevronDown />
    </label>
  )
}

function ReviewQueueTable({
  reviews,
  onOpen,
}: {
  reviews: ReviewRecord[]
  onOpen: (id: string) => void
}) {
  return (
    <>
      <div className="table-wrap review-queue-table">
        <table>
          <thead><tr><th>Review</th><th>Review type</th><th>Related entity</th><th>Priority</th><th>Submitted by</th><th>Assigned reviewer</th><th>Submitted at</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td><button className="investigation-subject" onClick={() => onOpen(review.id)} type="button"><strong>{review.subject}</strong><span>{review.id}</span></button></td>
                <td>{review.type}</td><td><span className="technical-id">{review.relatedEntity}</span></td>
                <td><StatusBadge kind={review.priority === "High" ? "error" : "neutral"}>{review.priority}</StatusBadge></td>
                <td>{review.submittedBy}</td><td>{review.assignedReviewer}</td><td>{review.submittedAt}</td>
                <td><ReviewStatusBadge status={review.status} /></td>
                <td><IconButton icon={ChevronRight} label={`Open ${review.id}`} onClick={() => onOpen(review.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="review-mobile-list">
        {reviews.map((review) => (
          <button className="review-mobile-card" key={review.id} onClick={() => onOpen(review.id)} type="button">
            <span><span className="technical-id">{review.id}</span><StatusBadge kind={review.priority === "High" ? "error" : "neutral"}>{review.priority}</StatusBadge></span>
            <strong>{review.subject}</strong><small>{review.type} · {review.relatedEntity}</small>
            <span><ReviewStatusBadge status={review.status} /><small>{review.assignedReviewer}</small><ChevronRight /></span>
          </button>
        ))}
      </div>
    </>
  )
}

function ReviewQueue({
  institution,
  reviews,
  actor,
  onActorChange,
  onSelectInstitution,
  onOpen,
}: {
  institution: string
  reviews: ReviewRecord[]
  actor: ReviewActor
  onActorChange: (actor: ReviewActor) => void
  onSelectInstitution: (institution: string) => void
  onOpen: (id: string) => void
}) {
  const [range, setRange] = useState<DateRange>("30d")
  const [tab, setTab] = useState("All Reviews")
  const [query, setQuery] = useState("")
  const [type, setType] = useState("All review types")
  const [priority, setPriority] = useState("All priorities")
  const [status, setStatus] = useState("All statuses")
  const [reviewer, setReviewer] = useState("All reviewers")
  const [sort, setSort] = useState("Newest first")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const threshold = range === "24h" ? 24 : range === "7d" ? 168 : 720
  const inRange = reviews.filter((review) => review.ageHours <= threshold)
  const pending = reviews.filter(
    (review) =>
      review.status === "Pending" || review.status === "Claimed / In Review",
  )
  const metrics = {
    awaiting: pending.length,
    mine: pending.filter((review) => review.assignedReviewer === actor.name)
      .length,
    changes: reviews.filter((review) => review.status === "Changes Requested")
      .length,
    completed: reviews.filter(
      (review) => review.status === "Approved" || review.status === "Rejected",
    ).length,
  }
  const visible = inRange
    .filter((review) => {
      const tabMatch =
        tab === "All Reviews" ||
        (tab === "Assigned to Me" &&
          review.assignedReviewer === actor.name &&
          !["Approved", "Rejected", "Changes Requested"].includes(
            review.status,
          )) ||
        (tab === "Unassigned" && review.assignedReviewer === "Unassigned") ||
        (tab === "Completed" &&
          ["Approved", "Rejected"].includes(review.status))
      return (
        tabMatch &&
        `${review.id} ${review.investigationId || ""} ${review.subject} ${review.relatedIncident || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (type === "All review types" || review.type === type) &&
        (priority === "All priorities" || review.priority === priority) &&
        (status === "All statuses" || review.status === status) &&
        (reviewer === "All reviewers" || review.assignedReviewer === reviewer)
      )
    })
    .sort((a, b) => {
      if (sort === "Oldest first") return b.ageHours - a.ageHours
      if (sort === "Highest priority") {
        const rank = { High: 0, Medium: 1, Low: 2 }
        return rank[a.priority] - rank[b.priority]
      }
      if (sort === "Status") return a.status.localeCompare(b.status)
      return a.ageHours - b.ageHours
    })
  const pageSize = 5
  const pages = Math.max(1, Math.ceil(visible.length / pageSize))
  const rows = visible.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [tab, query, type, priority, status, reviewer, range])

  if (!institution) {
    return (
      <div className="reviews-page">
        <PageHeader description="Evaluate investigation findings and authorize evidence-backed conclusions." title="Review Queue" />
        <section className="institution-empty"><span className="institution-empty__icon"><ClipboardCheck /></span><span className="demo-label">No institution selected</span><h2>Select an institution to access reviews</h2><p>Review submissions, evidence and decisions are institution-scoped.</p><div><PrimaryButton onClick={() => onSelectInstitution("Cedar Bank — Demo Workspace")}>Enter Cedar Bank Demo</PrimaryButton><span>Demo · Synthetic data</span></div></section>
      </div>
    )
  }
  const clear = () => {
    setQuery("")
    setType("All review types")
    setPriority("All priorities")
    setStatus("All statuses")
    setReviewer("All reviewers")
  }
  return (
    <div className="reviews-page">
      <PageHeader
        actions={<><label className="date-range-control"><CalendarDays /><span className="sr-only">Review submission date range</span><select value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><ChevronDown /></label><SecondaryButton icon={RefreshCw} loading={loading} onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 600) }}>Refresh</SecondaryButton><SecondaryButton icon={UserCheck} onClick={() => setTab(tab === "Assigned to Me" ? "All Reviews" : "Assigned to Me")}>{tab === "Assigned to Me" ? "Show All Reviews" : "My Assigned Reviews"}</SecondaryButton></>}
        description="Evaluate investigation findings and authorize evidence-backed conclusions."
        eyebrow="Demo · Synthetic data"
        title="Review Queue"
      />
      <RolePreview actor={actor} onChange={onActorChange} />
      <div className="review-metrics">
        <MetricCard context="Pending or actively claimed decisions" icon={ClipboardCheck} label="Awaiting Review" value={String(metrics.awaiting)} />
        <MetricCard context={`Assigned to ${actor.name}`} icon={UserCheck} label="Assigned to Me" value={String(metrics.mine)} />
        <MetricCard context="Returned for evidence-backed revision" icon={RefreshCw} label="Changes Requested" value={String(metrics.changes)} />
        <MetricCard context="Approved or rejected decisions" icon={CheckCircle2} label="Completed Reviews" value={String(metrics.completed)} />
      </div>
      <section className="review-queue-panel">
        <div className="review-queue-tabs" role="tablist">{["All Reviews", "Assigned to Me", "Unassigned", "Completed"].map((item) => <button aria-selected={tab === item} className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}</button>)}<label className="sort-control review-sort"><span>Sort</span><select onChange={(event) => setSort(event.target.value)} value={sort}><option>Newest first</option><option>Oldest first</option><option>Highest priority</option><option>Status</option></select><ChevronDown /></label></div>
        <div className="review-filters">
          <label className="investigation-search"><Search /><span className="sr-only">Search review queue</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search review, investigation, subject or incident" value={query} /></label>
          {[
            ["Type", type, setType, ["All review types", "Investigation Finding", "Operational Conclusion", "Knowledge Change"]],
            ["Priority", priority, setPriority, ["All priorities", "High", "Medium", "Low"]],
            ["Status", status, setStatus, ["All statuses", "Pending", "Claimed / In Review", "Changes Requested", "Approved", "Rejected"]],
            ["Reviewer", reviewer, setReviewer, ["All reviewers", "Nneka Williams", "Jordan Lee", "Unassigned"]],
          ].map(([label, value, setter, options]) => <label className="investigation-filter" key={String(label)}><span>{String(label)}</span><select onChange={(event) => (setter as (value: string) => void)(event.target.value)} value={String(value)}>{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select><ChevronDown /></label>)}
          <TertiaryButton onClick={clear}>Clear filters</TertiaryButton>
        </div>
        {loading ? <div className="investigation-list-loading"><LoadingSkeleton /></div> : visible.length === 0 ? <div className="monitoring-empty"><Inbox /><h3>{tab === "Assigned to Me" ? "No assigned reviews" : tab === "Unassigned" ? "No unassigned reviews" : "No reviews match this view"}</h3><p>The queue is healthy. Adjust filters or select another queue tab.</p>{query && <SecondaryButton onClick={clear}>Clear filters</SecondaryButton>}</div> : <ReviewQueueTable onOpen={onOpen} reviews={rows} />}
        {!loading && visible.length > 0 && <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)} of {visible.length}</span><div><SecondaryButton disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</SecondaryButton><span>Page {page} of {pages}</span><SecondaryButton disabled={page === pages} onClick={() => setPage(page + 1)}>Next</SecondaryButton></div></div>}
      </section>
    </div>
  )
}

type ChecklistState = "Not reviewed" | "Satisfied" | "Needs attention"

function EvidenceReviewChecklist({
  values,
  onChange,
}: {
  values: ChecklistState[]
  onChange: (values: ChecklistState[]) => void
}) {
  const labels = [
    "Investigation objective is clearly stated",
    "Relevant source evidence is available",
    "Evidence provenance is traceable",
    "Facts are distinguished from hypotheses",
    "Contradictory evidence is acknowledged",
    "Financial outcome limitations are documented",
    "Recommendations fit authorized institutional workflows",
  ]
  return (
    <section className="evidence-review-checklist">
      <div><h3>Evidence Review Checklist</h3><span>{values.filter((value) => value === "Satisfied").length}/{labels.length} satisfied</span></div>
      <p>Checklist completion guides review quality and does not automatically approve a finding.</p>
      <ul>
        {labels.map((label, index) => (
          <li key={label}>
            <span className={cx("checklist-state-icon", values[index] === "Satisfied" && "satisfied", values[index] === "Needs attention" && "attention")}>{values[index] === "Satisfied" ? <Check /> : values[index] === "Needs attention" ? <TriangleAlert /> : <CircleDot />}</span>
            <span><strong>{label}</strong><small>{values[index]}</small></span>
            <label><span className="sr-only">Set checklist state for {label}</span><select onChange={(event) => onChange(values.map((value, itemIndex) => itemIndex === index ? event.target.value as ChecklistState : value))} value={values[index]}><option>Not reviewed</option><option>Satisfied</option><option>Needs attention</option></select><ChevronDown /></label>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ReviewDecisionDialog({
  review,
  actor,
  decision,
  onClose,
  onConfirm,
}: {
  review: ReviewRecord
  actor: ReviewActor
  decision: "Approve Findings" | "Request Changes" | "Reject Findings"
  onClose: () => void
  onConfirm: (rationale: string, corrections: string) => void
}) {
  const [rationale, setRationale] = useState("")
  const [corrections, setCorrections] = useState("")
  const [evidence, setEvidence] = useState("")
  const [deadline, setDeadline] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const requiresRationale = decision !== "Approve Findings"
  const invalid =
    (requiresRationale && !rationale.trim()) ||
    (decision === "Request Changes" && !corrections.trim())
  const consequence =
    decision === "Approve Findings"
      ? "The finding will be marked Approved and linked to the investigation review history. The investigation will remain a separate workflow."
      : decision === "Request Changes"
        ? "The review will become Changes Requested and the investigation will reopen for revision."
        : "The finding will be marked Rejected and the investigation will reopen for supported revision."

  const continueToConfirm = () => {
    setSubmitted(true)
    if (!invalid) setConfirming(true)
  }

  return (
    <div aria-modal="true" className="dialog-layer" role="dialog">
      <button aria-label="Cancel review decision" className="dialog-scrim" onClick={onClose} type="button" />
      <div className="dialog review-decision-dialog">
        <div className="modal-heading"><div><span className="demo-label">Simulated accountable decision</span><h2>{decision}</h2><p>{review.id} · {review.subject}</p></div><IconButton icon={X} label="Close decision dialog" onClick={onClose} /></div>
        {!confirming ? (
          <>
            {submitted && invalid && <InlineAlert kind="error" title="Decision validation failed">{decision === "Request Changes" && !corrections.trim() ? "Describe the required corrections before continuing." : "A decision rationale is required for this action."}</InlineAlert>}
            <div className="modal-form">
              <label className="field"><span className="field__label">Decision rationale {requiresRationale ? <small>Required</small> : <small>Optional under demo policy</small>}</span><textarea className="input textarea" onChange={(event) => setRationale(event.target.value)} placeholder="Record the evidence-backed rationale for this decision…" value={rationale} /></label>
              {decision === "Request Changes" && <label className="field"><span className="field__label">Required corrections</span><textarea className="input textarea" onChange={(event) => setCorrections(event.target.value)} placeholder="Specify the revisions required before resubmission…" value={corrections} /></label>}
              <div className="form-grid">
                <label className="field"><span className="field__label">Evidence references <small>Optional</small></span><input className="input" onChange={(event) => setEvidence(event.target.value)} placeholder="EVD-2026-0411, EVD-2026-0413" value={evidence} /></label>
                <label className="field"><span className="field__label">Revision deadline <small>Optional</small></span><input className="input" onChange={(event) => setDeadline(event.target.value)} placeholder="e.g. 21 Mar 2026" value={deadline} /></label>
              </div>
            </div>
            <InlineAlert kind="info" title="No financial action will be performed">This review decision cannot refund, reverse, settle, update balances or verify transaction outcomes.</InlineAlert>
            <div className="dialog__actions"><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton onClick={continueToConfirm}>Review decision</PrimaryButton></div>
          </>
        ) : (
          <>
            <div className="decision-confirmation">
              <dl className="detail-list"><div><dt>Review</dt><dd>{review.id}</dd></div><div><dt>Decision</dt><dd>{decision}</dd></div><div><dt>Reviewer</dt><dd>{actor.name} · {actor.role}</dd></div><div><dt>Rationale</dt><dd>{rationale.trim() || "No additional rationale required under demo approval policy."}</dd></div>{corrections && <div><dt>Required corrections</dt><dd>{corrections}</dd></div>}{evidence && <div><dt>Evidence</dt><dd>{evidence}</dd></div>}{deadline && <div><dt>Deadline</dt><dd>{deadline}</dd></div>}</dl>
              <InlineAlert kind="warning" title="Workflow consequence">{consequence}</InlineAlert>
            </div>
            <div className="dialog__actions"><SecondaryButton onClick={() => setConfirming(false)}>Back</SecondaryButton><PrimaryButton onClick={() => onConfirm(rationale.trim(), corrections.trim())}>Confirm simulated decision</PrimaryButton></div>
          </>
        )}
      </div>
    </div>
  )
}

function ReviewHistory({ review }: { review: ReviewRecord }) {
  return (
    <section className="review-detail-panel">
      <div className="review-detail-panel__header"><div><h2>Review History</h2><p>Chronological submission, assignment and decision activity.</p></div></div>
      <ol className="timeline review-history">
        {review.history.map((event, index) => (
          <li key={`${event.timestamp}-${event.action}-${index}`}>
            <span className="timeline__connector" />
            <span className="timeline__icon">{event.action.toLowerCase().includes("approved") ? <Check /> : event.action.toLowerCase().includes("changes") ? <RefreshCw /> : <ClipboardCheck />}</span>
            <time>{event.timestamp.split(", ")[1] || event.timestamp}<small>{event.timestamp.split(", ")[0]}</small></time>
            <div><span className="timeline__category">Synthetic demonstration</span><h3>{event.action}</h3><p>{event.description}</p><span className="timeline__actor">Actor: {event.actor}</span>{event.reference && <button type="button"><Link2 />{event.reference}</button>}</div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SubmittedFindings({
  review,
  investigation,
  onNavigate,
}: {
  review: ReviewRecord
  investigation?: InvestigationRecord
  onNavigate: (label: string) => void
}) {
  return (
    <section className="review-detail-panel submitted-findings">
      <div className="review-detail-panel__header"><div><h2>Submitted Findings</h2><p>Proposed conclusions remain separate from source-supported observations.</p></div><StatusBadge kind="info">Evidence-backed submission</StatusBadge></div>
      <div className="finding-title"><div><span>Finding title</span><h3>{review.subject}</h3></div>{review.investigationId && <SecondaryButton onClick={() => onNavigate(review.investigationId!)}>Open {review.investigationId}</SecondaryButton>}</div>
      <dl className="finding-metadata"><div><dt>Submission author</dt><dd>{review.submittedBy}</dd></div><div><dt>Submitted</dt><dd>{review.submittedAt}</dd></div><div><dt>Investigation objective</dt><dd>{review.objective}</dd></div><div><dt>Investigation workflow</dt><dd>{investigation?.status || "Not available"}</dd></div></dl>
      <div className="finding-content">
        <section><span><Database />Source-supported proposed conclusion</span><p>{review.conclusion}</p></section>
        <section><span><Paperclip />Supporting evidence summary</span><p>{review.evidenceSummary}</p></section>
        <section className="finding-limitation"><span><TriangleAlert />Known uncertainties and limitations</span><p>{review.uncertainties}</p></section>
        <section><span><ListChecks />Recommended next steps</span><ul>{review.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
    </section>
  )
}

function ReviewDetail({
  review,
  investigation,
  actor,
  onActorChange,
  onBack,
  onNavigate,
  onClaim,
  onDecision,
}: {
  review?: ReviewRecord
  investigation?: InvestigationRecord
  actor: ReviewActor
  onActorChange: (actor: ReviewActor) => void
  onBack: () => void
  onNavigate: (label: string) => void
  onClaim: (review: ReviewRecord, actor: ReviewActor) => void
  onDecision: (
    review: ReviewRecord,
    decision: "Approve Findings" | "Request Changes" | "Reject Findings",
    rationale: string,
    corrections: string,
    actor: ReviewActor,
  ) => void
}) {
  const [checklist, setChecklist] = useState<ChecklistState[]>(
    Array(7).fill("Not reviewed") as ChecklistState[],
  )
  const [decision, setDecision] = useState<
    "Approve Findings" | "Request Changes" | "Reject Findings" | null
  >(null)
  const [success, setSuccess] = useState(false)

  if (!review) {
    return <div className="reviews-page"><section className="dashboard-state"><span><ClipboardCheck /></span><h2>Review not found</h2><p>The requested review is unavailable for this institution or permission context.</p><PrimaryButton onClick={onBack}>Back to Review Queue</PrimaryButton></section></div>
  }
  const completed = ["Approved", "Rejected", "Changes Requested"].includes(
    review.status,
  )
  const selfConflict = actor.name === review.submittedBy
  const canAct = actor.canApprove && !selfConflict
  const canClaim =
    canAct &&
    review.status === "Pending" &&
    (review.assignedReviewer === "Unassigned" ||
      review.assignedReviewer === actor.name)
  const claimedByActor =
    review.assignedReviewer === actor.name &&
    review.status === "Claimed / In Review"
  const checklistReady = checklist.every((item) => item === "Satisfied")

  const confirmDecision = (rationale: string, corrections: string) => {
    if (!decision) return
    onDecision(review, decision, rationale, corrections, actor)
    setDecision(null)
    setSuccess(true)
  }

  return (
    <div className="review-detail-page">
      <button className="back-link" onClick={onBack} type="button"><ChevronRight />Back to Review Queue</button>
      <section className="review-detail-header">
        <div><div className="investigation-id-row"><span className="technical-id">{review.id}</span><span className="demo-label">Demo · Synthetic data</span></div><h1>{review.subject}</h1><div className="investigation-header-badges"><StatusBadge kind="neutral">{review.type}</StatusBadge><StatusBadge kind={review.priority === "High" ? "error" : "neutral"}>{review.priority} priority</StatusBadge><ReviewStatusBadge status={review.status} /></div><dl className="investigation-header-meta"><div><dt>Submitted</dt><dd>{review.submittedAt}</dd></div><div><dt>Submitted by</dt><dd>{review.submittedBy}</dd></div><div><dt>Assigned reviewer</dt><dd>{review.assignedReviewer}</dd></div><div><dt>Related entity</dt><dd>{review.relatedEntity}</dd></div></dl></div>
        <div className="review-header-actions">
          <SecondaryButton disabled={!canClaim || completed} icon={UserCheck} onClick={() => onClaim(review, actor)}>Claim Review</SecondaryButton>
          <SecondaryButton disabled={!canAct || !claimedByActor || completed} onClick={() => setDecision("Request Changes")}>Request Changes</SecondaryButton>
          <SecondaryButton disabled={!canAct || !claimedByActor || completed} onClick={() => setDecision("Reject Findings")}>Reject Findings</SecondaryButton>
          <PrimaryButton disabled={!canAct || !claimedByActor || completed || !checklistReady} icon={CheckCircle2} onClick={() => setDecision("Approve Findings")}>Approve Findings</PrimaryButton>
        </div>
      </section>
      <RolePreview actor={actor} onChange={onActorChange} />
      {!actor.canApprove && <InlineAlert kind="warning" title="Permission preview: approval unavailable">This simulated role may inspect the review but cannot record approval decisions. A backend must enforce actual permissions.</InlineAlert>}
      {selfConflict && <InlineAlert kind="error" title="Reviewer conflict">Institutional separation-of-duties policy prevents {actor.name} from approving their own submission.</InlineAlert>}
      {completed && <InlineAlert kind={review.status === "Approved" ? "success" : "warning"} title={`Review already ${review.status.toLowerCase()}`}>The recorded demonstration decision remains available in Review History. Further decisions are disabled.</InlineAlert>}
      <div className="review-detail-workspace">
        <main className="review-detail-main">
          <SubmittedFindings investigation={investigation} onNavigate={onNavigate} review={review} />
          <EvidenceExplorer investigationId={review.investigationId || "INV-DEMO-0001"} />
          <section className="review-detail-panel ai-interpretation-review">
            <div className="review-detail-panel__header"><div><h2>AI-Assisted Interpretation</h2><p>AI-generated hypotheses remain separate from established findings.</p></div><StatusBadge kind="warning">Not independently verified</StatusBadge></div>
            <InlineAlert kind="warning" title="AI-generated hypothesis — not independently verified">A supported operational conclusion does not require accepting every AI hypothesis as fact.</InlineAlert>
            <div className="review-hypotheses">
              <AIHypothesisCard evidence={["EVD-2026-0411", "EVD-2026-0413"]} explanation="Observed delivery or timeout patterns may align with an intermittent upstream dependency condition." missing="Authorized downstream confirmation and unaffected-route comparison remain incomplete." title="Operational dependency degradation" validation="Compare affected and unaffected route windows and inspect source confirmation records." />
            </div>
          </section>
          <ReviewHistory review={review} />
        </main>
        <aside className="review-context-panel">
          <section className="review-detail-panel reviewer-assignment">
            <div className="review-detail-panel__header"><div><h2>Reviewer Responsibility</h2><p>Client-side role simulation</p></div></div>
            <dl className="context-list"><div><dt>Reviewer</dt><dd>{review.assignedReviewer}</dd></div><div><dt>Current actor</dt><dd>{actor.name}</dd></div><div><dt>Permission</dt><dd>{canAct ? "Decision capable in demo" : "Inspect only"}</dd></div><div><dt>Self-approval</dt><dd>{selfConflict ? "Blocked by policy" : "No conflict detected"}</dd></div></dl>
            {review.assignedReviewer === "Unassigned" && canAct && <div className="context-actions"><PrimaryButton onClick={() => onClaim(review, actor)}>Claim Review</PrimaryButton></div>}
          </section>
          <EvidenceReviewChecklist onChange={setChecklist} values={checklist} />
          <section className="review-detail-panel decision-panel">
            <div className="review-detail-panel__header"><div><h2>Decision Controls</h2><p>Accountable human action</p></div></div>
            {!checklistReady && <p className="decision-guidance"><Info />Complete the evidence checklist before approval. Changes or rejection remain available with rationale.</p>}
            <div><SecondaryButton disabled={!canAct || !claimedByActor || completed} onClick={() => setDecision("Request Changes")}>Request Changes</SecondaryButton><SecondaryButton disabled={!canAct || !claimedByActor || completed} onClick={() => setDecision("Reject Findings")}>Reject Findings</SecondaryButton><PrimaryButton disabled={!canAct || !claimedByActor || completed || !checklistReady} onClick={() => setDecision("Approve Findings")}>Approve Findings</PrimaryButton></div>
            <p>Decisions update synthetic workflow state only and perform no financial operation.</p>
          </section>
        </aside>
      </div>
      {decision && <ReviewDecisionDialog actor={actor} decision={decision} onClose={() => setDecision(null)} onConfirm={confirmDecision} review={review} />}
      {success && <ToastNotification message="The simulated review decision and related investigation workflow were updated locally. No institutional backend action occurred." onClose={() => setSuccess(false)} title="Demo review decision recorded" />}
    </div>
  )
}

function DetailPlaceholder({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  return (
    <div className="dashboard-page">
      <PageHeader
        description="This destination is reserved for a future Veriq product page."
        eyebrow="Demonstration route"
        title={title}
      />
      <section className="dashboard-state">
        <span><FileSearch /></span>
        <h2>{title}</h2>
        <p>The full workflow has not been generated yet. No live action or banking operation was performed.</p>
        <PrimaryButton onClick={onBack}>Return to Intelligence Overview</PrimaryButton>
      </section>
    </div>
  )
}

function ShellPreview() {
  return (
    <div className="shell-preview-content">
      <PageHeader
        actions={
          <>
            <SecondaryButton icon={SlidersHorizontal}>
              Configure view
            </SecondaryButton>
            <PrimaryButton icon={Plus}>New workspace item</PrimaryButton>
          </>
        }
        description="A neutral workspace template for future Veriq investigation and operational intelligence pages."
        eyebrow="Workspace shell preview"
        title="Intelligence overview"
      />
      <InlineAlert kind="info" title="Select an institution to begin">
        This preview does not automatically assign an institution. Choose a
        synthetic demonstration institution from the sidebar to explore tenant
        switching.
      </InlineAlert>
      <div className="metric-grid">
        <MetricCard
          context="No live data connected"
          icon={FileSearch}
          label="Items requiring review"
          value="—"
        />
        <MetricCard
          context="No institution selected"
          icon={Activity}
          label="Operational signals"
          value="—"
        />
        <MetricCard
          context="Preview state"
          icon={ShieldCheck}
          label="Governance checks"
          value="—"
        />
      </div>
      <div className="shell-grid">
        <StandardCard
          action={<TertiaryButton>View all</TertiaryButton>}
          description="Neutral placeholder content demonstrating a standard workspace surface."
          title="Workspace activity"
        >
          <DataTable />
        </StandardCard>
        <StandardCard
          title="Getting started"
          description="Complete these steps to prepare a workspace."
        >
          <div className="step-list">
            <div>
              <span>1</span>
              <div>
                <strong>Select an institution</strong>
                <p>
                  Choose a tenant context before accessing institution-specific
                  data.
                </p>
              </div>
            </div>
            <div>
              <span>2</span>
              <div>
                <strong>Review access</strong>
                <p>Confirm your assigned role and permitted workflows.</p>
              </div>
            </div>
            <div>
              <span>3</span>
              <div>
                <strong>Configure a view</strong>
                <p>Choose the information relevant to your current task.</p>
              </div>
            </div>
          </div>
        </StandardCard>
      </div>
    </div>
  )
}

export default function VeriqApp({
  initialInstitution = "",
}: {
  initialInstitution?: string
}) {
  const [view, setView] = useState<
    | "dashboard"
    | "monitoring"
    | "incidents"
    | "incident-detail"
    | "investigations"
    | "investigation-detail"
    | "reviews"
    | "review-detail"
    | "foundations"
    | "shell"
    | "placeholder"
  >("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [institution, setInstitution] = useState(initialInstitution)
  const [activePage, setActivePage] = useState("Intelligence Overview")
  const [investigationRecords, setInvestigationRecords] = useState<
    InvestigationRecord[]
  >(initialInvestigationRecords)
  const [selectedInvestigationId, setSelectedInvestigationId] = useState("")
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>(
    initialIncidentRecords,
  )
  const [selectedIncidentId, setSelectedIncidentId] = useState("")
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>(
    initialReviewRecords,
  )
  const [selectedReviewId, setSelectedReviewId] = useState("")
  const [reviewActor, setReviewActor] = useState<ReviewActor>(reviewActors[0])

  const institutionSlug = institution.startsWith("Cedar")
    ? "cedar-demo"
    : "northstar-demo"
  const setRoute = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, "", path)
  }

  const navigate = (label: string) => {
    setActivePage(label)
    if (label === "Intelligence Overview") {
      setView("dashboard")
      if (institution) setRoute(`/w/${institutionSlug}/overview`)
    } else if (label === "Operational Monitoring") {
      setView("monitoring")
      if (institution) setRoute(`/w/${institutionSlug}/monitoring`)
    } else if (label === "Incidents") {
      setView("incidents")
      if (institution) setRoute(`/w/${institutionSlug}/incidents`)
    } else if (label.startsWith("INC-")) {
      setSelectedIncidentId(label)
      setView("incident-detail")
      if (institution) setRoute(`/w/${institutionSlug}/incidents/${label}`)
    } else if (label === "Investigations") {
      setView("investigations")
      if (institution) setRoute(`/w/${institutionSlug}/investigations`)
    } else if (label.startsWith("INV-")) {
      setSelectedInvestigationId(label)
      setView("investigation-detail")
      if (institution)
        setRoute(`/w/${institutionSlug}/investigations/${label}`)
    } else if (label === "Review Queue") {
      setView("reviews")
      if (institution) setRoute(`/w/${institutionSlug}/reviews`)
    } else if (label.startsWith("REV-")) {
      setSelectedReviewId(label)
      setView("review-detail")
      if (institution) setRoute(`/w/${institutionSlug}/reviews/${label}`)
    } else {
      setView("placeholder")
    }
  }

  const updateInvestigation = (updated: InvestigationRecord) => {
    setInvestigationRecords((records) =>
      records.map((record) => (record.id === updated.id ? updated : record)),
    )
  }

  const updateIncident = (updated: IncidentRecord) => {
    setIncidentRecords((records) =>
      records.map((record) => (record.id === updated.id ? updated : record)),
    )
  }

  const initiateIncidentInvestigation = (incident: IncidentRecord) => {
    const id = `INV-DEMO-${String(Math.max(1, investigationRecords.length - 7)).padStart(4, "0")}`
    const investigation: InvestigationRecord = {
      id,
      subject: `${incident.title} Investigation`,
      type: "Operational Incident",
      related: incident.id,
      priority:
        incident.severity === "Critical" || incident.severity === "High"
          ? "High"
          : incident.severity === "Medium"
            ? "Medium"
            : "Low",
      status: "Initiated",
      investigator: incident.owner,
      created: "18 Mar 2026, 12:00",
      updated: "18 Mar 2026, 12:00",
      ageHours: 0,
      trigger: `Authorized incident workflow initiated from ${incident.id}.`,
      objective:
        "Collect source evidence and establish an evidence-backed operational understanding.",
      service: incident.service,
      understanding:
        "Investigation initiated. No root cause or financial outcome has been established.",
      evidenceCompleteness: "0 of 0 expected records defined",
    }
    setInvestigationRecords((records) => [investigation, ...records])
    updateIncident({
      ...incident,
      investigations: [...incident.investigations, id],
      updated: "18 Mar 2026, 12:00",
    })
  }

  const claimReview = (review: ReviewRecord, actor: ReviewActor) => {
    if (!actor.canApprove || actor.name === review.submittedBy) return
    setReviewRecords((records) =>
      records.map((item) =>
        item.id === review.id
          ? {
              ...item,
              assignedReviewer: actor.name,
              status: "Claimed / In Review",
              history: [
                ...item.history,
                {
                  timestamp: "18 Mar 2026, 12:00",
                  actor: actor.name,
                  action: "Review claimed",
                  description:
                    "The authorized reviewer claimed this synthetic review submission.",
                },
              ],
            }
          : item,
      ),
    )
  }

  const recordReviewDecision = (
    review: ReviewRecord,
    decision: "Approve Findings" | "Request Changes" | "Reject Findings",
    rationale: string,
    corrections: string,
    actor: ReviewActor,
  ) => {
    const status: ReviewStatus =
      decision === "Approve Findings"
        ? "Approved"
        : decision === "Request Changes"
          ? "Changes Requested"
          : "Rejected"
    const description =
      decision === "Request Changes"
        ? `${rationale} Required corrections: ${corrections}`
        : rationale ||
          "The source-supported finding and documented limitations were reviewed."
    setReviewRecords((records) =>
      records.map((item) =>
        item.id === review.id
          ? {
              ...item,
              status,
              assignedReviewer: actor.name,
              decisionRationale: description,
              decisionAt: "18 Mar 2026, 12:00",
              history: [
                ...item.history,
                {
                  timestamp: "18 Mar 2026, 12:00",
                  actor: actor.name,
                  action: decision,
                  description,
                  reference: item.investigationId,
                },
              ],
            }
          : item,
      ),
    )
    if (review.investigationId) {
      setInvestigationRecords((records) =>
        records.map((investigation) =>
          investigation.id === review.investigationId
            ? {
                ...investigation,
                status:
                  status === "Approved" ? "In Review" : "Reopened",
                reviewDecision: status,
                requestedChanges:
                  status === "Changes Requested" || status === "Rejected"
                    ? description
                    : undefined,
                updated: "18 Mar 2026, 12:00",
                ageHours: 0,
              }
            : investigation,
        ),
      )
    }
  }

  useEffect(() => {
    const restoreRoute = () => {
      if (/\/w\/[^/]+\/overview$/.test(window.location.pathname)) {
        setActivePage("Intelligence Overview")
        setView("dashboard")
        return
      }
      if (/\/w\/[^/]+\/monitoring$/.test(window.location.pathname)) {
        setActivePage("Operational Monitoring")
        setView("monitoring")
        return
      }
      const incidentMatch = window.location.pathname.match(
        /\/w\/[^/]+\/incidents(?:\/([^/]+))?$/,
      )
      if (incidentMatch) {
        if (incidentMatch[1]) {
          setSelectedIncidentId(incidentMatch[1])
          setActivePage(incidentMatch[1])
          setView("incident-detail")
        } else {
          setActivePage("Incidents")
          setView("incidents")
        }
        return
      }
      const match = window.location.pathname.match(
        /\/w\/[^/]+\/investigations(?:\/([^/]+))?$/,
      )
      if (match?.[1]) {
        setSelectedInvestigationId(match[1])
        setActivePage(match[1])
        setView("investigation-detail")
        return
      } else if (match) {
        setActivePage("Investigations")
        setView("investigations")
        return
      }
      const reviewMatch = window.location.pathname.match(
        /\/w\/[^/]+\/reviews(?:\/([^/]+))?$/,
      )
      if (reviewMatch?.[1]) {
        setSelectedReviewId(reviewMatch[1])
        setActivePage(reviewMatch[1])
        setView("review-detail")
      } else if (reviewMatch) {
        setActivePage("Review Queue")
        setView("reviews")
      }
    }
    restoreRoute()
    window.addEventListener("popstate", restoreRoute)
    return () => window.removeEventListener("popstate", restoreRoute)
  }, [])

  return (
    <div className={cx("app-shell", collapsed && "app-shell--collapsed")}>
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed(!collapsed)}
        onMobileClose={() => setMobileOpen(false)}
        onNavigate={navigate}
        onSelectInstitution={setInstitution}
        selectedInstitution={institution}
        active={
          view === "investigation-detail"
            ? "Investigations"
            : view === "incident-detail"
              ? "Incidents"
              : view === "review-detail"
                ? "Review Queue"
              : activePage
        }
      />
      <div className="app-main">
        <TopBar current={activePage} onMenu={() => setMobileOpen(true)} />
        <div className="view-switcher" aria-label="Preview view">
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => {
              setView("dashboard")
              setActivePage("Intelligence Overview")
            }}
            type="button"
          >
            Intelligence Overview
          </button>
          <button
            className={view === "monitoring" ? "active" : ""}
            onClick={() => navigate("Operational Monitoring")}
            type="button"
          >
            Operational Monitoring
          </button>
          <button
            className={
              view === "incidents" || view === "incident-detail" ? "active" : ""
            }
            onClick={() => navigate("Incidents")}
            type="button"
          >
            Incidents
          </button>
          <button
            className={
              view === "investigations" || view === "investigation-detail"
                ? "active"
                : ""
            }
            onClick={() => navigate("Investigations")}
            type="button"
          >
            Investigations
          </button>
          <button
            className={
              view === "reviews" || view === "review-detail" ? "active" : ""
            }
            onClick={() => navigate("Review Queue")}
            type="button"
          >
            Review Queue
          </button>
          <button
            className={view === "foundations" ? "active" : ""}
            onClick={() => {
              setView("foundations")
              setActivePage("UI Foundations")
            }}
            type="button"
          >
            UI Foundations
          </button>
          <button
            className={view === "shell" ? "active" : ""}
            onClick={() => {
              setView("shell")
              setActivePage("Application Shell")
            }}
            type="button"
          >
            Application Shell
          </button>
        </div>
        <main>
          <div className="content-container">
            {view === "dashboard" && (
              <IntelligenceOverview
                incidentRecords={incidentRecords}
                institution={institution}
                onNavigate={navigate}
                onSelectInstitution={setInstitution}
                reviewRecords={reviewRecords}
              />
            )}
            {view === "incidents" && (
              <IncidentsList
                incidents={incidentRecords}
                institution={institution}
                onCreate={(incident) =>
                  setIncidentRecords((records) => [incident, ...records])
                }
                onOpen={navigate}
                onSelectInstitution={setInstitution}
              />
            )}
            {view === "incident-detail" &&
              (institution ? (
                <IncidentDetail
                  incident={incidentRecords.find(
                    (incident) => incident.id === selectedIncidentId,
                  )}
                  investigations={investigationRecords}
                  onBack={() => navigate("Incidents")}
                  onInitiateInvestigation={initiateIncidentInvestigation}
                  onNavigate={navigate}
                  onUpdate={updateIncident}
                />
              ) : (
                <IncidentsList
                  incidents={[]}
                  institution=""
                  onCreate={(incident) =>
                    setIncidentRecords((records) => [incident, ...records])
                  }
                  onOpen={navigate}
                  onSelectInstitution={setInstitution}
                />
              ))}
            {view === "monitoring" && (
              <OperationalMonitoring
                institution={institution}
                onNavigate={navigate}
                onSelectInstitution={setInstitution}
              />
            )}
            {view === "investigations" && (
              <InvestigationsList
                institution={institution}
                onCreate={(record) =>
                  setInvestigationRecords((records) => [record, ...records])
                }
                onOpen={navigate}
                onSelectInstitution={setInstitution}
                records={investigationRecords}
              />
            )}
            {view === "investigation-detail" && (
              institution ? (
                <InvestigationDetail
                  onBack={() => navigate("Investigations")}
                  onNavigate={navigate}
                  onUpdate={updateInvestigation}
                  record={investigationRecords.find(
                    (record) => record.id === selectedInvestigationId,
                  )}
                />
              ) : (
                <InvestigationsList
                  institution=""
                  onCreate={(record) =>
                    setInvestigationRecords((records) => [record, ...records])
                  }
                  onOpen={navigate}
                  onSelectInstitution={setInstitution}
                  records={[]}
                />
              )
            )}
            {view === "reviews" && (
              <ReviewQueue
                actor={reviewActor}
                institution={institution}
                onActorChange={setReviewActor}
                onOpen={navigate}
                onSelectInstitution={setInstitution}
                reviews={reviewRecords}
              />
            )}
            {view === "review-detail" &&
              (institution ? (
                <ReviewDetail
                  actor={reviewActor}
                  investigation={investigationRecords.find(
                    (investigation) =>
                      investigation.id ===
                      reviewRecords.find(
                        (review) => review.id === selectedReviewId,
                      )?.investigationId,
                  )}
                  onActorChange={setReviewActor}
                  onBack={() => navigate("Review Queue")}
                  onClaim={claimReview}
                  onDecision={recordReviewDecision}
                  onNavigate={navigate}
                  review={reviewRecords.find(
                    (review) => review.id === selectedReviewId,
                  )}
                />
              ) : (
                <ReviewQueue
                  actor={reviewActor}
                  institution=""
                  onActorChange={setReviewActor}
                  onOpen={navigate}
                  onSelectInstitution={setInstitution}
                  reviews={[]}
                />
              ))}
            {view === "foundations" && <FoundationsView />}
            {view === "shell" && <ShellPreview />}
            {view === "placeholder" && (
              <DetailPlaceholder
                onBack={() => navigate("Intelligence Overview")}
                title={activePage}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
