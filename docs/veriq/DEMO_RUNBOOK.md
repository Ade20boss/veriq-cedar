# Veriq synthetic onboarding demo runbook

## Purpose

This is the stable recording path for the Veriq onboarding-to-intelligence demonstration. It shows explicit institution selection, a simulated connection, read-only permission review, synchronization, institutional knowledge registration, and the existing institution-scoped intelligence workspace.

The onboarding path is synthetic. It does not create production permissions, access live banking systems, use bank credentials, or call the FastAPI investigator session.

## Start locally

From the repository root:

```bash
cd apps/web/veriq
pnpm install --frozen-lockfile
PORT=3002 pnpm dev
```

Open:

```text
http://127.0.0.1:3002/demo
```

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

The synthetic workspace bypass is narrowly available only for `mode=synthetic` and `cedar-demo` or `northstar-demo` slugs. It is not an authentication replacement and does not make arbitrary institutions accessible.

## Backend fallback

For the separate Cedar operational demonstration, use the existing local backend/Caddy setup and private operator-provisioned sessions. Do not treat Payload app authentication as an investigator session, and do not claim that the Veriq synthetic onboarding connected to Cedar's FastAPI backend.

The supported Cedar operations and S2 response-timeout rehearsal remain documented in `apps/web/cedarBank/INTEGRATION_HANDOFF.md`.

## Validation record

Passed:

- `pnpm exec tsc --noEmit` in `apps/web/veriq`.
- Dev-server route smoke checks returned HTTP 200 for `/demo`, every synthetic onboarding step, and `/w/cedar-demo/overview?mode=synthetic`.
- `git diff --check`.

Blocked by platform environment:

- `pnpm build` cannot run in a normal shell because `@payloadcms/figma` requires the platform-owned `FIGMA_EID`. No secret or placeholder was added.

No migrations, seeders, database changes, accepted contract changes, Cedar changes, Payload admin route changes or credentials were used.
