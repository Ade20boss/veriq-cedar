# Emergency Local Demo Readiness

Date: 16 October 2026, Africa/Lagos  
Machine: `Barry`  
Repository: `/home/barry/Desktop/veriq-cedar`  
Revision: `783ced650d1a030da2742c36ed760f41af5b53c1` (`feat/frontend-foundation`)

## Phase verdicts

| Phase | Verdict | Result |
| --- | --- | --- |
| Runtime verification | PASS | PostgreSQL, FastAPI, g1, g2, Caddy and all three frontends running. `/health`, `/ready`, and all recording URLs returned HTTP 200. |
| Frontend synchronization | PARTIAL | Source and contract alignment checked; Veriq typed AI states and case polling are present. Auth/session wiring remains intentionally separate. |
| Browser rehearsal | PARTIAL | Unauthenticated route rendering and protected 401 behavior verified. Authenticated visual/browser actions were not run because private session files were absent and Playwright is not installed. |
| Recording freeze | PARTIAL | Services remain running and the runbook is updated. Final recording still requires private cookie installation and manual authenticated browser checks. |

## Running services

- PostgreSQL: `127.0.0.1:5433`, accepting connections, revision `0004_pitch_g2`.
- FastAPI: `127.0.0.1:8000`.
- Cedar Customer: `http://localhost:8080/`.
- Cedar Operations: `http://localhost:8081/`.
- Veriq: `http://localhost:8082/demo`.
- Caddy: ports `8080`, `8081`, `8082`; configuration validates.
- g1 payment recovery worker and g2 complaint/investigation worker: running.
- AI: disabled and not started.

## Existing demo state

The approved records were checked read-only: transfer `5525e2e0-849a-4571-a14c-b7df2f3db49c` is `RESPONSE_TIMEOUT`/`UNKNOWN`; complaint `15d3a206-53a4-4a81-8206-aea76f87faa6` references it; the case is `EVIDENCE_READY_AI_UNAVAILABLE`/`UNKNOWN` with seven evidence records, no incident link and no AI result. Context contains five sources, seven entities, ten documented relationships, zero verified claims, two routes and one incident.

## Required operator action

Privately install the already-approved customer `cedar_demo_session` for the customer origin and a separate bank-scoped investigator `cedar_demo_session` for the staff/Veriq origin. Do not paste or expose token values. Payload `app-session` login and the staff role picker do not grant backend investigator access. Do not run migrations, seeds, replay, reset or telemetry for this recording.

## Final verdict

**READY WITH LIMITATIONS** — the local stack is running and the persisted synthetic demo state is correct, but authenticated customer/investigator browser journeys are not yet demonstrated. Complete the private session step and manual 1366px browser rehearsal before recording.
