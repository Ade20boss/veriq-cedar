import assert from "node:assert/strict"
import test from "node:test"
import { isCurrentInvestigationResponse } from "../src/lib/investigation-guards.js"

test("out-of-order case response cannot replace the current case", () => {
  assert.equal(isCurrentInvestigationResponse(1, 2, "CASE-A", "CASE-A"), false)
  assert.equal(isCurrentInvestigationResponse(2, 2, "CASE-B", "CASE-A"), false)
  assert.equal(isCurrentInvestigationResponse(2, 2, "CASE-B", "CASE-B"), true)
})
