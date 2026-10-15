# ADR-001 — Python Backend Implementation Stack

**Date:** 15 October 2026  
**Status:** Approved product-owner direction; record as accepted in shared repository after team review  
**Affected area:** Backend implementation technology, development environment and tests

## Context

`Veriq_Cedar_Engineering_Specification_v1.0.md` was written for a NestJS/Prisma implementation. The backend owner has elected to use Python/FastAPI to take advantage of existing Python familiarity and share language and tooling with the separate AI engineering workstream. The project continues to be a hackathon demonstration with a single shared repository and controlled bank/intelligence boundaries.

## Decision

- Replace NestJS/TypeScript backend with Python 3 + FastAPI.
- Replace Prisma with SQLAlchemy 2 + Alembic migrations.
- Replace Jest/Supertest backend tests with pytest/HTTPX (plus database integration tests).
- Retain PostgreSQL; replace BullMQ-specific orchestration with simple Python-compatible job execution, adding a durable queue only if needed.
- Keep Habeeb's independent FastAPI AI service and Usaamah's Next.js/TypeScript frontend.
- Preserve all functional requirements, synthetic scenario truth, evidence authority, banking invariants, endpoint paths and JSON schemas unless separately amended.
- Update OpenAPI development server base URL/metadata to point to the agreed FastAPI port when the repo is initialized; publish one typed contract for the team.

## Non-decisions

This does not authorize real-money integrations, AI monetary actions, unrestricted database access, removal of provenance, altered failure semantics, or arbitrary endpoint changes. It does not select an LLM provider, hosting service or production deployment architecture.

## Consequences

Backend and AI can share Python skills but remain logically and operationally distinct. Frontend consumers depend on stable HTTP APIs, not the backend language. Any generated docs or code that still say “NestJS” are legacy stack references, not controlling implementation instructions after this ADR is accepted.

## Verification

- Confirm `/v1/cedar/*`, `/v1/veriq/*`, `/v1/demo/*` and `/internal/ai/*` route contract compatibility.
- Enforce idempotent balanced ledger operations, `UNKNOWN` on response loss, role separation, source provenance and AI output validation.
- Keep deterministic fixture IDs and all mandatory engineering tests T01–T16 from the original spec.
