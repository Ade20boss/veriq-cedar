"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
    baseTransactions,
    createTransferEvidence,
    creditEvidence,
    naira,
    type CaseRecord,
    type NotificationRecord,
    type Scenario,
    type Transaction,
} from "../../data"
import { accountNumber } from "./constants"
import { BottomNav, DemoSheet } from "./components/SharedComponents"
import { Login, Splash } from "./screens/AuthScreens"
import {
    DetailsScreen,
    HistoryScreen,
    HomeScreen,
} from "./screens/ActivityScreens"
import {
    AuthorizeScreen,
    ProcessingTransferScreen,
    ReviewScreen,
    StatusScreen,
    TransferScreen,
} from "./screens/TransferScreens"
import {
    CaseScreen,
    ComplaintConfirmation,
    ComplaintsScreen,
    NotificationsScreen,
    ReportScreen,
    SupportScreen,
} from "./screens/SupportScreens"
import type { Screen } from "./types"

export default function CustomerApp() {
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
