"""Adversarial and boundary tests for defense-in-depth financial truth handling."""
import asyncio
from copy import deepcopy

import pytest

from app.errors import AIServiceError
from app.financial_safety import (
    NEUTRAL_CUSTOMER_DRAFT,
    contains_unqualified_outcome,
    recommends_financial_action,
)
from app.guardrails import validate_case
from app.schemas import AIInvestigationInput, AIInvestigationOutput
from app.service import analyze_case


@pytest.mark.parametrize("statement", [
    "The beneficiary has received the money.",
    "Funds have landed in the recipient's account.",
    "The transfer went through successfully.",
    "The payment completed; the recipient was credited.",
    "Recipient was not credited by Elm.",
    "The transfer failed and the amount was refunded.",
    "The payment bounced.",
    "Money has returned to the sender.",
    "The transaction is settled.",
    "The amount reached the payee's account.",
    "The transfer is done.",
    "The recipient got the money.",
    "The beneficiary was cred\u200bited.",  # invisible-character evasion
    "The beneficiary was ＣＲＥＤＩＴＥＤ.",  # Unicode compatibility characters
    "It might have failed, however the payment succeeded.",  # hedge in other clause
])
def test_unknown_outcome_assertions_are_rejected_in_any_display_field(read_fixture, statement):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    raw = {
        "case_id": request.case_id,
        "financial_outcome": "UNKNOWN",
        "observations": [], "hypotheses": [],
        "unknowns": ["Beneficiary-credit outcome remains unknown"],
        "recommended_checks": ["Request authorized status verification"],
        "customer_safe_update_draft": "We are checking the final status of your transfer.",
    }
    # Model can slip unsafe language into any of these fields; reject each.
    for location in ["observations", "hypotheses", "alternatives", "unknowns", "recommended_checks", "customer_safe_update_draft"]:
        item = deepcopy(raw)
        if location == "observations":
            item["observations"] = [{"text": statement, "evidence_ids": [request.evidence[0].id]}]
        elif location in ("hypotheses", "alternatives"):
            item["hypotheses"] = [{
                "text": statement if location == "hypotheses" else "A response path issue is possible",
                "evidence_ids": [request.evidence[0].id],
                "alternatives": [statement if location == "alternatives" else "More checks needed"],
            }]
        elif location == "unknowns":
            item["unknowns"].append(statement)
        elif location == "recommended_checks":
            item["recommended_checks"].append(statement)
        else:
            item[location] = statement
        with pytest.raises(AIServiceError, match="definitive"):
            validate_case(request, AIInvestigationOutput.model_validate(item))


@pytest.mark.parametrize("statement", [
    "Recipient might have been credited despite the response loss.",
    "An authorized check is needed; beneficiary status is unknown.",
    "The gateway response timed out.",
    "There is no evidence establishing recipient credit.",
    "A timeout does not establish whether the recipient was credited.",
    "The payment may have failed, but the outcome is not known.",
])
def test_uncertainty_and_gateway_processing_are_not_conflated_with_outcome(statement):
    assert not contains_unqualified_outcome(statement)


@pytest.mark.parametrize("statement", [
    "Resend the transfer to Elm immediately.",
    "Refund the customer now.",
    "Reverse the payment without waiting for a status check.",
    "Credit the beneficiary account to resolve the incident.",
])
def test_no_ai_instructed_financial_operations(read_fixture, statement):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    item = AIInvestigationOutput.model_validate({
        "case_id": request.case_id,
        "financial_outcome": "UNKNOWN",
        "observations": [], "hypotheses": [],
        "unknowns": ["Recipient status not yet confirmed"],
        "recommended_checks": [statement],
        "customer_safe_update_draft": NEUTRAL_CUSTOMER_DRAFT,
    })
    assert recommends_financial_action(statement)
    with pytest.raises(AIServiceError, match="unauthorized financial action"):
        validate_case(request, item)


def test_bank_status_check_remains_allowed():
    assert not recommends_financial_action("Request an authorized transfer-status query")
    assert not recommends_financial_action("Inspect G2 route telemetry and check reversal status")


def test_provider_customer_message_is_never_forwarded_without_approval(read_fixture):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))

    class MaliciousProvider:
        async def generate(self, task, instruction, payload):
            return {
                "case_id": payload["case_id"],
                "financial_outcome": "UNKNOWN",
                "observations": [], "hypotheses": [],
                "unknowns": ["Beneficiary status unknown"],
                "recommended_checks": [],
                "customer_safe_update_draft": "Payment succeeded! Tell the customer they can spend it.",
            }

    result = asyncio.run(analyze_case(request, MaliciousProvider()))
    assert result.customer_safe_update_draft == NEUTRAL_CUSTOMER_DRAFT
    assert "succeeded" not in result.customer_safe_update_draft


def test_model_hallucination_in_findings_still_rejected_when_customer_draft_is_sanitized(read_fixture):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))

    class BadProvider:
        async def generate(self, task, instruction, payload):
            return {
                "case_id": payload["case_id"], "financial_outcome": "UNKNOWN",
                "observations": [{"text": "The beneficiary received the funds.",
                                  "evidence_ids": [payload["evidence"][0]["id"]]}],
                "hypotheses": [], "unknowns": ["Unknown status"],
                "recommended_checks": [],
                "customer_safe_update_draft": "We are investigating.",
            }

    with pytest.raises(AIServiceError, match="definitive"):
        asyncio.run(analyze_case(request, BadProvider()))


def test_no_auto_publish_route_exists():
    from app.main import app
    paths = {r.path for r in app.routes}
    assert not any("publish" in path or "send-message" in path for path in paths)
