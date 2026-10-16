import {
    ArrowRight,
    Check,
    CheckCircle2,
    Clipboard,
    Clock3,
    Copy,
    CircleHelp,
    FileSearch,
    Headphones,
    History,
    Phone,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
    Zap,
} from "lucide-react"
import {
    naira,
    type CaseRecord,
    type NotificationRecord,
    type Transaction,
} from "../../../data"
import {
    Button,
    Field,
    ScreenHeader,
    StatusPill,
} from "../../../ui"
import { issueTypes } from "../constants"
import {
    Empty,
    InfoRow,
    MenuItem,
    TimelineItem,
} from "../components/SharedComponents"
import type { Screen } from "../types"

export function SupportScreen({
    cases,
    transactions,
    onNavigate,
    reportRecent,
}: {
    cases: CaseRecord[]
    transactions: Transaction[]
    onNavigate: (s: Screen) => void
    reportRecent: () => void
}) {
    return (
        <div className="screen with-nav">
            <ScreenHeader title="Support" />
            <div className="content">
                <div className="support-hero">
                    <span>
                        <Headphones size={26} />
                    </span>
                    <h1>How can we help?</h1>
                    <p>Find answers or get support with your Cedar account.</p>
                </div>
                <div className="support-grid">
                    <button onClick={reportRecent}>
                        <FileSearch />
                        <span>
                            <strong>Report transaction issue</strong>
                            <small>Select from your authorized history</small>
                        </span>
                        <ArrowRight />
                    </button>
                    <button onClick={() => onNavigate("complaints")}>
                        <Clipboard />
                        <span>
                            <strong>My complaints</strong>
                            <small>
                                {cases.length
                                    ? `${cases.length} active case`
                                    : "Track existing cases"}
                            </small>
                        </span>
                        <ArrowRight />
                    </button>
                </div>
                <h3 className="subheading">Help & information</h3>
                <div className="menu-list">
                    <MenuItem
                        icon={<Zap />}
                        title="Help with transfers"
                        action={() => alert("Transfer help opened")}
                    />
                    <MenuItem
                        icon={<CircleHelp />}
                        title="Frequently asked questions"
                        action={() => alert("Frequently asked questions opened")}
                    />
                    <MenuItem
                        icon={<Phone />}
                        title="Contact Cedar support"
                        action={() => alert("Demo support channel opened")}
                    />
                </div>
                <div className="powered">
                    <ShieldCheck size={17} />
                    <span>
                        Transaction investigations securely powered by{" "}
                        <strong>Veriq</strong>
                    </span>
                </div>
                {!transactions.length && (
                    <Empty
                        icon={<History />}
                        title="No transactions yet"
                        copy="Transactions available for reporting will appear here."
                    />
                )}
            </div>
        </div>
    )
}

export function ReportScreen({
    transaction,
    existingCase,
    issue,
    setIssue,
    description,
    setDescription,
    error,
    onBack,
    onSubmit,
    onViewCase,
}: {
    transaction: Transaction
    existingCase?: CaseRecord
    issue: string
    setIssue: (v: string) => void
    description: string
    setDescription: (v: string) => void
    error: string
    onBack: () => void
    onSubmit: () => void
    onViewCase: () => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Report an issue" onBack={onBack} />
            <div className="content">
                <div className="attached">
                    <span>
                        <ReceiptText size={20} />
                    </span>
                    <div>
                        <small>ATTACHED TRANSACTION</small>
                        <strong>
                            {transaction.title} · {naira(transaction.amount)}
                        </strong>
                        <p>
                            {transaction.id} · {transaction.bank || "Cedar Bank"}
                        </p>
                    </div>
                    <CheckCircle2 size={18} />
                </div>
                {existingCase && (
                    <div className="existing-case">
                        <FileSearch size={20} />
                        <div>
                            <strong>An active complaint is already linked</strong>
                            <p>
                                {existingCase.id} is tracking this transaction. View it before
                                creating another report.
                            </p>
                        </div>
                        <button onClick={onViewCase}>View case</button>
                    </div>
                )}
                <div className="heading-group">
                    <h1>What went wrong with this transaction?</h1>
                    <p>Choose the option that best matches your experience.</p>
                </div>
                <div className="option-list">
                    {issueTypes.map((item) => (
                        <button
                            key={item}
                            className={issue === item ? "selected" : ""}
                            onClick={() => setIssue(item)}
                        >
                            <span className="radio">{issue === item && <i />}</span>
                            {item}
                        </button>
                    ))}
                </div>
                <Field
                    label="Tell us more (optional)"
                    hint={`${description.length}/300 characters`}
                >
                    <textarea
                        className="input textarea"
                        maxLength={300}
                        placeholder="Add any useful details…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Field>
                {error && (
                    <div className="error-box">
                        <TriangleAlert size={17} />
                        {error}
                    </div>
                )}
                <div className="privacy-note">
                    <ShieldCheck size={18} />
                    <p>
                        Never include passwords, PINs or OTPs. Your complaint will be saved
                        even if investigation services are temporarily unavailable.
                    </p>
                </div>
                <Button onClick={onSubmit}>Submit complaint</Button>
                <p className="powered centered">
                    Investigation workflow powered by <strong>Veriq</strong>
                </p>
            </div>
        </div>
    )
}

export function ComplaintConfirmation({
    record,
    transaction,
    onTrack,
    onHome,
}: {
    record: CaseRecord
    transaction: Transaction
    onTrack: () => void
    onHome: () => void
}) {
    return (
        <div className="screen confirmation">
            <div className="content">
                <div className="confirmation-mark">
                    <Check size={30} />
                </div>
                <span className="eyebrow">COMPLAINT RECEIVED</span>
                <h1>Your complaint has been received.</h1>
                <p>
                    We've securely recorded your report and started reviewing the
                    available transaction evidence.
                </p>
                <div className="reference-card">
                    <small>CASE REFERENCE</small>
                    <strong>{record.id}</strong>
                    <button onClick={() => navigator.clipboard?.writeText(record.id)}>
                        <Copy size={16} /> Copy
                    </button>
                </div>
                <div className="detail-card">
                    <InfoRow
                        label="Linked transaction"
                        value={`${transaction.title} · ${naira(transaction.amount)}`}
                    />
                    <InfoRow label="Issue category" value={record.issue} />
                    <InfoRow label="Created" value={record.createdAt} />
                    <InfoRow label="Status" value="Evidence review" />
                </div>
                <div className="info-box">
                    <Clock3 size={18} />
                    <p>
                        We'll notify you when there is a meaningful, verified update. We
                        won't promise an outcome before the evidence is clear.
                    </p>
                </div>
                <Button onClick={onTrack}>
                    Track complaint <ArrowRight size={18} />
                </Button>
                <Button variant="ghost" onClick={onHome}>
                    Return home
                </Button>
            </div>
        </div>
    )
}

export function ComplaintsScreen({
    cases,
    transactions,
    onBack,
    onOpen,
}: {
    cases: CaseRecord[]
    transactions: Transaction[]
    onBack: () => void
    onOpen: (id: string) => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="My complaints" onBack={onBack} />
            <div className="content">
                <div className="filter-row">
                    <button className="active">All</button>
                    <button>In progress</button>
                    <button>Resolved</button>
                </div>
                {cases.length ? (
                    <div className="case-list">
                        {cases.map((item) => {
                            const t = transactions.find((x) => x.id === item.transactionId)!
                            return (
                                <button
                                    className="case-card"
                                    key={item.id}
                                    onClick={() => onOpen(item.id)}
                                >
                                    <div>
                                        <small>{item.id}</small>
                                        <StatusPill status={item.status} />
                                    </div>
                                    <h3>
                                        {t.title} · {naira(t.amount)}
                                    </h3>
                                    <p>{item.issue}</p>
                                    <div>
                                        <span>{item.createdAt}</span>
                                        <ArrowRight size={18} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <Empty
                        icon={<Clipboard />}
                        title="No complaints yet"
                        copy="Complaints you submit will appear here with verified investigation updates."
                    />
                )}
            </div>
        </div>
    )
}

export function CaseScreen({
    record,
    transaction,
    loading,
    onRefresh,
    onBack,
    onTransaction,
    onSupport,
}: {
    record: CaseRecord
    transaction: Transaction
    loading: boolean
    onRefresh: () => void
    onBack: () => void
    onTransaction: () => void
    onSupport: () => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Complaint details" onBack={onBack} />
            <div className="content">
                <div className="case-summary">
                    <div>
                        <small>CASE REFERENCE</small>
                        <strong>{record.id}</strong>
                    </div>
                    <StatusPill status={record.status} />
                    <h2>{naira(transaction.amount)}</h2>
                    <p>
                        {transaction.title} · {transaction.id}
                    </p>
                </div>
                <section className="investigation-summary">
                    <span>INVESTIGATION SUMMARY</span>
                    <p>
                        {record.resolved
                            ? `The debit and beneficiary credit for this ${naira(transaction.amount)} transfer have both been verified. The original complaint history remains available.`
                            : `We've confirmed that ${naira(transaction.amount)} was debited and the payment instruction was acknowledged. The recipient's credit has not yet been verified.`}
                    </p>
                    <small>Last meaningful update · {record.updatedAt}</small>
                </section>
                <div className="finding">
                    <div>
                        <ShieldCheck size={20} />
                        <span>CURRENT FINDING · {record.finding.toUpperCase()}</span>
                    </div>
                    <p>
                        {record.resolved
                            ? "Authorized evidence confirms that Tolu Adebayo was credited. Your transaction record has been updated."
                            : `We've confirmed that ${naira(transaction.amount)} was debited from your account. We're still checking whether the recipient was credited.`}
                    </p>
                </div>
                <div className="timeline-card">
                    <h3>What has been checked</h3>
                    {record.events.map((event) => (
                        <TimelineItem
                            key={event.id}
                            done={event.verified}
                            active={!event.verified}
                            title={event.title}
                            copy={event.detail}
                            time={event.time}
                        />
                    ))}
                </div>
                <div className="case-guidance-grid">
                    <div>
                        <span>NEXT ACTION</span>
                        <p>{record.nextAction}</p>
                    </div>
                    <div>
                        <span>WHAT YOU CAN DO</span>
                        <p>
                            {record.resolved
                                ? "Review the updated transaction. If you still have a genuine concern, contact Cedar support to continue the conversation."
                                : "Check back for verified updates. You do not need to resubmit this complaint or initiate a duplicate transfer."}
                        </p>
                    </div>
                </div>
                <Button loading={loading} onClick={onRefresh}>
                    <RefreshCw size={17} /> Refresh status
                </Button>
                <Button variant="secondary" onClick={onTransaction}>
                    View original transaction
                </Button>
                <Button variant="ghost" onClick={onSupport}>
                    Contact bank support
                </Button>
            </div>
        </div>
    )
}

export function NotificationsScreen({
    notifications,
    onBack,
    onOpen,
}: {
    notifications: NotificationRecord[]
    onBack: () => void
    onOpen: (notification: NotificationRecord) => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Notifications" onBack={onBack} />
            <div className="content">
                {notifications.length ? (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <button
                                key={notification.id}
                                className={`notification-card ${notification.read ? "" : "unread"} ${notification.kind}`}
                                onClick={() => onOpen(notification)}
                            >
                                <span>
                                    {notification.kind === "success" ? (
                                        <CheckCircle2 />
                                    ) : notification.kind === "warning" ? (
                                        <TriangleAlert />
                                    ) : (
                                        <ShieldCheck />
                                    )}
                                </span>
                                <div>
                                    <strong>{notification.title}</strong>
                                    <p>{notification.message}</p>
                                    <small>
                                        {notification.time}
                                        {!notification.read && " · New"}
                                    </small>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <button className="notification-card">
                        <span>
                            <ShieldCheck />
                        </span>
                        <div>
                            <strong>Your account is protected</strong>
                            <p>
                                Remember, Cedar will never ask for your PIN or OTP by phone.
                            </p>
                            <small>Today, 8:00 AM</small>
                        </div>
                    </button>
                )}
            </div>
        </div>
    )
}
