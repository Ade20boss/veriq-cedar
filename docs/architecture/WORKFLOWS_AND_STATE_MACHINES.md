# Workflows and state machines

These diagrams describe the observed Cedar flow and proposed future Veriq workflows. Backend persistence and authorization remain authoritative.

## Authentication

**PROPOSED:** no browser login route exists in the current demo backend.

~~~mermaid
stateDiagram-v2
  [*] --> SignUp
  SignUp --> Verification: email accepted
  Verification --> SignIn: verified
  SignIn --> MembershipCheck: session created
  MembershipCheck --> WorkspaceSelection: memberships available
  MembershipCheck --> InstitutionOnboarding: none/incomplete
  WorkspaceSelection --> AuthorizedWorkspace
  SignIn --> SignInError: invalid/expired
~~~

Restore by calling a server `/auth/me` endpoint, not by trusting a local role or token. Session expiry returns to an honest session-required state.

## Institution onboarding and connection

~~~mermaid
flowchart LR
  A[Create or join institution] --> B[Membership authorization]
  B --> C[Select connector and scopes]
  C --> D[Provider authorization]
  D --> E[Connection health]
  E --> F[Queue synchronization]
  F --> G{Sync result}
  G -->|completed| H[Knowledge onboarding]
  G -->|failed| I[Retry or admin intervention]
  H --> J[Workspace ready]
  B --> K[Permission restricted]
~~~

Synchronization is durable: `QUEUED → RUNNING → COMPLETED|FAILED`, with bounded retry and a job ID. UI animation cannot declare readiness.

## Proactive operational investigation

~~~mermaid
flowchart LR
  A[Authorized operational event] --> B[Validate and persist]
  B --> C[Monitoring rule]
  C --> D[Anomaly signal]
  D --> E[Incident assessment]
  E --> F[Investigation created]
  F --> G[Evidence collection]
  G --> H[AI candidate analysis]
  H --> I[Human review]
~~~

Anomaly state and incident lifecycle are different. Route evidence can support an operational incident but cannot establish an individual transfer outcome.

## Customer complaint investigation

~~~mermaid
sequenceDiagram
  participant C as Customer
  participant Cedar as Cedar API
  participant W as Durable worker
  participant V as Veriq case service
  C->>Cedar: POST complaint(transfer_id, report)
  Cedar-->>C: Complaint OPEN
  Cedar->>W: durable outbox
  W->>V: permitted neutral case projection
  V->>V: correlate authorized evidence
  V-->>W: investigation status/evidence
  C->>Cedar: GET complaint status
  V-->>Staff: investigator case view
~~~

If AI is unavailable, the investigation remains explicitly unavailable/degraded; no narrative or financial conclusion is fabricated.

## Review workflow

~~~mermaid
stateDiagram-v2
  [*] --> FindingsDraft
  FindingsDraft --> Submitted
  Submitted --> Claimed
  Claimed --> Approved
  Claimed --> ChangesRequested
  Claimed --> Rejected
  ChangesRequested --> Submitted
  Approved --> AuditRecorded
  Rejected --> AuditRecorded
~~~

A reviewer decision requires permission, version checking, separation of duties and an immutable audit record.

## Incident lifecycle

~~~mermaid
stateDiagram-v2
  [*] --> Emerging
  Emerging --> Active: corroborated assessment
  Active --> Contained: mitigation recorded
  Contained --> Resolved: evidence supports closure
  Active --> Rejected: insufficient/contradictory evidence
  Resolved --> Active: justified reopening
~~~

## Knowledge registration

~~~mermaid
stateDiagram-v2
  [*] --> Registered
  Registered --> Parsing
  Parsing --> Extracted
  Parsing --> Failed
  Extracted --> HumanValidation
  HumanValidation --> Review
  Review --> Approved
  Review --> Rejected
  Approved --> Published
~~~

## Frontend synchronization rules

- Commands show pending until the server returns an accepted state/job ID.
- Poll a job/resource with bounded backoff; recover after reload by refetching authority.
- Include request/correlation IDs in support diagnostics, never secrets or private simulator truth.
- Render `UNKNOWN` and `AI_UNAVAILABLE` explicitly.
- Retries reuse the original idempotency key for the same command only.
- Every authority-changing transition is a server audit event.

