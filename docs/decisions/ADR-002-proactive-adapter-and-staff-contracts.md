# ADR 002 Proactive investigations bank adapters and frontend alignment

Date: 15 October 2026. Status: owner-directed behavior and frontend correction recorded; detailed API/adapter/job design PROPOSED pending technical and affected-owner review. Task 001 architecture accepted subject to these amendments. No implementation authorization.

Owner direction: Veriq automatically starts investigations from validated operational anomalies and from new complaints; supporting evidence permits case/incident correlation. Manual staff work is optional verification, re-investigation, escalation and approval. Financial authority remains Cedar's; AI is advisory. Cedar customer design is preserved; staff operations UI is rebuilt, retaining relevant workflows. The latest supplied feedback supersedes earlier wording that preserved the staff interface.

Propose independent customer and staff Next.js deployments, the latter containing separately authorized Cedar operations and Veriq workbench areas. Current apps/web is only a legacy reservation. Source migration remains blocked on supplied repositories and Usaamah's explicit approval.

Cedar implements neutral knowledge/event/transaction-evidence/metrics/status-verification/case/result ports; Veriq has no direct Cedar ORM/repository/SQL dependency. Propose durable autonomous PostgreSQL inbox/outbox/jobs with retries/leases and distinct INCIDENT/BANK_CASE investigations. Staff receives versioned status/approved findings through a Cedar-owned result inbox. No complaint or staff session is needed for proactive work.

The unchanged canonical contracts remain contracts/openapi.yaml and contracts/demo.json. The full versioned review candidate lives under contracts/proposals; no new path is approved by its existence. Incident AI requires an explicit case-free proposal because existing analyze-case requires a real case_id; Habeeb must review it. Baseline extraction/case AI schemas remain unchanged.

Acceptance: no-session/no-complaint anomaly starts durable work; later complaint triggers/correlates automatically; Cedar survives Veriq/AI outage; private truth never leaks; route findings do not establish individual outcome; import/grant/fake-adapter and crash-recovery tests. Proposal scheduling defaults, staff permission matrix, source import, additional AI endpoint and contract adoption require review. No teammate acknowledgement is invented.
