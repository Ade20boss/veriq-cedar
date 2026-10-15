export type Bank = { bank_id: string; name: string; is_fictional: boolean }
export type Account = {
  id: string
  display_account_id: string
  currency: "NGN"
  available_balance_kobo: number
  owner_display_name: string
}
export type NameEnquiryResult = {
  bank_id: string
  account_id: string
  beneficiary_name: string
  verified_in_simulation: boolean
}
export type Transfer = {
  id: string
  reference: string
  amount_kobo: number
  beneficiary_bank_id: string
  beneficiary_account_id: string
  processing_stage: "CREATED" | "VALIDATED" | "DEBIT_POSTED" | "SUBMITTED" | "ACKNOWLEDGED" | "RESPONSE_TIMEOUT" | "STATUS_QUERIED" | "COMPLETED"
  financial_outcome: "UNKNOWN" | "CREDIT_CONFIRMED" | "FAILURE_CONFIRMED" | "REVERSAL_POSTED"
  last_evidence_id?: string | null
  created_at: string
  updated_at: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "")

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: { Accept: "application/json", ...init.headers },
    })
  } catch {
    throw new ApiError(
      0,
      "BACKEND_UNAVAILABLE",
      "Cedar banking is currently unavailable.",
    )
  }
  if (!response.ok) {
    let body: { error?: { code?: string; message?: string } } = {}
    try {
      body = await response.json()
    } catch {
      /* generic message below */
    }
    throw new ApiError(
      response.status,
      body.error?.code ??
        (response.status === 401 ? "SESSION_REQUIRED" : "REQUEST_FAILED"),
      body.error?.message ?? "The banking request could not be completed.",
    )
  }
  return (await response.json()) as T
}

export const customerApi = {
  getAccount: () => request<Account>("/v1/cedar/accounts/me"),
  getBanks: () => request<Bank[]>("/v1/cedar/banks"),
  enquireName: (input: { bank_id: string; account_id: string }) =>
    request<NameEnquiryResult>("/v1/cedar/name-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  createTransfer: (
    input: {
      beneficiary_bank_id: string
      beneficiary_account_id: string
      amount_kobo: number
      narration?: string
    },
    idempotencyKey: string,
  ) =>
    request<Transfer>("/v1/cedar/transfers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(input),
    }),
  getTransfer: (transferId: string) =>
    request<Transfer>(`/v1/cedar/transfers/${encodeURIComponent(transferId)}`),
}

export function parseNairaToKobo(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "")
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const [whole, fraction = ""] = normalized.split(".")
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null
}
