Daniel's response resolves one important disagreement between us, and I agree with his correction about Veriq being proactive.

Veriq should not wait for Sarah or Michael to press Start Investigation. If its operational monitoring detects a qualifying anomaly, it should automatically begin investigating the incident using the evidence and institutional context already available.

When Ada subsequently complains, Veriq should connect that complaint to any relevant existing investigation or initiate a separate case investigation if necessary.

That gives us two different triggers:

Trigger A — Proactive monitoring

Operational events → Anomaly detection → Automatic incident investigation → Evidence and findings → Staff review when needed

Trigger B — Customer complaint

Complaint received → Automatic evidence retrieval → Link relevant incident → Case investigation → Customer-safe update

The crucial distinction is that a route-level incident investigation cannot automatically establish the final outcome of an individual transfer. Even if Veriq identifies a real payment-route disruption, Ada's transfer must remain `UNKNOWN` until eligible evidence confirms what happened to her payment.

## One correction Daniel still needs

Daniel says we should preserve both existing frontend applications.

That's only partially consistent with your latest decision.

Our actual plan is:

| Application                 | Decision                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Cedar Customer Banking      | Preserve the current Next.js design and integrate Daniel's backend                 |
| Cedar Bank Staff Operations | Redesign and rebuild from scratch as a realistic bank-owned operations system      |
| Veriq Workbench             | Build as a logically separate intelligence product, accessible to authorized staff |

We are preserving the requirements and employee workflows from the original Cedar staff prototype, not preserving its current interface design.

I would make sure Daniel understands that before his ChatGPT updates your frontend specification.

## 1. The screen inventory Daniel requested

I rechecked the source files in the two original Figma Make exports.

One limitation: these are the original React/Vite prototypes, not the latest Next.js repositories. So I can verify what the original prototypes implement, but I cannot confirm whether every feature survived migration or is currently running correctly.

In the tables, prototype working means an interactive workflow exists in the exported code—not that a backend API is connected.

### A. Cedar Customer Banking Application

The original customer application has 16 screen states, although some are intermediate steps in the same journey.

| Screen                 | Current prototype                              | Minimum backend data required                      |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Splash                 | Implemented visually                           | None                                               |
| Login                  | Demo navigation works; no real session         | Authenticated customer identity and session        |
| Home                   | Balance and transactions shown from local data | Account, available balance, recent transfers       |
| Transfer               | Amount, bank and recipient inputs              | Recipient banks, account balance, name enquiry     |
| Review                 | Transfer confirmation details                  | Validated beneficiary, amount and account          |
| Authorize              | Demo PIN flow                                  | Server-enforced transfer authorization             |
| Submitting             | Animated processing state                      | Transfer request and processing response           |
| Transfer Status        | Local scenario outcome displayed               | Transfer ID, processing stage, financial outcome   |
| History                | Local transaction list and filtering           | Authorized transaction history                     |
| Transaction Details    | Evidence and explanation UI exists             | Transfer details, eligible timeline, safe insights |
| Support                | Support and complaint navigation               | Customer cases and available support actions       |
| Report Problem         | Complaint form exists                          | Complaint creation and transfer association        |
| Complaint Confirmation | Local reference displayed                      | Persisted complaint ID/reference                   |
| My Complaints          | Local complaint records                        | Authorized complaint list                          |
| Case Details           | Complaint timeline and updates                 | Case status and approved updates                   |
| Notifications          | Local notification state                       | Customer-safe notifications and timestamps         |

Assessment: We have enough customer UI already. It needs backend integration, error handling, and consistent scenario data—not a redesign.

One critical issue I verified in the original code is that the app can subtract the transfer amount from the balance in React state and change a transfer's status using simulated frontend actions. Those behaviours must be replaced with Daniel's authoritative APIs.

Also, the original mobile demo allows client-side scenario selection. That must become a separate operator-controlled mechanism rather than something the ordinary customer can use to control a payment outcome.

Daniel's existing API contract supports account retrieval, bank lists, name enquiry, transfers, complaint creation and individual complaint retrieval. It still lacks some capabilities required by the existing History, Notifications and session screens.&#x20;

01_Usaamah_Frontend_Build_Spec_v1.1.md



### B. Original Cedar Staff Operations Portal

This inventory is particularly important because we are rebuilding the interface, but we want to preserve the relevant workflows.

| Module                    | What the existing prototype implements                            | Minimum backend data required                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Staff Login               | Select Bob, Sarah, Michael or Grace                               | Staff session, role, department and permissions               |
| Dashboard                 | Different employee-specific metrics and actions                   | Authorized workload, cases, alerts and recent activity        |
| Customer Search           | Search UI with simulated results                                  | Customer lookup, masked profile and account references        |
| Transaction Search        | Search UI with simulated transaction details                      | Authorized transaction lookup, timeline and outcome           |
| Complaints                | Intake, queues, interactions, assignment and escalation workflows | Cases, channels, interactions, ownership, events              |
| Veriq Investigation       | Evidence, hypotheses, verification requests and review actions    | Investigation, evidence, gaps, review state, linked incidents |
| Incident Intelligence     | Incident monitoring and scenario-based status changes             | Route metrics, automatically detected incidents and findings  |
| Team Management           | Staff availability and workload controls                          | Departments, staff capacity, availability and assignments     |
| Case Quality & Exceptions | Complaint corrections and approval workflows                      | Correction requests, review decisions and audit trail         |
| Demo Control Centre       | Scenario selection and simulated state transitions                | Restricted operator actions and scenario state                |
| Notifications             | Simulated activity and alert entries                              | Staff-scoped notifications and timestamps                     |
| Settings                  | Basic demo preferences                                            | Staff profile and supported preferences                       |

There are working prototype interactions behind several of these modules.

For example, the complaint service can create a branch complaint, record interactions and request specialist investigation. The investigation service can record verification requests. The operations service supports incident scenarios, correction exceptions and supervisory activity.

However, these services currently rely on React state and browser `localStorage`, rather than server-backed banking records.

The customer and staff applications therefore cannot currently be assumed to share the same persisted complaints or transaction outcomes.

This is an integration requirement, not something to solve by adding more mock records.

## 2. What must change because Veriq is proactive?

This is the key difference between our previous UI approach and Daniel's clarification.

### In Cedar's Staff Operations System

Sarah should open Ada's complaint and immediately see the Veriq status if a relevant investigation already exists.

For example:

CEDAR BANK · COMPLAINT DETAILS

Disputed Transfer — VRQ-001

Open

Illustrative design using the earlier Cedar fixture

Customer

Ada Johnson

Amount

₦50,000

Financial outcome

Unknown

Assigned support agent

Sarah

Veriq Intelligence

Related route anomaly

Suspected

An investigation was initiated automatically following abnormal payment-route activity.

The connection to this specific transfer remains subject to evidence review.

Open Veriq Workbench&#x20;

The important difference: Sarah isn't being asked to initiate the investigation. She's being shown an investigation Veriq has already started.

If the complaint reveals a previously undetected issue, its creation can independently trigger evidence gathering and case investigation.

In both cases, Sarah should be able to follow progress without repeatedly clicking a button.

### In Michael's Veriq Workbench

I would change the primary investigation experience to emphasize automatically created work.

The investigation list should distinguish:

| Origin              | Meaning                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Operational anomaly | Veriq initiated investigation after a detection rule was satisfied |
| Customer complaint  | A customer report initiated case investigation                     |
| New evidence        | Existing investigation was updated or reevaluated                  |
| Manual verification | Authorized employee requested an additional specific check         |

Michael's main actions should be Review Evidence, Request Verification, Record Finding and Escalate, rather than Start Investigation.

I would also show when an investigation was opened and the evidence that triggered it.

This makes the automation visible and auditable.

### In Incident Intelligence

The page must not depend on clicking a simulated Detect Incident button.

The operator may still start an operational event stream, but detection itself must happen automatically in Daniel's backend.

The frontend displays the changing state.

For the hackathon, polling the backend is acceptable; we do not need WebSockets immediately.

## 3. The new screens we actually need

Given your decision to rebuild Cedar Operations, here's the UI scope I recommend.

| Experience                           | Screens to build or retain                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Cedar Customer                       | Preserve existing screens and integrate them                                        |
| Cedar Operations — Staff foundation  | Staff login, role-based home, customer search                                       |
| Cedar Operations — Payments          | Transaction inquiry, transaction evidence, payment exceptions                       |
| Cedar Operations — Complaints        | Complaint queues, case details, branch intake, interactions                         |
| Cedar Operations — Supervision       | Assignments, workload, corrections, approvals and audit                             |
| Cedar Operations — Veriq integration | Linked investigation status, permitted findings and open-workbench action           |
| Veriq — Proactive Intelligence       | Monitoring overview, automated investigation queue, incident details                |
| Veriq — Investigations               | Evidence timeline, institutional context, hypotheses, verification and human review |
| Veriq — Institutional Knowledge      | Source onboarding, claim review, service relationships                              |
| Veriq — Administration               | Connector status, bank context configuration and permitted integration information  |
| Restricted Demo                      | Scenario controls, reset, replay and authorized status reveal                       |

For the first demo, I would prioritize the complaint and transaction inquiry journey within Cedar Operations, plus Veriq's monitoring and investigation experience.

We don't need to finish every supervisor feature before proving that the integration works.

## 4. Minimum API changes to discuss with Daniel

His existing contract already covers much of the customer app and Veriq workbench.

What it needs is additional support for the bank-owned staff system and proactive investigation state.

I would ask him to review the following data requirements, without treating any new endpoint as already approved:

| Required data                             | Why the UI needs it                                           |
| ----------------------------------------- | ------------------------------------------------------------- |
| Staff identity, role and permissions      | Appropriate bank employee access                              |
| Customer and transaction search results   | Normal banking operations                                     |
| Complaint list and case details           | Sarah and Bob's daily workflows                               |
| Complaint interactions and assignment     | Case management independent of Veriq                          |
| Linked Veriq investigation ID and status  | Display automatically initiated investigations                |
| Investigation trigger and initiation time | Explain why the investigation exists                          |
| Related incident and evidence references  | Display supported context without claiming causation          |
| Investigation progress and evidence gaps  | Let Michael review ongoing automatic analysis                 |
| Verification request status               | Track additional authorized checks                            |
| Approved customer-safe updates            | Return verified findings to Cedar's normal complaint workflow |
| Source/integration health                 | Expose failed ingestion and connection problems               |

One extra requirement deserves particular attention.

The backend must distinguish an automatically initiated route-level investigation from a transaction-specific case investigation.

A suspected route disruption might be detected before Ada even makes her transfer.

Her later complaint could then be correlated with the already-open incident.

Those should remain related but distinct records, rather than creating duplicate investigations or incorrectly concluding that the route incident proves what happened to Ada's money.

## 5. My recommendation for how you and Daniel proceed

I would proceed with the frontend redesign, but use a fixed integration contract as the foundation.

1. You: Build the new Cedar Staff Operations frontend in Codex, using typed mock data for screens whose backend contracts are not yet approved. Preserve the current customer frontend.
2. Daniel: Implement Cedar's banking backend, the automatic event-driven Veriq investigation engine and the bank adapter boundary. Review the missing staff and investigation-status data requirements.
3. Habeeb: Implement evidence-grounded AI extraction and analysis, returning validated advisory findings to Daniel's engine.
4. Together: Demonstrate that a suspected incident and its investigation can exist before Ada submits a complaint, and that Cedar later receives the correct linked investigation information automatically.

I would not spend time creating a new Figma Make project. The frontend redesign can still happen directly in Codex, one workflow at a time.

## 6. What I would tell Daniel

His correction about Veriq being proactive is valid and should become a central product requirement.

There are two points I would emphasize in your reply.

First: We are not merely preserving Cedar's original staff operations interface. We are rebuilding that interface from scratch to represent a credible bank-owned system, while retaining its established workflows and employee responsibilities.

Second: His API contract needs to account for automatic incident investigations and the bank's ability to consume their status and approved findings without requiring staff to initiate them manually.

Once those points are acknowledged, I think the team is aligned on the fundamental product.

The next meaningful step is to give Daniel the screen inventory and missing data requirements above, then freeze the minimum contracts for the redesigned Cedar Operations system and Veriq's proactive investigation workflow before we begin implementing the new screens.


Yes. We should send Daniel the specifications for the new Cedar Bank Operations System we're planning to build, not an inventory of the old prototype.

The old portal can remain a reference for some employee workflows, but it should no longer define the new system's structure, screens or functionality.

That also means we shouldn't ask Daniel to implement APIs based on screens we're about to discard.

I'd organize the new operations platform around how bank employees actually work, with Veriq integrated into those workflows.

## Proposed new Cedar Bank Operations System

| Module                   | What employees will do                                                                                                   | Priority                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Operations Dashboard     | See assigned work, payment exceptions, complaints, alerts and service performance                                        | P0                                 |
| Customer 360             | Search customers, verify identity, view masked accounts, transaction and complaint history                               | P0                                 |
| Transaction Inquiry      | Search transfers by reference, inspect payment stages, ledger postings, network responses and known financial outcomes   | P0                                 |
| Complaints & Disputes    | Register complaints, handle digital and branch cases, record interactions and track resolution                           | P0                                 |
| Payment Operations       | Monitor delayed payments, unknown outcomes, payment exceptions and authorized verification requests                      | P0                                 |
| Team Work Queues         | View department queues, assign cases and escalate work                                                                   | P0, basic                          |
| Veriq Integration        | Display proactively detected incidents, linked investigation status, approved findings and access to the Veriq workbench | P0                                 |
| Supervisor & Approvals   | Review escalations, corrections, assignments and operational exceptions                                                  | P1, with essential approvals in P0 |
| Reconciliation           | Inspect unmatched records, compare evidence and manage exceptions                                                        | P1                                 |
| Audit & Activity History | Review relevant employee actions, status changes, evidence access and approvals                                          | P0, embedded in workflows          |

These are proposed requirements for the redesigned system, not claims that Daniel's current API already implements them.

The staff interface should be built around realistic searchable records, operational tables, case details, activity timelines and permission-controlled actions. It shouldn't resemble a generic SaaS analytics dashboard.

And most importantly, Cedar's operations system must work independently of Veriq. Veriq adds proactive intelligence and deeper investigation without replacing normal banking operations.

## What I would send Daniel instead

This is the updated direction I'd send him. It focuses on what the new system will contain, the information his backend must provide and how it connects to Veriq.

# CEDAR BANK — NEW OPERATIONS SYSTEM SPECIFICATION

## Frontend and Backend Alignment Proposal

**Purpose:** Define the banking operations platform Usaamah will build from scratch and identify the capabilities Daniel's backend must support.

**Status:** Proposed product and integration requirements for team review. API changes and final implementation scope require agreement.

## 1. Product Direction

We are completely redesigning the Cedar Bank Operations System.

The new system must represent a realistic internal banking operations environment, especially for customer service, electronic payments, complaints, payment exceptions and supervisory operations.

Cedar is a fictional bank for our demonstration, but its workflows should reflect recognizable banking operations.

**The fundamental architectural principle is that Cedar Bank operates independently, while Veriq integrates into its existing processes to provide proactive intelligence and evidence-based investigation.**

We are not redesigning Cedar to function as a Veriq dashboard.

We are building a bank-owned operations interface, then demonstrating how Veriq improves it.

## 2. Frontend Structure

We intend to maintain three logically distinct experiences:

1. **Cedar Customer Banking:** The existing Next.js customer application, which we are retaining and connecting to the backend.
2. **Cedar Staff Operations:** A completely new Next.js operations interface, designed from scratch.
3. **Veriq Intelligence Workbench:** The specialized external intelligence platform for bank-specific context, proactive incident monitoring and investigations.

Cedar Staff Operations and the Veriq workbench may share a frontend deployment if their branding, navigation, access control and ownership remain logically separate.

The original Cedar Staff Operations prototype is no longer our visual design specification. Its relevant business workflows can inform requirements, but the new screens and information architecture will be developed independently.

## 3. New Banking Operations Modules

### Module A — Operations Dashboard

**Purpose:** Give authenticated employees a realistic operational starting point.

Features:

- Role-specific work overview.
- Assigned complaints and investigation tasks.
- Department queues.
- Pending payment exceptions.
- Cases approaching or exceeding internal service targets.
- Relevant operational alerts.
- Recently updated cases.
- Staff notifications.

The dashboard should reflect the employee's actual permissions and responsibilities.

**Backend data required:** Staff identity, department, permissions, authorized work items, case summaries, pending exceptions, operational alert summaries and timestamps.

### Module B — Customer 360

**Purpose:** Provide one place for authorized bank employees to understand a customer's relationship with Cedar.

Features:

- Customer search by permitted identifiers.
- Customer profile and basic verification status.
- Masked account details.
- Account status.
- Available balance where authorized.
- Recent transactions.
- Existing complaints.
- Previous interactions.
- Related operational issues.

Customer data access must be authorized and audited.

**Backend data required:** Customer search, scoped profile, account summaries, transaction summaries, complaint history, interactions and relevant verification information.

### Module C — Transaction Inquiry

**Purpose:** Allow staff to investigate the ordinary banking information available for a transfer.

Features:

- Search by transaction reference.
- Filter by date, channel, status and permitted customer reference.
- Transaction details.
- Sender and beneficiary information.
- Processing stage.
- Financial outcome.
- Sender-side ledger postings.
- Payment-gateway events.
- Authorized payment-network responses.
- Evidence timeline.
- Linked complaints.
- Relevant exceptions.
- Veriq investigation status, where available.

The UI must distinguish a posted debit, a submitted instruction, a response timeout and a confirmed recipient outcome.

An unknown outcome must never be displayed as a confirmed failure.

**Backend data required:** Transaction search, authorized transaction details, eligible event timeline, known outcome, permitted source references, ledger evidence and linked cases.

### Module D — Complaints & Dispute Management

**Purpose:** Reproduce the bank's normal complaint-handling workflow.

Features:

- Branch complaint registration.
- Complaints submitted through Cedar Mobile.
- Case queues and filters.
- Complaint details.
- Customer and transaction linking.
- Possible duplicate detection.
- Customer interaction timeline.
- Complaint classification.
- Department routing.
- Case ownership.
- Escalation.
- Customer communication history.
- Case resolution and closure.
- Correction requests where incorrect information was registered.

The system must distinguish customer interactions, complaint cases and Veriq investigations.

Several interactions may relate to one complaint.

**Backend data required:** Staff complaint creation, customer case listing, case details, interactions, assignments, escalation, case events, audit history and approved customer updates.

### Module E — Payment Operations & Exceptions

**Purpose:** Give payment operations employees visibility into transfers requiring attention.

Features:

- Delayed or inconclusive transfers.
- Payment-processing exceptions.
- Transactions awaiting authorized verification.
- Gateway response timeouts.
- Payment-route health indicators.
- Relevant reconciliation discrepancies.
- Evidence-based status enquiries.
- Linked complaints and Veriq incidents.

Staff must not be allowed to change a financial outcome without qualifying banking evidence.

**Backend data required:** Payment exception lists, route information, authorized transaction events, verification-request status and permitted reconciliation evidence.

### Module F — Team Work Queues & Supervision

**Purpose:** Support department-level case handling and managerial oversight.

Features:

- Department work queues.
- Assigned and unassigned complaints.
- Individual case ownership.
- Basic workload visibility.
- Manual assignment and reassignment.
- Escalation tracking.
- Supervisor review.
- Correction approvals.
- Staff action history.

Advanced workload-based automatic assignment and full shift scheduling are not required for the initial demonstration.

**Backend data required:** Staff and department membership, queues, assignments, workload summaries, escalation records, reviewer permissions and audit events.

### Module G — Veriq Integration

**Purpose:** Demonstrate how an existing bank benefits from Veriq without replacing its normal software.

This module is a connection to the external Veriq platform, not Cedar's own investigation engine.

Features:

- Proactively detected incident indicators.
- Existing Veriq investigation references.
- Automatic investigation status updates.
- Linked evidence-backed findings.
- Missing-evidence alerts.
- Permitted incident associations.
- Reviewed recommendations.
- Secure navigation to the Veriq workbench.
- Authorized results returned to Cedar.

**Backend data required:** Bank case reference, Veriq investigation ID, investigation origin, initiation time, lifecycle status, related incident references, approved findings, evidence references, and synchronization status.

Cedar must remain operational when Veriq or its AI service is unavailable.

### Module H — Audit & Operational History

**Purpose:** Preserve accountability for consequential staff actions.

Features:

- Case ownership changes.
- Customer interaction history.
- Transaction-reference corrections.
- Investigation review decisions.
- Verification requests.
- Approval records.
- Customer communication history.

Audit information should be accessible within relevant workflows rather than requiring employees to visit an unrelated dashboard.

**Backend data required:** Actor, action, affected resource, timestamp, previous/new value when appropriate, reason and audit reference.

## 4. Employee Workflows

### Bob — Branch Service Officer

A customer visits a Cedar branch.

Bob locates the customer, checks permitted account and transaction details, registers or locates the complaint, records the interaction and routes the case appropriately.

Bob may request a correction when a complaint is linked to an incorrect transaction.

### Sarah — Digital Support Agent

Ada submits a complaint through Cedar Mobile.

Sarah sees the same persisted complaint in her digital-support queue.

The record automatically displays any relevant Veriq investigation or suspected incident information made available by the integration.

**Sarah does not need to manually start a routine investigation.**

Her responsibility is customer service, case management, reviewing available updates and escalating when necessary.

### Michael — Investigation Officer

Michael reviews automatically initiated investigations and relevant payment exceptions.

For Veriq investigations, he opens the specialized workbench to inspect evidence, missing information, hypotheses, possible related incidents and verification requirements.

Michael may request additional authorized verification or record a human review decision.

He must not infer financial finality from AI output alone.

### Grace — Supervisor

Grace oversees complaints, assignments, escalations, correction requests and operational exceptions.

She can authorize permitted supervisory actions, but cannot rewrite immutable banking evidence.

## 5. Veriq Must Remain Proactive

Veriq continuously consumes permitted operational information and maintains institutional context independently of customer complaints.

Its workflow is:

Authorized operational events → Deterministic anomaly detection → Automatic incident creation/investigation → Evidence assembly → AI-assisted advisory findings → Human review when required.

A complaint may independently trigger case investigation or become linked to an already detected incident.

We need to distinguish:

- Proactive operational incident investigation.
- Individual transaction/case investigation.
- Manual request for additional verification.
- Human review or approval.

The staff portal should display the investigation's current state instead of requiring employees to initiate everything manually.

A suspected payment-route incident must not be treated as proof that every transaction on that route failed.

## 6. Cedar-to-Veriq Integration

The bank's existing systems must retain ownership of their normal responsibilities.

Cedar owns:

- Customer accounts and simulated financial records.
- Transfer processing.
- Banking transaction history.
- Bank-owned complaints.
- Customer interactions.
- Staff roles, department queues and normal case ownership.
- Customer communications.

Veriq owns:

- Institutional intelligence context.
- Ingested knowledge and provenance.
- Proactive incident detection and intelligence.
- Evidence-based investigation records.
- Hypotheses and recommendations.
- Veriq investigation status and history.

We need an explicit integration contract defining how:

1. Cedar provides Veriq with authorized operational events and contextual information.
2. Veriq initiates investigations without requiring user interaction.
3. Cedar retrieves or receives linked investigation information.
4. Veriq reports approved findings and changes.
5. Cedar updates its existing employee and customer workflows.

The integration must not require Veriq to read Cedar's private database tables or simulator ground truth directly.

Please propose reusable bank adapters rather than Cedar-specific investigation dependencies.

## 7. Backend Contract Requirements

Your existing customer and Veriq APIs remain the baseline.

However, the proposed new operations system requires additional data capabilities covering:

- Staff authentication and permissions.
- Customer search and lookup.
- Transaction inquiry and history.
- Staff complaint intake.
- Complaint queues and case details.
- Case interactions.
- Assignment and escalation.
- Correction and approval history.
- Payment exceptions.
- Linked proactive Veriq investigations.
- Investigation status synchronization.
- Approved customer communications.
- Relevant operational audit records.

Please review which can reuse existing endpoints and which need small OpenAPI amendments.

**Do not implement every possible banking feature. Prioritize the minimum interfaces required for one end-to-end banking complaint and investigation workflow.**

## 8. Implementation Priorities

### P0 — Required for the integrated demonstration

- Working Cedar Customer Banking integration.
- Role-scoped Cedar Staff Operations.
- Basic Customer 360.
- Transaction Inquiry.
- Complaint queue and case details.
- Branch/digital complaint intake.
- Basic ownership and escalation.
- Proactive Veriq investigation status.
- Linked incident information.
- Evidence-backed staff review.
- Customer-safe updates.
- Audit trail for demonstrated actions.

### P1 — After the primary workflow is functional

- Detailed reconciliation workspace.
- Advanced workload-based assignment.
- Complex supervisor approval workflows.
- Staff rostering and scheduling.
- Advanced operational reporting.
- Additional bank connectors.

## 9. Demonstration Requirements

The demonstration must show that Cedar is an independently functioning fictional bank.

Veriq should build context and detect payment-route degradation automatically.

Ada then makes a simulated transfer and submits a complaint.

Sarah sees the complaint in Cedar's bank-owned staff system, including automatically linked Veriq intelligence.

Michael reviews the investigation in Veriq.

Later authorized evidence confirms the payment outcome, and Cedar receives the permitted update.

The key message is:

**Veriq doesn't replace how a bank operates. It helps the bank understand and investigate what its existing systems cannot explain efficiently.**

## 10. What We Need From Daniel

Please review this proposed operations scope against your current engineering specification and OpenAPI contract.

We need your feedback on:

1. Whether your current backend modules can support these operations.
2. Which API capabilities are missing.
3. Which banking functions should be simplified for the hackathon.
4. How the automatic Veriq investigation state should be exposed to Cedar.
5. How Cedar and Veriq can maintain independent data ownership.
6. Whether the proposed bank-adapter contract can support other banking environments.
7. Which frontend features can be built immediately using contract-valid mocks.

Please distinguish existing approved contracts from new recommendations, and identify the smallest set of changes needed for the first complete integration.

**We want to align the backend with the new bank operations system before implementing its screens in Codex.**

## My recommendation

I would send Daniel this proposed specification, rather than the old screen inventory.

There is also an important scope decision: we're rebuilding Cedar's operations frontend from scratch, but we're not building an entire core banking product from scratch. Daniel's simulator provides the necessary banking functionality; your staff interface exposes realistic operational workflows around it.

The most important screens to design first are Customer 360, Transaction Inquiry, Complaints & Disputes, and the linked Veriq investigation experience. Those four areas will establish the banking environment and prove the integration.

Once Daniel responds, we can reconcile his backend capabilities with this proposed design, finalize the screens, and then give Codex a proper implementation specification without repeatedly changing the architecture.