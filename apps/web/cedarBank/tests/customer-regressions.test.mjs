import assert from "node:assert/strict"
import test from "node:test"
import {
  cancelNameEnquiry,
  disposeNameEnquiry,
  isCurrentNameEnquiry,
  startNameEnquiry,
} from "../src/features/customer-app/flow-guards.js"
import {
  clearStoredPendingTransfer,
  parsePendingTransfer,
  readPendingTransfer,
  storePendingTransfer,
} from "../src/features/customer-app/pending-transfer-runtime.js"
import { getTransactionInsight } from "../src/features/customer-app/transaction-insights.js"

const current = (bankId, accountId, generation) => ({
  bankId,
  accountId,
  generation,
})

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

test("out-of-order name enquiries accept only the latest snapshot", async () => {
  const elmA = { bankId: "ELM", accountId: "ELM-ACC-001", generation: 1 }
  const elmB = { bankId: "ELM", accountId: "ELM-ACC-002", generation: 2 }
  const birchB = { bankId: "BIR", accountId: "BIR-ACC-002", generation: 3 }

  const first = deferred()
  const second = deferred()
  let selected = current(elmA.bankId, elmA.accountId, elmA.generation)
  const accepted = []
  const consume = (snapshot, request) =>
    request.promise.then((result) => {
      if (isCurrentNameEnquiry(snapshot, selected)) accepted.push(result)
    })

  consume(elmA, first)
  selected = current(elmB.bankId, elmB.accountId, elmB.generation)
  consume(elmB, second)
  second.resolve({ bankId: "ELM", accountId: "ELM-ACC-002", name: "Latest" })
  await second.promise
  first.resolve({ bankId: "ELM", accountId: "ELM-ACC-001", name: "Stale" })
  await first.promise

  assert.deepEqual(accepted, [
    { bankId: "ELM", accountId: "ELM-ACC-002", name: "Latest" },
  ])
  assert.equal(
    isCurrentNameEnquiry(elmA, current("ELM", "ELM-ACC-002", 2)),
    false,
  )
  assert.equal(
    isCurrentNameEnquiry(elmB, current("ELM", "ELM-ACC-002", 2)),
    true,
  )

  selected = current(birchB.bankId, birchB.accountId, birchB.generation)
  assert.equal(isCurrentNameEnquiry(elmB, selected), false)
  assert.equal(
    isCurrentNameEnquiry(birchB, current("BIR", "BIR-ACC-002", 3)),
    true,
  )
})

test("stale name-enquiry failures cannot replace the latest request", async () => {
  const first = deferred()
  let selected = current("ELM", "ELM-ACC-001", 1)
  let error = ""
  first.promise.catch((caught) => {
    if (
      isCurrentNameEnquiry(
        { bankId: "ELM", accountId: "ELM-ACC-001", generation: 1 },
        selected,
      )
    ) {
      error = caught.message
    }
  })
  selected = current("ELM", "ELM-ACC-002", 2)
  first.reject(new Error("stale failure"))
  await first.promise.catch(() => {})
  assert.equal(error, "")
})

test("cancelled enquiry clears loading and a fresh enquiry can complete", async () => {
  const first = deferred()
  const second = deferred()
  const generation = { current: 0 }
  const controller = { current: null }
  let selectedAccount = "ELM-ACC-001"
  let loading = false
  let acceptedName = ""
  const calls = []
  const submit = (accountId, response) =>
    startNameEnquiry({
      generationRef: generation,
      controllerRef: controller,
      bankId: "ELM",
      accountId,
      getSelection: () => ({ bankId: "ELM", accountId: selectedAccount }),
      enquire: (payload, signal) => {
        calls.push({ payload, signal })
        return response.promise
      },
      setLoading: (value) => {
        loading = value
      },
      onSuccess: (result) => {
        acceptedName = result.beneficiary_name
      },
      onError: (error) => {
        throw error
      },
    })

  const firstResult = submit("ELM-ACC-001", first)
  assert.equal(loading, true)
  const firstSignal = calls[0].signal

  selectedAccount = "ELM-ACC-002"
  cancelNameEnquiry(generation, controller, () => {
    loading = false
  })
  assert.equal(firstSignal.aborted, true)
  assert.equal(loading, false)

  const secondResult = submit("ELM-ACC-002", second)
  assert.deepEqual(calls[1].payload, {
    bank_id: "ELM",
    account_id: "ELM-ACC-002",
  })
  assert.equal(loading, true)
  first.resolve({ beneficiary_name: "Stale" })
  await firstResult
  assert.equal(loading, true)
  second.resolve({ beneficiary_name: "Fresh" })
  await secondResult
  assert.equal(acceptedName, "Fresh")
  assert.equal(loading, false)
})

test("unmount aborts an enquiry without accepting a late result or updating loading", async () => {
  const response = deferred()
  const generation = { current: 0 }
  const controller = { current: null }
  const loadingUpdates = []
  let accepted = false
  const pending = startNameEnquiry({
    generationRef: generation,
    controllerRef: controller,
    bankId: "ELM",
    accountId: "ELM-ACC-009",
    getSelection: () => ({ bankId: "ELM", accountId: "ELM-ACC-009" }),
    enquire: () => response.promise,
    setLoading: (value) => loadingUpdates.push(value),
    onSuccess: () => {
      accepted = true
    },
    onError: () => {
      throw new Error("unexpected")
    },
  })
  const signal = controller.current.signal
  disposeNameEnquiry(generation, controller)
  response.resolve({ beneficiary_name: "Late" })
  await pending
  assert.equal(signal.aborted, true)
  assert.equal(accepted, false)
  assert.deepEqual(loadingUpdates, [true])
})

test("transaction insights use processing stage and preserve UNKNOWN", () => {
  const timeout = getTransactionInsight(
    {
      id: "transfer-1",
      title: "Elm beneficiary",
      subtitle: "Bank transfer",
      amount: 50000,
      direction: "debit",
      status: "Delayed",
      date: "now",
      processingStage: "RESPONSE_TIMEOUT",
      financialOutcome: "unknown",
    },
    false,
  )
  assert.equal(timeout.hasTimeout, true)
  assert.match(timeout.summary, /sender debit/i)
  assert.match(timeout.summary, /final payment outcome is still unknown/i)
  assert.doesNotMatch(timeout.summary, /credited|failed|reversal|refund/i)

  const processing = getTransactionInsight(
    {
      id: "transfer-2",
      title: "Elm beneficiary",
      subtitle: "Bank transfer",
      amount: 50000,
      direction: "debit",
      status: "Processing",
      date: "now",
      processingStage: "SUBMITTED",
      financialOutcome: "unknown",
    },
    false,
  )
  assert.equal(processing.hasTimeout, false)
  assert.doesNotMatch(processing.summary, /response timed out/i)
})

test("pending transfer recovery requires the originating account", () => {
  const record = JSON.stringify({
    originatingAccountId: "CED-ACC-001",
    idempotencyKey: "same-request-key",
    payload: {
      beneficiary_bank_id: "ELM",
      beneficiary_account_id: "ELM-ACC-009",
      amount_kobo: 5000000,
    },
    beneficiaryName: "Elm beneficiary (fictional)",
    createdAt: Date.now(),
  })
  assert.equal(
    parsePendingTransfer(record, "CED-ACC-001")?.idempotencyKey,
    "same-request-key",
  )
  assert.equal(parsePendingTransfer(record, "CED-ACC-002"), null)
  assert.equal(
    parsePendingTransfer(
      record.replace("originatingAccountId", "legacyAccount"),
      "CED-ACC-001",
    ),
    null,
  )
  assert.equal(parsePendingTransfer("{malformed", "CED-ACC-001"), null)
  assert.equal(
    parsePendingTransfer(record.replace("5000000", "-1"), "CED-ACC-001"),
    null,
  )
})

test("account switching preserves unresolved keys without cross-account recovery or a 24-hour expiry", () => {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  }
  const a = {
    originatingAccountId: "CED-ACC-001",
    idempotencyKey: "original-key",
    payload: {
      beneficiary_bank_id: "ELM",
      beneficiary_account_id: "ELM-ACC-009",
      amount_kobo: 5000000,
    },
    beneficiaryName: "Fictional beneficiary",
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
  }
  storage.setItem("cedar.pending-transfer.v1", JSON.stringify(a))
  assert.equal(readPendingTransfer(storage, "CED-ACC-002"), null)
  assert.equal(storage.getItem("cedar.pending-transfer.v1"), JSON.stringify(a))
  assert.equal(
    readPendingTransfer(storage, "CED-ACC-001")?.idempotencyKey,
    "original-key",
  )
  assert.equal(storage.getItem("cedar.pending-transfer.v1"), null)

  const b = {
    ...a,
    originatingAccountId: "CED-ACC-002",
    idempotencyKey: "other-key",
  }
  storePendingTransfer(storage, b)
  assert.equal(
    readPendingTransfer(storage, "CED-ACC-002")?.idempotencyKey,
    "other-key",
  )
  clearStoredPendingTransfer(storage, "CED-ACC-002")
  assert.equal(readPendingTransfer(storage, "CED-ACC-002"), null)
  assert.equal(
    readPendingTransfer(storage, "CED-ACC-001")?.idempotencyKey,
    "original-key",
  )
})
