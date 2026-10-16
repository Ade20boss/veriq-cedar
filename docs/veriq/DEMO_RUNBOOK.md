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

For the live Cedar context panel, run the backend and same-origin gateway in separate terminals:

```bash
cd apps/backend
uv run --locked uvicorn veriq_cedar.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log

cd ../
caddy run --config infra/pitch/Caddyfile
```

Open `http://localhost:8082/demo` for Veriq. The browser must have the privately provisioned investigator cookie for `/v1/veriq`; there is no public browser login or token bootstrap. Install that cookie only through the approved local operator procedure, never in source code or localStorage.

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
