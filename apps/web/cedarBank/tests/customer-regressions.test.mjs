import assert from "node:assert/strict"
import test from "node:test"
import { isCurrentNameEnquiry } from "../src/features/customer-app/flow-guards.js"
import { parsePendingTransfer } from "../src/features/customer-app/pending-transfer-runtime.js"
import { getTransactionInsight } from "../src/features/customer-app/transaction-insights.js"

const current = (bankId, accountId, generation) => ({ bankId, accountId, generation })

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

  assert.deepEqual(accepted, [{ bankId: "ELM", accountId: "ELM-ACC-002", name: "Latest" }])
  assert.equal(isCurrentNameEnquiry(elmA, current("ELM", "ELM-ACC-002", 2)), false)
  assert.equal(isCurrentNameEnquiry(elmB, current("ELM", "ELM-ACC-002", 2)), true)

  selected = current(birchB.bankId, birchB.accountId, birchB.generation)
  assert.equal(isCurrentNameEnquiry(elmB, selected), false)
  assert.equal(isCurrentNameEnquiry(birchB, current("BIR", "BIR-ACC-002", 3)), true)
})

test("stale name-enquiry failures cannot replace the latest request", async () => {
  const first = deferred()
  let selected = current("ELM", "ELM-ACC-001", 1)
  let error = ""
  first.promise.catch((caught) => {
    if (isCurrentNameEnquiry({ bankId: "ELM", accountId: "ELM-ACC-001", generation: 1 }, selected)) {
      error = caught.message
    }
  })
  selected = current("ELM", "ELM-ACC-002", 2)
  first.reject(new Error("stale failure"))
  await first.promise.catch(() => {})
  assert.equal(error, "")
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
  assert.equal(parsePendingTransfer(record, "CED-ACC-001")?.idempotencyKey, "same-request-key")
  assert.equal(parsePendingTransfer(record, "CED-ACC-002"), null)
  assert.equal(parsePendingTransfer(record.replace("originatingAccountId", "legacyAccount"), "CED-ACC-001"), null)
})
