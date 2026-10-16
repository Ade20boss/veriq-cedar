# Veriq + Cedar

Task 006 adds optional private case AI orchestration over durable, permitted evidence. See [AI integration status](docs/handoffs/AI_BACKEND_INTEGRATION_STATUS.md) for configuration, safety, provider limitations and current verification. The following milestone descriptions are historical.

Task 005 supplies the integrated backend pitch: genuine source uploads/context, persistent proactive read APIs, protected Cedar complaints and automatic case evidence investigations. Run the four-act CLI with actual PostgreSQL; see [pitch status and frontend wiring](docs/handoffs/PITCH_BACKEND_STATUS.md) and [backend instructions](apps/backend/README.md). G1's S2 financial outcome remains UNKNOWN; AI findings/status reveal are not simulated. Older milestone descriptions below are historical.


Task 004 implements Cedar G1: protected customer account/name enquiry/transfer endpoints, balanced append-only accounting, durable idempotent transfer dispatch and restricted synthetic S0/S2 behavior. S2 stays UNKNOWN after its observed response timeout. See [financial design and limitations](docs/FINANCIAL_G1.md), [backend setup/replay](apps/backend/README.md) and [current handoff](docs/handoffs/CURRENT_STATE.md). G0 remains independent of transfers/complaints. AI PR #2 is merged; this task does not change or invoke that service. Earlier Task 001–003 paragraphs below are historical context.


Task 003 adds the working proactive G0 backend slice: synthetic permitted metrics → suspected incident → durable deterministic investigation → Cedar status inbox, with zero complaints or staff initiation. See [G0 implementation and replay](docs/PROACTIVE_G0.md) and the [current handoff](docs/handoffs/CURRENT_STATE.md). No banking/AI/frontend or proposed HTTP endpoint is added. The Task 001/002 descriptions below are historical foundation context.

Task 002 now implements the FastAPI backend foundation in apps/backend: settings, lifecycle, domain-scoped PostgreSQL connections, metadata registries, schema-only Alembic migration, infrastructure health/readiness, logging/errors and tests. No banking/business endpoints or v1.1 proposals are implemented. See [backend setup](apps/backend/README.md) and [current handoff](docs/handoffs/CURRENT_STATE.md).

The original checkout remains at the writable outputs/veriq-cedar fallback because the execution /home mount cannot create ~/Projects/veriq-cedar. No second repository or move was created. The project owner has created https://github.com/Ade20boss/veriq-cedar. Task 002-GIT published the existing monorepo to main and verified its files. Both named developers have write invitations pending acceptance; main requires PRs, without mandatory CI, and retains owner/admin maintenance bypass. See the current handoff for publication and access status.

Task 001 established the shared monorepo. Task 001.1 now records proactive investigation, reusable bank adapters, redesigned staff frontend boundaries and proposed v1.1 contracts. Task 001/001.1 sections below describe the earlier planning baseline; Task 002 adds only the backend foundation and project-local dependencies. No business seed or deployment exists. Technical review is the next step. The requested ~/Projects/veriq-cedar location remained read-only despite permission grants, so this checkout is delivered in the chat outputs fallback. Transfer instructions and the outstanding location requirement are in docs/handoffs/TASK_001_REPORT.md.

Veriq provides bank-specific contextual intelligence; Cedar is its independent fictional Nigerian bank. One continuous synthetic demo connects knowledge onboarding and monitoring to a 5,000,000-kobo Elm transfer, complaint, investigation and later authorized confirmation.

## Start here

1. Read `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md` and `docs/TEAM_ONBOARDING.md`.
2. Read preserved originals in `docs/specs/`, the relevant v1.1 owner specification and `docs/decisions/ADR-001-python-backend.md`.
3. Use `contracts/openapi.yaml` for HTTP shapes and `contracts/demo.json` for deterministic scenario IDs/order. Never expose private demo truth through runtime APIs.
4. Review `docs/CONTRACT_REVIEW.md`, `docs/BACKEND_ARCHITECTURE.md` and the proposed amendment in `docs/specs/Veriq_Cedar_Engineering_Amendment_v1.1_PROPOSED.md`.
5. Review `docs/handoffs/TASK_001_1_REPORT.md` and `contracts/proposals/README.md` before authorizing implementation.

## Ownership

| Path | Owner | Purpose |
|---|---|---|
| apps/backend | Daniel | Cedar banking and Veriq context, persistence, authorization and orchestration |
| apps/ai | Habeeb | Independent advisory extraction/reasoning service and evaluations |
| apps/web | Usaamah | Legacy reservation; future customer app plus rebuilt staff app/workbench, pending source review |
| contracts | Shared; Daniel coordinates | Backend/AI HTTP schemas, demo contract, future agreed event schemas |
| docs | Shared | Preserved specs, decisions, onboarding and agent state |
| fixtures | Shared; Daniel coordinates | Future synthetic sources and deterministic scenarios |
| infra | Daniel coordinates | Future local PostgreSQL and development configuration |
| scripts | Daniel coordinates | Future local setup, verification and replay helpers |

Approved backend technology is Python 3, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL and Pydantic, tested with pytest/HTTPX. AI remains separate FastAPI; web remains Next.js/TypeScript. Proposed local defaults: web 3000, backend 8000, AI 8001. Backend commands are now runnable as documented in apps/backend/README.md; AI/frontend commands remain future proposals.

Task 002-GIT authorizes publishing this existing checkout to https://github.com/Ade20boss/veriq-cedar and inviting the named collaborators with write access. Team setup and current state are documented in docs/TEAM_ONBOARDING.md and docs/handoffs/CURRENT_STATE.md. Original v1.0 files remain unchanged; canonical OpenAPI differs only in development server metadata. No route, field or outcome semantics have been amended.

## Current review direction

Veriq automatically investigates qualifying operational anomalies before complaints/staff actions. Complaints independently trigger case work and evidence-backed links to incidents. Cedar staff receive progress/results, then review, verify, assign or escalate; route findings never establish individual financial finality. See docs/EVENT_PROCESSING.md, BANK_ADAPTER_CONTRACT.md, FRONTEND_ALIGNMENT.md and STAFF_AND_UI_CONTRACTS.md.

Customer design is retained; Cedar staff operations is rebuilt from workflow requirements. Veriq workbench is separately authorized even in the staff deployment. No source repository has been imported. Current checkout remains this fallback: execution /home mount is read-only; the requested ~/Projects location is absent. No transfer is claimed. Proposed contract is contracts/proposals/openapi-v1.1.proposed.yaml; accepted baseline stays unchanged. Implementation awaits revised review.

Current scope clarification: Task 002 authorizes backend infrastructure only. The Cedar Operations attachment is a proposed requirements source, not authorization to build every module. Read docs/MINIMUM_DEMO_SCOPE.md from repository root for the 26-addition P0 proposal and the 13 excluded secondary operations. Canonical APIs are unchanged; only the Task 002 backend foundation is implemented.

## Shared GitHub workflow

Repository: [Ade20boss/veriq-cedar](https://github.com/Ade20boss/veriq-cedar). Clone instructions and ownership are in [team onboarding](docs/TEAM_ONBOARDING.md). Daniel uses feat/backend-foundation; Habeeb (Hbboss226) uses feat/ai-foundation; Usaamah (Barry1003) uses feat/frontend-foundation. Open pull requests against main. Frontend source locations/migration remain subject to the agreed plan; no existing frontend is imported by this setup task. Proposed v1.1 contracts remain proposals.
