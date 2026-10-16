import assert from "node:assert/strict"
import test from "node:test"
import { isCurrentInvestigationResponse } from "../src/lib/investigation-guards.js"

function deferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

test("out-of-order case response cannot replace the current case", async () => {
  const caseA = deferred()
  const caseB = deferred()
  let currentRequestId = 1
  let currentCaseId = "CASE-A"
  const displayed = []
  const consume = (requestId, requestedCaseId, request) =>
    request.promise.then((result) => {
      if (isCurrentInvestigationResponse(requestId, currentRequestId, requestedCaseId, result.case_id)) {
        displayed.push(result)
      }
    })

  consume(1, "CASE-A", caseA)
  currentRequestId = 2
  currentCaseId = "CASE-B"
  consume(2, currentCaseId, caseB)
  caseB.resolve({ case_id: "CASE-B", evidence: ["B evidence"] })
  await caseB.promise
  caseA.resolve({ case_id: "CASE-A", evidence: ["A evidence"] })
  await caseA.promise

  assert.deepEqual(displayed, [{ case_id: "CASE-B", evidence: ["B evidence"] }])
  assert.equal(isCurrentInvestigationResponse(1, 2, "CASE-A", "CASE-A"), false)
  assert.equal(isCurrentInvestigationResponse(2, 2, "CASE-B", "CASE-A"), false)
})
