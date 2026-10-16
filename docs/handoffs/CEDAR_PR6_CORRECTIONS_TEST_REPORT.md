# Cedar PR #6 Corrections — Test Report

Date: 2026-10-16
Branch: `feat/frontend-foundation`

This report covers the focused Cedar Customer Banking and Cedar Bank Operations corrections. Veriq, the FastAPI backend, accepted contracts and authentication code were not modified.

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Name-enquiry latest snapshot | Account A response is discarded after Account B is selected | Generation, bank and account guards reject the stale response; latest response is accepted | PASS |
| Name-enquiry bank switch | A response for the previous bank cannot populate the new bank | Snapshot guard rejects the response and the obsolete request is aborted | PASS |
| Name-enquiry failure ordering | Stale failure cannot overwrite the current request error state | Error is applied only for the current snapshot; abort errors are ignored | PASS |
| Transaction Insights timeout | `RESPONSE_TIMEOUT` + `UNKNOWN` shows debit/unknown explanation | Uses `processingStage`; no credit, failure, reversal, refund or root-cause claim is generated | PASS |
| Transaction Insights other stage | Non-timeout stages do not receive timeout copy | `SUBMITTED` remains a normal processing explanation | PASS |
| Pending transfer same-account recovery | Same account retains the original payload and idempotency key | Account-scoped record parses and preserves the original key | PASS |
| Pending transfer account mismatch | Another account cannot view or replay the record | Mismatched record is rejected and removed from local storage | PASS |
| Legacy pending record | Ownerless legacy record cannot be replayed | Record without `originatingAccountId` is rejected | PASS |
| Operations investigation switching | Out-of-order Case A cannot overwrite Case B | Request sequence and returned case ID guards reject stale/mismatched responses | PASS |
| Customer TypeScript | No type errors | `pnpm exec tsc --noEmit` passed | PASS |
| Operations TypeScript | No type errors | `pnpm run typecheck` passed | PASS |
| Customer production build | Build succeeds | `pnpm build` passed | PASS |
| Operations lint | Lint succeeds | `pnpm run lint` passed | PASS |
| Operations production build | Build succeeds | `pnpm run build` passed | PASS |
| Caddy configuration | Gateway configuration is valid | `caddy validate --config infra/pitch/Caddyfile` passed; formatting warning only | PASS |

## Real authorized API checks

Using the existing private demo sessions without printing token values or creating new financial records:

- `GET /v1/cedar/accounts/me` through `localhost:8080`: `200`, `CED-ACC-001`, `5,000,000` kobo.
- `GET /v1/cedar/banks`: `200`, Elm and Birch returned.
- `POST /v1/cedar/name-enquiries`: `200`, `ELM-ACC-009` returned the fictional beneficiary name.
- `GET /v1/cedar/transfers/5525e2e0-849a-4571-a14c-b7df2f3db49c`: `200`, `RESPONSE_TIMEOUT`, `UNKNOWN`.
- `GET /v1/cedar/complaints/15d3a206-53a4-4a81-8206-aea76f87faa6`: `200`, `OPEN`, and `transfer_id` exactly matched the transfer above.
- `GET /v1/veriq/banks/CED/cases/15d3a206-53a4-4a81-8206-aea76f87faa6` through the Operations gateway: `200`, `EVIDENCE_READY_AI_UNAVAILABLE`, `UNKNOWN`, seven evidence records, no incident IDs, no AI result.
- Investigator cookie at the customer API returned `401`.
- Customer cookie at the investigator API returned `403`.

## Browser checks and limitations

Headless Firefox rendered the customer and Operations gateway entry screens at 1366px. No application error or exception appeared in the browser process output; only Firefox platform/network warnings were present. Authenticated browser click automation, cookie installation and console collection were not available because Playwright/Selenium is not installed. The authenticated journey was therefore verified at the API level and through static/build checks, not claimed as a complete browser E2E test.

The branch was not pushed. No new transfer, complaint, seed, reset, replay or migration was executed.
