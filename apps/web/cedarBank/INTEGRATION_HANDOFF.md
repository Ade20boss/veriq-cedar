# Cedar customer banking integration handoff

Updated 16 October 2026.

## Connected frontend path

`src/lib/api.ts` is the typed customer API client. It uses same-origin relative URLs by default through the pitch Caddy route and sends `credentials: same-origin` so the server-provisioned `cedar_demo_session` cookie is used. It parses `{ error: { code, message } }` and never creates session credentials in the browser.

The customer flow now requests:

- `GET /v1/cedar/accounts/me` for the owner, account reference, currency and authoritative `available_balance_kobo`.
- `GET /v1/cedar/banks` for fictional recipient banks.
- `POST /v1/cedar/name-enquiries` before review.
- `POST /v1/cedar/transfers` with exact integer kobo conversion and a stable `Idempotency-Key`.
- `GET /v1/cedar/transfers/{transferId}` for status refresh.
- `POST /v1/cedar/complaints` for durable complaint registration.
- `GET /v1/cedar/complaints/{caseId}` for owned complaint refresh.

Uncertain transfer recovery is explicit. Before submission, the browser stores only the original request metadata and idempotency key in account-scoped localStorage; it never stores the session cookie or a backend token. A network ambiguity keeps the customer on the recovery screen. Retrying reuses the original payload and key, while starting a different transfer explicitly clears only the current account's pending intent. Switching accounts cannot recover another account's intent and does not delete its key. An owned legacy `v1` record migrates to the account-scoped `v2` key only when that owner returns. The frontend no longer expires unresolved intent after 24 hours: the backend's persisted idempotency record has no time-based expiry. Clearing browser storage manually can still lose recovery metadata; this is not a server-side transfer ledger.

Processing stage and financial outcome remain separate. `RESPONSE_TIMEOUT` with `UNKNOWN` is displayed as an ambiguous, debited transfer; the client does not infer failure, success, refund, or credit confirmation.

## Session and backend compatibility

There is no browser login endpoint. The UI shows a session-required/unavailable state when the server-provisioned cookie is absent. Do not add a login endpoint, store the cookie in local storage, expose a token in a public environment variable, or weaken origin checks.

All seven customer operations above are implemented in the backend. Private session provisioning remains an operator-only CLI responsibility; the browser retry action only repeats the real account/bank requests. The current main backend has migration 0005 and optional AI orchestration; the earlier local 0004/AI-disabled rehearsal was valid only for its recorded scope.

## Deliberately not connected

There is no customer transaction-list or complaint-list endpoint. History is limited to transfers created during the current browser session, and the complaint list is limited to complaints successfully created during that session. Notifications, airtime and bill payment remain visibly non-live UI. No AI finding, customer-safe notification, final status reveal or reversal is fabricated.

## Verification

Targeted Node regression tests live in `tests/customer-regressions.test.mjs` and the Operations `tests/investigation-switching.test.mjs`; run them with `node --test`. Run `pnpm exec tsc --noEmit` and `pnpm run build` in Customer, plus `pnpm run typecheck`, `pnpm run lint` and `pnpm run build` in Operations. The cancellation regression verifies loading clears on abort and a fresh enquiry can complete.

Earlier live same-origin HTTP rehearsals used private local demo cookies. They do not prove this new Cedar-only branch has been exercised in an authenticated browser. The checked-in `infra/pitch/Caddyfile` maps Customer 3000→8080, Operations 3001→8081 and Veriq 3002→8082. Existing local demo processes may still be running on the old 3001/3000 frontend assignment; do not mistake an HTTP 200 for validation of the newly standardized process mapping.

Staff monitoring now distinguishes loading, backend error/unavailable, empty projection and populated data. A failed request never renders as healthy, and an empty route projection is not labeled as “no current degraded route.” The role selector and local sign-in preview are explicitly demonstration-only; investigator session and bank scope remain backend-controlled.

The customer transaction detail view no longer invents debit, acknowledgement or timeout timestamps, and does not claim an incident cause or operational action without a backend-provided field. It displays the backend-reported stage/outcome and states when no event timeline was returned.
