# Cedar customer banking integration handoff

Updated 15 October 2026.

## Connected frontend path

`src/lib/api.ts` is the typed customer API client. It uses `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000`), sends `credentials: include` so the server-provisioned `cedar_demo_session` cookie is used, parses `{ error: { code, message } }`, and never creates session credentials in the browser.

The customer flow now requests:

- `GET /v1/cedar/accounts/me` for the owner, account reference, currency and authoritative `available_balance_kobo`.
- `GET /v1/cedar/banks` for fictional recipient banks.
- `POST /v1/cedar/name-enquiries` before review.
- `POST /v1/cedar/transfers` with exact integer kobo conversion and a stable `Idempotency-Key`.
- `GET /v1/cedar/transfers/{transferId}` for status refresh.

Processing stage and financial outcome remain separate. `RESPONSE_TIMEOUT` with `UNKNOWN` is displayed as an ambiguous, debited transfer; the client does not infer failure, success, refund, or credit confirmation.

## Session and backend compatibility

There is no browser login endpoint. The UI shows a session-required/unavailable state when the server-provisioned cookie is absent. Do not add a login endpoint, store the cookie in local storage, expose a token in a public environment variable, or weaken origin checks.

At the time of this handoff, the checked-out `apps/backend` is still the infrastructure/G0 slice: its README says banking routes are unimplemented, `main.py` registers only `/health` and `/ready`, and backend tests assert `/v1/cedar/accounts/me` is 404. Therefore no live customer journey or S2 replay can honestly be claimed from this checkout. Daniel must provide the banking backend commit/environment and the approved session bootstrap for live verification.

## Deliberately not connected

Transaction history, notifications, complaints and support cases remain isolated demo UI because their customer APIs are unavailable in this checkout. They must not be presented as backend-backed records. Airtime and bill payment actions remain explicitly simulated.

## Verification

`pnpm exec tsc --noEmit` and `pnpm exec next build` pass in this application. HTTP account/bank/name-enquiry/transfer/status tests are blocked until the five backend routes and a disposable authorized demo session are available.
