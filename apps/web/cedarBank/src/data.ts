export type Scenario =
  | "success"
  | "delay"
  | "uncertain"
  | "timeout"
  | "suspected-disruption"
  | "confirmed-disruption"
  | "complaint-credit"
  | "credit-during-investigation"
  | "failed"
  | "reversal"

export type TransactionStatus =
  | "Completed"
  | "Processing"
  | "Delayed"
  | "Outcome unknown"
  | "Failed"
  | "Reversal posted"

export type EvidenceRecord = {
  id: string
  transactionId: string
  source: "Cedar ledger" | "Payment gateway" | "Operations monitoring" | "Authorized status service"
  eventType:
    | "debit_recorded"
    | "instruction_acknowledged"
    | "response_timeout"
    | "route_degradation_observed"
    | "incident_confirmed"
    | "credit_confirmed"
    | "failure_confirmed"
    | "reversal_confirmed"
  timestamp: string
  details: string
  authority: "verified" | "observed" | "hypothesis"
}

export type Transaction = {
  id: string
  title: string
  subtitle: string
  amount: number
  direction: "credit" | "debit"
  status: TransactionStatus
  date: string
  bank?: string
  account?: string
  narration?: string
  scenario?: Scenario
  evidence?: EvidenceRecord[]
  processingCondition?: "normal" | "delayed"
  financialOutcome?: "unknown" | "credit_confirmed" | "failure_confirmed" | "reversal_posted"
  incidentStatus?: "none" | "suspected" | "confirmed"
  explanationLevel?: 1 | 2 | 3
  lastVerifiedUpdate?: string
}

export type CaseEvent = {
  id: string
  title: string
  detail: string
  time: string
  verified: boolean
}

export type CaseRecord = {
  id: string
  transactionId: string
  issue: string
  description: string
  createdAt: string
  updatedAt: string
  status: "Evidence review" | "Outcome verified"
  resolved: boolean
  finding:
    | "No cause identified yet"
    | "Possible processing issue"
    | "Suspected service disruption"
    | "Verified technical issue"
    | "Verified financial outcome"
  nextAction: string
  events: CaseEvent[]
}

export type NotificationRecord = {
  id: string
  transactionId: string
  caseId?: string
  title: string
  message: string
  time: string
  read: boolean
  kind: "information" | "warning" | "success"
}

export const baseTransactions: Transaction[] = [
  {
    id: "TX-CB-829104",
    title: "Shoprite Lekki",
    subtitle: "Card payment • Yesterday, 6:42 PM",
    amount: 18450,
    direction: "debit",
    status: "Completed",
    date: "Yesterday, 6:42 PM",
    financialOutcome: "credit_confirmed",
    processingCondition: "normal",
    incidentStatus: "none",
    explanationLevel: 3,
    lastVerifiedUpdate: "Yesterday, 6:42 PM",
  },
  {
    id: "TX-CB-829011",
    title: "Kemi Adesina",
    subtitle: "Transfer received • 18 Jun, 10:14 AM",
    amount: 25000,
    direction: "credit",
    status: "Completed",
    date: "18 Jun, 10:14 AM",
    financialOutcome: "credit_confirmed",
    processingCondition: "normal",
    incidentStatus: "none",
    explanationLevel: 3,
    lastVerifiedUpdate: "18 Jun, 10:14 AM",
  },
  {
    id: "TX-CB-828732",
    title: "MTN Airtime",
    subtitle: "Airtime • 17 Jun, 8:03 AM",
    amount: 5000,
    direction: "debit",
    status: "Completed",
    date: "17 Jun, 8:03 AM",
    financialOutcome: "credit_confirmed",
    processingCondition: "normal",
    incidentStatus: "none",
    explanationLevel: 3,
    lastVerifiedUpdate: "17 Jun, 8:03 AM",
  },
]

export const scenarios: { id: Scenario; label: string; detail: string }[] = [
  { id: "success", label: "Normal success", detail: "Credit confirmed immediately" },
  { id: "delay", label: "Brief processing delay", detail: "Processing, then confirmed credit" },
  { id: "uncertain", label: "Prolonged uncertainty", detail: "No conclusive financial outcome" },
  { id: "timeout", label: "Payment response timeout", detail: "Observed timeout; outcome remains unknown" },
  {
    id: "suspected-disruption",
    label: "Suspected route disruption",
    detail: "Unusual delays detected, under investigation",
  },
  {
    id: "confirmed-disruption",
    label: "Confirmed service disruption",
    detail: "Operational cause verified; outcome still unknown",
  },
  {
    id: "complaint-credit",
    label: "Complaint before completion",
    detail: "Transfer remains open while a complaint is filed",
  },
  {
    id: "credit-during-investigation",
    label: "Credit during investigation",
    detail: "Later evidence updates both transfer and case",
  },
  { id: "failed", label: "Confirmed failure", detail: "Failure confirmed by authorized evidence" },
  { id: "reversal", label: "Reversal posted", detail: "Debit independently reversed" },
]

export function createTransferEvidence(transactionId: string, scenario: Scenario): EvidenceRecord[] {
  const records: EvidenceRecord[] = [
    {
      id: `${transactionId}-E1`,
      transactionId,
      source: "Cedar ledger",
      eventType: "debit_recorded",
      timestamp: "Today, 10:30 AM",
      details: "The debit was recorded on the customer's Cedar account.",
      authority: "verified",
    },
    {
      id: `${transactionId}-E2`,
      transactionId,
      source: "Payment gateway",
      eventType: "instruction_acknowledged",
      timestamp: "Today, 10:30 AM",
      details: "The payment instruction was accepted for processing.",
      authority: "verified",
    },
  ]

  if (["uncertain", "timeout", "suspected-disruption", "confirmed-disruption", "complaint-credit", "credit-during-investigation"].includes(scenario)) {
    records.push({
      id: `${transactionId}-E3`,
      transactionId,
      source: "Payment gateway",
      eventType: "response_timeout",
      timestamp: "Today, 10:31 AM",
      details: "The final payment response was not received within the expected window.",
      authority: "observed",
    })
  }
  if (scenario === "suspected-disruption") {
    records.push({
      id: `${transactionId}-E4`,
      transactionId,
      source: "Operations monitoring",
      eventType: "route_degradation_observed",
      timestamp: "Today, 10:33 AM",
      details: "Monitoring detected unusual response delays on this payment route.",
      authority: "hypothesis",
    })
  }
  if (scenario === "confirmed-disruption") {
    records.push({
      id: `${transactionId}-E4`,
      transactionId,
      source: "Operations monitoring",
      eventType: "incident_confirmed",
      timestamp: "Today, 10:34 AM",
      details: "Authorized operations records confirmed a temporary processing disruption.",
      authority: "verified",
    })
  }
  if (scenario === "success") {
    records.push(creditEvidence(transactionId))
  }
  if (scenario === "failed") {
    records.push({
      id: `${transactionId}-E5`,
      transactionId,
      source: "Authorized status service",
      eventType: "failure_confirmed",
      timestamp: "Today, 10:32 AM",
      details: "The payment instruction was confirmed unsuccessful.",
      authority: "verified",
    })
  }
  if (scenario === "reversal") {
    records.push({
      id: `${transactionId}-E5`,
      transactionId,
      source: "Cedar ledger",
      eventType: "reversal_confirmed",
      timestamp: "Today, 10:34 AM",
      details: "A matching reversal credit was posted to the Cedar account.",
      authority: "verified",
    })
  }
  return records
}

export function creditEvidence(transactionId: string): EvidenceRecord {
  return {
    id: `${transactionId}-E5-CREDIT`,
    transactionId,
    source: "Authorized status service",
    eventType: "credit_confirmed",
    timestamp: "Today, 10:37 AM",
    details: "Authorized records confirm the beneficiary account was credited.",
    authority: "verified",
  }
}

export const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value)
