export function isCurrentInvestigationResponse(
  requestId,
  currentRequestId,
  requestedCaseId,
  responseCaseId,
) {
  return requestId === currentRequestId && requestedCaseId === responseCaseId
}
