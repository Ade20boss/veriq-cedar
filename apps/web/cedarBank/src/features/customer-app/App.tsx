"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import {
  naira,
  type CaseRecord,
  type NotificationRecord,
  type Transaction,
} from "../../data"
import { BottomNav } from "./components/SharedComponents"
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
import { isCurrentNameEnquiry } from "./flow-guards.js"
import { parsePendingTransfer } from "./pending-transfer-runtime.js"
import type { PendingTransfer } from "./pending-transfer"
import {
  ApiError,
  customerApi,
  parseNairaToKobo,
  type Account,
  type Bank,
  type Complaint,
  type Transfer,
} from "../../lib/api"

const PENDING_TRANSFER_STORAGE_KEY = "cedar.pending-transfer.v1"

function readPendingTransfer(accountId: string): PendingTransfer | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(PENDING_TRANSFER_STORAGE_KEY)
  const value = parsePendingTransfer(raw, accountId)
  if (!value) window.localStorage.removeItem(PENDING_TRANSFER_STORAGE_KEY)
  return value
}

function storePendingTransfer(value: PendingTransfer) {
  window.localStorage.setItem(PENDING_TRANSFER_STORAGE_KEY, JSON.stringify(value))
}

function clearStoredPendingTransfer() {
  window.localStorage.removeItem(PENDING_TRANSFER_STORAGE_KEY)
}

export default function CustomerApp() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [previous, setPrevious] = useState<Screen>("home")
  const [balanceVisible, setBalanceVisible] = useState(true)
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
  const [narration, setNarration] = useState("Demo transfer")
  const [issue, setIssue] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [formError, setFormError] = useState("")
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [sessionError, setSessionError] = useState("")
  const [beneficiaryName, setBeneficiaryName] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(
    null,
  )
  const [balanceStale, setBalanceStale] = useState(false)
  const transferInFlight = useRef(false)
  const nameEnquiryGeneration = useRef(0)
  const nameEnquiryController = useRef<AbortController | null>(null)
  const bankRef = useRef(bank)
  const recipientAccountRef = useRef(recipientAccount)
  bankRef.current = bank
  recipientAccountRef.current = recipientAccount

  const invalidateNameEnquiry = () => {
    nameEnquiryGeneration.current += 1
    nameEnquiryController.current?.abort()
    nameEnquiryController.current = null
    setBeneficiaryName("")
  }

  const loadSession = useCallback(async () => {
    setLoading(true)
    try {
      const [nextAccount, nextBanks] = await Promise.all([
        customerApi.getAccount(),
        customerApi.getBanks(),
      ])
      setAccount(nextAccount)
      setBanks(nextBanks)
      setBalanceStale(false)
      setSessionError("")
      const recovered = readPendingTransfer(nextAccount.id)
      if (recovered) {
        setPendingTransfer(recovered)
        setIdempotencyKey(recovered.idempotencyKey)
        setBank(recovered.payload.beneficiary_bank_id)
        setRecipientAccount(recovered.payload.beneficiary_account_id)
        setAmount((recovered.payload.amount_kobo / 100).toFixed(2))
        setNarration(recovered.payload.narration ?? "")
        setBeneficiaryName(recovered.beneficiaryName)
        setFormError(
          "An earlier transfer request is unresolved. Retry the same request to recover its backend result, or explicitly start a different transfer.",
        )
        setScreen("authorize")
      } else {
        setScreen("home")
      }
    } catch (error) {
      setSessionError(
        error instanceof ApiError && error.status === 401
          ? "A Cedar demo session is required or has expired. Ask the demo operator to provision it, then retry."
          : error instanceof ApiError
            ? error.message
            : "Cedar banking is unavailable.",
      )
      setScreen("login")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

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

  const transferToTransaction = (
    transfer: Transfer,
    metadata?: Pick<Transaction, "title" | "narration">,
  ): Transaction => {
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
      title: metadata?.title || transfer.beneficiary_account_id,
      subtitle: `Bank transfer • ${new Date(transfer.created_at).toLocaleString()}`,
      amount: transfer.amount_kobo / 100,
      direction: "debit",
      status,
      date: new Date(transfer.created_at).toLocaleString(),
      bank:
        banks.find((item) => item.bank_id === transfer.beneficiary_bank_id)
          ?.name ?? transfer.beneficiary_bank_id,
      account: transfer.beneficiary_account_id,
      narration: metadata?.narration,
      reference: transfer.reference,
      processingStage: transfer.processing_stage,
      updatedAt: new Date(transfer.updated_at).toLocaleString(),
      beneficiaryBankId: transfer.beneficiary_bank_id,
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

  const complaintToCase = (complaint: Complaint, issueLabel: string): CaseRecord => ({
    id: complaint.id,
    reference: complaint.reference,
    transactionId: complaint.transfer_id,
    issue: issueLabel,
    description: complaint.customer_report,
    createdAt: new Date(complaint.created_at).toLocaleString(),
    updatedAt: new Date(complaint.created_at).toLocaleString(),
    status:
      complaint.status === "WAITING_FOR_EVIDENCE"
        ? "Waiting for evidence"
        : complaint.status === "INVESTIGATING"
          ? "Investigating"
          : complaint.status === "RESOLVED"
            ? "Resolved"
            : "Open",
    resolved: complaint.status === "RESOLVED",
    finding: "No cause identified yet",
    nextAction: complaint.customer_safe_updates.length
      ? complaint.customer_safe_updates[complaint.customer_safe_updates.length - 1]
      : "No customer-safe investigation update has been published yet.",
    customerSafeUpdates: complaint.customer_safe_updates,
    events: [
      {
        id: `${complaint.id}-received`,
        title: "Complaint received",
        detail: "Cedar stored your report and linked it to this transfer.",
        time: new Date(complaint.created_at).toLocaleString(),
        verified: true,
      },
    ],
  })

  const addNotification = (notification: NotificationRecord) => {
    setNotifications((current) =>
      current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current],
    )
  }

  const submitTransfer = async () => {
    if (transferInFlight.current) return
    if (!account) {
      setFormError("Enter a valid amount.")
      return
    }
    const recovered = pendingTransfer ?? (account ? readPendingTransfer(account.id) : null)
    const amountKobo = recovered?.payload.amount_kobo ?? parseNairaToKobo(amount)
    if (!amountKobo) {
      setFormError("Enter a valid amount.")
      return
    }
    setFormError("")
    transferInFlight.current = true
    setLoading(true)
    setScreen("submitting")
    const key = recovered?.idempotencyKey || idempotencyKey || crypto.randomUUID()
    const payload = recovered?.payload ?? {
      beneficiary_bank_id: bank,
      beneficiary_account_id: recipientAccount,
      amount_kobo: amountKobo,
      narration,
    }
    const intent: PendingTransfer = recovered ?? {
      originatingAccountId: account.id,
      idempotencyKey: key,
      payload,
      beneficiaryName,
      createdAt: Date.now(),
    }
    setPendingTransfer(intent)
    setIdempotencyKey(key)
    storePendingTransfer(intent)
    try {
      const result = await customerApi.createTransfer(payload, key)
      const mapped = transferToTransaction(result, {
        title: intent.beneficiaryName,
        narration: payload.narration,
      })
      setTransactions((current) => [mapped, ...current])
      setSelectedId(mapped.id)
      clearStoredPendingTransfer()
      setPendingTransfer(null)
      setIdempotencyKey("")
      try {
        setAccount(await customerApi.getAccount())
        setBalanceStale(false)
      } catch {
        setBalanceStale(true)
      }
      setScreen("status")
    } catch (error) {
      setScreen("authorize")
      setFormError(
        error instanceof ApiError && error.status === 0
          ? "The transfer response is uncertain. Retry this same transfer to safely reuse its idempotency key."
          : error instanceof ApiError
          ? error.message
          : "The transfer response is ambiguous. Retry with the same request.",
      )
    } finally {
      transferInFlight.current = false
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const result = await customerApi.getTransfer(selected.id)
      setTransactions((items) =>
        items.map((item) =>
          item.id === selected.id ? transferToTransaction(result, item) : item,
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

  const submitComplaint = async () => {
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
    const report = [issue, description.trim()].filter(Boolean).join(" — ")
    if (report.length < 5) {
      setFormError("Describe the issue in at least 5 characters")
      return
    }
    setLoading(true)
    try {
      const complaint = await customerApi.createComplaint({
        transfer_id: selected.id,
        description: report,
      })
      const caseRecord = complaintToCase(complaint, issue)
      setCases((current) => [caseRecord, ...current])
      setFormError("")
      navigate("complaint-confirmation")
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "The complaint could not be saved.",
      )
    } finally {
      setLoading(false)
    }
  }

  const refreshComplaint = async () => {
    const current = cases.find((item) => item.transactionId === selectedId)
    if (!current) return
    setLoading(true)
    try {
      const complaint = await customerApi.getComplaint(current.id)
      setCases((items) =>
        items.map((item) =>
          item.id === current.id
            ? complaintToCase(complaint, item.issue)
            : item,
        ),
      )
      setToast("Complaint status refreshed")
    } catch (error) {
      setToast(error instanceof ApiError ? error.message : "Complaint status could not be loaded")
    } finally {
      setLoading(false)
    }
  }

  const openDetails = (id: string) => {
    setSelectedId(id)
    navigate("details")
  }

  if (screen === "splash") return <Splash />
  if (screen === "login")
    return (
      <Login
        onLogin={() => void loadSession()}
        loading={loading}
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
              navigator.clipboard?.writeText(account?.display_account_id ?? "")
              setToast("Account number copied")
            }}
            hasUpdate={notifications.some((item) => !item.read)}
            ownerName={account?.owner_display_name ?? "Cedar customer"}
            displayAccountId={account?.display_account_id ?? "Unavailable"}
            balanceStale={balanceStale}
          />
        )}
        {screen === "transfer" && (
          <TransferScreen
            balance={(account?.available_balance_kobo ?? 0) / 100}
            bank={bank}
            setBank={(value) => {
              setBank(value)
              invalidateNameEnquiry()
            }}
            account={recipientAccount}
            setAccount={(value) => {
              setRecipientAccount(value)
              invalidateNameEnquiry()
            }}
            amount={amount}
            setAmount={(value) => {
              setAmount(value)
            }}
            narration={narration}
            setNarration={(value) => {
              setNarration(value)
            }}
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
                const requestedBank = bank
                const requestedAccount = recipientAccount
                const requestId = ++nameEnquiryGeneration.current
                nameEnquiryController.current?.abort()
                const controller = new AbortController()
                nameEnquiryController.current = controller
                setLoading(true)
                customerApi
                  .enquireName(
                    { bank_id: requestedBank, account_id: requestedAccount },
                    controller.signal,
                  )
                  .then((result) => {
                    if (
                      !isCurrentNameEnquiry(
                        {
                          bankId: requestedBank,
                          accountId: requestedAccount,
                          generation: requestId,
                        },
                        {
                          bankId: bankRef.current,
                          accountId: recipientAccountRef.current,
                          generation: nameEnquiryGeneration.current,
                        },
                      )
                    ) return
                    setBeneficiaryName(result.beneficiary_name)
                    setFormError("")
                    navigate("review")
                  })
                  .catch((error: unknown) =>
                    isCurrentNameEnquiry(
                      {
                        bankId: requestedBank,
                        accountId: requestedAccount,
                        generation: requestId,
                      },
                      {
                        bankId: bankRef.current,
                        accountId: recipientAccountRef.current,
                        generation: nameEnquiryGeneration.current,
                      },
                    ) &&
                      (error as { name?: string } | null)?.name !== "AbortError" &&
                      setFormError(
                        error instanceof ApiError
                          ? error.message
                          : "Beneficiary name enquiry failed",
                      ),
                  )
                  .finally(() => {
                    if (requestId === nameEnquiryGeneration.current) {
                      nameEnquiryController.current = null
                      setLoading(false)
                    }
                  })
              } else {
                setFormError("")
                navigate("review")
              }
            }}
            sourceAccount={account?.display_account_id ?? "Cedar account"}
          />
        )}
        {screen === "review" && (
          <ReviewScreen
            bank={bank}
            account={recipientAccount}
            amount={Number(amount)}
            narration={narration}
            beneficiaryName={beneficiaryName}
            sourceAccount={account?.display_account_id ?? "Cedar account"}
            onBack={() => navigate("transfer")}
            onConfirm={() => navigate("authorize")}
          />
        )}
        {screen === "authorize" && (
          <AuthorizeScreen
            amount={Number(amount)}
            beneficiaryName={beneficiaryName}
            error={formError}
            loading={loading}
            recovery={Boolean(pendingTransfer)}
            onBack={() => (pendingTransfer ? setFormError("This request is unresolved. Retry it or start a different transfer.") : navigate("review"))}
            onStartNewTransfer={() => {
              clearStoredPendingTransfer()
              setPendingTransfer(null)
              setIdempotencyKey("")
              setFormError("")
              navigate("transfer")
            }}
            onSubmit={submitTransfer}
          />
        )}
        {screen === "submitting" && (
          <ProcessingTransferScreen
            amount={Number(amount)}
            recipient={beneficiaryName}
            bank={banks.find((item) => item.bank_id === bank)?.name ?? bank}
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
            onSubmit={() => void submitComplaint()}
            onViewCase={() => navigate("case")}
            loading={loading}
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
              onRefresh={() => void refreshComplaint()}
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
