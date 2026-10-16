# Realtime and asynchronous processing

No browser WebSocket/SSE transport is observed. The backend has durable workers and job/outbox state. Start with REST polling and add push only after transport/auth decisions are approved.

## Recommended transport

| Operation | Initial recommendation | Reason |
|---|---|---|
| Account/transfer/complaint reads | REST | Small authoritative resources |
| Transfer status | REST GET with user action or bounded polling | No outcome inference |
| Source parsing | 202 + job polling | Durable bounded parser state |
| Sync/evidence/AI/report jobs | 202 + polling; SSE later | Reload recovery |
| Staff operations | REST refresh or SSE proposal | Current backend exposes reads, not streams |

## Proposed event envelope

~~~json
{
  "event_id": "evt_01JDEMO",
  "event_name": "investigation.status_changed",
  "occurred_at": "2026-10-16T00:05:56Z",
  "observed_at": "2026-10-16T00:05:57Z",
  "institution_id": "inst_cedar_demo",
  "resource_type": "investigation",
  "resource_id": "inv_01JDEMO",
  "version": 4,
  "correlation_id": "req_01JDEMO",
  "payload": { "status": "EVIDENCE_READY_AI_UNAVAILABLE" }
}
~~~

Proposed event names include `sync.status_changed`, `source.processing_completed`, `monitoring.anomaly_detected`, `incident.lifecycle_changed`, `investigation.status_changed`, `review.decision_recorded`, and `report.status_changed`. These are not current public routes.

## Client behavior

- Track event/resource version and ignore duplicates or older updates.
- On reconnect or tab resume, refetch the resource.
- Use `Retry-After` and bounded exponential backoff for 429/503.
- Show stale-data markers when timestamps exceed the freshness window.
- Preserve pending state using a server job ID, not a React timer.
- Network loss during a financial command is ambiguous; retry the same idempotency key or retrieve by known transfer ID.
- Never send Redis/BullMQ credentials or connect the browser to internal queues.

## Backend requirements

Workers need durable job IDs, attempt counts, lease/generation fencing, terminal error codes, correlation IDs and immutable audit events. Event payloads must be tenant-scoped and exclude private simulator truth, secrets, stack traces and unapproved customer data.

