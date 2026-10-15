# Proposed v1.1 engineering amendment

Date: 15 October 2026. Status: technology migration is owner-approved; this scoped editorial/implementation amendment awaits technical review. Read with the unmodified v1.0 specification. This is not a replacement baseline or a claim of three-owner signoff.

| Original section | Narrow amendment |
|---|---|
| §0 D-09 and §2.2 | Replace the NestJS/TypeScript backend implementation with one modular Python/FastAPI backend; retain distinct Cedar/Veriq domains and separate AI app |
| §0 D-10 and §9 | Replace Prisma with SQLAlchemy 2 and Alembic; retain PostgreSQL, deterministic seed/clock, append-only accounting and restricted simulator persistence |
| §4.4, §7, §8.4, §8.6, §11 beat 6, Appendix A | Read backend references to NestJS as FastAPI; FastAPI/AI outage references mean the separate AI service where complaints must remain available |
| §7 and §12 | Establish apps/backend (Daniel), apps/ai (Habeeb), apps/web (Usaamah), contracts, docs/specs, docs/decisions, fixtures, infra and scripts; add durable agent handoffs |
| §8 implementation | Use explicit Pydantic transport schemas, dependency-injected authorization and role-specific database access; canonical HTTP shapes stay unchanged |
| §8 development metadata | Backend localhost:8000, private AI localhost:8001, frontend localhost:3000 as v1.1 local defaults; preserve all routes and wire fields |
| §9 implementation | Version migrations with Alembic and use SQLAlchemy units of work; validate actual PostgreSQL grants and transactional boundaries |
| §10.2 and §12 implementation/testing | Use pytest/HTTPX for backend checks, PostgreSQL integration tests for atomicity/concurrency/access and contract/replay checks; retain every T01–T16 acceptance criterion |

No amendment to banking or recipient-outcome semantics, knowledge trust, authority, scenario S0–S6, route thresholds, source provenance or mandatory tests is proposed. Task 001.1 explicitly clarifies proactive investigation, adds proposed staff contracts and revises frontend boundaries and visible demo steps as recorded below. Retain integer kobo, eligible evidence, UNKNOWN on timeout, AI advisory authority and one continuous two-act Cedar context.

The supplied ADR mentions replacing Jest/Supertest and BullMQ-specific tooling; the frozen Markdown does not explicitly name these tools. Treat these as superseded implementation assumptions from the supplied ADR, not newly discovered v1.0 requirements. Do not install a queue or create infrastructure based on that wording.

Contract and narrative discrepancies C01–C10 are recorded in `docs/CONTRACT_REVIEW.md`. They require separate decisions and do not become approved by accepting this technology amendment. The module/access-boundary proposal is in `docs/BACKEND_ARCHITECTURE.md`.

Review record: project-owner stack direction supplied; technical lead review pending; Daniel/Habeeb/Usaamah cross-workstream acknowledgements pending. Preserve the original files byte-for-byte and record future accepted decisions with date, owner, rationale and affected tests.

## Task 001.1 explicit addendum

Owner-approved proactive direction: amend §§5.1–5.4, 7–9, 11–12 so operational events automatically create suspected incidents AND durable incident investigations without complaints/manual staff initiation. Complaint persistence automatically initiates distinct case work or contributes supported evidence to an existing incident; staff reviews, verifies and escalates rather than starting routine work. Financial outcomes remain independently evidence-based.

Amend implementation boundaries to require the neutral bank ports in docs/BANK_ADAPTER_CONTRACT.md. Veriq core cannot import Cedar models/repositories or query its SQL. Autonomous jobs, result synchronization, leases/retries and proposed scheduling policy are in docs/EVENT_PROCESSING.md.

Supersede one-app/apps-web as final architecture: preserve the customer Next.js design, rebuild Cedar Staff Operations, and retain an independently authorized Veriq workbench. Preferred two frontend deployments are proposed in docs/REPOSITORY_ARCHITECTURE.md; staff/source migration needs Usaamah approval and supplied repositories. No code import occurs here.

Staff workflows, durable trigger/status/result/verification DTOs and precise gap resolutions are review candidates in contracts/proposals/openapi-v1.1.proposed.yaml and docs/CONTRACT_REVIEW.md. Frozen/canonical v1.0 shapes remain unchanged. contracts/demo.json is unchanged; docs/DEMO_SEQUENCE_v1.1_PROPOSED.md makes incident-first investigation, Sarah's receipt and Michael's review visible. Markdown is the canonical engineering format. This addendum does not approve proposed schemas or begin implementation.
