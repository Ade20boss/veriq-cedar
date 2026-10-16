# Frontend implementation reference

## Audit basis

**OBSERVED:** This audit covers tracked source under `apps/web/cedarBank/src` and `apps/web/Cedar Bank Operations Design/src`, excluding generated `.next` output and `node_modules`. Principal customer files are `src/features/customer-app/App.tsx`, screen modules, `src/data.ts`, `src/lib/api.ts`, and `src/features/customer-app/types.ts`. Principal staff files are `src/App.tsx` and `src/lib/veriq-api.ts`.

## Architecture

| Area | Observed implementation |
|---|---|
| Framework | Next.js 16 and React 19 from each app's `package.json`; both use TypeScript. |
| Routing | Next app routes expose `/` and, in the staff app, `/[module]`; visible navigation is mostly client screen/module state. |
| Customer shell | `CustomerApp` owns screen, form, request, and presentation state. |
| Staff shell | `src/App.tsx` owns employee selection, module navigation, workspace views and live Veriq reads. |
| Styling | App-local CSS/Tailwind/PostCSS configuration; no shared monorepo design-system package was observed. |
| Data access | Customer `src/lib/api.ts`; staff `src/lib/veriq-api.ts`. Both use same-origin `fetch` and cookies. |
| State | React hooks; no Redux, query cache, or global context was observed. |
| Authentication | No browser login endpoint. Customer expects a server-provisioned `cedar_demo_session`; staff expects a separately provisioned investigator cookie. Staff sign-in is a local role picker, not authentication. |
| Errors | Typed `ApiError`/`VeriqApiError` parse `{error:{code,message}}`; screen-level loading/session/request errors exist. |
| Responsive behavior | Mobile-first customer screens and desktop-oriented staff workspace styling. |

## Customer feature audit

The customer screen union is in `features/customer-app/types.ts`. These are client-state views, not independently addressable URLs.

| Area | Component/source | Status | Observed behavior |
|---|---|---|---|
| Sign in/session | `AuthScreens.tsx`, `CustomerApp.loadSession` | PARTIALLY IMPLEMENTED | Account/bank load; missing session shows an honest message. No login, logout, refresh, or bootstrap endpoint. |
| Dashboard | `ActivityScreens.tsx` / `HomeScreen` | IMPLEMENTED AND FUNCTIONAL | Live customer name, account reference, NGN balance and live transfer cards. Balance derives from `available_balance_kobo`. |
| Send money | `TransferScreens.tsx` / `TransferScreen` | IMPLEMENTED AND FUNCTIONAL | Live bank list; fictional IDs such as `ELM-ACC-009`; kobo-safe amount parsing. |
| Beneficiary enquiry | `CustomerApp`, `customerApi.enquireName` | IMPLEMENTED AND FUNCTIONAL | Only backend-returned beneficiary name is shown. |
| Review/authorization | `ReviewScreen`, `AuthorizeScreen` | IMPLEMENTED AND FUNCTIONAL | Existing review flow preserved. Passcode-style screen is presentation; cookie session is backend auth. |
| Transfer submission | `CustomerApp.submitTransfer` | IMPLEMENTED AND FUNCTIONAL | Integer kobo, `Idempotency-Key`, duplicate-click guard, same-key retry after ambiguity. |
| Status/details | `StatusScreen`, `DetailsScreen`, `checkStatus` | IMPLEMENTED AND FUNCTIONAL | Actual transfer ID/reference/stage/outcome and refresh. UNKNOWN remains separate from RESPONSE_TIMEOUT. |
| History | `HistoryScreen` | PARTIALLY IMPLEMENTED | Shows transfers created in current browser state only; no accepted history endpoint. |
| Notifications | `NotificationsScreen` | UI ONLY | Local state only; no accepted notification API. |
| Support/help | `SupportScreen` | UI ONLY | Help/FAQ/contact actions use browser alerts. |
| Complaint intake | `ReportScreen`, `customerApi.createComplaint` | IMPLEMENTED AND FUNCTIONAL | Real transfer-linked complaint submission; backend persistence is independent of Veriq/AI. |
| Complaint list/detail | `ComplaintsScreen`, `CaseScreen` | PARTIALLY IMPLEMENTED | Current client state plus refresh of known case IDs; no accepted list route. |
| Complaint confirmation | `ComplaintConfirmation` | IMPLEMENTED AND FUNCTIONAL | Backend complaint reference and pending-investigation copy. |
| Logout | No implementation observed | NOT IMPLEMENTED | No approved logout/revocation route in current backend slice. |

### Important customer observation

The older `apps/web/cedarBank/src/App.tsx` contains a legacy simulated application with `baseTransactions`, local balance deductions, scenario choices, timers and fake PIN validation. The canonical `src/app/page.tsx` mounts `features/customer-app/App.tsx`; the legacy file must not be treated as the live integration path and remains a risk if reconnected.

## Staff/Veriq operations audit

**OBSERVED:** The staff app presents modules for workspace, queue, customer operations, payment operations, management and Veriq Intelligence. Employee records and access arrays are local constants in `src/App.tsx`; selecting Sarah, Michael, Bob or Grace changes presentation state and does not authenticate against the backend.

The live adapter `src/lib/veriq-api.ts` supports:

- `GET /v1/veriq/banks/CED/operations`
- `GET /v1/veriq/banks/CED/incidents`
- `GET /v1/veriq/banks/CED/incidents/{id}`
- `GET /v1/veriq/banks/CED/cases/{caseId}`
- `GET /v1/veriq/banks/CED/sources`
- `POST /v1/veriq/banks/CED/sources`
- `GET /v1/veriq/banks/CED/context`
- `GET /v1/veriq/banks/CED/relationships`

This is a real read/source slice, but assignment, customer search, transaction inquiry, approvals, audit filtering and incident lifecycle mutation were not observed as live implementations.

## Product areas not observed as implemented

The brief names Intelligence Overview, full Operational Monitoring, Investigation List, complete Investigation Detail, Evidence Explorer, AI-Assisted Analysis, Review Queue, Sign Up, institution registration/join, bank connection authorization, synchronization management, institutional knowledge onboarding/explorer, Audit & Activity, Integrations and Institution Settings. Some navigation labels suggest concepts; labels alone are not implementation.

## Data and validation

- Live customer data comes from `src/lib/api.ts`.
- `Transaction`, `CaseRecord`, and `NotificationRecord` in `src/data.ts` are presentation models; history and complaint collections are not hydrated from list APIs.
- `parseNairaToKobo` accepts at most two decimal places, rejects malformed/zero/unsafe values, and returns an integer.
- Backend errors are sanitized into typed errors; raw stack traces are not shown.
- No browser token, internal credential, localStorage session, or direct database/AI access was observed in the live customer adapter.

## Backend implications

Keep the same-origin cookie model. Extend API coverage only after tenant scope, pagination, status enums, authorization, and audit behavior are agreed. Backend remains authoritative for balances, outcomes, evidence, incidents and review decisions; frontend timers must never mutate financial outcomes.

