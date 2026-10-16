export function isCurrentNameEnquiry(snapshot, current) {
  return (
    snapshot.generation === current.generation &&
    snapshot.bankId === current.bankId &&
    snapshot.accountId === current.accountId
  )
}
export function isCurrentInvestigationResponse(
  requestId,
  currentRequestId,
  requestedCaseId,
  responseCaseId,
) {
  return requestId === currentRequestId && requestedCaseId === responseCaseId
}
