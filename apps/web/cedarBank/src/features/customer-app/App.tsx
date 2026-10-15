"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
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
import {
  ApiError,
  customerApi,
  parseNairaToKobo,
  type Account,
  type Bank,
  type Transfer,
} from "../../lib/api"

export default function CustomerApp() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [previous, setPrevious] = useState<Screen>("home")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [scenario, setScenario] = useState<Scenario>("uncertain")
  const [demoOpen, setDemoOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [bank, setBank] = useState("")
  const [recipientAccount, setRecipientAccount] = useState("")
  const [amount, setAmount] = useState("50000")
  const [narration, setNarration] = useState("For Tolu")
  const [pin, setPin] = useState("1234")
  const [issue, setIssue] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [formError, setFormError] = useState("")
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [sessionError, setSessionError] = useState("")
  const [beneficiaryName, setBeneficiaryName] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState("")

  useEffect(() => {
    let cancelled = false
    Promise.all([customerApi.getAccount(), customerApi.getBanks()])
      .then(([nextAccount, nextBanks]) => {
        if (cancelled) return
        setAccount(nextAccount)
        setBanks(nextBanks)
        setScreen("home")
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSessionError(
          error instanceof ApiError && error.status === 401
            ? "A Cedar demo session is required. Start the backend with a server-provisioned cedar_demo_session cookie, then retry."
            : error instanceof ApiError
              ? error.message
              : "Cedar banking is unavailable.",
        )
        setScreen("login")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selected = transactions.find((item) => item.id === selectedId)
  const resolved = Boolean(beneficiaryName)

  const navigate = (next: Screen) => {
    setPrevious(screen)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const transferToTransaction = (transfer: Transfer): Transaction => {
    const status: Transaction["status"] =
      transfer.financial_outcome === "CREDIT_CONFIRMED"
        ? "Completed"
        : transfer.financial_outcome === "FAILURE_CONFIRMED"
          ? "Failed"
          : transfer.financial_outcome === "REVERSAL_POSTED"
            ? "Reversal posted"
            : transfer.processing_stage === "RESPONSE_TIMEOUT"
              ? "Delayed"
              : "Processing"
    return {
      id: transfer.id,
      title: beneficiaryName || "Beneficiary",
      subtitle: `Bank transfer • ${new Date(transfer.created_at).toLocaleString()}`,
      amount: transfer.amount_kobo / 100,
      direction: "debit",
      status,
      date: new Date(transfer.created_at).toLocaleString(),
      bank:
        banks.find((item) => item.bank_id === transfer.beneficiary_bank_id)
          ?.name ?? transfer.beneficiary_bank_id,
      account: transfer.beneficiary_account_id,
      narration,
      reference: transfer.reference,
      processingStage: transfer.processing_stage,
      updatedAt: new Date(transfer.updated_at).toLocaleString(),
      financialOutcome:
        transfer.financial_outcome === "CREDIT_CONFIRMED"
          ? "credit_confirmed"
          : transfer.financial_outcome === "FAILURE_CONFIRMED"
            ? "failure_confirmed"
            : transfer.financial_outcome === "REVERSAL_POSTED"
              ? "reversal_posted"
              : "unknown",
      processingCondition:
        transfer.processing_stage === "RESPONSE_TIMEOUT" ? "delayed" : "normal",
    }
  }

  const addNotification = (notification: NotificationRecord) => {
    setNotifications((current) =>
      current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current],
    )
  }

  const submitTransfer = async () => {
    const amountKobo = parseNairaToKobo(amount)
    if (!amountKobo || !account) {
      setFormError("Enter a valid amount.")
      return
    }
    setFormError("")
    setLoading(true)
    setScreen("submitting")
    const key = idempotencyKey || crypto.randomUUID()
    setIdempotencyKey(key)
    try {
      const result = await customerApi.createTransfer(
        {
          beneficiary_bank_id: bank,
          beneficiary_account_id: recipientAccount,
          amount_kobo: amountKobo,
          narration,
        },
        key,
      )
      const mapped = transferToTransaction(result)
      setTransactions((current) => [mapped, ...current])
      setSelectedId(mapped.id)
      setLoading(false)
      setScreen("status")
    } catch (error) {
      setLoading(false)
      setScreen("authorize")
      setFormError(
        error instanceof ApiError
          ? error.message
          : "The transfer response is ambiguous. Retry with the same request.",
      )
    }
  }

  const checkStatus = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const result = await customerApi.getTransfer(selected.id)
      setTransactions((items) =>
        items.map((item) =>
          item.id === selected.id ? transferToTransaction(result) : item,
        ),
      )
      setToast("Latest status loaded")
    } catch (error) {
      setToast(
        error instanceof ApiError
          ? error.message
          : "Status could not be loaded",
      )
    } finally {
      setLoading(false)
    }
  }

  const submitComplaint = () => {
    if (!selected) return
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
        onLogin={() => {
          setSessionError(
            "A server-provisioned Cedar demo session is required; retry after starting the backend session.",
          )
        }}
        error={sessionError}
      />
    )

  const showNav = ["home", "history", "support"].includes(screen)
  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === "home" && (
          <HomeScreen
            balance={(account?.available_balance_kobo ?? 0) / 100}
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
            balance={(account?.available_balance_kobo ?? 0) / 100}
            bank={bank}
            setBank={(value) => {
              setBank(value)
              setBeneficiaryName("")
              setIdempotencyKey("")
            }}
            account={recipientAccount}
            setAccount={(value) => {
              setRecipientAccount(value)
              setBeneficiaryName("")
              setIdempotencyKey("")
            }}
            amount={amount}
            setAmount={(value) => {
              setAmount(value)
              setIdempotencyKey("")
            }}
            narration={narration}
            setNarration={setNarration}
            resolved={resolved}
            beneficiaryName={beneficiaryName}
            banks={banks}
            loading={loading}
            error={formError}
            onBack={() => navigate("home")}
            onContinue={() => {
              const amountKobo = parseNairaToKobo(amount)
              if (!bank) setFormError("Select a recipient bank")
              else if (!recipientAccount)
                setFormError("Enter a beneficiary account")
              else if (
                !amountKobo ||
                amountKobo > (account?.available_balance_kobo ?? 0)
              )
                setFormError(
                  "Enter a valid amount within your available balance",
                )
              else if (!resolved) {
                setLoading(true)
                customerApi
                  .enquireName({ bank_id: bank, account_id: recipientAccount })
                  .then((result) => {
                    setBeneficiaryName(result.beneficiary_name)
                    setFormError("")
                    navigate("review")
                  })
                  .catch((error: unknown) =>
                    setFormError(
                      error instanceof ApiError
                        ? error.message
                        : "Beneficiary name enquiry failed",
                    ),
                  )
                  .finally(() => setLoading(false))
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
            beneficiaryName={beneficiaryName}
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
              if (transactions[0]) {
                setSelectedId(transactions[0].id)
                navigate("report")
              }
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
        {screen === "complaint-confirmation" && cases[0] && selected && (
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
          selected &&
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
