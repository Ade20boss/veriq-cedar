# Veriq + Cedar — team handoff v1.1

This addendum package contains three independent, aligned instructions:

1. `01_Usaamah_Frontend_Build_Spec_v1.1` — Cedar customer banking UI **and** Veriq onboarding, context, operations, investigations and demo controls.
2. `02_Habeeb_AI_Build_Spec_v1.1` — bank-knowledge extraction and grounded AI investigation reasoning.
3. `03_Shared_Integration_and_Agent_Handoff_v1.1` — ownership, API contracts, G0–G4 gates, unresolved endpoints, and Codex ↔ Google Antigravity continuation.

Read each with the existing frozen source material:

- `Veriq_Cedar_Engineering_Specification_v1.0.md`
- `Veriq_Cedar_API_Contract_v1.0.yaml`
- `Veriq_Cedar_Demo_Contract_v1.0.json`

The earlier narrative specification still says NestJS/Prisma. The approved **implementation** change in these addenda is **FastAPI + SQLAlchemy + Alembic** for Daniel's backend; otherwise existing business states and contracts are preserved. A short recorded ADR in the actual repo should formalize the stack update.

**Important integration gaps requiring explicit contract decisions:** demo login/session issuance, transaction history endpoint, entity-list/labels for full graph view, source job-status polling, and persistent assertion review IDs in claims list. Do not silently invent new APIs.

No real bank, customer data, funds or NIBSS access is involved. All demo evidence and financial values are synthetic.

Additional working files:

- `ADR-001_Python_Backend_Stack.md`: records the agreed switch from NestJS to FastAPI, for the team to accept in the repository.
- `CURRENT_STATE_TEMPLATE.md`: mandatory agent/tool handoff template; works with Codex, Google Antigravity, or any other coding assistant.

**Recommended distribution:** Send Usaamah document 01, Habeeb document 02, and send document 03 + all original baseline specifications to **everyone**. Keep the actual shared Git repository as the durable source of truth.
