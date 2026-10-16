# Gap analysis and integration roadmap

## Current state

**OBSERVED:** The repository has a functioning customer S2 transfer path and a staff Veriq read/source slice against FastAPI. The broader Veriq product vision is not implemented in the frontend and is not represented by the accepted backend contract.

## Priority gaps

| Priority | Gap | Impact | Owner/decision |
|---|---|---|---|
| P0 | Production authentication/session issuance absent; staff role picker is not auth | No secure multi-user use | Identity/backend |
| P0 | Same-origin proxy/browser setup not launched | Browser integration cannot be claimed | Infra/integration |
| P0 | Tenant and permission model undefined for proposed workspace | Cross-institution risk | Backend/security |
| P0 | Financial outcome authority must remain Cedar/backend-owned | Incorrect customer claims if simulated | Cedar/backend/frontend |
| P1 | Customer transfer history and complaint list absent | Dashboard/history is session-local | Cedar API |
| P1 | Staff queues, inquiry, assignment and review writes absent | Operations UI cannot be functional | Staff/backend |
| P1 | Investigation list/detail/evidence pagination incomplete | Exact-case reads only | Veriq API |
| P1 | Connector/sync/knowledge APIs absent | Onboarding cannot integrate | Platform/backend |
| P2 | AI analysis/result contract absent | No honest live hypothesis UI | AI/backend |
| P2 | Report generation/export and audit query absent | Governance incomplete | Backend/security |
| P3 | Push events, offline cache and advanced filters | UX improvements | Joint |

## Inconsistencies and risks

- Legacy `apps/web/cedarBank/src/App.tsx` contains fake scenarios, timer-driven results and local balance deductions, although the canonical route uses the live app. It should be isolated or removed in a future authorized code task.
- Customer `CaseRecord` and staff `Investigation` names obscure distinct case/investigation/incident IDs.
- Some frontend display labels compress stage/outcome into one visual status; details must retain both.
- Local employee access arrays look like RBAC but are not server authorization.
- Technology descriptions (NestJS, Redis/BullMQ, LLM APIs) are not evidence that services exist.

## Recommended implementation order

1. Agree identity/session, tenant, role, permission and same-origin deployment.
2. Freeze IDs, enums, pagination envelopes, error schema, versions and concurrency rules.
3. Complete browser demo using existing Cedar/Veriq routes; test cookie paths and origin checks.
4. Add customer transfer/complaint list reads without changing financial authority.
5. Add staff operations/incident/case list projections, assignment and audit reads.
6. Add connector/synchronization/knowledge job APIs with polling/reload recovery.
7. Add review decisions and report jobs with separation of duties.
8. Add AI candidate analysis only with evidence provenance and unavailable states.
9. Add push events after REST/reconnect semantics are tested.

## Decisions requiring agreement

1. Is FastAPI `/v1` the integration authority, or will proposed `/api/v1` belong to NestJS?
2. What is the production identity provider and cookie/session route?
3. Is `institution_id` or `bank_id` the primary staff tenant boundary?
4. Which roles may create, assign, review and export investigations?
5. Which customer history/list routes are approved for v1.1?
6. What evidence is sufficient for outcome reveal, and who may publish a customer-safe update?
7. Which realtime transport and freshness SLA are required?
8. Which features are in the next authorized implementation task?

## Joint verification

Use a fresh disposable database to verify session scoping, account/bank/name enquiry, ₦50,000→5,000,000 kobo conversion, idempotent S2 transfer, retrieved `RESPONSE_TIMEOUT/UNKNOWN`, balance, complaint persistence, automatic case delivery, investigator separation, source provenance and browser origin enforcement. Do not claim unimplemented AI/review/reveal behavior.

