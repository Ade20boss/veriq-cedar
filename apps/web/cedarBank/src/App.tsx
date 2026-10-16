"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clipboard,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileSearch,
  Fingerprint,
  Headphones,
  History,
  Home,
  Landmark,
  LifeBuoy,
  MoreHorizontal,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TriangleAlert,
  UserRound,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"
import {
  baseTransactions,
  createTransferEvidence,
  creditEvidence,
  naira,
  scenarios,
  type CaseRecord,
  type NotificationRecord,
  type Scenario,
  type Transaction,
} from "./data"
import {
  Button,
  CedarMark,
  Field,
  ScreenHeader,
  StatusPill,
  TextInput,
} from "./ui"

type Screen = "splash" | "login" | "home" | "transfer" | "review" | "authorize" | "submitting" | "status" | "history" | "details" | "support" | "report" | "complaint-confirmation" | "complaints" | "case" | "notifications"

const accountNumber = "1034 829 104"
const banks = ["Access Bank", "GTBank", "First Bank", "Kuda Bank", "UBA"]
const issueTypes = [
  "I was debited, but the recipient hasn't received the money",
  "My transfer is taking too long",
  "I was debited unexpectedly",
  "I have another issue with this transaction",
]

function App() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [previous, setPrevious] = useState<Screen>("home")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [scenario, setScenario] = useState<Scenario>("uncertain")
  const [demoOpen, setDemoOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(150000)
  const [transactions, setTransactions] =
    useState<Transaction[]>(baseTransactions)
  const [selectedId, setSelectedId] = useState(baseTransactions[0].id)
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [bank, setBank] = useState("")
  const [recipientAccount, setRecipientAccount] = useState("")
  const [amount, setAmount] = useState("50000")
  const [narration, setNarration] = useState("For Tolu")
  const [pin, setPin] = useState("")
  const [issue, setIssue] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [formError, setFormError] = useState("")
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setScreen("login"), 1600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selected =
    transactions.find((item) => item.id === selectedId) ?? transactions[0]
  const resolved = bank && recipientAccount === "0123456789"

  const navigate = (next: Screen) => {
    setPrevious(screen)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const transferStatus = (chosen: Scenario): Transaction["status"] => {
    if (chosen === "success") return "Completed"
    if (chosen === "delay") return "Processing"
    if (chosen === "failed") return "Failed"
    if (chosen === "reversal") return "Reversal posted"
    if (
      chosen === "suspected-disruption" ||
      chosen === "confirmed-disruption"
    )
      return "Delayed"
    return "Outcome unknown"
  }

  const addNotification = (notification: NotificationRecord) => {
    setNotifications((current) =>
      current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current],
    )
  }

  const submitTransfer = () => {
    if (pin !== "1234") {
      setFormError("Use the demo passcode 1234")
      return
    }
    setFormError("")
    setLoading(true)
    setScreen("submitting")
    window.setTimeout(() => {
      const transactionId = `CB-DEMO-${String(transactions.length + 1).padStart(4, "0")}`
      const isConfirmed = scenario === "success"
      const isFailed = scenario === "failed"
      const isReversed = scenario === "reversal"
      const transfer: Transaction = {
        id: transactionId,
        title: "Tolu Adebayo",
        subtitle: `Bank transfer • Today, 10:30 AM`,
        amount: Number(amount),
        direction: "debit",
        status: transferStatus(scenario),
        date: "Today, 10:30 AM",
        bank,
        account: recipientAccount,
        narration,
        scenario,
        evidence: createTransferEvidence(transactionId, scenario),
        processingCondition:
          scenario === "success" ? "normal" : "delayed",
        financialOutcome: isConfirmed
          ? "credit_confirmed"
          : isFailed
            ? "failure_confirmed"
            : isReversed
              ? "reversal_posted"
              : "unknown",
        incidentStatus:
          scenario === "suspected-disruption"
            ? "suspected"
            : scenario === "confirmed-disruption"
              ? "confirmed"
              : "none",
        explanationLevel:
          isConfirmed ||
          isFailed ||
          isReversed ||
          scenario === "confirmed-disruption"
            ? 3
            : scenario === "suspected-disruption" || scenario === "timeout"
              ? 2
              : 1,
        lastVerifiedUpdate:
          scenario === "confirmed-disruption"
            ? "Today, 10:34 AM"
            : "Today, 10:30 AM",
      }
      setTransactions((current) => [transfer, ...current])
      setSelectedId(transfer.id)
      setBalance((value) => value - Number(amount))
      if (
        scenario === "suspected-disruption" ||
        scenario === "confirmed-disruption"
      ) {
        addNotification({
          id: `${transactionId}-${scenario}`,
          transactionId,
          title:
            scenario === "confirmed-disruption"
              ? "Payment service update"
              : "Possible payment delay identified",
          message:
            scenario === "confirmed-disruption"
              ? "A temporary processing disruption has been confirmed. Your transfer outcome is still being verified."
              : "We've identified unusual payment-response delays that may affect your transfer.",
          time: "Just now",
          read: false,
          kind: "warning",
        })
      }
      setLoading(false)
      setScreen("status")
    }, 1800)
  }

  const checkStatus = () => {
    if (!selected) return
    setLoading(true)
    window.setTimeout(() => {
      if (
        selected.scenario === "delay" ||
        selected.scenario === "complaint-credit" ||
        selected.scenario === "credit-during-investigation"
      ) {
        setTransactions((items) =>
          items.map((item) =>
            item.id === selected.id
              ? {
                  ...item,
                  status: "Completed",
                  financialOutcome: "credit_confirmed",
                  processingCondition: "normal",
                  explanationLevel: 3,
                  lastVerifiedUpdate: "Today, 10:37 AM",
                  evidence: [
                    ...(item.evidence ?? []),
                    creditEvidence(item.id),
                  ],
                }
              : item,
          ),
        )
        setCases((items) =>
          items.map((item) =>
            item.transactionId === selected.id
              ? {
                  ...item,
                  status: "Outcome verified",
                  resolved: true,
                  finding: "Verified financial outcome",
                  nextAction:
                    "The case is moving toward closure under Cedar's demo case policy. Contact support if you still have a concern.",
                  updatedAt: "Today, 10:38 AM",
                  events: item.events.some(
                    (event) => event.id === `${item.id}-outcome`,
                  )
                    ? item.events
                    : [
                        ...item.events.map((event) =>
                          event.id === `${item.id}-verification`
                            ? {
                                ...event,
                                title: "Additional status verification received",
                                detail:
                                  "An authorized downstream response was received.",
                                time: "10:37 AM",
                                verified: true,
                              }
                            : event,
                        ),
                        {
                          id: `${item.id}-outcome`,
                          title: "Verified outcome recorded",
                          detail:
                            "Authorized records confirm the beneficiary was credited.",
                          time: "10:38 AM",
                          verified: true,
                        },
                      ],
                }
              : item,
          ),
        )
        addNotification({
          id: `${selected.id}-credit-confirmed`,
          transactionId: selected.id,
          caseId: cases.find(
            (item) => item.transactionId === selected.id,
          )?.id,
          title: "Your transfer has been confirmed",
          message: `Your ${naira(selected.amount)} transfer to ${selected.title} has now been confirmed as credited.`,
          time: "Just now",
          read: false,
          kind: "success",
        })
        setToast("Verified credit confirmation received")
      } else {
        setToast("No new verified status is available yet")
      }
      setLoading(false)
    }, 1000)
  }

  const submitComplaint = () => {
    if (!issue) {
      setFormError("Select the option that best describes the issue")
      return
    }
    const duplicate = cases.find(
      (item) =>
        item.transactionId === selected.id &&
        item.issue === issue &&
        !item.resolved,
    )
    if (duplicate) {
      setToast("An active case already exists for this issue")
      navigate("case")
      return
    }
    const caseId = `VRQ-${new Date().getFullYear()}-${String(cases.length + 1842).padStart(6, "0")}`
    const caseRecord: CaseRecord = {
      id: caseId,
      transactionId: selected.id,
      issue,
      description,
      createdAt: "Today, 10:35 AM",
      updatedAt: "Today, 10:36 AM",
      status: "Evidence review",
      resolved: false,
      finding:
        selected.incidentStatus === "suspected"
          ? "Suspected service disruption"
          : selected.incidentStatus === "confirmed"
            ? "Verified technical issue"
            : selected.evidence?.some(
                  (item) => item.eventType === "response_timeout",
                )
              ? "Possible processing issue"
              : "No cause identified yet",
      nextAction:
        "Cedar needs to request the latest authorized payment status before the financial outcome can be established.",
      events: [
        {
          id: `${caseId}-received`,
          title: "Complaint received",
          detail: "Your report was saved and linked to the transaction.",
          time: "10:35 AM",
          verified: true,
        },
        {
          id: `${caseId}-matched`,
          title: "Transaction reference matched",
          detail: "The transaction was matched to your Cedar account.",
          time: "10:35 AM",
          verified: true,
        },
        {
          id: `${caseId}-debit`,
          title: "Sender debit verified",
          detail: "The debit and submitted payment instruction were confirmed.",
          time: "10:36 AM",
          verified: true,
        },
        {
          id: `${caseId}-verification`,
          title: "Additional status verification requested",
          detail: "Awaiting an authorized downstream status response.",
          time: "Current",
          verified: false,
        },
      ],
    }
    setCases((current) => [caseRecord, ...current])
    setFormError("")
    navigate("complaint-confirmation")
  }

  const openDetails = (id: string) => {
    setSelectedId(id)
    navigate("details")
  }

  if (screen === "splash") return <Splash />
  if (screen === "login")
    return (
      <Login
        passwordVisible={passwordVisible}
        setPasswordVisible={setPasswordVisible}
        onLogin={() => navigate("home")}
      />
    )

  const showNav = ["home", "history", "support"].includes(screen)
  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === "home" && (
          <HomeScreen
            balance={balance}
            balanceVisible={balanceVisible}
            toggleBalance={() => setBalanceVisible(!balanceVisible)}
            transactions={transactions}
            onNavigate={navigate}
            openDetails={openDetails}
            copyAccount={() => {
              navigator.clipboard?.writeText(accountNumber.replace(/ /g, ""))
              setToast("Account number copied")
            }}
            openDemo={() => setDemoOpen(true)}
            hasUpdate={notifications.some((item) => !item.read)}
          />
        )}
        {screen === "transfer" && (
          <TransferScreen
            balance={balance}
            bank={bank}
            setBank={setBank}
            account={recipientAccount}
            setAccount={setRecipientAccount}
            amount={amount}
            setAmount={setAmount}
            narration={narration}
            setNarration={setNarration}
            resolved={Boolean(resolved)}
            error={formError}
            onBack={() => navigate("home")}
            onContinue={() => {
              if (
                !bank ||
                !resolved ||
                Number(amount) <= 0 ||
                Number(amount) > balance
              ) {
                setFormError(
                  !bank
                    ? "Select a recipient bank"
                    : !resolved
                      ? "Enter demo account 0123456789"
                      : "Enter an amount within your available balance",
                )
              } else {
                setFormError("")
                navigate("review")
              }
            }}
          />
        )}
        {screen === "review" && (
          <ReviewScreen
            bank={bank}
            account={recipientAccount}
            amount={Number(amount)}
            narration={narration}
            onBack={() => navigate("transfer")}
            onConfirm={() => navigate("authorize")}
          />
        )}
        {screen === "authorize" && (
          <AuthorizeScreen
            amount={Number(amount)}
            pin={pin}
            setPin={setPin}
            error={formError}
            loading={loading}
            onBack={() => navigate("review")}
            onSubmit={submitTransfer}
          />
        )}
        {screen === "submitting" && (
          <ProcessingTransferScreen
            amount={Number(amount)}
            recipient="Tolu Adebayo"
            bank={bank}
          />
        )}
        {screen === "status" && selected && (
          <StatusScreen
            transaction={selected}
            loading={loading}
            onCheck={checkStatus}
            onDetails={() => navigate("details")}
            onReport={() => navigate("report")}
            onHome={() => navigate("home")}
          />
        )}
        {screen === "history" && (
          <HistoryScreen
            transactions={transactions}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            openDetails={openDetails}
          />
        )}
        {screen === "details" && selected && (
          <DetailsScreen
            transaction={selected}
            existingCase={cases.find(
              (item) => item.transactionId === selected.id && !item.resolved,
            )}
            loading={loading}
            onBack={() => setScreen(previous)}
            onCheck={checkStatus}
            onReport={() => navigate("report")}
            onViewCase={() => navigate("case")}
          />
        )}
        {screen === "support" && (
          <SupportScreen
            cases={cases}
            transactions={transactions}
            onNavigate={navigate}
            reportRecent={() => {
              setSelectedId(transactions[0].id)
              navigate("report")
            }}
          />
        )}
        {screen === "report" && selected && (
          <ReportScreen
            transaction={selected}
            existingCase={cases.find(
              (item) => item.transactionId === selected.id && !item.resolved,
            )}
            issue={issue}
            setIssue={setIssue}
            description={description}
            setDescription={setDescription}
            error={formError}
            onBack={() => navigate("details")}
            onSubmit={submitComplaint}
            onViewCase={() => navigate("case")}
          />
        )}
        {screen === "complaint-confirmation" && cases[0] && (
          <ComplaintConfirmation
            record={cases[0]}
            transaction={selected}
            onTrack={() => navigate("case")}
            onHome={() => navigate("home")}
          />
        )}
        {screen === "complaints" && (
          <ComplaintsScreen
            cases={cases}
            transactions={transactions}
            onBack={() => navigate("support")}
            onOpen={(id) => {
              const found = cases.find((item) => item.id === id)
              if (found) setSelectedId(found.transactionId)
              navigate("case")
            }}
          />
        )}
        {screen === "case" &&
          cases.find((item) => item.transactionId === selectedId) && (
            <CaseScreen
              record={cases.find((item) => item.transactionId === selectedId)!}
              transaction={selected}
              loading={loading}
              onRefresh={checkStatus}
              onBack={() => navigate("complaints")}
              onTransaction={() => navigate("details")}
              onSupport={() => navigate("support")}
            />
          )}
        {screen === "notifications" && (
          <NotificationsScreen
            notifications={notifications}
            onBack={() => navigate("home")}
            onOpen={(notification) => {
              setSelectedId(notification.transactionId)
              setNotifications((items) =>
                items.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
                ),
              )
              navigate(notification.caseId ? "case" : "details")
            }}
          />
        )}
        {showNav && <BottomNav current={screen} onNavigate={navigate} />}
        {demoOpen && (
          <DemoSheet
            scenario={scenario}
            setScenario={setScenario}
            close={() => setDemoOpen(false)}
          />
        )}
        {toast && (
          <div className="toast">
            <Check size={16} />
            {toast}
          </div>
        )}
      </div>
    </main>
  )
}

function ProcessingTransferScreen({
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

function Splash() {
  return (
    <main className="splash">
      <div className="splash-glow" />
      <CedarMark light />
      <p>Banking, rooted in trust.</p>
      <span className="demo-chip">FICTIONAL DEMO BANK</span>
    </main>
  )
}

function Login({
  passwordVisible,
  setPasswordVisible,
  onLogin,
}: {
  passwordVisible: boolean
  setPasswordVisible: (v: boolean) => void
  onLogin: () => void
}) {
  return (
    <main className="login-page">
      <div className="login-top">
        <CedarMark light />
        <span className="secure-label">
          <ShieldCheck size={14} /> Secure demo
        </span>
        <div className="welcome">
          <span className="eyebrow light">WELCOME BACK</span>
          <h1>
            Good to see you,
            <br />
            Ada.
          </h1>
          <p>Sign in to your fictional Cedar account.</p>
        </div>
      </div>
      <section className="login-card">
        <div className="customer-row">
          <div className="avatar">AO</div>
          <div>
            <strong>Ada Okafor</strong>
            <span>Customer ID •••• 4102</span>
          </div>
          <button className="text-button">Switch</button>
        </div>
        <Field label="Demo password" hint="Use any password for this prototype">
          <div className="input-wrap">
            <TextInput
              type={passwordVisible ? "text" : "password"}
              defaultValue="cedar-demo"
            />
            <button
              className="input-action"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </Field>
        <button className="forgot">Forgot password?</button>
        <Button onClick={onLogin}>
          Sign in securely <ArrowRight size={18} />
        </Button>
        <button className="biometric" onClick={onLogin}>
          <Fingerprint size={26} />
          <span>
            <strong>Use demo biometrics</strong>
            <small>No real biometric data is collected</small>
          </span>
        </button>
        <p className="safety">
          <ShieldCheck size={15} /> This is a simulated banking environment.
          Never enter real credentials.
        </p>
      </section>
    </main>
  )
}

function HomeScreen({
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

function TransferScreen(props: {
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

function ReviewScreen({
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

function AuthorizeScreen({
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

function StatusScreen({
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
          className={`status-visual ${
            completed ? "ok" : failed ? "bad" : "pending"
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

function HistoryScreen({
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

function DetailsScreen({
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

function SupportScreen({
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

function ReportScreen({
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

function ComplaintConfirmation({
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

function ComplaintsScreen({
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

function CaseScreen({
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

function NotificationsScreen({
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

function BottomNav({
  current,
  onNavigate,
}: {
  current: Screen
  onNavigate: (s: Screen) => void
}) {
  const items: [Screen, typeof Home, string][] = [
    ["home", Home, "Home"],
    ["transfer", Send, "Transfer"],
    ["history", History, "History"],
    ["support", LifeBuoy, "Support"],
  ]
  return (
    <nav className="bottom-nav">
      {items.map(([id, Icon, label]) => (
        <button
          key={id}
          className={current === id ? "active" : ""}
          onClick={() => onNavigate(id)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function DemoSheet({
  scenario,
  setScenario,
  close,
}: {
  scenario: Scenario
  setScenario: (v: Scenario) => void
  close: () => void
}) {
  return (
    <div className="sheet-backdrop" onClick={close}>
      <section className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <div>
            <span className="eyebrow">DEMO-ONLY TOOL</span>
            <h2>Choose transfer scenario</h2>
          </div>
          <button className="icon-button" onClick={close}>
            <X size={20} />
          </button>
        </header>
        <p>
          This control is separate from Cedar's customer banking experience.
        </p>
        <div className="scenario-list">
          {scenarios.map((item) => (
            <button
              key={item.id}
              className={scenario === item.id ? "selected" : ""}
              onClick={() => setScenario(item.id)}
            >
              <span className="radio">{scenario === item.id && <i />}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          ))}
        </div>
        <Button onClick={close}>Use selected scenario</Button>
      </section>
    </div>
  )
}

function TransactionRow({
  item,
  onClick,
}: {
  item: Transaction
  onClick: () => void
}) {
  return (
    <button className="transaction-row" onClick={onClick}>
      <span className={`transaction-icon ${item.direction}`}>
        {item.direction === "credit" ? <ArrowDownLeft /> : <ArrowUpRight />}
      </span>
      <span className="transaction-main">
        <strong>{item.title}</strong>
        <small>{item.subtitle}</small>
        <StatusPill status={item.status} />
      </span>
      <strong className={item.direction}>
        {item.direction === "credit" ? "+" : "−"}
        {naira(item.amount)}
      </strong>
    </button>
  )
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong className={strong ? "emphasis" : ""}>{value}</strong>
    </div>
  )
}

function TimelineItem({
  done = false,
  active = false,
  title,
  copy,
  time,
}: {
  done?: boolean
  active?: boolean
  title: string
  copy: string
  time?: string
}) {
  return (
    <div
      className={`timeline-item ${done ? "done" : ""} ${
        active ? "active" : ""
      }`}
    >
      <span className="timeline-dot">
        {done ? <Check size={12} /> : active ? <Clock3 size={12} /> : null}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
        {time && <small>{time}</small>}
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode
  title: string
  action: () => void
}) {
  return (
    <button onClick={action}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <ArrowRight size={18} />
    </button>
  )
}

function Empty({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode
  title: string
  copy: string
}) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  )
}

export default App
