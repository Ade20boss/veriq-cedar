# Veriq Gate 1A baseline stabilization report

Date: 16 October 2026 (Africa/Lagos)
Scope: apps/web/veriq only

## 1. Dependency installation

Command:

~~~bash
cd apps/web/veriq
pnpm install --frozen-lockfile
~~~

Result: PASSED

- Lockfile was up to date; resolution was skipped.
- 553 packages were installed.
- No package versions or lockfile entries were intentionally changed.
- pnpm used: 10.34.5.
- Project metadata requests pnpm ^9 || ^10 and .mise.toml pins 10.34.3.

The install emitted slow-download/timeout retries for a few npm tarballs, but completed successfully. No external database, migration, seed, credential or environment setup was performed.

## 2. Toolchain and configuration

Observed:

- Node runtime: v24.19.0
- Project metadata: Node 24.15.0
- Next.js: 16.4.0
- React/React DOM: 19.2.1
- Payload: 4.0.0-beta.1
- TypeScript resolved from the lockfile: 5.9.3
- Tailwind CSS 4 and the Figma image loader remain configured.
- next.config.ts wraps the app with withPayload and buildFigmaConfig() remains in src/payload.config.ts.
- next.config.ts still has typescript.ignoreBuildErrors: true; this was not changed.
- No .env or .env.example exists in apps/web/veriq.

Environment references found:

- FIGMA_EID is required by @payloadcms/figma to resolve the Figma environment.
- FIGMA_PUBLIC_URL controls preview origin and public site URL behavior.
- FIGMA_CONTENT_API_CONTENT_SYSTEM_ID
- FIGMA_CONTENT_API_URL
- FIGMA_OAUTH_CLIENT_ID
- NEXT_PUBLIC_SITE_URL has a local fallback in the Next config/layout.
- NODE_ENV controls the secure flag on the app session cookie.

The Figma-specific values are platform-owned. No values were invented or added.

## 3. TypeScript

Command:

~~~bash
pnpm exec tsc --noEmit
~~~

Result: PASSED

The command completed with exit code 0 and no TypeScript diagnostics.

This is a typecheck result only. It does not prove that Payload/Figma runtime initialization or production build succeeds.

## 4. Formatting/lint checks

Command:

~~~bash
pnpm exec oxfmt --check .
~~~

Result: FAILED — formatting baseline

OxFMT reported formatting issues in 22 files, including:

- figma-image-loader.ts
- next.config.ts
- postcss.config.mjs
- several frontend route files
- veriq-app.tsx
- Payload route/import-map files
- collection/configuration files
- generated payload-types.ts

No formatter was run in write mode.

There is no lint script in package.json, so pnpm run lint returns “Missing script: lint.” No lint dependency or script was added during Gate 1A.

## 5. Production build

Command:

~~~bash
pnpm build
~~~

Result: FAILED — missing Figma platform environment

The build fails while loading src/payload.config.ts:

~~~text
Error: Environment ID could not be resolved. Set FIGMA_EID or initialize the project.
    at buildFigmaConfig
    at src/payload.config.ts:16
~~~

This is a Figma/Payload platform initialization failure, not a TypeScript compilation failure. The build was not made to pass by adding a dummy environment ID, replacing buildFigmaConfig, or removing Payload.

## 6. Development server

Command:

~~~bash
PORT=3002 pnpm dev
~~~

Result: STARTED

- Local URL: http://localhost:3002
- Next.js/Turbopack reported ready.
- Port 3002 was selected to avoid existing local services.
- The server emitted Environment ID could not be resolved errors when dynamic Payload-backed routes attempted to resolve app auth.
- The server nevertheless served public/static frontend routes.

The server remains running in the local development process.

## 7. Route smoke checks

Checks used Node's built-in fetch because common shell HTTP utilities were not available in the execution PATH.

| Route | Result | Interpretation |
|---|---:|---|
| / | 307 → /sign-in | Correct unauthenticated redirect |
| /sign-in | 200 | Public auth page renders |
| /sign-up | 200 | Public registration page renders |
| /select-workspace | 307 → /sign-in | Membership route did not bypass auth |
| /demo | 200 | Synthetic unauthenticated demo renders |
| /onboarding/institution | 307 → /sign-in | Onboarding did not bypass auth |
| /invitations/accept | 307 → /sign-in | Invitation route did not bypass auth |
| /w/demo/overview | 307 → /sign-in | Workspace route did not bypass session/membership checks |

No session cookie was fabricated or injected. No membership check was bypassed.

## 8. Figma/Payload portability

The imported app can start Next dev sufficiently to serve public routes outside Figma Make, but it is not fully portable as a standalone Payload deployment.

Known requirements/limitations:

1. buildFigmaConfig() requires a platform-resolved Figma environment ID.
2. Payload Admin/API behavior depends on Figma-managed backend/platform variables.
3. .figma/make/dev explicitly tolerates failed import-map generation before starting the frontend, but that does not make Payload auth/admin operational.
4. Production payload build cannot complete without the platform environment.
5. Payload Admin/API route groups remain platform-managed and were not modified.
6. Existing Figma custom code, image loader, Payload wrapper and platform configuration remain intact.
7. The current app-auth flow uses Payload Local API and cannot authenticate to the separate FastAPI investigator session without an approved identity/session bridge.

## 9. Existing errors and technical risks

- Build error: missing FIGMA_EID/Figma initialization in src/payload.config.ts.
- Dev-time dynamic-route error: the same Figma environment resolution failure appears when protected routes call src/lib/app-auth.ts.
- Formatting baseline: 22 files fail oxfmt --check.
- No lint script exists.
- next.config.ts ignores build type errors, although standalone tsc --noEmit currently passes.
- Auth/membership is Payload-local and denormalized in Users.memberships; it is not the FastAPI institution/bank authorization model.
- The workspace UI remains synthetic/local state and is not connected to FastAPI.
- The imported app remains a single 6,189-line veriq-app.tsx; no restructuring was performed in Gate 1A.

## 10. Gate 1A file/state changes

No source code, dependency manifest, lockfile, Payload config, environment file, backend file, Cedar app or accepted contract was changed.

Dependency installation created the ignored local node_modules tree. Existing untracked files were preserved. No destructive Git command was run.

## 11. Recommended Gate 1B actions

Before restructuring:

1. Obtain the approved Figma Make/Payload runtime environment or an owner-approved local portability strategy. Do not invent FIGMA_EID or platform secrets.
2. Re-run pnpm build and route checks inside the supported Figma Make environment.
3. Decide whether Gate 1B may add a lint script and whether formatting should be normalized across generated Payload files or only app-owned files.
4. Agree on the identity/session bridge between Payload app-session and FastAPI cedar_demo_session.
5. Agree how an independent Veriq institutionId maps to an authorized backend bank scope; never default all institutions to Cedar.
6. Preserve the synthetic /demo path as an explicit fixture mode.
7. Only after the above decisions, extract features from veriq-app.tsx without changing route URLs, visual tokens, auth boundaries or synthetic disclosures.
8. Add typed adapters for only verified FastAPI routes; do not use unimplemented OpenAPI review/demo/AI routes.

Gate 1A stops here. Gate 1B restructuring and integration work has not begun.

