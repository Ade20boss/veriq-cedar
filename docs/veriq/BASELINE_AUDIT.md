# Veriq Gate 0 baseline audit

Date: 16 October 2026 (Africa/Lagos)

## Executive summary

**Gate 0 inspection only.** No application code, backend code, accepted contract, dependency manifest, environment file, database or seed data was changed.

The repository contains an imported Figma Make Veriq application at `apps/web/veriq`. It is already Next.js 16/React 19/TypeScript, not a Vite app. It is a Payload/Figma-managed project with App Router route groups, Payload admin/API routes, a Payload-backed application user collection, and a very large client-side workbench component.

The current frontend has a polished synthetic Veriq workbench and a separate Payload-backed application-auth flow. The workbench is predominantly local fixture data and local React state. It is not connected to the existing FastAPI Veriq endpoints. The current backend has real, scoped operational reads, source uploads/context, automatic complaint-to-case processing, and private investigator sessions, but not a general Veriq identity/institution service or the full OpenAPI surface.

The main Gate 1 blockers are:

1. The requested `docs/veriq/IMPLEMENTATION_PLAN.md` does not exist in this checkout. The closest available plan is `apps/web/veriq/VERIQ_CODEX_NEXTJS_MIGRATION_INTEGRATION_PLAN.md`.
2. `apps/web/veriq/node_modules` is absent, so frontend typecheck/build could not run without installing packages.
3. The existing Payload application-auth/membership model and FastAPI investigator session/bank-scope model are separate systems. Their ownership and mapping must be agreed before live Veriq integration.
4. The OpenAPI contract contains routes that current FastAPI source does not implement, especially review/demo/AI operations.

## Scope and evidence reviewed

- Root `AGENTS.md` and nested `apps/web/veriq/AGENTS.md`/`CLAUDE.md`.
- `apps/web/veriq/VERIQ_CODEX_NEXTJS_MIGRATION_INTEGRATION_PLAN.md`.
- Veriq package/configuration and all source files under `apps/web/veriq/src`.
- `apps/backend/README.md`, `src/veriq_cedar/main.py`, customer router, investigator dependency and `composition/pitch_api.py`.
- `contracts/openapi.yaml`.
- Existing pitch handoff `docs/handoffs/PITCH_BACKEND_STATUS.md`.
- Repository status and non-destructive checks listed below.

The root working tree already contains untracked work from earlier tasks, including `apps/web/veriq/` and documentation directories. These were preserved.

## 1. Monorepo and dependency assessment

There is no root `package.json`, `pnpm-workspace.yaml`, or other workspace manifest at the inspected top levels. The web applications are separate package directories.

### Veriq package

File: `apps/web/veriq/package.json`

- Next.js `16.4.0`
- React/React DOM `19.2.1`
- Payload `4.0.0-beta.1`
- `@payloadcms/figma`, `@payloadcms/next`, UI, translations, richtext, cloud storage and MCP plugins
- Tailwind CSS 4 through `@tailwindcss/postcss`
- `lucide-react`, Monaco, GraphQL, `html-react-parser`, Sharp
- TypeScript, Node and pnpm engines
- Scripts: `dev`, `build`, `start`, `format`, Payload type/import-map commands
- No `lint` or test script

File: `apps/web/veriq/.mise.toml`

- Node `24.15.0`
- pnpm `10.34.3`

The current shell has Node `v24.19.0` and pnpm `10.34.5`, close to but not identical to the project metadata.

### Figma/Payload-specific configuration

Observed:

- `src/payload.config.ts` uses `buildFigmaConfig()`, keeps the Payload Admins and Media collections, registers Users/Folders/Tags/Posts, and enables the MCP plugin.
- `next.config.ts` wraps config with `withPayload`, uses the Figma image loader, standalone output, Figma preview origin handling, server-action allowed origins and Payload build integration.
- `figma-image-loader.ts` exports `figmaNextImageLoader`.
- `src/lib/make-custom-code.tsx` renders Figma-managed head/body custom code.
- `src/lib/make-site-settings.ts` and `.figma/make/*` are platform-generated infrastructure.
- Payload Admin/API route groups under `src/app/(payload)` should remain platform-managed.
- `src/collections/Users.ts` is an auth-enabled Payload collection for public app users; `Admins.ts` is a separate CMS/admin collection.
- `src/payload-types.ts` is generated and contains app-role/membership fields.

The nested instructions explicitly prohibit replacing Figma Payload configuration with raw Payload database setup, adding dummy secrets, or treating Payload Admin auth as public app auth.

## 2. Existing frontend routes and implementation state

### Route inventory

| Route | Observed state |
|---|---|
| `/` | Server page checks Payload app session and redirects to sign-in, onboarding, workspace selection or workspace. |
| `/sign-in` | Functional-looking app sign-in form posting to local Next route. |
| `/sign-up` | Functional-looking app registration form posting to local Next route. |
| `/select-workspace` | Server page lists current user's Payload membership array and links to a workspace/onboarding route. |
| `/onboarding/[step]` | Honest placeholder explaining administrator configuration is required; does not perform onboarding. |
| `/invitations/accept` | Preserves invitation context but explicitly says acceptance is not connected. |
| `/demo` | Synthetic, unauthenticated local workbench. |
| `/w/[institutionId]/[[...view]]` | Authenticated membership check, then mounts the giant `VeriqApp` client component. |
| `/api/app-auth/login` | Next route calling Payload `payload.login`. |
| `/api/app-auth/register` | Next route validating and creating a Payload User. |
| `/api/app-auth/logout` | Clears the `app-session` cookie and redirects. |
| `/admin`, Payload API/GraphQL routes | Figma/Payload admin/control-plane routes; not the Veriq product API. |

### Workbench implementation

File: `src/app/(frontend)/components/veriq-app.tsx` — 6,189 lines.

Observed reusable primitives include buttons, inputs, badges, cards, alerts, skeletons, empty/error states, navigation, tabs, tables, drawers and dialogs. The file also contains feature-level components for:

- Intelligence Overview
- Investigations list/detail
- Evidence Explorer
- AI Analysis panel
- Operational Monitoring
- Incidents list/detail
- Review Queue/detail
- Shell/foundations preview

The component owns local React state for selected institution, page, filters, records, notes, review decisions, incident lifecycle dialogs and demo actions. It defines local fixture arrays for institutions, activity, incidents, investigations, evidence, reviews, services, anomalies and events.

The UI is careful in several places to label actions as local/synthetic and state that no institutional authorization or backend action occurred. That disclosure must be preserved during integration.

### Classification

| Area | Status | Evidence |
|---|---|---|
| Visual workbench/shell | Implemented as UI | `veriq-app.tsx`, CSS and reusable local primitives |
| Institution switcher | UI with local fixture names | `institutions` constant and local `selected` state |
| Overview metrics/charts | Implemented with synthetic fixtures | `activityFixtures`, local metric components |
| Monitoring/events/anomalies | Implemented with synthetic fixtures | `serviceFixtures`, `OperationalEvent`, local filters |
| Incidents | Implemented with synthetic records and local lifecycle UI | `initialIncidentRecords`, local update handlers |
| Investigations | Implemented with synthetic records and local state | `initialInvestigationRecords`, local create/update handlers |
| Evidence | Implemented as local fixture explorer | `evidenceFixtures` |
| AI analysis | UI/demo candidate presentation | `AIAnalysisPanel`; no backend AI call |
| Reviews | UI/demo decisions only | Explicit copy says no institutional approval occurs |
| Sign-in/sign-up | Payload-backed local application auth | `lib/app-auth.ts` and Next route handlers |
| Membership/workspace selection | Payload membership array | `Users.ts`, `select-workspace/page.tsx` |
| Institution onboarding | Placeholder | `onboarding/[step]/page.tsx` |
| Invitation acceptance | Placeholder | `invitations/accept/page.tsx` |
| Live FastAPI Veriq data | Not implemented | No FastAPI API adapter or calls found in Veriq source |

## 3. Authentication, membership and tenancy

### Existing Veriq app auth

`src/lib/app-auth.ts`:

- Uses Payload Local API and the `users` auth collection.
- Reads `app-session` from server cookies.
- Calls `payload.auth()` to resolve the user.
- Login sets an HttpOnly, SameSite=Lax cookie at `/`.
- Registration creates a User with `appRole: member`, empty memberships and active status.
- Post-login path is derived from membership count/setup state.
- Logout deletes the cookie.

`src/collections/Users.ts`:

- Public registration is narrowly allowed through request context `appRegistration`.
- Users can read/update only their own record; Payload admins can manage users.
- Memberships are an array of embedded fields: institution ID/name, role and setup state.
- Roles include analyst, investigator, reviewer and institution-admin.
- There is no observed institution collection, invitation persistence model, membership API, workspace authorization service, or server-side mapping to Cedar bank IDs.

### Risk

The independent Veriq app is designed for multi-institution access, but the current membership record is a denormalized Payload array and the workbench accepts an institution display name. The backend investigator API is scoped by `bankId` and requires a private `cedar_demo_session` token with role INVESTIGATOR. These are not interchangeable:

- Veriq `institutionId` must not be assumed equal to backend `bankId`.
- Veriq Payload `app-session` cannot currently authenticate to FastAPI investigator routes.
- A local role selector or hidden UI button cannot grant backend permission.
- Defaulting every Veriq workspace to `CED` would violate the independent multi-institution boundary.
- A browser must not receive internal service credentials or database/AI access.

A Gate 1 architecture decision is required for identity/session ownership, institution-to-bank scope mapping, and the approved same-origin gateway/cookie arrangement.

## 4. Existing backend and integration opportunities

### Implemented FastAPI routes

The backend registers customer and pitch routers in `src/veriq_cedar/main.py`.

Current Veriq routes in `composition/pitch_api.py`:

- `GET /v1/veriq/banks/{bankId}/operations`
- `GET /v1/veriq/banks/{bankId}/incidents`
- `GET /v1/veriq/banks/{bankId}/incidents/{incidentId}`
- `GET /v1/veriq/banks/{bankId}/cases/{caseId}`
- `POST /v1/veriq/banks/{bankId}/cases/{caseId}/investigate`
- `POST /v1/veriq/banks/{bankId}/sources`
- `GET /v1/veriq/banks/{bankId}/sources`
- `GET /v1/veriq/banks/{bankId}/sources/{sourceId}/claims`
- `GET /v1/veriq/banks/{bankId}/context`
- `GET /v1/veriq/banks/{bankId}/relationships`

Auth is a private investigator session using the frozen cookie name `cedar_demo_session`. The backend checks token hash, expiry, investigator role and exact bank scope. It uses origin checks for POST requests and sanitized errors.

### Safe integration opportunities

The first backend-connected Veriq slice can use:

1. Operations route health snapshot.
2. Incident list/detail reads.
3. Exact complaint investigation read.
4. Source list/upload.
5. Context summary.
6. Documented relationships.
7. Source claims endpoint as an explicit empty/pending state.
8. Investigate command only where exact case ID and approved permission/session are available.

These reads must be adapted into the existing UI without making a Veriq institution automatically equal to `CED`.

The current backend does not implement AI extraction/analyze-case, final financial status reveal, human review endpoints, customer-safe publishing, staff assignment, institution management, connector authorization, synchronization API, or notification stream.

## 5. OpenAPI compatibility

### Accepted contract paths

`contracts/openapi.yaml` contains Cedar account/bank/name-enquiry/transfer/complaint routes and Veriq sources/claims/context/relationships/operations/incidents/cases routes. It also lists:

- Assertion review.
- Case review.
- Incident review.
- Demo reset/seed/stream/scenario controls.
- Transfer status reveal.
- Internal AI extraction and case analysis.

### Contract/source mismatch

Current FastAPI source does not expose implementations for:

- `POST /v1/veriq/banks/{bankId}/assertions/{assertionId}/review`
- `POST /v1/veriq/banks/{bankId}/cases/{caseId}/review`
- `POST /v1/veriq/banks/{bankId}/incidents/{incidentId}/review`
- `/v1/demo/*`
- `/internal/ai/*`

The source does implement the Veriq `sources/{sourceId}/claims` read, returning an empty list because no AI provider was called. The accepted contract remains authoritative; the frontend must not use a path merely because it is listed there until implementation and authorization are verified.

The frontend must preserve exact accepted field names/enums and must not introduce an alternative `/api/v1` contract as part of Gate 1.

## 6. Missing features and risks

### P0

- Identity/session bridge between Payload app auth and FastAPI investigator authorization.
- Institution membership and bank-scope mapping owned and enforced server-side.
- Same-origin gateway for browser requests and cookie paths; no direct browser access to internal FastAPI/database/AI.
- Explicit live/synthetic environment and institution labeling.
- Typed API client with exact backend DTOs and sanitized error mapping.
- Preserve separate case, investigation, incident, transfer, evidence, source, job and run IDs.

### P1

- Live operations/incident/case reads in existing views.
- Source/context/relationship integration.
- Loading, stale, disconnected, 401, 403, 404 and AI-unavailable states.
- Cursor/pagination support when backend endpoints provide it.
- Honest source claims/pending UI.
- Workspace refresh/reload recovery.

### P2

- Review workflow after backend implementation is verified.
- Connector/sync/knowledge onboarding after approved API exists.
- Assignment/team/audit/report workflows.
- Push events or SSE after REST behavior is stable.
- AI candidate display only after approved backend result contract and provenance validation.

### Risks

- The giant client component makes feature isolation, API ownership and test coverage difficult.
- Local state can accidentally be mistaken for durable investigation truth.
- The workbench has multiple local institution and Cedar demo labels; this can create unsafe tenant coupling.
- Payload/Figma platform envs may be unavailable outside Make lifecycle.
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`; type safety is currently not enforced by production build.
- No frontend lint/test scripts exist.
- The working tree contains the app as untracked content; do not reset or discard it.

## 7. Next.js restructuring recommendations for Gate 1

These are proposals, not changes:

- Keep App Router route groups and existing URLs.
- Preserve `src/app/(payload)` unchanged.
- Keep Figma `buildFigmaConfig`, image loader, Make custom-code integration and Payload Admin boundaries.
- Extract the giant client workbench gradually into `features/overview`, `features/monitoring`, `features/incidents`, `features/investigations`, `features/reviews`, `features/onboarding` and shared `components/ui`/layout modules.
- Add `lib/api` for typed FastAPI adapters, `lib/auth` for the existing Payload session boundary, `lib/tenancy` for authorized institution scope and `lib/formatters` for status/timestamp presentation.
- Add explicit `types` for backend DTOs and UI view models; never reuse display fixture types as API truth.
- Keep synthetic fixtures behind an explicit `lib/demo` boundary.
- Make the browser gateway/API origin an explicit configuration decision; do not hardcode `CED` or expose credentials.
- Remove `ignoreBuildErrors` only after type errors are resolved and after owner review.

## 8. Exact proposed Gate 1 work

Gate 1 should be a normalization/refactor gate only:

1. Register `apps/web/veriq` in the repository's approved workspace/dev workflow without changing package ownership or installing new dependencies.
2. Establish a documented nonconflicting dev port and safe non-secret environment template.
3. Capture the current route behavior with smoke checks before extraction.
4. Extract shared primitives and feature modules from `veriq-app.tsx` without changing markup, visual tokens, labels or route URLs.
5. Move fixture data and domain types behind explicit demo/type modules.
6. Add a typed, server-safe FastAPI adapter skeleton only for verified endpoints; no live calls until session/mapping authority is approved.
7. Preserve the existing Payload app-auth routes and membership semantics; do not replace auth.
8. Replace local navigation coupling only where route/institution behavior is regression-tested.
9. Enable typechecking in a controlled step, resolve actual errors, and then propose removal of `ignoreBuildErrors`.
10. Add the minimum lint/type/build scripts using existing toolchain only if owner approval permits manifest changes.
11. Add a baseline route/tenant/auth integration matrix and regression checklist.

### Proposed Gate 1 files to modify

These are planning targets only; none were modified in Gate 0:

- `apps/web/veriq/package.json` — only if workspace scripts/checks need registration.
- `apps/web/veriq/next.config.ts` — only for approved safe build/type configuration.
- `apps/web/veriq/.env.example` — new safe variable names only, no secrets.
- `apps/web/veriq/src/app/(frontend)/components/veriq-app.tsx` — temporary extraction source during small refactors.
- New `apps/web/veriq/src/features/**` modules.
- New `apps/web/veriq/src/components/**` modules.
- New `apps/web/veriq/src/lib/api/**`, `src/lib/tenancy/**`, `src/lib/formatters/**`.
- New `apps/web/veriq/src/types/**`.
- Tests under `apps/web/veriq/tests/**` if existing tooling is approved.
- Documentation under `docs/veriq/**`.

Do not modify `src/app/(payload)`, generated `payload-types.ts`, accepted OpenAPI, backend source or Cedar applications during Gate 1 without separate coordination.

## 9. Validation plan

### Checks executed

| Check | Result |
|---|---|
| Repository status/branch | Passed inspection; existing untracked app/docs preserved |
| Node/pnpm | Node `v24.19.0`, pnpm `10.34.5`; project metadata requests Node `24.15.0`, pnpm `10.34.3` |
| Veriq typecheck | Blocked: `node_modules` absent; `tsc` unavailable |
| Veriq lint | Blocked: no `lint` script |
| Veriq build | Blocked: local `payload` binary unavailable because dependencies are not installed |
| Backend non-PostgreSQL tests | Passed: `47 passed, 76 deselected` |
| Backend Ruff | Passed: `All checks passed!` |
| DB migrations/seeding | Not run, per task restriction |
| Package installation | Not run, per task restriction |
| Frontend runtime/browser smoke | Not run; no frontend dependencies and no request to start it |

### Recommended Gate 1 validation

After approval and explicit authorization for dependency setup:

- Use the project pnpm version metadata and install from the existing lockfile only.
- Run TypeScript with `ignoreBuildErrors` still visible during the first baseline, then resolve errors before changing config.
- Add/run a lint command only with the existing toolchain.
- Run Payload/Next production build inside the supported Make environment if required platform variables are available; otherwise record the platform limitation.
- Smoke-test `/`, `/sign-in`, `/sign-up`, `/select-workspace`, `/demo`, `/onboarding/institution`, `/invitations/accept`, and a permitted workspace path.
- Test unauthenticated, no-membership, incomplete-membership, multi-membership, unauthorized institution and synthetic-demo states.
- Before any live backend call, obtain team agreement on identity/session bridging and institution-to-bank authorization.

## Gate 0 conclusion

Gate 0 inspection is complete. No Gate 1 implementation was started. The next safe action is to review this baseline with the frontend/backend owners and explicitly decide:

1. whether Payload remains the app identity source or only a temporary local auth layer;
2. how a Veriq institution maps to an authorized backend bank scope;
3. how the browser receives a permitted investigator session through the same-origin gateway;
4. which existing OpenAPI routes are confirmed live;
5. whether dependency installation and a supported Payload/Make build environment may be used for Gate 1.

