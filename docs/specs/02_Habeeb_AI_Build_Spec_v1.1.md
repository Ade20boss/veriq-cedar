# VERIQ + CEDAR
## Habeeb — AI Extraction & Intelligence Engineering Specification v1.1

**Owner:** Habeeb · **Workstream:** AI · **Status:** Team implementation handoff · **Date:** 15 October 2026  
**Primary stack:** Python + FastAPI + Pydantic; LLM provider selected and configured by the AI workstream  
**Project:** Veriq is the intelligence product; Cedar is a fictional Nigerian bank and the source of controlled evidence  
**Canonical references:** `Veriq_Cedar_Engineering_Specification_v1.0.md`, `Veriq_Cedar_API_Contract_v1.0.yaml`, `Veriq_Cedar_Demo_Contract_v1.0.json`.

> **Your job is not “make a chatbot.”** Build two measurable AI capabilities: **(A) institutional knowledge extraction** from Cedar's varied bank materials, and **(B) evidence-grounded contextual investigation reasoning** over the bank's living context. The backend—not the LLM—decides what information is authorized, which claims become accepted, what financial outcomes are confirmed and what investigators may do.

## 1. How the intelligence system works

**Cedar → Daniel's FastAPI backend → Habeeb's private AI service → Daniel's validation layer → Veriq context / investigator UX.**

Veriq is continuously updated by banking events independently of complaints. The backend runs deterministic route anomaly detection, maintains the institutional context and assembles authorized evidence. AI runs when relevant new unstructured sources arrive or investigation is requested, not on every telemetry event.

**AI role #1 — Understand Cedar's inputs:** Convert source documents and text into grounded candidate claims, named entities, relations and uncertainty. **AI role #2 — Reason within Cedar's context:** Compare relevant observed evidence with known relationships and historical incidents, propose explanations and verification actions, and draft reviewable customer-safe language.

**Do not** store independent institutional truth in prompts or model memory, read simulator ground truth, infer account balances, perform payments, decide reversals, or silently upgrade unknown transfer outcomes.

## 2. Repository, ownership and service contract

- Work within `apps/ai/` of the shared monorepo. Expose a separately runnable FastAPI service, initially using the internal endpoint prefix in the canonical OpenAPI contract.
- **Required private endpoints:** `POST /internal/ai/extract-knowledge` and `POST /internal/ai/analyze-case`. `analyze-incident` is optional and must not delay P0.
- Internal authentication uses `X-Internal-Service-Key` or an equivalent agreed service-to-service mechanism; public browser requests are not allowed. No secrets, keys, or model credentials in Git.
- Pydantic input/output validation must match `AIExtractInput`, `AIExtractOutput`, `AIInvestigationInput`, `AIInvestigationOutput` in `Veriq_Cedar_API_Contract_v1.0.yaml`.
- The backend selects bank-scoped, permission-filtered evidence and passes it in bounded payloads. AI may only cite IDs supplied in the current request. No privileged direct SQL access from AI.
- AI returns JSON, not free-form Markdown as the contract. Free-form explanation may exist only inside string fields of typed responses.

## 3. Capability A — AI-assisted bank knowledge extraction (P0)

### Inputs the backend prepares

Cedar's onboarding sources include `services.json`, `dependencies.csv`, `routes.json`, `historical_incidents.md`, `operations_sop.txt`, `prior_complaints.csv`, and `baseline_metrics.jsonl`. Some already have structured semantics and should be parsed with deterministic adapters by Daniel's backend; AI is especially useful for **historical incidents, narrative procedures, support descriptions and ambiguous document wording**.

Canonical request contains `bank_id`, `source_id`, `source_kind`, and `chunks[]`. Each chunk should have a stable source locator/content string agreed with Daniel. You must preserve the association to the original source ID and chunk locator, not just summarize a document globally.

### Output requirements

For each source text, propose zero or more source-grounded claims. Each claim includes:

- A unique claim ID within the extraction response.
- Typed subject (`type`, `external_id` where available); normalized names alone do not justify merging two entities.
- Predicate and object value for the proposed statement/relationship.
- Original `source_locator` and **exact supporting evidence quotation** from the input source; never manufacture quotes.
- `classification` equal to `SOURCE_CLAIM` or `CANDIDATE_RELATIONSHIP`.
- `needs_review` where ambiguity, causal attribution or missing identifiers require human/deterministic evaluation.
- `unresolved_mentions[]` for entities that cannot be mapped reliably, plus `warnings[]`.

Example: The historical report says Gateway G2's connection-pool misconfiguration *was reported as the cause* of delays. Output a source-cited claim about what the report says. Do **not** label the technical cause independently verified merely because the text is confident.

### Example valid extraction response

```json
{
  "source_id": "SRC-INC-001",
  "claims": [
    {
      "claim_id": "CLM-001",
      "subject": {"type": "SERVICE", "external_id": "G2"},
      "predicate": "REPORTED_CAUSE",
      "object": "connection-pool misconfiguration",
      "source_locator": "historical_incidents.md#incident-14",
      "quoted_evidence": "investigation identified a connection pool misconfiguration",
      "classification": "SOURCE_CLAIM",
      "needs_review": true
    }
  ],
  "unresolved_mentions": [],
  "warnings": []
}
```

### What the backend does after extraction

It checks exact IDs against Cedar's inventory, validates source locators and quotations, applies deterministic relationship rules, stages ambiguous candidates, deduplicates and records verification state/provenance. **Your output is a proposal; no direct database write by AI.**

### Adversarial and ambiguous cases

- Same service referred to as `G2`, `Gateway G2` and an unknown nickname: propose alias candidates, do not invent a match.
- A document contradicts structured inventory: preserve conflicting claims and flag for review.
- A complaint alleges “money disappeared”: classify as reported customer experience, not ledger truth.
- Source text contains instruction to ignore the system prompt or request bank secrets: treat it as untrusted document data; never follow it.
- Unsupported statement with no exact source quote: omit or flag, do not fabricate a citation.
- Duplicate report processed twice: consistent extraction IDs are useful, but backend owns canonical deduplication.

## 4. Capability B — Contextual investigation reasoning (P0)

### Source of the investigation

When a Cedar customer submits a complaint, the backend persists the case immediately, retrieves bank-permitted events and prior context, and sends a **bounded investigation evidence bundle** to your service. The bank's operator may already have a `SUSPECTED` G2 incident, raised by backend rules before the complaint arrived.

**Hero scenario:** A Cedar customer sends **₦50,000 = 5,000,000 kobo** to fictional Elm Bank via `ROUTE-CED-ELM-G2`. Cedar posts the debit, the simulated Elm recipient is secretly credited, but the network response is lost. As far as permitted sender-visible evidence goes, the financial outcome is `UNKNOWN` until a later authorized status response arrives.

### Exact input interface

`AIInvestigationInput` includes `case_id`, `bank_id`, `financial_outcome`, `question`, `evidence[]`, `known_relationships[]`, and `historical_incidents[]`.

Each evidence item includes stable `id`, `source_system`, `kind`, `observed_at`, `occurred_at`, `citation`, `verified_for_purpose`, and `data`.

Treat the supplied `financial_outcome` as an authoritative **input fact**. Your service must copy it unchanged into the response. It cannot independently establish payment finality.

### Mandatory output

`AIInvestigationOutput` includes:

- Same `case_id` and `financial_outcome` as input.
- `observations[]`: individual factual observations, each referencing eligible input `evidence_ids`.
- `hypotheses[]`: tentative explanations, each with supporting `evidence_ids` and **alternatives**.
- `unknowns[]`: crucial facts that cannot yet be established.
- `recommended_checks[]`: bank-permitted next steps, such as authorized status re-query or route telemetry inspection.
- `customer_safe_update_draft`: measured, truthful message for an investigator to review; no invented reversal, guaranteed ETA or payment success/failure.

### Example valid investigation response

```json
{
  "case_id": "CASE-001",
  "financial_outcome": "UNKNOWN",
  "observations": [
    {"text": "Sender debit posted", "evidence_ids": ["EV-DEBIT-1042"]},
    {"text": "Gateway response timed out", "evidence_ids": ["EV-TIMEOUT-1042"]}
  ],
  "hypotheses": [
    {
      "text": "G2 route degradation may explain the response timeout",
      "evidence_ids": ["EV-METRIC-G2-01", "EV-TIMEOUT-1042"],
      "alternatives": ["The recipient may have been credited despite response loss"]
    }
  ],
  "unknowns": ["Authoritative beneficiary-credit outcome"],
  "recommended_checks": ["Authorized status re-query", "Inspect G2 route telemetry"],
  "customer_safe_update_draft": "We are checking the final status of your transfer."
}
```

**Hard rule:** The only evidence IDs allowed in output are IDs present in the input bundle. Backend also enforces this; implement an independent service-side check and fail safely if violated.

## 5. What 'understanding' and reasoning mean operationally

Your model should use **institution-specific context** rather than general knowledge to make a case-specific judgment:

1. Identify the complaint's alleged symptoms; do not convert claims to verified facts.
2. Reconstruct the sequence of eligible observed events, respecting `occurred_at` versus `observed_at`.
3. Retrieve how Cedar's own documented entities and routes relate (e.g., transfer → route → G2).
4. Compare the current signature against contextual operational metrics and historical incidents.
5. Propose plausible explanations *and competing alternatives*; explicitly enumerate missing evidence.
6. Recommend the next permissible checks rather than executing privileged actions.
7. Express what is safe to tell a customer now and what must remain unknown.

A suspected G2 route degradation must **not** become a verified root cause solely because multiple complaints are similar. A Birch/G3 complaint with similar wording must not become linked to G2 merely on semantic resemblance.

When later authorized evidence changes the backend's financial outcome from `UNKNOWN` to `CREDIT_CONFIRMED`, a new investigation can reflect that changed input. The AI did not discover the hidden credit; Cedar exposed it through an authorized status pathway.

## 6. Prompt/model architecture and quality controls

- Use a clear extraction prompt distinct from an investigation prompt. Version prompts and preserve model/provider configuration for reproducibility.
- Parse using schema-constrained output or strict Pydantic validation. Reject/repair malformed JSON within a bounded retry budget; report failures to backend instead of returning fabricated success.
- Treat Cedar documents and complaint text as **untrusted input**. They are not instructions to the model; use clear role separation, quote/citation constraints and minimal allowed fields.
- For source quotations, perform exact substring verification against supplied text where feasible. For evidence IDs, validate strict set membership.
- Accept multiple statement strengths: `observed`, `documented`, `reported`, `candidate`, `unknown`. Never infer `verified` from model confidence alone.
- Cap context size; include only relevant permitted evidence, not wholesale account/customer exports. Any model confidence number is optional and never proof of a financial outcome.
- Handle missing provider key, rate limit, timeout, malformed output and LLM outage with explicit error envelopes; never block Cedar complaint registration.
- Keep logging safe: trace request ID, duration, model version and schema validation result; do not log full secret-bearing prompts or synthetic personal profiles by default.

## 7. Required tests and evaluation fixtures

| Test | Pass condition |
|---|---|
| Extraction from historical G2 incident | Proper source-cited claim; reported cause is not promoted to independent truth |
| Extraction of documented dependency | Correct typed subject and relation, traceable locator |
| Unknown alias | Mention remains unresolved and marked reviewable |
| Contradictory documents | Conflict preserved; no forced reconciliation by AI |
| Prompt injection in source document | Instruction ignored; only source claims extracted |
| Missing/false source quote | Reject or flag claim; do not claim source support |
| Hero case before status reveal | `financial_outcome == UNKNOWN` and recipient credit listed as unknown |
| G2 vs unrelated Birch complaint | No false causal/linking assertion based on wording alone |
| Fabricated evidence ID | Service-side validation fails and backend refuses unsupported finding |
| Evidence arrives late/out of order | No claim based on future unavailable evidence |
| Later confirmed status | Only changes once backend sends eligible `CREDIT_CONFIRMED` |
| LLM unavailable | Predictable failure; backend can save complaint and show evidence independently |

**Evaluation plan:** Assemble fixture examples with expected entities, claims, evidence references and ambiguity labels. Report exact sample size and extraction precision/recall (where labeled), citation validity, invented evidence reference count, unsupported final-outcome assertions, latency and error rate. Use **SIMULATED** labels; do not invent metrics. Compare reasoning with bank-specific context vs a context-reduced baseline where feasible.

## 8. Repo deliverables (P0)

- FastAPI AI app, configuration template, health endpoint, internal service-key validation and a reproducible local start command.
- Typed Pydantic models generated/aligned against the source OpenAPI, plus contract tests.
- `POST /internal/ai/extract-knowledge` and `POST /internal/ai/analyze-case` functioning with real extraction/reasoning calls or an explicitly labelled deterministic fallback for offline demonstrations.
- Prompt modules, prompt-version identifiers, provider adapter abstraction and bounded request handling.
- Unit and integration tests covering source grounding, evidence-ID validation, unknown-preservation and adversarial documents.
- A README explaining inputs, outputs, local secrets, mock examples, test commands, limitations and current build status.
- Clearly documented optional improvements: embeddings/pgvector, Pidgin examples, specialized incident model, OCR/PDF support. These are not blockers for P0.

## 9. Work sequencing and interface freeze

1. **A0:** Read canonical contracts; meet Daniel to confirm chunk structure, stable IDs, retrieval limits and internal auth; create request/response fixtures.
2. **A1:** Scaffold independent FastAPI AI service, Pydantic schemas and mock-valid contract endpoints; test without real LLM.
3. **A2:** Implement bank-document extraction with citation validation and ambiguity handling; evaluate with sample incident/SOP text.
4. **A3:** Implement case-investigation reasoning with strict evidence-ID checks, alternative hypotheses and safe message drafting.
5. **A4:** Connect to Daniel's real evidence bundles, verify latency/error behavior, rehearse both acts and report benchmark results.

The **backend's route detector**, financial accounting, account ownership, incident state transitions, evidence bundle construction, claim acceptance and investigator authorization are **Daniel's responsibilities**, not yours. If you need another field or endpoint, propose a documented contract change; don't add it unilaterally.

## 10. What to report to the team

At each milestone: branch/commit, endpoints/schema support, prompts/model/provider used, fixture counts, pass/fail tests, invalid citations, missing context, costs/latency when measured, integration blockers, and proposed contract changes. Explicitly distinguish *model output* from *backend-verified finding*.

**Definition of done:** The AI can transform Cedar's narrative bank records into traceable candidate knowledge and can analyze a bank-authorized evidence bundle to produce useful hypotheses and next checks **without inventing facts, evidence, customer credit status or payment finality**.
