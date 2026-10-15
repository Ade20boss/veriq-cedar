import {
    ArrowRight,
    Check,
    CheckCircle2,
    Clock3,
    ChevronDown,
    Landmark,
    ReceiptText,
    RefreshCw,
    Send,
    ShieldCheck,
    TriangleAlert,
    X,
} from "lucide-react"
import {
    naira,
    type Transaction,
} from "../../../data"
import { InfoRow } from "../components/SharedComponents"
import { banks } from "../constants"
import {
    Button,
    Field,
    ScreenHeader,
    StatusPill,
    TextInput,
} from "../../../ui"

export function ProcessingTransferScreen({
    amount,
    recipient,
    bank,
}: {
    amount: number
    recipient: string
    bank: string
}) {
    return (
        <div className="screen transfer-processing">
            <div className="processing-content">
                <div className="processing-animation" aria-label="Submitting transfer">
                    <span className="processing-ring" />
                    <span className="processing-core">
                        <Send size={25} />
                    </span>
                </div>
                <span className="eyebrow">SECURE TRANSFER</span>
                <h1>Sending your transfer</h1>
                <p>
                    Please keep Cedar open while we securely submit your payment
                    instruction.
                </p>
                <div className="processing-payment">
                    <small>TRANSFER AMOUNT</small>
                    <strong>{naira(amount)}</strong>
                    <span>
                        {recipient} · {bank}
                    </span>
                </div>
                <div className="processing-steps">
                    <div className="complete">
                        <Check size={13} />
                        <span>
                            <strong>Authorization confirmed</strong>
                            <small>Your demo passcode was accepted</small>
                        </span>
                    </div>
                    <div className="active">
                        <span className="step-loader" />
                        <span>
                            <strong>Submitting payment instruction</strong>
                            <small>Connecting securely to the payment service</small>
                        </span>
                    </div>
                    <div>
                        <span className="step-dot" />
                        <span>
                            <strong>Preparing your status</strong>
                            <small>We’ll show only verified information</small>
                        </span>
                    </div>
                </div>
                <div className="processing-safety">
                    <ShieldCheck size={16} />
                    Do not close the app or submit this transfer again.
                </div>
            </div>
        </div>
    )
}

export function TransferScreen(props: {
    balance: number
    bank: string
    setBank: (v: string) => void
    account: string
    setAccount: (v: string) => void
    amount: string
    setAmount: (v: string) => void
    narration: string
    setNarration: (v: string) => void
    resolved: boolean
    error: string
    onBack: () => void
    onContinue: () => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Transfer money" onBack={props.onBack} />
            <div className="content">
                <div className="source-card">
                    <div className="bank-icon">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <span>FROM</span>
                        <strong>Cedar Current • 9104</strong>
                        <small>{naira(props.balance)} available</small>
                    </div>
                    <ChevronDown size={18} />
                </div>
                <div className="form-stack">
                    <Field label="Recipient bank">
                        <div className="select-wrap">
                            <select
                                className="input"
                                value={props.bank}
                                onChange={(e) => props.setBank(e.target.value)}
                            >
                                <option value="">Select bank</option>
                                {banks.map((b) => (
                                    <option key={b}>{b}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} />
                        </div>
                    </Field>
                    <Field label="Account number" hint="For this demo, enter 0123456789">
                        <TextInput
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="10-digit account number"
                            value={props.account}
                            onChange={(e) =>
                                props.setAccount(e.target.value.replace(/\D/g, ""))
                            }
                        />
                    </Field>
                    {props.resolved && (
                        <div className="resolved">
                            <CheckCircle2 size={19} />
                            <span>
                                <small>ACCOUNT NAME</small>
                                <strong>Tolu Adebayo</strong>
                            </span>
                        </div>
                    )}
                    <Field label="Amount">
                        <div className="amount-input">
                            <span>₦</span>
                            <TextInput
                                inputMode="numeric"
                                value={props.amount}
                                onChange={(e) =>
                                    props.setAmount(e.target.value.replace(/\D/g, ""))
                                }
                            />
                        </div>
                    </Field>
                    <Field label="Narration" hint="Optional · 30 characters maximum">
                        <TextInput
                            maxLength={30}
                            value={props.narration}
                            onChange={(e) => props.setNarration(e.target.value)}
                        />
                    </Field>
                    {props.error && (
                        <div className="error-box">
                            <TriangleAlert size={17} />
                            {props.error}
                        </div>
                    )}
                </div>
                <Button onClick={props.onContinue}>
                    Continue <ArrowRight size={18} />
                </Button>
                <p className="legal-note">
                    All banks and account records shown are fictional demo data.
                </p>
            </div>
        </div>
    )
}

export function ReviewScreen({
    bank,
    account,
    amount,
    narration,
    onBack,
    onConfirm,
}: {
    bank: string
    account: string
    amount: number
    narration: string
    onBack: () => void
    onConfirm: () => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Review transfer" onBack={onBack} />
            <div className="content">
                <div className="review-hero">
                    <span>YOU'RE SENDING</span>
                    <strong>{naira(amount)}</strong>
                    <div className="recipient-avatar">TA</div>
                    <h2>Tolu Adebayo</h2>
                    <p>
                        {bank} · ••••••{account.slice(-4)}
                    </p>
                </div>
                <div className="detail-card">
                    <InfoRow label="From" value="Cedar Current • 9104" />
                    <InfoRow label="Narration" value={narration || "Not provided"} />
                    <InfoRow label="Transfer fee" value="₦0.00 (fictional)" />
                    <div className="divider" />
                    <InfoRow label="Total debit" value={naira(amount)} strong />
                </div>
                <div className="info-box">
                    <ShieldCheck size={19} />
                    <p>
                        Confirm the recipient details carefully. This transfer is simulated
                        and does not move real funds.
                    </p>
                </div>
                <Button onClick={onConfirm}>Confirm transfer</Button>
                <Button variant="ghost" onClick={onBack}>
                    Edit details
                </Button>
            </div>
        </div>
    )
}

export function AuthorizeScreen({
    amount,
    pin,
    setPin,
    error,
    loading,
    onBack,
    onSubmit,
}: {
    amount: number
    pin: string
    setPin: (v: string) => void
    error: string
    loading: boolean
    onBack: () => void
    onSubmit: () => void
}) {
    return (
        <div className="screen">
            <ScreenHeader title="Authorize" onBack={onBack} />
            <div className="content authorize">
                <div className="authorize-icon">
                    <ShieldCheck size={32} />
                </div>
                <h1>Authorize {naira(amount)}</h1>
                <p>
                    Enter the 4-digit demo passcode to approve this simulated transfer to
                    Tolu Adebayo.
                </p>
                <div className="pin-display">
                    {[0, 1, 2, 3].map((n) => (
                        <span key={n} className={pin.length > n ? "filled" : ""} />
                    ))}
                </div>
                <TextInput
                    className="hidden-pin"
                    aria-label="Demo passcode"
                    autoFocus
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
                <div className="demo-code">
                    DEMO PASSCODE <strong>1234</strong>
                </div>
                {error && <span className="field-error centered">{error}</span>}
                <Button
                    loading={loading}
                    disabled={pin.length !== 4}
                    onClick={onSubmit}
                >
                    {loading ? "Submitting securely…" : "Authorize transfer"}
                </Button>
                <p className="safety centered">
                    <ShieldCheck size={15} /> Never use a real banking PIN in this demo.
                </p>
            </div>
        </div>
    )
}

export function StatusScreen({
    transaction,
    loading,
    onCheck,
    onDetails,
    onReport,
    onHome,
}: {
    transaction: Transaction
    loading: boolean
    onCheck: () => void
    onDetails: () => void
    onReport: () => void
    onHome: () => void
}) {
    const completed = transaction.status === "Completed"
    const failed = transaction.status === "Failed"
    const reversed = transaction.status === "Reversal posted"
    const uncertain = transaction.status === "Outcome unknown"
    const delayed = transaction.status === "Delayed"
    const title = completed
        ? "Transfer confirmed"
        : failed
            ? "Transfer unsuccessful"
            : reversed
                ? "Reversal posted"
                : uncertain
                    ? "This transfer is taking longer than expected"
                    : delayed
                        ? "Transaction taking longer than expected"
                        : "Your transfer is still being processed"
    const copy = completed
        ? "Verified confirmation shows the recipient was credited."
        : failed
            ? "Authorized evidence confirms this transfer did not complete."
            : reversed
                ? "The debit has been returned to your Cedar account."
                : uncertain
                    ? "We're checking its status. We can't yet confirm whether the recipient has received the funds."
                    : delayed
                        ? transaction.incidentStatus === "confirmed"
                            ? "A temporary processing disruption is confirmed. We're still verifying the financial outcome of this transfer."
                            : "Payment responses on this route are unusually delayed. The final outcome hasn't been confirmed."
                        : "We're checking the latest transaction status. The final outcome hasn't been confirmed yet."
    return (
        <div className="screen status-screen">
            <ScreenHeader title="Transfer status" />
            <div className="content">
                <div
                    className={`status-visual ${completed ? "ok" : failed ? "bad" : "pending"
                        }`}
                >
                    {completed ? (
                        <Check size={35} />
                    ) : failed ? (
                        <X size={34} />
                    ) : reversed ? (
                        <RefreshCw size={32} />
                    ) : (
                        <Clock3 size={32} />
                    )}
                </div>
                <StatusPill
                    status={completed ? "Credit confirmed" : transaction.status}
                />
                {delayed && (
                    <span className="outcome-note">Financial outcome · Unknown</span>
                )}
                <h1>{title}</h1>
                <p className="status-copy">{copy}</p>
                <div className="amount-summary">
                    <span>AMOUNT</span>
                    <strong>{naira(transaction.amount)}</strong>
                    <p>Tolu Adebayo · {transaction.bank}</p>
                    <small>{transaction.id}</small>
                </div>
                {!completed && !failed && !reversed && (
                    <Button loading={loading} onClick={onCheck}>
                        <RefreshCw size={17} /> Check status
                    </Button>
                )}
                <Button
                    variant={uncertain || delayed ? "secondary" : "ghost"}
                    onClick={uncertain || delayed ? onReport : onDetails}
                >
                    {uncertain || delayed
                        ? "Report a transaction issue"
                        : "View transaction details"}
                </Button>
                {(uncertain || delayed) && (
                    <Button variant="ghost" onClick={onDetails}>
                        View transaction details
                    </Button>
                )}
                {!uncertain && !delayed && !completed && (
                    <button className="link-button" onClick={onReport}>
                        Report an issue
                    </button>
                )}
                {(completed || failed || reversed) && (
                    <Button variant="secondary" onClick={onDetails}>
                        View details & receipt
                    </Button>
                )}
                <button className="link-button" onClick={onHome}>
                    Return home
                </button>
            </div>
        </div>
    )
}
