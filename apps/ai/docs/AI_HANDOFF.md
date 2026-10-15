# Veriq AI — A0/A1 implementation handoff and preliminary A2

**Date:** 15 October 2026  
**Owner:** Habeeb (AI), for integration with Daniel's FastAPI backend  
**Deliverable:** `apps/ai/` implementation against the existing `contracts/openapi.yaml` v1.0 canonical contract  
**Status:** Offline deterministic-mock path verified. Live LLM and end-to-end integration are **not yet verified**. Not a production banking service.

## Implemented files

- `app/schemas.py`: Pydantic v2 DTOs matching existing v1.0 `AIExtractInput/Output`, `AIInvestigationInput/Output`, `AIClaim`, `KnowledgeRelationship`, `EvidenceRecord`, `Incident`. All wire models reject extra JSON fields.
- `app/main.py`: separate private FastAPI app, `GET /health`, authenticated `POST /internal/ai/extract-knowledge`, authenticated `POST /internal/ai/analyze-case`, structured error envelopes and provider-mode header.
- `app/providers.py`: explicit deterministic fixture mock and OpenAI-compatible chat/completions JSON provider, with safe provider error mapping (HTTP404 model not found, authentication, rate limits, malformed JSON).
- `app/prompts.py`: separate versioned extraction and case analysis prompts; untrusted-document/complaint instructions are data.
- `app/service.py`: orchestration, Pydantic output validation and guardrails.
- `app/guardrails.py`: strict source locator + verbatim quotation checks, basic subject grounding, duplicate ID rejection, eligible evidence-ID membership, cross-bank context screening for relationship and incident models, case/financial outcome equality.
- `fixtures/*.json`: controlled synthetic Cedar document and case evidence inputs, including alias, injection, unknown and later authorized credit scenarios.
- `docs/A3_INCIDENT_DESIGN_NOT_ENDPOINT.md` and `fixtures/incident_evidence_proposed_a3.json`: draft A3 reasoning context, no API addition.
- `scripts/smoke_mock.py`, `docs/samples/*.json`: reproducible HTTP outputs with mock labels.

## Tests actually executed

From `apps/ai/`:

```bash
PYTHONPATH=. pytest -q
# 37 passed
PYTHONPATH=. python scripts/smoke_mock.py
# 3 HTTP 200 responses, explicitly MOCK_PROVIDER or X-Veriq-AI-Mode: mock
```

Tests cover: canonical YAML field/required parity, extra-field rejection, valid historical source quote, documented candidate relationship, unresolved nickname, injection fixture, malformed input and service-key denial, fabricated quotation/locator/subject rejection, UNKNOWN preservation, approved-status echo, cross-bank relationship rejection, unverified evidence not used, fabricated IDs, false credited claims, unrelated route detection in fixture mock, invalid LLM JSON output, provider 404 error mapping and HTTP-stub successful provider call.

**Not tested:** actual Groq key/model accessibility, real LLM extraction accuracy/recall, true provider latency/cost, backend persistence/orchestration, cross-tenant authorization guarantees, independent unseen-document accuracy. The mock has narrow fixed demonstration rules; outputs are **not** a measured model capability.

## Sample extracted claim (actual local mock HTTP response)

Source fixture: `fixtures/extract_incident.json`.

```json
{
  "source_id": "SRC-INC-001",
  "claims": [{
    "claim_id": "CLM-001",
    "subject": {"type": "SERVICE", "external_id": "G2"},
    "predicate": "REPORTED_CAUSE",
    "object": "connection-pool configuration issue",
    "source_locator": "historical_incidents.md#incident-14",
    "quoted_evidence": "Engineers identified a connection-pool configuration issue",
    "classification": "SOURCE_CLAIM",
    "needs_review": true
  }],
  "unresolved_mentions": [],
  "warnings": ["MOCK_PROVIDER: deterministic fixture result; no external LLM was called"]
}
```

Sample case output is in `docs/samples/case_mock_response.json`: financial_outcome remains `UNKNOWN`, every finding references allowed evidence IDs and a matched G2 route metric; no definitive recipient credit is asserted.

## Integration expected from Daniel

1. Invoke AI directly **server-to-server**. Example dev base URL `http://localhost:8001`. Set the same random private `INTERNAL_SERVICE_KEY` in the backend caller and AI environment; send header `X-Internal-Service-Key`. No browser calls.
2. For document extraction, send exact v1.0 `AIExtractInput` with registered `bank_id`, `source_id`, `source_kind`, and nonempty `chunks[]` with stable unique `chunk_id` and original `text`. AI will cite `source_locator=chunk_id`, with verbatim supporting quotes.
3. Treat every extracted claim as **candidate**. Backend independently validates identity, documentary accuracy, relation semantics, duplication, accepted state and provenance; it never auto-promotes source claims to operational truth.
4. For case analysis send bank-permitted, scoped `AIInvestigationInput`; `EvidenceRecord.verified_for_purpose=true` is necessary for a referenced evidence ID. AI returns exact financial outcome supplied. Backend still enforces ownership, permitted evidence, case/incident association, financial finality and audit/versioning.
5. On HTTP 502/503, do not drop a bank complaint or incident. Retain evidence and mark AI unavailable/retryable under backend state control. Error JSON `{ "error": { "code": "MODEL_NOT_FOUND", "message": "..." } }` and other error codes are internal service conventions; agree if they need formal contract publication.
6. On HTTP 200, inspect `X-Veriq-AI-Mode` (`mock` or `openai_compatible`). Mock outputs should be clearly labelled in any public hackathon recording.

## Specific unresolved contract/implementation questions

**C-01: Incident route/schema (blocking only A3):** PRD expects case-free operational incident reasoning. v1.0 specifies only extraction and case analysis. Proposed `analyze-incident` v1.1 route and types require Habeeb/Daniel approval. Do not fabricate a `case_id` to force an incident into `analyze-case`.

**C-02: Rich extraction fields (nonblocking A1):** v1.0 `AIExtractOutput` only exposes `claims`, `unresolved_mentions`, `warnings`; PRD calls for explicit candidate entity/event lists and temporal qualifiers. Propose addition in v1.1, but don't break v1.0 DTOs.

**C-03: Unknown entity ID (nonblocking A1):** v1.0 `AIClaim.subject.external_id` is mandatory; unknown or name-only entity mentions must go to `unresolved_mentions[]`, not fabricated IDs. A candidate entity model with optional ID is a future contract proposal.

**C-04: Exact locator agreement (important):** Current guardrail requires `source_locator` exactly equal a supplied `chunk_id` and the quotation to be a verbatim substring. Daniel should confirm chunk conventions including filename/section prefixes; current sample uses `historical_incidents.md#incident-14`.

**C-05: Evidence eligibility and customer/bank scope (important):** v1.0 `EvidenceRecord` has no `bank_id`, customer scope, `status_authority` enum, purpose or `as_of` cutoff; Daniel must permission-filter and authenticate the evidence bundle before calling AI. This service checks relationship/incident `bank_id` and evidence membership but cannot independently prove authorization of arbitrary evidence.

**C-06: Reanalysis versioning (for Daniel):** No approved `investigation_run_id`, `knowledge_version`, `as_of`, `request_id` in v1.0 case DTO; backend must correlate queued calls and reject stale responses without changing the AI DTO. A v1.1 metadata change would require approval.

**C-07: Mock/provider response mode and errors:** v1.0 does not define AI provider metadata on successful case output. This implementation uses an additive `X-Veriq-AI-Mode` response header, and JSON error envelopes for failed requests. Confirm with Daniel whether to codify these headers/error codes in a future amendment.

**C-08: Institutional knowledge and prompted checks:** v1.0 case input exposes relationships/historical incidents but no explicit investigation procedures, current route metrics, active incident evidence bundle IDs or model run metadata except generic EvidenceRecord.data. Daniel can supply eligible metric records in `evidence[]` for now; richer context should be reviewed in v1.1.

## Next sequence

- **A0:** independent FastAPI + exact v1.0 contracts + authentication + mock tests: implemented, offline tests pass.
- **A1:** extraction path plus exact-source guardrails: fixture mock tested. **Live model extraction and unseen-document evaluation still needed**.
- **A2:** v1.0 case analysis path and mock contextual reasoning with exact evidence-ID checks: initial implementation and tests pass; **live model and Daniel integration still needed**.
- **A3:** provisional case-free incident evidence fixture, not an endpoint. Await proposed v1.1 contract approval.
- **A4:** pending Daniel backend and Usaamah UI integration.

Git status / commit: This delivery has been adapted as an `apps/ai/` integration overlay. No commit has been made to Daniel's repository; it must be reviewed and merged intentionally. Connected GitHub identity `Barry1003` currently has pull-only permission in `Ade20boss/veriq-cedar` (invitation still pending, per repository handoff). AI owner account is Hbboss226.

## A2 financial-outcome hardening review — 15 October 2026

- Preserve the existing v1.0 wire DTO and endpoint paths; financial_outcome remains caller-authoritative.
- `app/financial_safety.py` now normalizes Unicode, checks broader finality paraphrases and prevents model-written customer sentences from passing through. `app/guardrails.py` applies the checks to every text-bearing investigation field and disallows model recommendations to move money.
- `app/service.py` discards arbitrary provider-authored `customer_safe_update_draft` wording and inserts a deterministic neutral **UNAPPROVED DRAFT**. Cedar's backend must separately approve/publish any message; AI service has no publication integration.
- This is a **heuristic** language check and cannot catch all ways to imply finality. It cannot substitute for deterministic backend financial authority, verified evidence, allowed action boundaries or investigator approval.
- `test_financial_safety.py` adds adversarial finality paraphrase tests across all output text fields, Unicode obfuscation, safe uncertainty language, financial action recommendations and malicious draft sanitization.
- Local regression run (Python 3.13.5): `python -m pytest -q`: **66 passed**. Not a live LLM assessment; no real bank, PostgreSQL, or Fedora runtime was exercised here.
- Integration blocker for Daniel: verify that he treats `customer_safe_update_draft` as **never approved and never automatically publishable**; send only authenticated, eligible evidence; independently check outcome and refs; record reviewer identity/decision before Cedar publishes.
