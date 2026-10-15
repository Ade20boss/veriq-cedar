# VERIQ + CEDAR
## Shared Team Integration & Coding-Agent Handoff v1.1

**For:** Daniel (backend), Habeeb (AI), Usaamah (frontend)  
**Date:** 15 October 2026 · **Status:** Shared working agreement, to be acknowledged by all three owners  
**Objective:** One repository, one demo, one set of interface contracts, three independently testable workstreams.

## 1. Product boundaries, frozen behavior and approved technology update

**Veriq:** the bank-specific contextual intelligence infrastructure. **Cedar:** fictional Nigerian bank furnishing synthetic customer/financial operations and institutional evidence. **Elm / Birch:** fictional receiving banks. **One demo** has two acts: Cedar knowledge upload and living context; then a ₦50,000 Elm transfer with a lost response, complaint and Veriq investigation. Route degradation may be detected **before** any complaint, and complaint submission triggers its own case investigation.

The original v1.0 engineering specification selects NestJS/Prisma. Daniel has chosen **FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL** for the backend. This is the agreed implementation stack change, not authorization to silently rewrite banking semantics or OpenAPI shapes. Record it in `docs/decisions/ADR-001-python-backend.md` and update the OpenAPI **server/development URL** without changing routes or payloads unless separately approved. Habeeb's AI remains separate FastAPI; Usaamah's frontend remains Next.js/TypeScript.

**Immutable business invariants:** All bank information is synthetic; journal entries are balanced/append-only, with amounts stored in integer kobo; transfers are idempotent; debit + timeout does not establish failure; Veriq never reads simulator private ground truth; AI can cite/advise but cannot independently change financial outcomes or verified bank facts; data/role boundaries are enforced server-side; all contextual claims have source/time provenance; the same Cedar instance persists across both acts.

## 2. Shared repository layout

```text
veriq-cedar/
  apps/
    backend/      # Daniel + Codex/Antigravity: Cedar + Veriq FastAPI modules, SQLAlchemy, Alembic, tests
    ai/           # Habeeb: private FastAPI knowledge extraction + case reasoning, tests
    web/          # Usaamah: Next.js /cedar, /veriq and controlled /demo UI
  contracts/      # Canonical OpenAPI/DTO examples/event envelope; shared review required
  docs/
    specs/        # Original v1.0 spec, OpenAPI and demo JSON + these three addenda
    decisions/    # ADRs / contract changes
    handoffs/     # Milestone reports and current session handoff
  fixtures/       # Bank/source/incident fixtures, deterministic scenario data
  infra/          # Docker Compose and environment examples
  scripts/        # Local setup, smoke tests and deterministic replay helpers
  AGENTS.md       # Repo-wide instructions applicable to any coding agent
  README.md       # Single canonical setup guide
```

Proposed dev services: Next.js `localhost:3000`; backend FastAPI `localhost:8000`; AI FastAPI `localhost:8001`; PostgreSQL via Docker Compose. These are **development defaults**, not contracted external production addresses.

## 3. Ownership and cross-team interfaces

| Component | Accountable owner | Consumers / constraints |
|---|---|---|
| Cedar ledger/accounts/transfer simulator + restricted private ground truth | Daniel | Usaamah receives only authorized API data; AI never receives truth |
| Cedar complaints and customer-safe updates | Daniel | Usaamah Cedar UI; case may persist while AI is unavailable |
| Veriq source ingestion, deterministic parsing, claim review/state/provenance and context persistence | Daniel | Habeeb receives scoped document chunks; Usaamah uses review/context endpoints |
| Veriq event ingestion, 5-min route detector and eligible evidence-bundle assembly | Daniel | Habeeb sees scoped evidence; Usaamah shows true persisted incident state |
| AI extraction & grounded case reasoning | Habeeb | Backend validates all references/enums/outcome; advisory only |
| Customer app, bank onboarding, investigation console and operator controls | Usaamah | Browser talks only to backend, not private AI/database |
| Contract files, ADR decisions, demo seed and end-to-end acceptance | Daniel coordinates; all three sign off | Breaking changes require affected owners' approval |

**Contract order:** `contracts/openapi.yaml` (copy and adapt approved v1.0 YAML) → typed request/response fixtures → AI Pydantic models → backend schemas → frontend generated TypeScript types. The shared spec is authoritative for domain invariants; the OpenAPI file is authoritative for HTTP shapes; the demo JSON is authoritative for synthetic scenario truth and ordering.

## 4. Canonical routes that must remain aligned

**Cedar customer:** `GET /v1/cedar/accounts/me`, `GET /v1/cedar/banks`, `POST /v1/cedar/name-enquiries`, `POST /v1/cedar/transfers`, `GET /v1/cedar/transfers/{transferId}`, `POST /v1/cedar/complaints`, `GET /v1/cedar/complaints/{caseId}`.

**Veriq:** `POST/GET /v1/veriq/banks/{bankId}/sources`, `GET /v1/veriq/banks/{bankId}/sources/{sourceId}/claims`, `POST /v1/veriq/banks/{bankId}/assertions/{assertionId}/review`, `GET /v1/veriq/banks/{bankId}/context`, `GET /v1/veriq/banks/{bankId}/relationships`, `GET /v1/veriq/banks/{bankId}/operations`, `GET /v1/veriq/banks/{bankId}/incidents`, `GET /v1/veriq/banks/{bankId}/incidents/{incidentId}`, `GET /v1/veriq/banks/{bankId}/cases/{caseId}`, `POST /v1/veriq/banks/{bankId}/cases/{caseId}/investigate`, `POST /v1/veriq/banks/{bankId}/cases/{caseId}/review`, `POST /v1/veriq/banks/{bankId}/incidents/{incidentId}/review`.

**AI private:** `POST /internal/ai/extract-knowledge`, `POST /internal/ai/analyze-case`. **Operator private:** `/v1/demo/reset`, `/seed`, `/stream/start`, `/scenarios/{scenarioId}/arm`, `/scenarios/{scenarioId}/run`, `/transfers/{transferId}/reveal-status`.

**Contract gaps to resolve before implementing dependent screens:** server-side demo-login/session issuance; customer transaction history list; entity labels/metadata in context explorer; source-job progress polling; persisted assertion review IDs/status on extracted-claim list. These are not already approved routes—record small ADRs with owner, fields, authorization and tests. Use UI fixture mocks until approved.

## 5. Core demo seed and ground-truth separation

`Veriq_Cedar_Demo_Contract_v1.0.json` is the seed contract: `CED`, `ELM`, `BIR`; customer `CED-CUST-001`; source account `CED-ACC-001`; Elm recipient `ELM-ACC-009`; amount `5000000` kobo; route `ROUTE-CED-ELM-G2`; scenario `S2-CREDITED-RESPONSE-LOST`.

Cedar private truth: recipient was credited and reply lost. **Before authorized status reveal**, sender/Veriq outcome must remain `UNKNOWN`. At reveal, the private simulator drives a **mock authorized status response** and backend advances permitted knowledge to `CREDIT_CONFIRMED`. No frontend “make payment successful” switch and no AI clairvoyance.

Monitoring fixture: G2 baseline 2 timeouts/100 attempts; anomalous window 7/25; Birch/G3 normal. A deterministic rule raises exactly one `SUSPECTED` incident before complaint; a similar-sounding Birch complaint must not be linked by text alone.

## 6. Integration gates and pass/fail handoffs

| Gate | Daniel backend | Habeeb AI | Usaamah frontend | Joint proof |
|---|---|---|---|---|
| G0 — Contracts | FastAPI repo skeleton, exact routes/schema decision log and fixture IDs | Pydantic input/output validation and representative requests | Typed API clients and mock screens | All shapes compatible; unresolved gaps logged |
| G1 — Cedar functions | Accounts, balanced ledger, S0 normal and S2 lost-response scenario | Contract-valid extraction stub with clear mock label | Cedar customer transfer and UNKNOWN UI | One debit, no double-debit; can file complaint |
| G2 — Context | Register/parse sources, deterministic relationships, stage claims, context query | Real source-cited extraction | Onboarding, claims review, context explorer | Source provenance and uncertainty visible |
| G3 — Investigation | Streaming detector, complaint→evidence, AI call/validation, investigation persistence | Evidence-grounded `analyze-case` + tests | Route dashboard, incident details, case view | G2 incident before complaint; no invented financial truth |
| G4 — Demo | Later authorized reveal, audit, deterministic replay and all core tests | Integration failure handling, source grounding | Full integrated customer/investigator/operator UX | Single uninterrupted replay and recording |

Each gate needs **an integration smoke test** using actual API, not just screenshot mocks. Every response should disclose whether it came from live backend, pre-recorded fixture or a deterministic fallback.

## 7. Git and PR workflow

- Shared `main` stays reviewable and runnable. Example branches: `feature/backend-g0`, `feature/ai-a1`, `feature/frontend-f1`.
- Keep branch scope primarily in the owner's folder. Do not edit another workstream's files without notifying them.
- PRs must include what changed, contract compatibility, tests run, screenshots if UI, and risk/blockers. For contract changes, include ADR and updates to example payloads and contract tests.
- Commit working increments; avoid large opaque agent-generated commits. Ensure `.env`, API keys, bank credentials and personally identifiable data are not committed.
- If simultaneous changes conflict, first sync from reviewed `main`, resolve consciously, rerun integration tests; do not force-push or overwrite others' work without explicit team agreement.

## 8. AI-tool portability: Codex → Google Antigravity

Switching coding tools should **not change the architecture or reset the work**. The Git repository, specs, tests and handoff reports—not an agent's conversation history—are the durable source of truth.

### Before stopping Codex

1. Ask Codex to stop at a clean checkpoint; if the task is incomplete, state exactly which changes are partial.
2. Ask it to update `docs/handoffs/CURRENT_STATE.md`: objective, accepted decisions, files edited, migrations, commands/tests and results, blockers, uncommitted state, next safe step.
3. Run `git status --short`, `git diff --stat`, unit tests relevant to the task, and show summary. Preserve uncommitted work; commit only if tests and review policy permit.
4. Confirm there are no unintended modifications to `contracts/`, fixture truth, `.env` or another teammate's area.

### After opening Google Antigravity

1. Open the **same existing repository folder**. Do not create a new scaffold or fork of the project.
2. Direct the agent to read `AGENTS.md`, `README.md`, all canonical spec/contract files, the relevant owner specification, and `docs/handoffs/CURRENT_STATE.md`.
3. Require it to inspect `git status`, recent commits and affected tests before editing.
4. Have it restate the task and risks; do not approve unrelated refactoring, new dependencies or contract changes.
5. Continue exactly one bounded task and use the **same status-report template**. The next switch back to Codex follows the same process.

**Copy-ready agent re-entry prompt:**

> You are continuing an existing Veriq/Cedar monorepo; do not scaffold a replacement. Read `AGENTS.md`, `README.md`, `docs/specs/`, `contracts/`, and `docs/handoffs/CURRENT_STATE.md`. Inspect Git status/diff and relevant tests. The approved stack is FastAPI + SQLAlchemy/Alembic for Daniel's backend, separate FastAPI for Habeeb's AI and Next.js for Usaamah's UI. Preserve all financial/knowledge/trust invariants and the original OpenAPI contracts except approved ADRs. Summarize the exact current state and proposed next implementation step before making edits. Do not modify another owner's work or change architecture without approval.

### Required handoff report template (`docs/handoffs/CURRENT_STATE.md`)

```markdown
# Veriq/Cedar — current engineering handoff
Date / time:
Current Git branch and commit:
Current milestone + exact approved task:
What works now (verified):
Files changed and reason:
DB migrations / seed state:
API/AI contract revisions (with ADR):
Commands and tests run (pass/fail):
Known bugs or failed tests:
Uncommitted changes / git status:
Risks to other teammates:
Next safe task (one bounded instruction):
```

## 9. Daily coordination and immediate team kickoff

**15-minute daily sync:** (a) API/contracts compatible? (b) which end-to-end step works today, actually? (c) what blocks the next shared gate? (d) contract changes or decisions needed? (e) what will each person merge next?

**Daniel's first deliverables:** Shared repo; `AGENTS.md`; approved ADR for Python stack; FastAPI backend skeleton; fixture IDs/DTOs; resolve demo login and entity-label gaps before those screens are wired.

**Habeeb's first deliverables:** Pydantic models plus validated example JSON for both AI endpoints; a real source-cited extraction sample; a grounded UNKNOWN-outcome investigation sample and tests.

**Usaamah's first deliverables:** Cedar and Veriq route map; typed contract-valid mocks; customer transfer→UNKNOWN→complaint flow; onboarding/claim review/context explorer skeleton.

**Do not wait to finish everything to integrate.** Each team member should demo a live path at the end of their own gate, then connect it to the shared repository before starting the next large feature.

## 10. Decisions/signoffs required now

- [ ] Daniel approves the FastAPI stack ADR, dev base URL, login demo-flow, and interface amendment plan.
- [ ] Habeeb accepts the exact two AI schemas, grounding/unknown behavior and private service boundary.
- [ ] Usaamah accepts both Cedar **and** Veriq frontend scope, role routes, and contract-gap resolution plan.
- [ ] Team agrees single scenario/fixture IDs, one demo recording, and measured/simulated labeling.
- [ ] Team confirms competition rules about building in advance and actual demo/video length independently.

**Success criterion:** Switching between Codex and Antigravity or integrating parallel AI/frontend work must never destroy institutional context, silently change authoritative bank state, violate frozen interfaces, or force anyone to guess how another component behaves.
