# Demonstration data contract

## Canonical synthetic story

The accepted demo uses synthetic customer `CED-CUST-001`, source `CED-ACC-001`, Elm bank `ELM`, beneficiary `ELM-ACC-009`, and a `5,000,000` kobo transfer. The sender balance is debited by Cedar. In S2, processing stage is `RESPONSE_TIMEOUT` and financial outcome is `UNKNOWN`.

~~~mermaid
flowchart LR
  O[Operational events] --> A[Anomaly signal]
  A --> I[Incident]
  I --> V[Investigation]
  T[Cedar transfer status] --> C[Customer complaint]
  C --> V
  V --> E[Evidence records]
  E --> H[AI hypothesis candidate]
  H --> R[Human review]
  R --> P[Approved report/customer-safe publication]
~~~

## Observed backend relationships

| Entity | Stable identity/relationship | Authority |
|---|---|---|
| Account/transfer | `CED-ACC-001`, returned transfer UUID/reference | Cedar financial domain |
| Bank/route | `ELM`, `ROUTE-CED-ELM-G2`, service `G2` | Synthetic adapter/Veriq projection |
| Incident | Generated incident ID, route/evidence scoped | Veriq operational only |
| Complaint | Generated complaint ID/reference linked to transfer | Cedar customer domain |
| Investigation | Case lookup plus internal record | Veriq; preserves outcome |
| Evidence | Source/kind/citation/occurred/observed times | Provenance authority |
| AI result | `null` in current pitch | No AI integration |

## Onboarding data

The backend README documents five fixture files under `fixtures/onboarding`: `services.json`, `dependencies.csv`, `routes.json`, `historical_incidents.md`, and `operations_sop.txt`. Structured parsing stores documented relationships with source/checksum provenance. Unstructured originals remain uploaded/pending when AI extraction is unavailable. `DOCUMENTED` is not `VERIFIED`.

The pitch context is expected to contain seven entities, ten documented relationships, version five and zero verified claims after the five-source sequence. Fetch these counts; do not hardcode them in the frontend.

## Frontend mapping rules

- Keep `transfer_id`, `case_id`, `investigation_id`, `incident_id`, `evidence_id`, `source_id`, `job_id` and `run_id` separate.
- Display occurred and observed timestamps distinctly.
- Do not link Birch/G3 to Elm/G2 without an explicit permitted relationship.
- Do not turn route degradation into customer debit/credit truth.
- Do not show private recipient-credit truth, simulator policy, hidden fixture fields or private AI context.
- Legacy fixture transactions are not backend records.

## Known consistency issues

The older customer fixture contains conventional recipient names/accounts and scenario variants not accepted by the backend. Its date strings are presentation values, not server timestamps. Staff employee/module data is also a UI fixture, not institutional membership truth.

## Environment

Replay/seed are private CLI operations on a fresh disposable database. The frontend must never call reset/seed/reveal routes or simulate the second act with React state. A live demo should show backend-created records across customer and staff views.

