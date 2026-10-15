# Autonomous events and durable investigation jobs

Task 001.1 review proposal implementing the owner's proactive requirement. Staff are consumers/reviewers of automatically initiated work. Neither a complaint nor Sarah/Michael pressing Start is a precondition for incident detection or investigation.

## Subject, investigation, run and job identities

An incident is a route/service operational record. A bank case is Cedar's complaint record; legacy Complaint.id maps exactly to bank_case_id. An investigation has its own stable investigation_id and subject_type INCIDENT or BANK_CASE. An incident investigation has incident_id and initially no bank_case_ids; a case investigation has one bank case and may cite a related incident. Unique active investigation per (bank, subject type, subject ID, purpose). Keep the incident and case investigations distinct rather than treating their relationship as duplication. Each evidence revision creates a run_id; retry attempts retain job_id/run_id. Manual re-investigation creates a new run under the existing investigation, with actor/reason.

## Trigger A: proactive monitoring

1. Cedar commits an allowlisted operational event and integration outbox independently of any customer/session. Automated dispatch or autonomous cursor polling continues after worker startup.
2. Veriq authenticates bank/source, validates envelope/type/payload/provenance and records a durable inbox receipt. Duplicate same-ID/same-digest delivery returns the original receipt; same-ID/different-digest is 409 discrepancy. Commit projection intent before ack. Invalid events do not silently advance the cursor.
3. A durable projection job updates route metrics exactly once. Use either raw attempts or a source-backed metric snapshot for a defined interval, not both. Late arrivals recompute relevant intervals under a versioned event-time/watermark policy; retain observed time for historical views. A recovered historical interval must not masquerade as a current incident; review exact late-window bounds.
4. Detector evaluates the frozen 5-minute thresholds: >=20 attempts, >=20% timeout, >=100 baseline attempts, <=5% baseline timeout, >=15-point increase, same route/service signature. Fixture G2 7/25 vs 2/100 qualifies; Birch 1/25 vs 2/100 does not.
5. In one Veriq transaction: upsert exactly one active SUSPECTED incident per bank/rule/route/service signature, create or reuse its INCIDENT investigation, record validated trigger with rule/version/window/evidence IDs, increment evidence revision as needed, enqueue a deduplicated analysis job and write a status-delivery outbox item.
6. An autonomous worker assembles eligible evidence/context and starts the run immediately. AI is advisory and optional for durable evidence progress; provider failure records EVIDENCE_READY_AI_UNAVAILABLE and bounded retry state. No manual enable button, complaint or operator detection command.
7. Deliver progress and permitted results through the bank result adapter. Cedar staff can see an incident with zero linked cases and review evidence when needed. Approval does not gate initial investigation creation.

## Trigger B: complaint or staff intake

Cedar commits the customer/staff complaint and outbox before Veriq/AI calls. Complaint source includes DIGITAL or BRANCH; repeated interaction on a known case does not create a duplicate complaint. Receipt automatically retrieves permitted transaction evidence, exact route/service/time and known active incidents. Supporting evidence permits an audited case↔incident association; similar text alone does not. Create/reuse a distinct BANK_CASE investigation automatically. If no supporting incident exists, investigate the case without inventing an incident. Existing incident evidence may be reused by reference, with permissions rechecked.

Attach the complaint to an existing incident only with evidence and queue an updated incident run when it adds material evidence. Case-specific finality remains independently assessed by Cedar. Duplicate complaint events/retries do not create duplicate runs; intentionally distinct complaints are not merged solely by transfer ID or wording. Customer-safe completion/status uses actual bank records even if Veriq is unavailable.

## Trigger C: new evidence and manual extensions

New eligible events/source versions/status responses may schedule a fresh run for an existing subject. Coalesce repeated unchanged evidence digests; one active run per investigation plus a pending latest revision prevents an LLM call per telemetry event. New material evidence during a lease marks a successor revision; a stale run is stored historically and cannot overwrite current findings/outcome. Trigger origins are OPERATIONAL_ANOMALY, CUSTOMER_COMPLAINT, NEW_EVIDENCE, MANUAL_REINVESTIGATION or MANUAL_VERIFICATION. The UI groups manual verification separately from review and initiation.

Manual requests are optional: review evidence, request a specific authorized verification, record finding, escalate or re-investigate. Each command checks scope, permission, reason, expected version and idempotency key. Staff assignment/escalation affects Cedar work ownership, not whether Veriq starts. A manual command on an existing current job returns the deduplicated accepted receipt rather than launching duplicate work.

## Durable job state and recovery

Job fields: job_id, bank_id, job_kind, nullable investigation_id/run_id, trigger_id, dedupe_key, evidence_revision, state, attempt_count, available_at, lease_owner, lease_expires_at, lease_generation, last_error_code and timestamps. Private payload/retry internals are not exposed to browsers. Job kinds cover EVENT_PROJECTION, INCIDENT_ANALYSIS, CASE_ANALYSIS, STATUS_VERIFICATION, SOURCE_INGESTION and RESULT_DELIVERY.

State transitions: QUEUED → LEASED → SUCCEEDED; transient failures LEASED → RETRY_WAIT → LEASED; exhausted/permanent failures → DEAD_LETTER with an alert and evidence retained. A crashed lease expires and is reclaimed. A fencing generation prevents an old worker from committing after a newer lease owner. Claim jobs in short PostgreSQL transactions with row locks/skip-locked semantics; perform HTTP/AI work outside the transaction; commit with lease/version compare. At-least-once execution plus unique dedupe/side-effect keys gives idempotent visible effects, not exactly-once delivery claims.

Proposed bounded defaults for review: lease 60 seconds with 20-second heartbeat; AI HTTP timeout 30 seconds; max 5 attempts with retry delays 5, 15, 60 and 180 seconds plus jitter; 5-second scheduler scan. Verification delivery may need its own timeout. LLM refusal/schema/citation failure is not automatically retried indefinitely. Record degraded status and alert on dead letter; authorized retry is an audited recovery action. A recovered worker scans automatically, so manual replay is diagnostic rather than required operation. No dependency on Redis/Celery/Kafka is introduced.

Investigation lifecycle is separate from job state and human review: REQUESTED, EVIDENCE_READY, AI_PENDING, FINDINGS_READY, EVIDENCE_READY_AI_UNAVAILABLE, REVIEWED, RESOLVED. review_status is UNREVIEWED, APPROVED or REJECTED. Investigation APPROVED finding is not a confirmed bank outcome. Source job and delivery status have their own DTOs. Never expose raw provider errors/secrets.

## Outcome and staff delivery rules

Incident analysis contains no single-transfer financial_outcome. Case analysis copies the current eligible Cedar outcome and records evidence revision/digest. Route cause hypotheses cannot update a ledger or settle a case. Status verification returns normalized banking evidence via Cedar; only Cedar validates a financial transition. Before authorized S2 reveal, UNKNOWN remains visible everywhere. Contradictory authoritative evidence is audited and opens a discrepancy, not silent overwrite.

Status deliveries are emitted at REQUESTED/evidence/AI/degraded/reviewed revisions and material link changes, not only on success. Cedar's inbox is idempotent by delivery_id and monotonic by investigation revision; staff polls the bank-owned projection, while authorized workbench clients poll Veriq. Publication of approved customer communication remains a separate human-authorized Cedar action with provenance. No automatic unsafe message is sent because an LLM produced a draft.

## Required acceptance checks after implementation authorization

P01: Emit qualifying G2 events with no complaint and no staff session; incident, INCIDENT investigation and durable job appear automatically.
P02: Restart after inbox commit and before dispatch; resume automatically, one incident/job effect, no lost work.
P03: Duplicate/concurrent threshold evaluation and job delivery preserve unique active incident/investigation and fenced writes.
P04: Ada's later complaint automatically creates BANK_CASE investigation and evidence-backed incident link; no staff click. Birch negative control remains unlinked.
P05: Case intake and staff banking workflows persist with Veriq/AI unavailable; automatic processing resumes after recovery.
P06: Before/after authorized reveal preserve UNKNOWN/CREDIT_CONFIRMED boundaries; route findings never establish individual finality.
P07: Older AI/result delivery cannot overwrite newer evidence or staff inbox revision; missing/false evidence IDs are rejected.
P08: Manual verification/re-investigation/escalation/review require permission/audit but never gate initial automation.
P09: Separate fake bank adapter runs core without Cedar imports/DB, private truth canary does not leak.
P10: Support-only staff cannot open Veriq/review findings; unsafe/unsupported communication publication fails. Retain T01–T16.

These are design acceptance criteria, not test results. No worker or application logic is implemented.
