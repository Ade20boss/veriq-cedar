# Proposed version 1.1 integration contract

Status: PROPOSED for technical review, not the accepted API. Owner direction requires proactive behavior; endpoint/DTO details still need affected-owner approval. Do not implement or publish this draft. Accepted baseline remains ../openapi.yaml; ../demo.json and preserved v1.0 files are unchanged.

openapi-v1.1.proposed.yaml is the recommended minimum-demo review candidate (OpenAPI 3.1), not an overlay to concatenate with the baseline. Version is 1.1.0-proposed.1, with 49 paths and 54 operations: 28 baseline operations plus 26 proposed P0 additions. Its 93 shared schemas also describe typed bank ports and secondary ideas; unused components do not authorize extra endpoints. The separate openapi-v1.1.secondary.proposed.yaml is a broader preview with 13 additional secondary operations (60 paths, 67 operations total), explicitly outside the minimum demo amendment. All 27 existing component schemas and baseline success response schemas remain unchanged. The four existing case/extraction AI root schemas are untouched. New endpoints use closed, named DTOs, explicit nullability and cursor-page envelopes; legacy array/resource responses stay as-is.

Compatibility changes are explicit proposals: common Error JSON bodies plus 404/409/503 response descriptions on legacy operations, X-CSRF-Token on existing browser mutations, and an additional case-free AI endpoint. These are not silently activated. Existing clients need a CSRF handshake when this amendment is adopted. Canonical baseline bytes are untouched. Use schema-diff and affected-owner review before promoting the candidate; do not call the whole draft backward-compatible merely because success schemas are preserved.

See ../../docs/CONTRACT_REVIEW.md for exact gap resolutions and ../../docs/STAFF_AND_UI_CONTRACTS.md for route ownership, permissions, identity mapping and lifecycle semantics. Examples in examples-v1.1.proposed.json are synthetic review fixtures, not live/recorded application responses. They are kept outside fixtures/ to avoid asserting an implemented simulator.

## Schema and type generation

Each proposal response/request references a named schema. Required/null fields, strict amount integers, literal enums, arrays and object extra-field rules can be represented in Pydantic and TypeScript. Generate per-consumer TypeScript modules/types and separate runtime Pydantic models from the approved candidate only after review. The schema smoke check builds transient Pydantic models in the bundled runtime; this is validation tooling, not app implementation. There is no checked-in SDK or generated app code. No TypeScript generator/compiler or standards-complete OpenAPI validator was run in this task.

Only the incident and case investigation types form a discriminated union with subject_type. IncidentInvestigation has incident_id, may have zero cases, and forbids financial_outcome. CaseInvestigation requires exactly one bank case and authoritative financial_outcome. Existing analyze-case still receives a genuine bank case ID. AIIncidentInput/Output and POST /internal/ai/analyze-incident are proposed additions requiring Habeeb review; no fake case IDs.

## Activation gates

1. Daniel/technical lead reviews adapter rights, automatic trigger/run/job/delivery idempotency, banking authority and error/session policy.
2. Usaamah reviews the retained customer plus rebuilt staff boundaries, minimal route set, role matrix, IDs, polling, error/CSRF migration and screen gaps.
3. Habeeb reviews new incident reasoning contract, citation/provenance conventions and preservation of existing AI schemas.
4. Agree P0 adoption and explicitly defer optional features. Record signoff and tests, then issue a bounded implementation task. No peer signoff is currently recorded.

Do not infer approval from this README, a generated example, or the fact that the owner approved the Python stack and proactive product behavior.

## Scope selection

Read ../../docs/MINIMUM_DEMO_SCOPE.md and PRIORITY_MATRIX.json. Every operation is tagged x-delivery-priority: BASELINE, P0_PROPOSED or SECONDARY_PROPOSED. The minimum candidate contains no SECONDARY_PROPOSED operation. The broader Cedar Operations attachment is a requirements proposal, not permission to implement its feature inventory. Both files remain drafts and this task implements neither.
