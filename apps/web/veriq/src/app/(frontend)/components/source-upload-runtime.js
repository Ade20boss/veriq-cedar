export const fixtureOrder = [
  "services.json",
  "dependencies.csv",
  "routes.json",
  "historical_incidents.md",
  "operations_sop.txt",
]

export function sourceRegistrationState(status) {
  if (status === "PARSED" || status === "ACCEPTED") return "registered"
  if (status === "UPLOADED" || status === "STAGED") return "pending"
  return "failed"
}

export function hasExistingSource(sources, filename, checksum) {
  return sources.some(
    (source) =>
      source.filename === filename && source.checksum_sha256 === checksum,
  )
}

export async function sha256File(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export async function runSourceUploadBatch(files, options) {
  const invalid = files.find((file) => !fixtureOrder.includes(file.name))
  if (invalid) {
    return {
      registered: 0,
      pending: 0,
      skipped: 0,
      failed: 1,
      message: `${invalid.name}: unsupported fixture filename. No upload was attempted.`,
    }
  }
  const ordered = [...files].sort(
    (a, b) => fixtureOrder.indexOf(a.name) - fixtureOrder.indexOf(b.name),
  )
  const seen = new Set()
  const counts = { registered: 0, pending: 0, skipped: 0, failed: 0 }
  let failure = ""
  for (const file of ordered) {
    let checksum
    try {
      checksum = await options.fingerprint(file)
    } catch {
      counts.failed += 1
      failure = `${file.name}: could not inspect the selected file.`
      break
    }
    const identity = `${file.name}:${checksum}`
    if (
      seen.has(identity) ||
      hasExistingSource(options.existingSources, file.name, checksum)
    ) {
      counts.skipped += 1
      options.onProgress(
        `${file.name}: identical file already selected or registered; skipped.`,
      )
      continue
    }
    seen.add(identity)
    options.onProgress(`Submitting ${file.name}…`)
    let registration
    try {
      registration = await options.upload(file)
    } catch (error) {
      counts.failed += 1
      failure = `${file.name}: ${
        error instanceof Error ? error.message : "network upload failed"
      }`
      break
    }
    const state = sourceRegistrationState(registration?.status)
    try {
      await options.refresh()
    } catch {
      counts.failed += 1
      failure = `${file.name}: registration returned ${registration?.status ?? "unknown"}, but source metadata refresh failed. Check the source list before retrying.`
      break
    }
    if (state === "failed") {
      counts.failed += 1
      failure = `${file.name}: backend reported ${registration?.status ?? "an unknown status"}; remaining files were not submitted.`
      break
    }
    counts[state] += 1
    options.onProgress(
      state === "pending"
        ? `${file.name}: accepted for processing (${registration.status}); registration is not yet confirmed.`
        : `${file.name}: registered (${registration.status}).`,
    )
  }
  const summary = `${counts.registered} registered, ${counts.pending} pending, ${counts.skipped} duplicate skipped, ${counts.failed} failed.`
  return { ...counts, message: failure ? `${summary} ${failure}` : summary }
}
