"""Conservative financial-language checks for advisory AI text.

Not a semantic oracle. These lexical checks are defense-in-depth only; the bank
must verify evidence and approve every customer communication before publication.
The wire-level financial_outcome is always copied from the caller, never inferred.
"""

from __future__ import annotations

import re
import unicodedata

# Never forward a model-authored customer sentence: this fixed, outcome-neutral
# string is an UNAPPROVED DRAFT, not a bank-published notification.
NEUTRAL_CUSTOMER_DRAFT = (
    "We are reviewing the available information about your transfer. "
    "Please refer to your bank's approved case updates for confirmed information."
)

# Deliberately expansive vocabulary; paired with subject detection below to avoid
# treating generic network/service successes as financial outcome confirmations.
_FINANCIAL_SUBJECT = re.compile(
    r"\b(?:recipient|beneficiary|receiver|destination|payee|their account|"
    r"transfer|transaction|payment|funds|money|amount|remittance|refund|reversal)\b"
)
_OUTCOME_WORDING = re.compile(
    r"\b(?:credited|credit(?:ed)?\s+(?:confirmed|complete)|received|"
    r"arrived|landed|reached|delivered|deposited|cleared|settled|successful|successfully|succeeded|"
    r"completed|complete|done|went\s+through|gone\s+through|"
    r"failed|failure|declined|rejected|bounced|unsuccessful|"
    r"reversed|refunded|returned|paid\s+back|paid\s+out|"
    r"made\s+it\s+to|got\s+(?:the\s+)?(?:money|funds|amount)|has\s+(?:the\s+)?(?:money|funds|amount))\b"
)
# These expressions qualify the outcome as UNKNOWN or hypothetical, rather than
# unconditionally presenting finality. This isn't a replacement for evidence review.
_NONASSERTIVE = re.compile(
    r"\b(?:may|might|could|possibly|perhaps|potentially|if|whether|"
    r"not\s+(?:yet\s+)?(?:confirmed|verified|established|known)|"
    r"cannot|can't|does\s+not|do\s+not|no\s+(?:proof|confirmation|evidence)|"
    r"unconfirmed|unverified|uncertain|unknown|"
    r"reportedly|allegedly|claims?|reported|hypothesized)\b"
)
# Clause boundaries limit a hedging word from licensing an unrelated, later
# categorical assertion (e.g. "may fail, but recipient got the money").
_CLAUSES = re.compile(r"[.;!?]|,|\b(?:and|but|however|although|whereas|yet)\b")

# Recommendations are never instructions to perform financial actions based on AI.
_UNSAFE_ACTION = re.compile(
    r"\b(?:resend|re[- ]?send|retry|re[- ]?initiate|repeat|"
    r"reverse|reversal|refund|credit|debit|settle|release)\b"
    r".{0,45}\b(?:transfer|payment|funds|money|account|customer|recipient|beneficiary)\b"
    r"|\b(?:transfer|payment|funds|money|account|customer|recipient|beneficiary)\b"
    r".{0,45}\b(?:resend|re[- ]?send|retry|re[- ]?initiate|repeat|"
    r"reverse|refund|credit|debit|settle|release)\b"
)


def normalize(text: str) -> str:
    """Normalize case, compatibility characters and invisible Unicode formatters."""
    text = unicodedata.normalize("NFKC", text).casefold()
    text = "".join("" if unicodedata.category(ch) == "Cf" else ch for ch in text)
    return " ".join(text.split())


def contains_unqualified_outcome(text: str) -> bool:
    """Reject assertive payment-finality claims while the bank outcome is UNKNOWN.

    This intentionally over-rejects unclear statements. It does not certify
    statements that pass, and no AI finding may be promoted to financial truth.
    """
    normalized = normalize(text)
    for clause in _CLAUSES.split(normalized):
        if not _FINANCIAL_SUBJECT.search(clause):
            continue
        for match in _OUTCOME_WORDING.finditer(clause):
            # Only immediate local qualifiers, not a hedge elsewhere in a paragraph.
            lead = clause[max(0, match.start() - 60) : match.start()]
            if not _NONASSERTIVE.search(lead):
                return True
    return False


def recommends_financial_action(text: str) -> bool:
    """Spot prohibited AI instructions to execute/resend/reverse a payment.

    Authorized status *verification* is allowed, but money movement is not.
    """
    n = normalize(text)
    # Do not block authorized *verification* of a possible reversal; the
    # recommended action must be inquiry rather than a payment instruction.
    if re.search(
        r"\b(?:verify|check|inspect|review|query|confirm|investigate|request\s+status)\b", n
    ):
        n = re.sub(
            r"\b(?:verify|check|inspect|review|query|confirm|investigate|request\s+status)\b"
            r".{0,65}\b(?:reversal|refund|credit|debit)\b",
            "",
            n,
        )
    return bool(_UNSAFE_ACTION.search(n))


_CAUSAL_ASSERTION = re.compile(
    r"\b(?:caused by|confirmed (?:root )?cause|verified (?:root )?cause|"
    r"root cause (?:is|was)|incident (?:is |was )?confirmed)\b"
)


def asserts_verified_cause(text: str) -> bool:
    """Reject explicit causal/incident confirmation in advisory generated prose."""
    for clause in _CLAUSES.split(normalize(text)):
        for match in _CAUSAL_ASSERTION.finditer(clause):
            # Qualifiers apply only to this assertion, never to the whole clause.
            # A later affirmative assertion must still be checked independently.
            if re.search(r"\bnot\s+(?:(?:a|an|the)\s+)?$", clause[: match.start()]):
                continue
            if match.group().startswith("root cause ") and re.match(
                r"\s+(?:unverified|unconfirmed|uncertain|unknown|"
                r"not\s+(?:verified|confirmed|established|known))\b",
                clause[match.end() :],
            ):
                continue
            return True
    return False
