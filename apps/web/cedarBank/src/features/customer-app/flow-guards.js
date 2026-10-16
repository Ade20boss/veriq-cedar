export function isCurrentNameEnquiry(snapshot, current) {
  return (
    snapshot.generation === current.generation &&
    snapshot.bankId === current.bankId &&
    snapshot.accountId === current.accountId
  )
}

export function cancelNameEnquiry(generationRef, controllerRef, clearLoading) {
  generationRef.current += 1
  controllerRef.current?.abort()
  controllerRef.current = null
  clearLoading()
}

export function startNameEnquiry({
  generationRef,
  controllerRef,
  bankId,
  accountId,
  getSelection,
  enquire,
  setLoading,
  onSuccess,
  onError,
}) {
  const generation = ++generationRef.current
  controllerRef.current?.abort()
  const controller = new AbortController()
  controllerRef.current = controller
  setLoading(true)
  const current = () =>
    isCurrentNameEnquiry({ bankId, accountId, generation }, {
      ...getSelection(),
      generation: generationRef.current,
    })
  return enquire({ bank_id: bankId, account_id: accountId }, controller.signal)
    .then((result) => {
      if (current()) onSuccess(result)
    })
    .catch((error) => {
      if (current() && error?.name !== "AbortError") onError(error)
    })
    .finally(() => {
      if (generation === generationRef.current) {
        controllerRef.current = null
        setLoading(false)
      }
    })
}

export function isCurrentInvestigationResponse(
  requestId,
  currentRequestId,
  requestedCaseId,
  responseCaseId,
) {
  return requestId === currentRequestId && requestedCaseId === responseCaseId
}
