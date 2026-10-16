import assert from "node:assert/strict"
import test from "node:test"
import {
  runSourceUploadBatch,
  sourceRegistrationState,
} from "../src/app/(frontend)/components/source-upload-runtime.js"

const file = (name, checksum) => ({ name, checksum })
const run = (files, statuses, existingSources = []) => {
  const uploads = []
  const messages = []
  let refreshes = 0
  return runSourceUploadBatch(files, {
    existingSources,
    fingerprint: async (item) => item.checksum,
    upload: async (item) => {
      uploads.push(item.name)
      const outcome = statuses[uploads.length - 1]
      if (outcome instanceof Error) throw outcome
      return {
        source_id: String(uploads.length),
        status: outcome,
        job_id: "job",
      }
    },
    refresh: async () => {
      refreshes += 1
    },
    onProgress: (message) => messages.push(message),
  }).then((result) => ({ result, uploads, messages, refreshes }))
}

test("successful registration requires application status, not HTTP 202 alone", async () => {
  const { result, uploads, refreshes } = await run(
    [file("services.json", "a")],
    ["PARSED"],
  )
  assert.deepEqual(uploads, ["services.json"])
  assert.equal(result.registered, 1)
  assert.equal(refreshes, 1)
  assert.equal(sourceRegistrationState("UPLOADED"), "pending")
})

test("accepted pending work is not reported as registered", async () => {
  const { result } = await run([file("historical_incidents.md", "a")], [
    "UPLOADED",
  ])
  assert.equal(result.pending, 1)
  assert.equal(result.registered, 0)
  assert.match(result.message, /pending/)
})

test("FAILED response stops remaining batch after earlier success", async () => {
  const { result, uploads } = await run(
    [
      file("services.json", "a"),
      file("dependencies.csv", "b"),
      file("routes.json", "c"),
    ],
    ["PARSED", "FAILED"],
  )
  assert.deepEqual(uploads, ["services.json", "dependencies.csv"])
  assert.equal(result.registered, 1)
  assert.equal(result.failed, 1)
  assert.match(result.message, /backend reported FAILED/)
})

test("same filename and content within a batch uploads once; different content is not assumed duplicate", async () => {
  const { result, uploads } = await run(
    [
      file("services.json", "a"),
      file("services.json", "a"),
      file("services.json", "b"),
    ],
    ["PARSED", "PARSED"],
  )
  assert.equal(uploads.length, 2)
  assert.equal(result.skipped, 1)
  assert.equal(result.registered, 2)
})

test("registered checksum is skipped, but a different checksum remains eligible", async () => {
  const { result, uploads } = await run(
    [file("services.json", "old"), file("services.json", "new")],
    ["PARSED"],
    [{ filename: "services.json", checksum_sha256: "old" }],
  )
  assert.deepEqual(uploads, ["services.json"])
  assert.equal(result.skipped, 1)
})

test("network interruption reports partial success and stops", async () => {
  const { result, uploads } = await run(
    [
      file("services.json", "a"),
      file("dependencies.csv", "b"),
      file("routes.json", "c"),
    ],
    ["PARSED", new Error("Connection lost")],
  )
  assert.deepEqual(uploads, ["services.json", "dependencies.csv"])
  assert.equal(result.registered, 1)
  assert.equal(result.failed, 1)
  assert.match(result.message, /Connection lost/)
})

test("invalid filename stops before upload; an empty tenant may submit its first source", async () => {
  const invalid = await run([file("unknown.txt", "a")], [])
  assert.equal(invalid.uploads.length, 0)
  const empty = await run([file("services.json", "a")], ["PARSED"], [])
  assert.equal(empty.result.registered, 1)
})
