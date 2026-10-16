# Cedar-only frontend PR handoff

16 October 2026 (Africa/Lagos). Branch `feat/cedar-frontend-pr6-fixes` from current `origin/main` `7983ec8`. This PR carries the reviewed Customer API client/screens and Cedar Operations integration from PR #6, without the standalone Veriq app or the uncommitted recording routes. PR #6 and its worktree remain untouched.

## Review corrections

- Name enquiry: the old rule invalidated/aborted a request but left loading true because the obsolete request's `finally` was generation-guarded. Cancellation now clears loading immediately; the fresh request owns loading until it completes. A dynamic regression exercises cancelled first request, fresh second submission, stale completion and successful fresh response.
- Pending transfer: the old global `v1` key was deleted when a different account read it and was automatically rejected after 24 hours. The new `v2` key is per account; only its owner can recover or clear it. A legacy record migrates only for its owner, while another account leaves it untouched. No frontend-only expiry remains because the current backend's persisted `(bank_id, customer_id, key)` idempotency record has no time-based expiry. This preserves an unresolved key, but is not a backend transaction-history service; manually clearing localStorage still loses browser recovery metadata.
- Port mapping: the checked-in Caddyfile now routes Customer 3000→8080, Operations 3001→8081 and Veriq 3002→8082. The running local demo processes are still assigned Customer 3001/Operations 3000 under a separately running gateway; they were not moved or restarted. An isolated staging test on ports 3100/3101 behind temporary 8180/8181 gateways served the expected Customer/Operations HTML; 8182 served the existing Veriq app. Thus the route topology and app identity were checked beyond Caddy syntax, but the live 3000/3001 processes remain to be relaunched under the new mapping at a safe operator-approved time.

No frozen API contract, backend code, auth, migration, AI service, balance, transfer, complaint or source record changed. Customer cookie remains server-provisioned and same-origin; staff bank scope remains backend-enforced. The current main backend includes migration 0005 and optional AI integration; the local demo database was not migrated from 0004 here, so its earlier AI-disabled rehearsal is not a complete 0005 integration test.

## Verification

- Customer `node --test tests/customer-regressions.test.mjs`: 6/6 passed.
- Customer `pnpm exec tsc --noEmit`: passed; production `pnpm run build`: passed.
- Operations `node --test tests/investigation-switching.test.mjs`: 1/1 passed; `pnpm run typecheck`, `pnpm run lint`, production `pnpm run build`: passed.
- `caddy validate --config infra/pitch/Caddyfile`: passed after formatting, without a warning.
- Isolated staging HTTP titles: 8180 Customer, 8181 Operations, 8182 Veriq; protected requests without cookies returned 401. Staging processes were stopped, original services retained.
- Existing valid private customer session sent only in memory to isolated staging `GET /v1/cedar/accounts/me`: HTTP 200, account `CED-ACC-001`, 5,000,000 kobo. An authenticated browser attempt could not run: installed Python Playwright lacks its Node driver (`/usr/share/nodejs/playwright/cli.js`); no browser success is claimed. No token was printed or copied to source.

Next safe action: review this Cedar-only PR, then schedule a non-recording window to launch Customer on 3000 and Operations on 3001 and reload the checked-in Caddy configuration. Separately provide working browser automation or perform the authenticated browser check manually. Do not merge automatically. The standalone Veriq branch and recording-mode uncommitted work remain separate.
