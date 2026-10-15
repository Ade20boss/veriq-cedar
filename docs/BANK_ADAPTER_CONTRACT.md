# Proposed reusable bank adapter contract

Task 003 implementation status: the bounded internal proactive G0 subset is now implemented in apps/backend. See [PROACTIVE_G0.md](PROACTIVE_G0.md) for actual models, tables, worker/replay and tests. Internal version g0.internal.1 is task-authorized; v1.1 HTTP additions and the broader design below remain proposals. No ledger, complaints, AI endpoint or frontend is implemented by G0.


Task 001.1 proposal. Veriq core consumes normalized, source-backed DTOs and capabilities; it never depends on Cedar ORM/repositories/private tables. Cedar is the first implementation, supplied at composition time. A fake second bank adapter must be able to run the same core tests. Interfaces below are signatures for review, not Python implementations.

## Common contract

Every call receives bank_id, authenticated service principal, purpose, correlation_id and as_of_observed_at where relevant. Tenant scope comes from trusted service configuration/policy, not an unchecked browser field. Requests have bounded cursors/limits, typed IDs and versioned DTOs. Results include immutable source references and visibility classification. Service credentials alone do not grant customer/employee rights. Denials are explicit; no direct SQL fallback.

| Port and operation | Input | Normalized output and safeguards |
|---|---|---|
| KnowledgeSourcePort.list_sources / read_chunks | authorized bank, source ID, cursor, observed cutoff | source ID/kind/checksum/permissions and stable chunk IDs/locators/text/checksums; no whole-bank data dump |
| OperationalEventPort.read_events / acknowledge | durable consumer cursor, limit, observed cutoff | normalized event envelopes and replay cursor; ack only after receiver commit; push may call the same receiver port |
| TransactionEvidencePort.get_evidence | bank transaction ID, purpose, cutoff | permitted sender-side evidence + current authoritative outcome/evidence reference; no private recipient ledger or scenario selector |
| RouteMetricsPort.read_metrics | route/service IDs, window, baseline version, cutoff | source-backed window/baseline attempts/timeouts and interval IDs; do not count a metric snapshot plus its events twice |
| StatusVerificationPort.request / get_request | transaction ID, approved query kind, reason, requested_by, idempotency key | asynchronous verification receipt/state; later normalized eligible status response, including inconclusive outcome when appropriate |
| BankCasePort.get_case / find_correlations | bank case ID or scoped transfer/route/time query, cursor | complaint facts, bank/customer/transaction refs and permitted correlation candidates; no automatic semantic-only link |
| InvestigationResultPort.deliver | versioned delivery ID, investigation/incident IDs, bank_case_ids, trigger, progress, permitted findings and source refs | idempotent bank inbox receipt; exact version ack; bank may reject unauthorized data without losing its normal operations |

Proposed source-backed evidence wrapper is NormalizedEvidence in the draft OpenAPI. Its EvidenceRecord payload preserves the existing AI wire shape; the wrapper carries bank/source/event IDs, locator, source digest, access classification and permitted purpose. Adapter strips private fields before core ingestion. Backend builds existing AI EvidenceRecord arrays from this wrapper and retains rich provenance server-side.

## Transaction-status verification

A human request or an explicitly approved bounded policy may enqueue TRANSACTION_STATUS. The AI can recommend a check but cannot authorize it. Demo policy does not allow a status response to expose S2 truth before the authorized reveal. An earlier query may return inconclusive and must leave UNKNOWN. Requests are audited and idempotent, complete with evidence/status rather than a direct set-outcome instruction. Backend policy rejects unsupported query kinds, wrong bank/transfer scope or absent permission.

## Reliable boundary and result delivery

Cedar persists each bank mutation and its integration outbox atomically in its own unit of work. Veriq's durable inbox deduplicates (bank_id, source_system, event_id). Its commit records accepted data plus processing intent before acknowledging Cedar. Neither distributed transactions nor cross-domain shared SQLAlchemy sessions are required. Domain-specific retry handles partial delivery.

Veriq emits versioned status/results in the same transaction as each investigation revision. A delivery worker calls InvestigationResultPort; Cedar writes a deduplicated result inbox under Cedar ownership, then acknowledges. If Cedar is unavailable, retries resume; staff sees synchronization age/state. Received lifecycle/status and evidence-only progress can be visible before human findings approval. Only reviewed permitted findings are published as approved_findings; customer communication is a separate bank-owned approval/publication action. Duplicate/older result versions never regress the inbox. An incident delivery can have bank_case_ids=[] and appear in the staff incident queue before any complaint.

## Enforcement and future tests

- Static dependency tests forbid veriq imports from cedar, simulator, Cedar ORM/repositories or database engines; ports are dependency-neutral. Composition may depend on both domains.
- Veriq test dependencies provide a fake adapter with no DB session. Fail tests on any direct bank SQL access; run against two fake bank schemas to expose Cedar-specific assumptions.
- PostgreSQL integration tests use actual adapter/Veriq/simulator roles. Veriq cannot SELECT Cedar/private tables or views; adapter cannot SELECT cedar_private; AI has no database configuration. Inspect grants/default grants and privileged functions.
- Export serialization allowlists and canary private fields must prevent ground-truth leakage in event payloads, open data dictionaries, normalized records, exceptions, logs and AI requests.
- Verify bank/customer/purpose/cutoff scoping; fabricated evidence, invalid chunk quote and unknown locator must fail safely.
- Fault-inject duplicate deliveries, crash-before-ack, out-of-order result versions, revoked permissions and Veriq/AI outage. Cedar intake/read/assignment/communications stay operational.

Import tests and role grants are enforceable safeguards, not a claim of production isolation in a shared process. No adapter interface is permission to read private truth.
