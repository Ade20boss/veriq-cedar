export function parsePendingTransfer(raw, currentAccountId, now = Date.now()) {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    const payload = value?.payload
    if (
      !value ||
      typeof value.originatingAccountId !== "string" ||
      value.originatingAccountId !== currentAccountId ||
      typeof value.idempotencyKey !== "string" ||
      typeof value.beneficiaryName !== "string" ||
      typeof value.createdAt !== "number" ||
      now - value.createdAt > 24 * 60 * 60 * 1000 ||
      !payload ||
      typeof payload.beneficiary_bank_id !== "string" ||
      typeof payload.beneficiary_account_id !== "string" ||
      !Number.isSafeInteger(payload.amount_kobo) ||
      payload.amount_kobo <= 0
    ) {
      return null
    }
    return value
  } catch {
    return null
  }
}
