import assert from "node:assert/strict"
import test from "node:test"
import {
  isCurrentCaseResponse,
  nextCaseRefresh,
  scheduleCaseRefresh,
} from "../src/app/(frontend)/components/case-refresh-runtime.js"

test("AI pending polls with bounded backoff and stops after eight checks", () => {
  assert.equal(nextCaseRefresh("AI_PENDING", 0, 0, 0), 2000)
  assert.equal(nextCaseRefresh("AI_PENDING", 2, 0, 2), 8000)
  assert.equal(nextCaseRefresh("AI_PENDING", 8, 0, 0), null)
  assert.equal(nextCaseRefresh("FINDINGS_READY", 0, 0, 0), null)
})

test("AI unavailable gets one delayed recheck then waits for manual refresh", () => {
  assert.equal(nextCaseRefresh("EVIDENCE_READY_AI_UNAVAILABLE", 0, 0, 0), 15000)
  assert.equal(nextCaseRefresh("EVIDENCE_READY_AI_UNAVAILABLE", 0, 1, 0), null)
  assert.equal(nextCaseRefresh("AI_PENDING", 0, 1, 0), 2000)
})

test("case switch rejects stale and mismatched case responses", () => {
  assert.equal(isCurrentCaseResponse(1, 2, "case-a", "case-a"), false)
  assert.equal(isCurrentCaseResponse(2, 2, "case-b", "case-a"), false)
  assert.equal(isCurrentCaseResponse(2, 2, "case-b", "case-b"), true)
})

test("unmount cleanup cancels scheduled refresh", () => {
  let callback
  let cancelled = false
  const timers = {
    setTimeout: (run) => {
      callback = run
      return 42
    },
    clearTimeout: (id) => {
      assert.equal(id, 42)
      cancelled = true
    },
  }
  const cleanup = scheduleCaseRefresh(
    () => {
      throw new Error("must not run")
    },
    2000,
    timers,
  )
  assert.equal(typeof callback, "function")
  cleanup()
  assert.equal(cancelled, true)
})
