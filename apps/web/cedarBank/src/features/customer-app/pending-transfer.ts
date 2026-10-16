export type PendingTransferPayload = {
  beneficiary_bank_id: string
  beneficiary_account_id: string
  amount_kobo: number
  narration?: string
}

export type PendingTransfer = {
  originatingAccountId: string
  idempotencyKey: string
  payload: PendingTransferPayload
  beneficiaryName: string
  createdAt: number
}
