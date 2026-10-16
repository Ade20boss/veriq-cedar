import { useMemo, useState } from "react"
import {
    ArrowRight,
    ArrowUpRight,
    Bell,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    FileSearch,
    MoreHorizontal,
    ReceiptText,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Send,
    Smartphone,
    Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
    naira,
    type CaseRecord,
    type Transaction,
} from "../../../data"
import {
    Button,
    ScreenHeader,
    StatusPill,
} from "../../../ui"
import { Empty, InfoRow, TimelineItem, TransactionRow } from "../components/SharedComponents"
import type { Screen } from "../types"

export function HomeScreen({
    balance,
    balanceVisible,
    toggleBalance,
    transactions,
    onNavigate,
    openDetails,
    copyAccount,
    openDemo,
    hasUpdate,
}: {
    balance: number
    balanceVisible: boolean
    toggleBalance: () => void
    transactions: Transaction[]
    onNavigate: (s: Screen) => void
    openDetails: (id: string) => void
    copyAccount: () => void
    openDemo: () => void
    hasUpdate: boolean
}) {
    const quickActions: Array<{
        Icon: LucideIcon
        label: string
        action: () => void
    }> = [
            { Icon: Send, label: "Transfer", action: () => onNavigate("transfer") },
            {
                Icon: Smartphone,
                label: "Airtime",
                action: () => alert("Airtime services are simulated in this demo."),
            },
            {
                Icon: ReceiptText,
                label: "Pay bills",
                action: () => alert("Bill payments are simulated in this demo."),
            },
            { Icon: MoreHorizontal, label: "More", action: () => onNavigate("support") },
        ]

    return (
        <div className="screen home-screen">
            <header className="home-header">
                <div className="avatar small">AO</div>
                <div className="grow">
                    <span>Good morning</span>
                    <strong>Ada</strong>
                </div>
                <button
                    className="icon-button tinted"
                    onClick={() => onNavigate("notifications")}
                >
                    <Bell size={20} />
                    {hasUpdate && <i className="notification-dot" />}
                </button>
            </header>
            <button className="demo-banner" onClick={openDemo}>
                <span>
                    <SlidersHorizontal size={16} /> Demo scenario controls
                </span>
                <ChevronDown size={17} />
            </button>
            <section className="balance-card">
                <div className="balance-orb one" />
                <div className="balance-orb two" />
                <div className="balance-label">
                    <span>Available balance</span>
                    <button onClick={toggleBalance} aria-label="Show or hide balance">
                        {balanceVisible ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                </div>
                <div className="balance-value">
                    {balanceVisible ? naira(balance) : "₦ ••••••"}
                </div>
                <div className="account-meta">
                    <span>Cedar Everyday</span>
                    <i />
                    <span>103 ••• 9104</span>
                </div>
                <div className="balance-actions">
                    <button onClick={copyAccount}>
                        Account details <ArrowUpRight size={15} />
                    </button>
                </div>
            </section>
            <section>
                <div className="quick-grid">
                    {quickActions.map(({ Icon, label, action }) => (
                        <button
                            className="quick-action"
                            onClick={action}
                            key={label}
                        >
                            <span>
                                <Icon size={21} />
                            </span>
                            {label}
                        </button>
                    ))}
                </div>
            </section>
            <section className="section-block">
                <div className="section-title">
                    <div>
                        <span className="eyebrow">YOUR ACTIVITY</span>
                        <h2>Recent transactions</h2>
                    </div>
                    <button onClick={() => onNavigate("history")}>See all</button>
                </div>
                <div className="transaction-list">
                    {transactions.slice(0, 4).map((item) => (
                        <TransactionRow
                            key={item.id}
                            item={item}
                            onClick={() => openDetails(item.id)}
                        />
                    ))}
                </div>
            </section>
            <section className="help-card">
                <span>
                    <ShieldCheck size={21} />
                </span>
                <div>
                    <strong>Bank safely with Cedar</strong>
                    <p>We will never ask for your PIN or password over a call.</p>
                </div>
                <ArrowRight size={18} />
            </section>
        </div>
    )
}

export function HistoryScreen({
    transactions,
    search,
    setSearch,
    filter,
    setFilter,
    openDetails,
}: {
    transactions: Transaction[]
    search: string
    setSearch: (v: string) => void
    filter: string
    setFilter: (v: string) => void
    openDetails: (id: string) => void
}) {
    const filtered = useMemo(
        () =>
            transactions.filter(
                (t) =>
                    (filter === "All" || t.status === filter) &&
                    t.title.toLowerCase().includes(search.toLowerCase()),
            ),
        [transactions, search, filter],
    )
    return (
        <div className="screen with-nav">
            <ScreenHeader title="Transaction history" />
            <div className="content">
                <div className="search-box">
                    <Search size={19} />
                    <input
                        placeholder="Search transactions"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button>
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
                <div className="filter-row">
                    {["All", "Completed", "Processing", "Outcome unknown"].map((f) => (
                        <button
                            className={filter === f ? "active" : ""}
                            key={f}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="list-date">
                    RECENT ACTIVITY <span>{filtered.length} transactions</span>
                </div>
                <div className="transaction-list">
                    {filtered.map((item) => (
                        <TransactionRow
                            key={item.id}
                            item={item}
                            onClick={() => openDetails(item.id)}
                        />
                    ))}
                    {!filtered.length && (
                        <Empty
                            icon={<Search />}
                            title="No matches found"
                            copy="Try another search or status filter."
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export function DetailsScreen({
    transaction,
    existingCase,
    loading,
    onBack,
    onCheck,
    onReport,
    onViewCase,
}: {
    transaction: Transaction
    existingCase?: CaseRecord
    loading: boolean
    onBack: () => void
    onCheck: () => void
    onReport: () => void
    onViewCase: () => void
}) {
    const open = ["Processing", "Delayed", "Outcome unknown"].includes(
        transaction.status,
    )
    return (
        <div className="screen">
            <ScreenHeader
                title="Transaction details"
                onBack={onBack}
                action={
                    <button className="icon-button">
                        <MoreHorizontal size={20} />
                    </button>
                }
            />
            <div className="content">
                <div className="transaction-hero">
                    <div className="recipient-avatar">
                        {transaction.title
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .slice(0, 2)}
                    </div>
                    <span>TRANSFER TO</span>
                    <h2>{transaction.title}</h2>
                    <strong>
                        {transaction.direction === "debit" ? "−" : "+"}
                        {naira(transaction.amount)}
                    </strong>
                    <StatusPill
                        status={
                            transaction.status === "Completed"
                                ? "Credit confirmed"
                                : transaction.status
                        }
                    />
                    {transaction.status === "Delayed" && (
                        <span className="outcome-note">Financial outcome · Unknown</span>
                    )}
                </div>
                <div className="detail-card">
                    <InfoRow
                        label="Recipient bank"
                        value={transaction.bank || "Cedar Bank"}
                    />
                    <InfoRow
                        label="Account"
                        value={
                            transaction.account
                                ? `••••••${transaction.account.slice(-4)}`
                                : "•••• 1042"
                        }
                    />
                    <InfoRow label="Date & time" value={transaction.date} />
                    <InfoRow label="Reference" value={transaction.id} />
                    <InfoRow
                        label="Narration"
                        value={transaction.narration || "Card payment"}
                    />
                </div>
                <TransactionInsights
                    transaction={transaction}
                    hasComplaint={Boolean(existingCase)}
                />
                <div className="timeline-card">
                    <h3>Transaction timeline</h3>
                    <TimelineItem
                        done
                        title="Debit recorded"
                        copy={`${naira(transaction.amount)} debit verified by Cedar Bank`}
                        time="10:30 AM"
                    />
                    <TimelineItem
                        done
                        title="Instruction submitted"
                        copy="Payment instruction acknowledged"
                        time="10:30 AM"
                    />
                    {transaction.evidence?.some(
                        (item) => item.eventType === "response_timeout",
                    ) && (
                            <TimelineItem
                                done
                                title="Payment response reviewed"
                                copy="The final response was not received in the expected window"
                                time="10:31 AM"
                            />
                        )}
                    <TimelineItem
                        done={transaction.status === "Completed"}
                        active={open}
                        title={
                            transaction.status === "Completed"
                                ? "Beneficiary credit confirmed"
                                : "Awaiting verified outcome"
                        }
                        copy={
                            transaction.status === "Completed"
                                ? "Authorized confirmation received"
                                : "No confirmed beneficiary credit yet"
                        }
                        time={transaction.status === "Completed" ? "10:37 AM" : "Latest"}
                    />
                </div>
                {open && (
                    <Button loading={loading} onClick={onCheck}>
                        <RefreshCw size={17} /> Check status
                    </Button>
                )}
                {transaction.status === "Completed" && (
                    <Button variant="secondary">
                        <ReceiptText size={17} /> View receipt
                    </Button>
                )}
                {existingCase ? (
                    <Button variant="secondary" onClick={onViewCase}>
                        <FileSearch size={17} /> Track existing complaint
                    </Button>
                ) : (
                    <Button
                        variant={
                            transaction.status === "Outcome unknown" ||
                                transaction.status === "Delayed"
                                ? "secondary"
                                : "ghost"
                        }
                        onClick={onReport}
                    >
                        Report an issue
                    </Button>
                )}
            </div>
        </div>
    )
}

function TransactionInsights({
    transaction,
    hasComplaint,
}: {
    transaction: Transaction
    hasComplaint: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const isCompleted =
        transaction.financialOutcome === "credit_confirmed" ||
        transaction.status === "Completed"
    const isFailed =
        transaction.financialOutcome === "failure_confirmed" ||
        transaction.status === "Failed"
    const isReversed =
        transaction.financialOutcome === "reversal_posted" ||
        transaction.status === "Reversal posted"
    const hasTimeout = transaction.evidence?.some(
        (item) => item.eventType === "response_timeout",
    )
    const incident = transaction.incidentStatus ?? "none"

    const summary = isCompleted
        ? `Authorized records confirm that ${transaction.title} received this transfer.`
        : isFailed
            ? "Authorized records confirm that this payment instruction did not complete."
            : isReversed
                ? "A matching reversal has been verified on your Cedar account."
                : hasTimeout
                    ? "Your account was debited and the payment instruction was acknowledged, but the beneficiary credit has not been confirmed."
                    : "Your transfer is being processed. We haven't received a final confirmation yet."

    const reason =
        incident === "confirmed"
            ? "A temporary payment-processing disruption has been confirmed. This explains the delayed response, but it does not establish whether this individual transfer completed."
            : incident === "suspected"
                ? "Our monitoring identified unusual payment-response delays on this route. Your transaction may be affected, but the cause is still under investigation."
                : hasTimeout
                    ? "The final payment response was not received within the expected window. This communication timeout is not proof that the transfer failed."
                    : isCompleted
                        ? "The final beneficiary-credit response was received and verified through an authorized status source."
                        : isFailed
                            ? "The final payment status was received from an authorized source and records the instruction as unsuccessful."
                            : isReversed
                                ? "Cedar's ledger shows a confirmed reversal credit matching the original debit."
                                : "No specific cause has been identified. The bank is waiting for the next verified processing event."

    const bankAction = isCompleted || isFailed || isReversed
        ? "The latest authorized outcome has been recorded on this transaction."
        : hasComplaint
            ? "The transaction is linked to an active case and additional status verification has been requested."
            : incident === "confirmed"
                ? "Cedar's payment operations team has recorded the incident and is verifying this transfer's individual outcome."
                : "Cedar will check the latest authorized status when you request an update."

    const guidance = isCompleted
        ? "No action is required. You can still report an issue if the recipient disputes receipt."
        : isFailed || isReversed
            ? "Review the confirmed outcome and contact Cedar support if you need more help."
            : hasComplaint
                ? "Track your complaint for verified updates and avoid sending a duplicate transfer while the outcome remains unknown."
                : "Check the latest status, avoid a duplicate transfer, or report an issue if you need assistance."

    const level = transaction.explanationLevel ?? (isCompleted ? 3 : 1)
    const label =
        level === 3
            ? incident === "confirmed" && !isCompleted
                ? "Verified cause · outcome pending"
                : "Verified finding"
            : level === 2
                ? "Possible cause · under investigation"
                : "Status explanation"

    return (
        <section className={`insights-card level-${level}`}>
            <header>
                <span className="insights-icon">
                    <Sparkles size={17} />
                </span>
                <div>
                    <h3>Transaction Insights</h3>
                    <small>Evidence-based explanation</small>
                </div>
                <span className="insight-level">{label}</span>
            </header>
            <div className="insight-summary">
                <span>WHAT WE KNOW</span>
                <p>{summary}</p>
            </div>
            <button
                className="insight-expand"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                Why is this happening?
                {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {expanded && (
                <div className="insight-details">
                    <InsightItem
                        label={
                            incident === "suspected"
                                ? "Possible reason"
                                : incident === "confirmed"
                                    ? "Verified cause"
                                    : hasTimeout
                                        ? "Observed issue"
                                        : "Why this may be happening"
                        }
                        copy={reason}
                        tone={incident === "suspected" || hasTimeout ? "warning" : "neutral"}
                    />
                    <InsightItem label="What Cedar is doing" copy={bankAction} />
                    <InsightItem label="What you can do" copy={guidance} />
                    <div className="verified-time">
                        <ShieldCheck size={14} />
                        Last verified update ·{" "}
                        {transaction.lastVerifiedUpdate ?? transaction.date}
                    </div>
                </div>
            )}
        </section>
    )
}

function InsightItem({
    label,
    copy,
    tone = "neutral",
}: {
    label: string
    copy: string
    tone?: "neutral" | "warning"
}) {
    return (
        <div className={`insight-item ${tone}`}>
            <strong>{label}</strong>
            <p>{copy}</p>
        </div>
    )
}
