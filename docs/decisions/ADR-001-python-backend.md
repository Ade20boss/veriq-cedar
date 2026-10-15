# ADR-001 Python backend implementation stack

Date: 15 October 2026.
Status: Stack migration approved by the project owner in Task 001 and supplied v1.1 direction. This repository record awaits technical review; team acknowledgement is not claimed. Detailed architecture below remains proposed.

## Context and decision

The frozen v1.0 D-09/D-10 and implementation references select NestJS, Prisma and TypeScript backend code. The owner explicitly replaces the backend with Python 3/FastAPI, SQLAlchemy 2, Alembic, PostgreSQL and Pydantic. Backend tests use pytest and HTTPX with real PostgreSQL integration checks. This uses the backend owner's Python familiarity while retaining separate financial and AI authority.

Keep one modular backend with Cedar and Veriq domains; retain Habeeb's separate FastAPI app and Usaamah's Next.js/TypeScript app. Keep all workstreams in this shared monorepo. No new microservices are required. Python job orchestration should begin with a durable database outbox and explicit replay/recovery; no queue product is selected for P0.

Development addresses are recorded from supplied v1.1 defaults: web localhost:3000, backend localhost:8000, AI localhost:8001. `contracts/openapi.yaml` changes the global development server and sets the two AI operations' development servers to 8001 so clients address the correct service. These are metadata changes only. The original YAML is archived unchanged. These internal AI paths are hosted by AI, not publicly proxied by the backend.

## Consequences and verification

Backend and AI share a language, not database authority or model ownership. Explicit Pydantic transport schemas preserve exact JSON fields, optionality, nullability, response shapes, headers and status codes. SQLAlchemy models remain persistence objects. Alembic owns versioned migrations. Compare generated application OpenAPI against the appropriate subset of the canonical contract before integration.

Retain double-entry integer-kobo journals, atomic/idempotent debits, immutable events, restricted simulator truth, advisory AI, bank/role authorization, permitted status evidence, provenance, T01–T16 and the two-act single-state demo. Preserve UNKNOWN after timeout and exact AI outcome equality with backend input.

## Review scope

The draft schema/role boundary and directory/module breakdown in `docs/BACKEND_ARCHITECTURE.md` require technical review. Login, history, entities, source-job details, review-ID mapping and narrative/YAML discrepancies remain in `docs/CONTRACT_REVIEW.md`. No LLM provider, Python minor version, package manager, deployment target or new API is selected. Stack approval does not approve any proposed payload extension.

Sources: preserved v1.0 specification; supplied `ADR-001_Python_Backend_Stack.md`; shared team integration v1.1; Task 001 owner instructions.
