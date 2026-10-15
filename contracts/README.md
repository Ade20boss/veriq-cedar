# Canonical shared contracts

openapi.yaml preserves the v1.0 HTTP shapes with development server metadata recorded by ADR-001. It describes both backend and private AI; the AI operations have localhost:8001 overrides. demo.json is byte-identical to the frozen demo contract, including developer-only private truth. Never import this file into frontend bundles, AI context or permitted evidence projections.

Read ../docs/CONTRACT_REVIEW.md for communication, schema mappings, proposed event fields and C01–C10. No new route or closed-object field has been approved. Future AI/event/enums schemas should be generated or extracted from reviewed source definitions to avoid competing authorities. Current event semantics and assertion enums also live in the frozen narrative; a machine event schema awaits review.

## Task 001.1 review candidate

proposals/openapi-v1.1.proposed.yaml is the full, versioned draft for proactive jobs/incidents, staff operations and gap resolutions. It is not the accepted contract and must not overwrite openapi.yaml. Read proposals/README.md and ../docs/CONTRACT_REVIEW.md for compatibility and required review. Baseline schemas, routes and demo truth remain unchanged in the accepted files.
