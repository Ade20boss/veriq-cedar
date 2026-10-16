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

Uncertain transfer recovery is explicit. Before submission, the browser stores only the original request metadata and idempotency key in session-local browser storage; it never stores the session cookie or a backend token. A network ambiguity keeps the customer on the recovery screen. Retrying reuses the original payload and key, while starting a different transfer explicitly clears that pending intent.

Processing stage and financial outcome remain separate. `RESPONSE_TIMEOUT` with `UNKNOWN` is displayed as an ambiguous, debited transfer; the client does not infer failure, success, refund, or credit confirmation.

## Session and backend compatibility

There is no browser login endpoint. The UI shows a session-required/unavailable state when the server-provisioned cookie is absent. Do not add a login endpoint, store the cookie in local storage, expose a token in a public environment variable, or weaken origin checks.

The branch now includes merged backend PR #5 (`bb918d981f621ec19bce285b3a88ab802652d221`). All seven customer operations above are implemented. Private session provisioning remains an operator-only CLI responsibility; the browser retry action only repeats the real account/bank requests.

## Deliberately not connected

There is no customer transaction-list or complaint-list endpoint. History is limited to transfers created during the current browser session, and the complaint list is limited to complaints successfully created during that session. Notifications, airtime and bill payment remain visibly non-live UI. No AI finding, customer-safe notification, final status reveal or reversal is fabricated.

## Verification

`pnpm exec tsc --noEmit` and `pnpm exec next build` pass in both Next.js applications. Staff lint and typecheck also pass. No test runner is configured in either application, so focused automated regression tests were not available without adding a new dependency.

The live same-origin HTTP rehearsal was completed through temporary Caddy routes with the private local demo cookies: account, bank list, name enquiry, idempotent S2 transfer, transfer retrieval, complaint retrieval, investigator operations, incident projection and exact case retrieval all returned the expected backend responses. Browser automation was not run because Chromium/Playwright is unavailable in this environment; Firefox is installed but no compatible automation package is present. The temporary Caddy/backend/frontend processes remain local-only and are not repository configuration.

Staff monitoring now distinguishes loading, backend error/unavailable, empty projection and populated data. A failed request never renders as healthy, and an empty route projection is not labeled as “no current degraded route.” The role selector and local sign-in preview are explicitly demonstration-only; investigator session and bank scope remain backend-controlled.

The customer transaction detail view no longer invents debit, acknowledgement or timeout timestamps, and does not claim an incident cause or operational action without a backend-provided field. It displays the backend-reported stage/outcome and states when no event timeline was returned.
