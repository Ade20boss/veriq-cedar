export function getTransactionInsight(transaction, hasComplaint) {
  const isCompleted =
    transaction.financialOutcome === "credit_confirmed" ||
    transaction.status === "Completed"
  const isFailed =
    transaction.financialOutcome === "failure_confirmed" ||
    transaction.status === "Failed"
  const isReversed =
    transaction.financialOutcome === "reversal_posted" ||
    transaction.status === "Reversal posted"
  const hasTimeout = transaction.processingStage === "RESPONSE_TIMEOUT"

  const summary = isCompleted
    ? `Authorized records confirm that ${transaction.title} received this transfer.`
    : isFailed
      ? "Authorized records confirm that this payment instruction did not complete."
      : isReversed
        ? "A matching reversal has been verified on your Cedar account."
        : hasTimeout
          ? "Cedar recorded the sender debit, but the payment response timed out. The beneficiary's final payment outcome is still unknown."
          : "Your transfer is being processed. We haven't received a final confirmation yet."

  const reason = hasTimeout
    ? "The backend reported a response timeout. This is not proof that the transfer failed or that the beneficiary was credited."
    : isCompleted
      ? "The final beneficiary-credit response was received and verified through an authorized status source."
      : isFailed
        ? "The final payment status was received from an authorized source and records the instruction as unsuccessful."
        : isReversed
          ? "Cedar's ledger shows a confirmed reversal credit matching the original debit."
          : "No specific cause has been identified. The bank is waiting for the next verified processing event."

  const bankAction =
    isCompleted || isFailed || isReversed
      ? "The latest authorized outcome has been recorded on this transaction."
      : hasComplaint
        ? "The transaction is linked to an active complaint. Complaint creation does not verify the transfer outcome."
        : "Cedar will check the latest authorized status when you request an update."

  const guidance = isCompleted
    ? "No action is required. You can still report an issue if the recipient disputes receipt."
    : isFailed || isReversed
      ? "Review the confirmed outcome and contact Cedar support if you need more help."
      : hasComplaint
        ? "Track your complaint for verified updates and avoid sending a duplicate transfer while the outcome remains unknown."
        : "Check the latest status, avoid a duplicate transfer, or report an issue if you need assistance."

  return { isCompleted, isFailed, isReversed, hasTimeout, summary, reason, bankAction, guidance }
}
