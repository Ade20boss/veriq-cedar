# Veriq synthetic onboarding demo runbook

## Purpose

This is the stable recording path for the Veriq onboarding-to-intelligence demonstration. It shows explicit institution selection, a simulated connection, read-only permission review, synchronization, institutional knowledge registration, the real Cedar source/context adapter, and the existing institution-scoped intelligence workspace.

The onboarding path is synthetic. It does not create production permissions, access live banking systems, use bank credentials, or call the FastAPI investigator session.

## Start locally

From the repository root:

```bash
cd apps/web/veriq
pnpm install --frozen-lockfile
PORT=3002 pnpm dev
```

For synthetic-only recording, open:

```text
http://127.0.0.1:3002/demo
```

For the live Cedar context panel, run the backend and same-origin gateway in separate terminals. In this checkout the customer app uses port 3001 and Cedar Operations uses port 3000:

```bash
cd apps/web/cedarBank
PORT=3001 pnpm dev

cd ../Cedar\ Bank\ Operations\ Design
PORT=3000 pnpm dev

cd apps/backend
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log

cd ../
caddy run --config infra/pitch/Caddyfile
```

Open `http://localhost:8081/` for Cedar Operations, `http://localhost:8080/` for Cedar Customer Banking, and `http://localhost:8082/demo` for Veriq. The browser must have the privately provisioned investigator cookie for `/v1/veriq`; there is no public browser login or token bootstrap. Install that cookie only through the approved local operator procedure, never in source code or localStorage.

The app can also run inside the Figma Make lifecycle. A normal shell build requires the platform-owned `FIGMA_EID`; do not invent that value or add dummy Payload/Figma secrets.

## Recording steps

1. Open `/demo` and choose **Start synthetic setup**.
2. On **Institution registration**, actively choose **Cedar Bank — Demo Workspace**. Enter a synthetic institutional type, jurisdiction and email, then acknowledge the synthetic authorization statement.
3. On **Connection method**, observe that Authorized Banking API and Approved Operational Event Feed require integration setup. Choose the available **Synthetic Demo Connector**.
4. Review the five simulated read-only capabilities and acknowledge the permission boundary.
5. Watch the synchronization stepper and technical activity log. The completion state reads: **Simulation completed. Synthetic operational sources are ready.**
6. Register the five synthetic knowledge categories: services, dependencies, payment routes, historical incidents and operational procedures.
7. Choose **Enter Intelligence Overview**. The workspace opens at `/w/cedar-demo/overview?mode=synthetic` with the existing Veriq shell and synthetic institution context.
8. Use the sidebar to demonstrate Operational Monitoring, Incidents, Investigations and Reviews. These existing workspace surfaces are synthetic unless their screen explicitly reports a backend-backed state.

To show real institutional context, open **Knowledge Explorer** from the sidebar. With the authorized investigator session it loads `/v1/veriq/banks/CED/sources`, `/context`, `/relationships`, `/operations` and `/incidents`. Choose the five files from `fixtures/onboarding/` to upload them sequentially with `source_kind=PITCH_FIXTURE`; the UI displays backend status, source IDs, checksums, actual context counts, documented relationships and route health. Without the investigator session it shows a clearly labeled unavailable state.

From the same Cedar workspace, open **Operational Monitoring** for the live route snapshot, **Incidents** for the backend incident registry/detail, and **Investigations** for an exact authorized case ID when an incident links one. A case detail displays backend status, financial outcome, evidence IDs and `AI unavailable`; it never creates a case locally. If no case ID is linked, the page says that no authorized case is selected.

The selected institution and setup progress are stored under a namespaced browser-local key so refresh/navigation does not silently assign Cedar or lose the demo state. Clearing site storage restarts the synthetic walkthrough.

## Live versus simulated

Live in this slice:

- Existing Payload-backed sign-in, sign-up and authenticated membership checks remain unchanged.
- Existing authenticated workspace route membership protection remains unchanged when `mode=synthetic` is absent.
- Existing Veriq dashboard, monitoring, incident, investigation and review UI is preserved.

Simulated in this slice:

- Institution creation/membership and invitation validation.
- Connector authorization and synchronization progress.
- Permission approval and knowledge source registration.
- Workspace records shown by the existing synthetic Veriq app.

Backend-connected in this slice when the private investigator session is present:

- Five-file source registration through the accepted multipart endpoint.
- Source status/identifier/checksum refresh.
- Context version/entity/relationship/claim counts.
- Documented relationship provenance.
- Operational route health and suspected incident reads.

The synthetic workspace bypass is narrowly available only for `mode=synthetic` and `cedar-demo` or `northstar-demo` slugs. It is not an authentication replacement and does not make arbitrary institutions accessible.

## Backend fallback

For the separate Cedar operational demonstration, use the existing local backend/Caddy setup and private operator-provisioned sessions. Do not treat Payload app authentication as an investigator session, and do not claim that the Veriq synthetic onboarding connected to Cedar's FastAPI backend.

The supported Cedar operations and S2 response-timeout rehearsal remain documented in `apps/web/cedarBank/INTEGRATION_HANDOFF.md`.

## Cedar Customer Banking — live S2 rehearsal

This is a separate customer-facing demonstration from the synthetic Veriq onboarding flow. It uses the real local FastAPI customer endpoints and the same-origin Caddy gateway.

Start the customer app and gateway:

```bash
cd apps/web/cedarBank
PORT=3001 pnpm dev

cd ../..
caddy run --config infra/pitch/Caddyfile
```

Start the backend separately if it is not already running:

```bash
cd apps/backend
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Open `http://localhost:8080/`. The customer app does not mint browser sessions. Before recording, the demo operator must provision a private disposable customer session for `CED-CUST-001` with the documented local CLI and install only that `cedar_demo_session` cookie for the customer origin/path. Never use an investigator cookie in this browser and never paste a token into source, localStorage, screenshots or logs.

Provisioning command (run from `apps/backend`, writing a new private file):

```bash
ENVIRONMENT=test uv run --locked python -m veriq_cedar.composition.g1 mint-session \
  --customer CED-CUST-001 --cookie-file /tmp/ada-customer.session.json
```

Recording clicks:

1. Open the customer URL and confirm the session-backed Cedar dashboard shows Ada (fictional), account `CED-ACC-001`, NGN and the backend-derived available balance.
2. Choose **Send money**, select **Elm Bank**, enter `ELM-ACC-009`, and enter `50000` NGN.
3. Continue through beneficiary enquiry and confirm the returned fictional beneficiary name on the review screen.
4. Confirm the transfer. The backend response should show `RESPONSE_TIMEOUT` and financial outcome `UNKNOWN`.
5. Explain: “Your account was debited, but we're still confirming the final transfer outcome. You can check the transaction status for updates.” Do not call it failed or successful.
6. Open transaction details, refresh status, then report the issue and submit the complaint. The complaint reference is displayed by the customer UI.
7. For the investigator act, use a separately provisioned investigator session and the authorized Cedar-scoped route `/v1/veriq/banks/CED/cases/{caseId}`. The case should remain evidence-backed and explicit about `AI unavailable`; an empty `incident_ids` list is valid and must not be filled in by the frontend.

Verified local rehearsal record (2026-10-16):

- Account: `CED-ACC-001`, Ada (fictional), balance after the posted debit: `5,000,000` kobo.
- Banks: Elm Bank (`ELM`) and Birch Bank (`BIR`).
- Name enquiry: `ELM-ACC-009` returned `Elm beneficiary (fictional)`.
- Transfer: `5525e2e0-849a-4571-a14c-b7df2f3db49c`, reference `CED-8dcd98d5-699e-49aa-8d2f-4882bb254fb5`, amount `5,000,000` kobo, stage `RESPONSE_TIMEOUT`, outcome `UNKNOWN`.
- Complaint: `15d3a206-53a4-4a81-8206-aea76f87faa6`, reference `CED-CASE-60a4415f-36a7-4b1d-802c-453ad9a3a91d`, status `OPEN`, linked to the transfer above.
- Authorized investigator retrieval returned `EVIDENCE_READY_AI_UNAVAILABLE`, `UNKNOWN`, seven evidence items, `incident_ids: []`, and `ai_result: null`.
- Repeating `POST /v1/cedar/transfers` with the same `Idempotency-Key: local-s2-transfer-001` returned the same transfer and did not create a second debit.

If the browser has no customer cookie, the honest fallback is the session-required screen. Do not add a fake login or local success state. The protected API flow can still be verified with the private operator session file and same-origin gateway.

## Validation record

Passed:

- `pnpm exec tsc --noEmit` in `apps/web/veriq`.
- Dev-server route smoke checks returned HTTP 200 for `/demo`, every synthetic onboarding step, and `/w/cedar-demo/overview?mode=synthetic`.
- Non-synthetic `/onboarding/institution`, `/select-workspace` and `/w/cedar-demo/overview` redirected to `/sign-in`; an unapproved synthetic slug also redirected to `/sign-in`.
- Headless Firefox rendered the demo at 390×844 and 1366×900 without application console/startup errors. The screenshots confirmed the entry screen remains readable and usable at both sizes.
- `git diff --check`.

Live backend rehearsal on the local disposable database:

- Uploaded `services.json`, `dependencies.csv`, `routes.json`, `historical_incidents.md` and `operations_sop.txt` from `fixtures/onboarding/` in the approved order.
- Received HTTP 202 for every upload; the first three returned `PARSED`, and both unstructured documents returned `UPLOADED`.
- Verified five sources, context version 5, seven entities, ten `DOCUMENTED` relationships, zero verified claims and actual route/incident projections.
- Verified the new Veriq route `/w/cedar-demo/knowledge?mode=synthetic` returns HTTP 200. Browser live reads require the private investigator cookie and the `localhost:8082` same-origin gateway.
- Verified `/w/cedar-demo/monitoring?mode=synthetic`, `/incidents?mode=synthetic` and `/investigations?mode=synthetic` return HTTP 200 through the same gateway.
- Rendered the live monitoring page at 1366×900 and 390×844 in headless Firefox. Without a browser-installed investigator cookie it showed the intended “Live Cedar data unavailable” state rather than synthetic metrics.

Blocked by platform environment:

- `pnpm build` cannot run in a normal shell because `@payloadcms/figma` requires the platform-owned `FIGMA_EID`. No secret or placeholder was added.

## Final readiness verdict

| Feature | Verdict | Evidence / boundary |
| --- | --- | --- |
| Sign In and Sign Up | WORKING | Existing Payload-backed routes render and unauthenticated protected routes redirect to sign-in. |
| Institution Registration | SYNTHETIC DEMO | Explicit Cedar/Northstar choice, details and acknowledgement persist in browser-local demo state; no production membership is created. |
| Bank Connection Selection | SYNTHETIC DEMO | Synthetic Demo Connector is selectable; real connector options correctly say integration required. |
| Permission Review | SYNTHETIC DEMO | Five simulated read-only capabilities are reviewed and acknowledged; no backend grant is claimed. |
| Bank Synchronization Animation | SYNTHETIC DEMO | Deterministic six-stage animation and technical log run locally; no real connector state is implied. |
| Institutional Knowledge Onboarding | SYNTHETIC DEMO | Five named fixture categories are registered locally with provenance/review disclaimer. |
| Intelligence Overview | SYNTHETIC DEMO | Existing Veriq shell/dashboard loads under the explicit synthetic workspace route. |
| Operational Monitoring | SYNTHETIC DEMO | Existing workspace view uses synthetic records; it is not connected to the FastAPI investigator session. |
| Incidents | SYNTHETIC DEMO | Existing institution-scoped incident UI is preserved with synthetic records and labels. |
| Investigations and Evidence Explorer | SYNTHETIC DEMO | Existing investigation/evidence UI is navigable with synthetic records; no claim of live Veriq evidence. |
| Existing FastAPI Integration | PARTIALLY WORKING | Cedar customer/staff applications have the verified FastAPI/Caddy integration; Veriq onboarding/workspace does not reuse that investigator session. |

Overall: **READY WITH LIMITATIONS**. The safest recording path is the explicit synthetic Veriq journey above. If the Figma build environment is unavailable, use the running Next dev server; if the Veriq workspace demo is unavailable, record the separately documented Cedar customer-to-investigation flow.

No migrations, seeders, database changes, accepted contract changes, Cedar changes, Payload admin route changes or credentials were used.

## Customer checkpoint validation

Passed:

- `pnpm exec tsc --noEmit` in `apps/web/cedarBank`.
- `pnpm build` in `apps/web/cedarBank`.
- `caddy validate --config infra/pitch/Caddyfile` (valid; formatting warning only).
- Customer gateway root returned HTTP 200 on `http://localhost:8080/`.
- Protected customer API journey passed through `localhost:8080`: account, banks, name enquiry, idempotent transfer, transfer retrieval, complaint retrieval and refreshed account balance.
- Correct customer session isolation check: the same account request without a cookie returned HTTP 401.
- Correct investigator-scoped case retrieval passed through `localhost:8082` and direct backend with a separate investigator cookie.
- Headless Firefox rendered the customer session-required state at 1366×900 and 390×844. The mobile capture was taken during the splash transition; repeat after the splash delay for a full session-state capture.

Limitations:

- There is no approved browser session bootstrap/login endpoint. A demo operator must privately provision and install the customer cookie.
- Browser automation with cookie installation and console collection was not available in this environment; authenticated API checks were run directly with the private session file, without printing its token.
- `localhost:8081` returned HTTP 502 during this checkpoint because the Cedar Operations dev server was not running. Cedar Operations was not modified; start its existing app on port 3000 before recording the staff act.
- Complaint and investigator data are synthetic backend records; no real banking system or customer data is involved.

## Final three-application rehearsal checklist

Run these commands in separate terminals from the repository root. Existing private sessions must be provisioned before recording; do not print their values.

```bash
# Terminal 1 — FastAPI backend
cd apps/backend
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log

# Terminal 2 — Cedar Customer Banking
cd apps/web/cedarBank
PORT=3001 pnpm dev

# Terminal 3 — Cedar Bank Operations
cd "apps/web/Cedar Bank Operations Design"
PORT=3000 pnpm dev

# Terminal 4 — Veriq Intelligence
cd apps/web/veriq
PORT=3002 pnpm dev

# Terminal 5 — same-origin gateway
caddy run --config infra/pitch/Caddyfile
```

Readiness checklist:

- `http://localhost:8080/` — Cedar Customer Banking.
- `http://localhost:8081/` — Cedar Bank Operations.
- `http://localhost:8082/demo` — Veriq Intelligence.
- Customer cookie is provisioned only for the customer browser context.
- Investigator cookie is provisioned separately for the investigator browser context and bank scope `CED`.
- No token, cookie value or private operator command appears in the recording.
- Backend context reads show source count `5`, context version `5`, entities `7`, documented relationships `10`, candidate claims `0`, verified claims `0`.
- Monitoring shows `ROUTE-CED-ELM-G2` and `ROUTE-CED-BIRCH-G3`, both currently `INSUFFICIENT_DATA`.
- The approved telemetry producer was not run during this rehearsal; do not present stale route metrics as freshly generated.

Chronological recording sequence:

1. **Veriq onboarding/context:** open `/demo`, complete the explicitly synthetic Cedar institution walkthrough, then enter the Cedar demonstration workspace. Show Knowledge Explorer and its backend-backed source/context counts; distinguish documented relationships from verified claims.
2. **Veriq monitoring:** open Operational Monitoring and show both route IDs with their actual `INSUFFICIENT_DATA` status. Open Incidents and show the existing `SUSPECTED` incident. Say that the finding is a suspected operational issue and the cause is unverified.
3. **Customer transfer:** switch to `http://localhost:8080/`, confirm Ada and the backend balance, select Elm Bank, enter `ELM-ACC-009` and `50000` NGN, complete review, and show the transfer result. Preserve `RESPONSE_TIMEOUT` and `UNKNOWN` exactly.
4. **Customer complaint:** open transfer details, refresh status, submit or open the existing complaint, and show case `15d3a206-53a4-4a81-8206-aea76f87faa6`. Confirm its `transfer_id` is `5525e2e0-849a-4571-a14c-b7df2f3db49c` before describing the linkage.
5. **Cedar Operations:** switch to `http://localhost:8081/`, use the separately authorized staff session, and open the customer case/investigation. Do not treat the employee picker as authentication.
6. **Veriq exact case:** return to the authorized Cedar-scoped investigator view and open `/v1/veriq/banks/CED/cases/15d3a206-53a4-4a81-8206-aea76f87faa6` through the existing UI. Show `EVIDENCE_READY_AI_UNAVAILABLE`, financial outcome `UNKNOWN`, seven evidence items, no incident link, and no AI result.

Fallback: if private browser session setup is unavailable, record the honest session-required customer state and the synthetic Veriq onboarding. Do not replace the transfer or investigation states with local fixtures. If telemetry freshness is challenged, show the actual `INSUFFICIENT_DATA` state and explain that no producer was run for this rehearsal.

Final rehearsal result (2026-10-16): all three applications and the FastAPI backend were running simultaneously; gateway roots returned HTTP `200`; protected reads and exact transfer/case linkage passed. The only operator preparation is private customer/investigator cookie setup.
