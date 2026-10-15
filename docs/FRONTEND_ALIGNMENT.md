# Frontend alignment for customer operations and Veriq

Task 001.1 proposal incorporating the supplied operations-system feedback. Preserve the existing Cedar customer Next.js design; rebuild Cedar Staff Operations from scratch. Retain relevant employee workflows, not the old staff interface or localStorage services. Veriq is a separately authorized product area, even if it shares the staff deployment.

No source repositories/branches or verified current Next.js feature inventory have been supplied. The reported original React/Vite exports are historical workflow references. Do not import/migrate/restructure source until Usaamah supplies it and explicitly approves migration. This task does not build screens.

## Minimum first integration

| Experience | First screens/workflows | Data boundary |
|---|---|---|
| Customer, retained | session, account, beneficiary/transfer, history/timeline, complaint list/detail and approved communications | own Cedar API data; no local balance subtraction, outcome selection or ordinary-customer scenario control |
| Cedar operations, rebuilt | role home/work queue, customer lookup/basic profile, transaction inquiry, complaint queue/detail/intake, interactions, assignment/escalation, result status and approved customer message | Cedar-owned records and result inbox; remains usable without Veriq |
| Veriq workbench | sources/assertion review, context/entities, route monitoring, automatic investigation list, incident/case evidence, verification and human review | Veriq API with separate permission; no Cedar repository/client store reuse |
| Restricted demo | seed/reset before acts, start telemetry, arm S2, later status reveal | demo operator only; no Detect Incident or fake Start Investigation state transition |

Basic Customer 360 means masked identity/account summaries and scoped links to transactions/cases, not an enterprise CRM. Embedded case activity provides the P0 audit trail. Dashboard/workload views derive real permitted queue data; do not invent analytics or delivery guarantees. Defer advanced supervisor/correction approvals, reconciliation workspace, shifts, full notifications delivery, automatic assignment, detailed reporting and further connectors until the core journey works. Preserve requested screen designs by showing clear deferred/not-connected states, not new mock banking truth.

## Automatic work presentation

Sarah opens the same persisted Ada complaint visible in the customer app. Cedar displays bank_case_id, transfer/outcome, assignment, linked incident and investigation IDs, trigger origin/time/evidence, progress, evidence gaps and synchronization age. It says 'Automatically initiated following operational anomaly' or 'Automatically initiated after complaint'; no routine Start button. If Veriq is unavailable, show last synchronization and a degraded state while normal case intake/updates remain available.

Michael's queue separates subject_type INCIDENT/BANK_CASE and origin OPERATIONAL_ANOMALY, CUSTOMER_COMPLAINT, NEW_EVIDENCE, MANUAL_REINVESTIGATION or MANUAL_VERIFICATION. Main actions are Review Evidence, Request Verification, Record Review and Escalate. A manual re-investigation action is secondary and requires a reason. Route incident and case outcome are separate columns/records. An unreviewed hypothesis is never styled as approved finding or proof of payment failure.

Support→specialist assignment/escalation models Sarah-to-Michael handoff; it does not start the core investigation. Bob may intake a branch complaint or add an interaction to an existing case. Grace's approved supervisor actions cannot mutate immutable financial evidence. Prototype employee names are illustrative synthetic personas; exact role mapping remains a team decision.

The workbench navigation target is built from authorized investigation_id, not a client-supplied arbitrary URL. Opening it rechecks server permission; sharing a deployment/session does not grant Veriq access. Cedar result projection may contain less evidence than the full workbench.

## API clients and mocks

Use separate cedarCustomerApi, cedarStaffApi and veriqApi clients/types. Generate from the approved baseline for current work; isolate any v1.1 proposed types/mocks behind a clearly named proposal adapter until review. Proposed OpenAPI provides DTOs/examples; none are live endpoints. Do not merge unrelated domain stores or calculate ledger/incident outcomes in React. Shared components may format records and render status only.

Poll permitted list/detail endpoints every 1–2 seconds during active demo work, with cleanup, backoff, last-updated indicator and full refresh after mutation. Background workers run independently of browser polling. Initial polling failure must not appear as 'no investigations'. Use cursor pagination without dropping selected items when updates reorder the queue. SSE/WebSockets are optional later.

History and complaint-list gaps receive proposed additions; customer notifications delivery and PIN/step-up authorization remain unapproved future scope. Do not preserve a fake PIN as a claim of server authorization. Require authenticated account ownership and command validation in the demo; propose any step-up contract separately if essential.

Current scope clarification: the Cedar Operations attachment is a proposed requirements source, not authorization to build every module. Read docs/MINIMUM_DEMO_SCOPE.md from repository root for the 26-addition P0 proposal and the 13 excluded secondary operations. Canonical APIs are unchanged; no app scaffolding is authorized.
