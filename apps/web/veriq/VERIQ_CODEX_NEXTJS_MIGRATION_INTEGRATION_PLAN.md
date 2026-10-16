# Veriq — Codex Next.js Normalization, Frontend Completion & Backend Integration

**Handoff status:** Implementation plan, not evidence of completed implementation.
**Target:** Existing monorepo, with the imported Figma Make Veriq app at `apps/web/veriq`.
**Working method:** Inspect → plan → implement one gate → test → report → stop for approval.

## Critical clarification

The supplied Figma Make export was **already Next.js 16 / React 19 / TypeScript** (`next@16.4.0`, `react@19.2.1`) with App Router route groups. Do not replace it with a new blank scaffold or migrate from Vite unless the **actual imported repository** differs. This work is a normalization, extraction/refactor, and monorepo integration task.

The export includes Figma-specific Payload packages (`@payloadcms/figma`, Payload 4 beta), an image loader, authentication routes/cookies, and a ~6,000-line `veriq-app.tsx`. Assess their active dependencies and purpose **before** removing or replacing anything. The snapshot's `next.config.ts` had `typescript.ignoreBuildErrors: true`; restore type safety only after resolving all errors.

## Non-negotiable boundaries

1. `apps/web/cedarBank`: Cedar customer app; Cedar backend owns account balances, transfer outcomes, complaints and idempotent financial commands.
2. `apps/web/Cedar Bank Operations Design`: Cedar-specific staff application; preserve its currently working backend slice.
3. `apps/web/veriq`: **independent multi-institution** Veriq product; never default a user to Cedar Bank, never equate institution IDs with backend bank IDs.
4. `contracts/openapi.yaml`: accepted **v1.0** wire authority. Verify it against actual backend code/tests. Proposed `/api/v1/...` routes are *not* implemented merely because documentation lists them.
5. Use the authorized same-origin browser gateway/session setup, not direct browser access to internal FastAPI/PostgreSQL/Redis/LLM or untrusted browser role flags.
6. `processing_stage=RESPONSE_TIMEOUT` can coexist with `financial_outcome=UNKNOWN`. Do not infer transfer failure, success, refund or reversal from timeout, anomaly, incident or AI content.
7. Evidence-backed observations must be separated from AI hypotheses; `AI_UNAVAILABLE` must remain visible when the backend has no analysis.
8. Synthetic environments must be unambiguously labeled. Demo connection/synchronization is not real authorization or live data.
9. No broad source rewrite, no changes to banking backend/contract without agreement, no secret leakage, no Git destructive commands.

## Existing confirmed context to verify in the live repository

Previous independent zip inspection found:
- `src/app/(frontend)/components/veriq-app.tsx`, a very large main app component.
- `src/app/(frontend)/w/[institutionId]/[[...view]]/page.tsx` and client-side screen selection.
- `src/app/(frontend)/api/app-auth/{login,logout,register}/route.ts` and Payload auth utilities.
- `src/app/(frontend)/onboarding/[step]/page.tsx`, at that snapshot an incomplete onboarding placeholder.
- `src/app/(payload)/...`, `src/payload.config.ts`, `src/collections/...`, Figma image loader and Figma-specific configuration.
- `public/veriq-logo.png` and original navy/teal design tokens.

These are **snapshot observations**. Reinspect the actual imported files before drawing conclusions.

# Implementation gates

## Gate 0 — Repository survey and safety baseline (no feature implementation)

1. Read `AGENTS.md`, repository README, monorepo/package-manager/workspace config, existing docs, `contracts/openapi.yaml`, backend README/tests, and the three apps' manifests.
2. Discover precise runtime, package manager, Node version, workspace packages, ports, application mounts, auth cookies, proxy/deployment topology, env variables and accepted API shapes. Never print env secret values.
3. Produce a concise source-grounded inventory: working / partial / demo-only / placeholder; actual public routes; dependencies; existing test commands.
4. Identify build blockers and coupling to Figma/Payload without changing functionality.
5. Make a dedicated working branch if repository policy supports it; keep original export recoverable.
6. Report findings, baseline checks, and the exact Gate 1 diff plan. Stop for approval if any identity or backend architectural choice is required.

**Gate 0 output:** `docs/veriq/BASELINE_AUDIT.md` with file references and checks.

## Gate 1 — Normalize the Next.js app and structure the source

Goal: Make `apps/web/veriq` independently runnable and maintainable **without changing product behavior or appearance**.

- Register imported app correctly in the existing monorepo/workspace, using the existing package manager and version conventions; keep its own package manifest.
- Establish nonconflicting dev server port and environment template; use explicit variables for browser-safe origin, same-origin API gateway and synthetic mode.
- Trace Figma-specific Payload and image dependencies; preserve required features. Do **not** simply strip Payload until an agreed authentication/data replacement is available. If an export dependency cannot run externally, isolate it behind an adapter and document the tradeoff.
- Break up the giant application by extracting small, tested feature components gradually. Avoid changing page markup and styling while moving code.
- Preserve the official Veriq logo, responsive shell, all completed designs and established design system tokens.
- Replace competing navigation only where tests confirm routing and institution state stay correct; use Next.js router/navigation consistently rather than mixing local page state and manual history pushes.
- Reduce technical debt: shared domain types, fixtures, hooks, typed API clients, status formatting, error/empty/loading components.
- Do not make assumptions about production auth while normalizing. Treat old Figma auth as existing behavior pending the identity decision.
- Fix TypeScript errors and then remove `ignoreBuildErrors: true`. Add/check lint/test scripts according to existing repo tooling.

**Illustrative architecture (adjust to actual repo; not a mandatory rewrite):**

```text
apps/web/veriq/
  public/                       # official logo/assets
  src/
    app/                        # App Router pages/layouts/API proxy only if approved
      (auth)/
      (onboarding)/
      (workspace)/
    components/
      ui/                       # shared visual primitives
      layout/                   # shell, sidebar, header, institution switcher
    features/
      overview/
      monitoring/
      incidents/
      investigations/
      reviews/
      onboarding/
      knowledge/
      audit/
      settings/
    lib/
      api/                      # typed, server-safe API adapters
      auth/                     # session authority adapter
      tenancy/                  # authorized institution scope
      demo/                     # explicit deterministic synthetic fixtures
      formatters/
    types/                      # contracts and UI-only view models
    styles/
  tests/
  .env.example
  package.json
  next.config.ts
```

Use the smallest safe diffs and preserve existing route URLs. Do not claim Gate 1 complete until local build and routes work.

## Gate 2 — Complete missing frontend UX without unapproved backend assumptions

After approval, work one tightly scoped page/feature at a time:

- Institution create/join/invitations/authorized workspace selection (if still incomplete)
- Bank Connection permission review and connector availability
- Bank Synchronization stepper, activity log, retry/resume and simulated/live distinctions
- Institutional Knowledge Onboarding
- Knowledge Explorer
- Audit & Activity
- Integrations and Institution Settings

Reuse established components. Workflows may show honest unavailable states until implemented backend capability exists. Do not invent functioning endpoints. Do not turn demo role selectors into real authorization.

## Gate 3 — Backend integration (contract-first, vertical slices)

1. Re-read actual `contracts/openapi.yaml` and implemented FastAPI router/security code. Produce **observed** endpoints with exact method/path/schemas/errors and access preconditions.
2. Decide jointly who owns identity/session, institutions, bank mappings and authorization; **do not choose or implement a competing identity system unilaterally**.
3. Build a typed browser/server adapter that accesses approved routes via authorized same-origin gateway; send cookies only as appropriate, never store secrets in client bundles. Ensure routing to `/w/[institutionId]` resolves only to institution membership and approved connected bank scope; never `institutionId === bankId` or blanket fallback to `CED`.
4. Integrate actual available read endpoints first, without mutating banking truth:
   - `GET /v1/veriq/banks/{bankId}/operations`
   - `GET /v1/veriq/banks/{bankId}/incidents`
   - `GET /v1/veriq/banks/{bankId}/incidents/{incidentId}`
   - `GET /v1/veriq/banks/{bankId}/cases/{caseId}`
   - `GET /v1/veriq/banks/{bankId}/sources`
   - `GET /v1/veriq/banks/{bankId}/context`
   - `GET /v1/veriq/banks/{bankId}/relationships`
   - Available accepted POST source/investigate commands only with exact contract requirements and permission checks.
5. Map backend enums with explicit typed adapters; never invent incident/investigation lifecycle state transitions. Preserve separate `case_id`, `transfer_id`, `incident_id`, `investigation_id`, `evidence_id`, `source_id` and job identifiers.
6. Implement loading, 401, 403, 404, 409, 429, 503, partial source coverage, stale data, disconnected and AI-unavailable states.
7. Keep future institution/connector/sync/approval/report APIs behind documented feature gates until the backend team approves and implements them. Do not write contract-changing backend code as part of a frontend task.
8. Write an integration matrix that says **Live / Simulated / Unavailable** per surface and identifies the backend source of truth.

If there is no approved mapping from a Veriq institution to `CED`, **do not turn the independent Veriq dashboard into a live Cedar dashboard**. Maintain a separate explicit synthetic demonstration workspace and request the missing agreement.

## Gate 4 — End-to-end verification, regression and user acceptance

- Run typecheck, lint, production build, existing tests and route smoke tests for Veriq. Report exact commands and real outcomes, including any unresolved failures.
- Regression-test BOTH existing Cedar apps and accepted FastAPI contract endpoints. Do not reset shared databases; use authorized disposable fixtures and seeds only.
- Test at 1440, 1366, 1280, 1024 and 390 px. Confirm no document-level horizontal overflow and usable menus/tables/drawers.
- Exercise authenticated, invited, unauthorized, no-membership, incomplete-onboarding, multi-institution, disconnected and synthetic demo cases.
- Verify actual S2 transfer shows `RESPONSE_TIMEOUT / UNKNOWN`, no fabricated customer credit outcome, complaint persists and the authorized investigator can retrieve the case.
- Verify monitoring/incident/case source timestamps, evidence provenance, honest AI-unavailable state, and correct distinction of real API data from synthetic fixture data.
- Verify 401/403/404/409/429/503 and disconnected/reload/retry behaviors.
- Verify tenant isolation and permission enforcement server-side, not only hidden UI buttons.
- Test reduced motion, keyboard navigation, focus handling, screen widths and table scrolling.
- Create concise reproducible manual acceptance checklist where automated E2E environments are unavailable; never claim tests ran if they did not.

**Gate 4 output:** `docs/veriq/TEST_REPORT.md`, `docs/veriq/INTEGRATION_MATRIX.md` and a list of known gaps/owners.

# Codex master instructions — first task only

> Read this document and all repo-specific `AGENTS.md` instructions. We are migrating the **already-Next.js** Figma Make Veriq frontend into `apps/web/veriq` and then integrating it with a separate, partly implemented FastAPI banking backend. Keep Cedar's customer app and Cedar's staff app unchanged. Treat `contracts/openapi.yaml` as the accepted contract; `/api/v1` proposals are not accepted. Start with **Gate 0**: inspect, classify and document the real code and current backend. Report commands, file evidence, risks and proposed Gate 1 edits. Do not implement Gates 1–4 until I approve the plan. Do not invent backend endpoints, banking outcomes, live authorization or AI results. Preserve the current Veriq UI and official logo.

# Gate completion report format

For each gate, report:

1. What was inspected and actual implementation state.
2. Files changed and why.
3. Design/UI regressions avoided or detected.
4. Existing versus proposed endpoints used.
5. Commands/tests executed with pass/fail evidence.
6. Risks, unresolved decisions and blockers.
7. Recommended precise next action.

**Stop after each gate and wait for approval.**
