# Frontend–backend access and fit report

Date: 16 October 2026 (Africa/Lagos)  
Branch inspected: `feat/frontend-foundation` at `1972c37c34802fe27eb203c643cd76ad72564481`

## Short answer

Yes, I can access and inspect the backend source code, accepted API contract, migrations, tests and implementation documentation in this repository. I understand the intended Cedar-to-Veriq flow and how both frontend applications fit it.

The backend is now running locally at `http://127.0.0.1:8000`. A disposable PostgreSQL 18 cluster is running on port `5433`; migrations, runtime grants and S2 seed data have been applied. FastAPI health and readiness checks return `200`. A G2 worker is also running for durable complaint delivery.

The browser same-origin layer is not currently running. The Caddy binary download available in this environment was invalid, so browser testing through `http://localhost:8080`/`8081` remains blocked until Caddy is installed from a valid local package or binary. Direct authenticated API verification has succeeded, and the backend correctly rejects an unapproved direct POST origin.

## What the backend currently provides

The FastAPI application registers the Cedar customer router and the bank-scoped Veriq investigator router. Its persisted implementation uses PostgreSQL, SQLAlchemy and Alembic, with migration head `0004_pitch_g2`.

### Cedar customer API

Authenticated Cedar customers use the server-provisioned `cedar_demo_session` cookie for:

- `GET /v1/cedar/accounts/me` — owned account and authoritative available balance.
- `GET /v1/cedar/banks` — fictional receiving banks, including Elm (`ELM`) and Birch (`BIR`).
- `POST /v1/cedar/name-enquiries` — authoritative fictional beneficiary lookup.
- `POST /v1/cedar/transfers` — idempotent transfer creation using integer kobo and `Idempotency-Key`.
- `GET /v1/cedar/transfers/{transferId}` — current transfer stage and financial outcome.
- `POST /v1/cedar/complaints` — durable customer complaint creation.
- `GET /v1/cedar/complaints/{caseId}` — owned complaint view.

For the pitch S2 transfer, Cedar records one sender debit of `5,000,000` kobo and returns `RESPONSE_TIMEOUT` with financial outcome `UNKNOWN`. This is intentionally not a failure, reversal or credit confirmation.

### Veriq investigator API

Authenticated investigators are scoped to a bank, with the demo bank ID `CED`:

- Live route health and persisted incidents.
- Incident detail.
- Exact customer-complaint investigation lookup.
- Source upload, list, context summary and documented relationships.
- Explicit investigation refresh command returning `202`.

There is no general case list, public session-minting endpoint, customer transaction-history endpoint, customer complaint-list endpoint, AI-generated case finding, final-status reveal, or customer-safe publishing endpoint.

## How the system fits together

```text
Customer browser → Caddy same-origin /v1 routes → FastAPI Cedar APIs
                                          │
                                          ├─ account, balance, transfer, complaint records
                                          └─ durable complaint outbox
                                                     │
                                                     ▼
                                          G2 background worker
                                                     │
                                                     ▼
Staff browser → Caddy same-origin /v1 routes → FastAPI Veriq APIs
```

Cedar owns the financial truth: customers, accounts, balances, ledger journals, transfers, complaints and financial outcomes. Veriq owns operational observations, suspected incidents, source-backed context and customer-case investigations. Veriq may correlate permitted evidence but cannot establish a customer transfer outcome. The separate AI service is not invoked in the pitch pipeline, so its findings must not be displayed as live results.

## Current frontend alignment

The customer app now uses same-origin relative requests and `credentials: "same-origin"`; it does not create or store session tokens. It reads Cedar’s account/bank/name-enquiry/transfer/complaint responses, reuses an idempotency key only for an uncertain retry of the same transfer intent, and refreshes the account after an accepted transfer.

The staff Veriq route uses the supported investigator endpoints for operations, incidents, sources, context, relationships and exact case investigation. It does not create a fake queue, fake AI result, verified cause or final financial outcome.

The required local browser entry points are `http://localhost:8080` for the customer app and `http://localhost:8081` for the staff app. Caddy forwards `/v1/*` to FastAPI and all other paths to the appropriate Next.js application. This same-origin route is important because the backend validates POST origins and relies on HttpOnly cookies.

## What is needed for live verification

Use a fresh disposable PostgreSQL environment only. The required sequence is:

1. Configure the ignored backend and infrastructure environment files.
2. Apply migrations and reviewed runtime grants.
3. Seed S2 and mint separate private customer and investigator sessions using the provided CLI commands.
4. Start FastAPI, G1/G2 workers, both Next.js apps and Caddy.
5. Install the private cookies only through the documented operator process.
6. Rehearse the S2 transfer, balance refresh, complaint creation, automatic Veriq case delivery and investigator read.

Do not reset a shared database, expose a token in browser code, bypass Caddy, weaken origin checks, or treat a network error as a failed transfer.

## Live verification completed

Using private, mode-`600` session files outside the repository, the following real HTTP flow was verified against the running backend:

- Customer account returned `CED-ACC-001`, NGN, `10,000,000` kobo and the fictional customer name.
- Banks returned Elm (`ELM`) and Birch (`BIR`).
- `ELM` + `ELM-ACC-009` resolved through the name-enquiry endpoint.
- The S2 transfer accepted `5,000,000` kobo and returned a real transfer ID/reference.
- The response contained `RESPONSE_TIMEOUT` and `UNKNOWN`.
- Retrying with the same idempotency key returned the same transfer rather than creating a second debit.
- The transfer was retrieved successfully by its returned ID.
- The account balance changed to the backend-reported `5,000,000` kobo.
- A complaint was persisted and the G2 worker delivered it; the investigator case was readable with `EVIDENCE_READY_AI_UNAVAILABLE` and financial outcome `UNKNOWN`.
- An unapproved direct POST origin was rejected with `403 FORBIDDEN`, confirming origin protection is active.

The customer session file is `/tmp/cedar-demo.session.json`; the investigator session file is `/tmp/cedar-investigator.session.json`. Their contents must not be copied into source, logs, browser storage or public environment variables.

## Evidence consulted

- `contracts/openapi.yaml`
- `contracts/demo.json`
- `apps/backend/src/veriq_cedar/main.py`
- `apps/backend/src/veriq_cedar/cedar/transfers/api.py`
- `apps/backend/src/veriq_cedar/composition/pitch_api.py`
- `docs/handoffs/PITCH_BACKEND_STATUS.md`
- `docs/FINANCIAL_G1.md`
- `apps/backend/README.md`
- `infra/pitch/Caddyfile`
