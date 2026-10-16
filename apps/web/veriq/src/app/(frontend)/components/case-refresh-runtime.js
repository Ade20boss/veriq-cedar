export function nextCaseRefresh(
  status,
  pendingAttempts,
  unavailableAttempts,
  networkFailures,
) {
  if (status === "AI_PENDING" && pendingAttempts < 8) {
    return Math.min(2000 * 2 ** Math.min(networkFailures, 2), 8000)
  }
  if (status === "EVIDENCE_READY_AI_UNAVAILABLE" && unavailableAttempts < 1) {
    return 15000
  }
  return null
}

export function isCurrentCaseResponse(
  generation,
  currentGeneration,
  requestedId,
  returnedId,
) {
  return generation === currentGeneration && requestedId === returnedId
}

export function scheduleCaseRefresh(callback, delay, timers = globalThis) {
  const timer = timers.setTimeout(callback, delay)
  return () => timers.clearTimeout(timer)
}
