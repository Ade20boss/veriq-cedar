const LEGACY_STORAGE_KEY = "cedar.pending-transfer.v1"
const ACCOUNT_STORAGE_PREFIX = "cedar.pending-transfer.v2."

function accountStorageKey(accountId) {
  return ACCOUNT_STORAGE_PREFIX + encodeURIComponent(accountId)
}

export function parsePendingTransfer(raw, currentAccountId) {
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
      !Number.isFinite(value.createdAt) ||
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

export function readPendingTransfer(storage, accountId) {
  const own = parsePendingTransfer(
    storage.getItem(accountStorageKey(accountId)),
    accountId,
  )
  if (own) return own

  const legacy = parsePendingTransfer(
    storage.getItem(LEGACY_STORAGE_KEY),
    accountId,
  )
  if (!legacy) return null
  storage.setItem(accountStorageKey(accountId), JSON.stringify(legacy))
  storage.removeItem(LEGACY_STORAGE_KEY)
  return legacy
}

export function storePendingTransfer(storage, value) {
  storage.setItem(
    accountStorageKey(value.originatingAccountId),
    JSON.stringify(value),
  )
}

export function clearStoredPendingTransfer(storage, accountId) {
  storage.removeItem(accountStorageKey(accountId))
  if (parsePendingTransfer(storage.getItem(LEGACY_STORAGE_KEY), accountId)) {
    storage.removeItem(LEGACY_STORAGE_KEY)
  }
}
