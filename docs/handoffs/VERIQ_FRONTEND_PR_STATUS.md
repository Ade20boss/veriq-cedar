# Standalone Veriq frontend PR handoff — 16 October 2026

Branch: `feat/veriq-frontend-pitch-fixes`, based on `origin/main` `7983ec8`.
This branch adds only the standalone `apps/web/veriq` app and this frontend handoff. It does not contain Cedar customer/Operations, backend, contract, schema, session, or recording-page changes. The focused Cedar frontend and 8082 Caddy gateway are in PR #11; review/merge that independently before relying on the gateway configuration in a new environment. Neither PR is automatically merged.

## Behavior and trust boundaries

- Live knowledge, monitoring, incident, and exact-case investigation panels call only the existing same-origin, bank-scoped `/v1/veriq/banks/CED/...` API with browser credentials. Missing/forbidden investigator sessions show errors; synthetic mode is not a backend authentication bypass.
- Authorized upload is available for a genuinely empty institutional projection. Five approved fixture filenames are allowed. The client hashes content, skips identical filename/checksum pairs already returned by the backend or repeated in one batch, distinguishes HTTP 202 application statuses (`PARSED`/`ACCEPTED` registered, `UPLOADED`/`STAGED` pending, `FAILED`/`REJECTED` failure), stops on failure, and refreshes source metadata. It does not assume matching filenames mean matching content. Do not re-upload Cedar's existing five sources during smoke tests.
- Exact authorized case ID lookup works without any incident link or invented case-list endpoint. The investigation view retains the current case's evidence on refresh errors, rejects stale/different-case responses, offers manual refresh, and bounds AI_PENDING polling to eight checks with backoff. AI-unavailable gets one delayed recheck; later changes require manual refresh. AI findings render only when returned for the same case/outcome. No financial finality or causal link is inferred from the separate suspected incident.
- `?mode=synthetic` is preserved through in-app workspace/case navigation; direct synthetic workspace URLs remain available after refresh. Onboarding and fixture-based overview/review screens are labeled as browser-only previews. Local review decisions are not persisted backend actions. The five-step onboarding does not register a real bank or create an investigator session.

## Checks actually run

- `pnpm install --frozen-lockfile --offline`: PASS, 553 packages.
- `pnpm exec tsc --noEmit`: PASS.
- `node --test tests/*.test.mjs`: PASS, 13 tests, 0 failures (upload outcomes/duplicates/partial failure, refresh transitions/stale guard/timer cancellation, synthetic routing).
- `pnpm build`: BLOCKED before app compilation because platform-owned `FIGMA_EID` is unavailable outside Figma Make. No dummy environment ID was supplied; this is not evidence of a successful production build.
- `PORT=3202 pnpm dev`: PARTIAL; isolated server served `/demo`, synthetic knowledge/monitoring/incidents/exact-case routes, and `/sign-in` with HTTP 200. The normal `/w/cedar-demo/knowledge` route redirected to `/sign-in` (HTTP 307). The dev process also logged unhandled `FIGMA_EID` resolution errors from `buildFigmaConfig`, so this is route compilation evidence only, **not** a clean production/runtime validation. The isolated 3202 process was stopped; original 3002/8082 services were not restarted.
- `figma make verify-deploy`: NOT RUN; Figma Make CLI/platform runtime unavailable in this local checkout. The production delivery requirement remains open.
- Empty-bank source upload was exercised with isolated mocked source metadata and registration responses, not a real empty authorized backend tenant. That end-to-end check remains open; do not create a new bank or re-upload Cedar fixtures merely to satisfy it.

## Backend and demo state

Canonical v1.0 endpoints and shapes remain unchanged. GET case is compatible with 0004 and 0005; 0005 adds a private durable AI run table and may transition `EVIDENCE_READY_AI_UNAVAILABLE` to `AI_PENDING` to `FINDINGS_READY` on a later enabled run. AI remains optional. A 0004/AI-disabled local database is a truthful degraded demo, not complete 0005 AI integration. Do not migrate, reset, grant, or enable AI without backend-owner coordination. Current five Cedar sources must not be uploaded again.

The original private investigator session returned HTTP 403. With explicit operator approval, exactly one replacement was minted through the existing private G2 CLI into an external mode-0600 file. Its command-line check returned HTTP 200 for Cedar context and the exact case; the existing customer session returned HTTP 200 for Ada's account. Read-only results: 5 sources/0 verified claims, UNKNOWN outcome/7 evidence/0 incident links/null AI, and customer balance 5000000 kobo. These checks do **not** prove that the actual Brave Default profile has either cookie. Authenticated Brave checks on this new branch remain open. The separate Cedar PR's 8082 gateway and approved private browser cookie installation are prerequisites for full live demonstration. No transfer, complaint, source upload, telemetry event, migration, or financial write was made for this PR.
