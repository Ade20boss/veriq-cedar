# Provisional A3 operational incident analysis — NOT an approved HTTP contract

A proactively detected G2 anomaly must support **case-free** incident analysis.
Do not use `/internal/ai/analyze-case` by creating fake `case_id` or `financial_outcome` values.

The future approved input should include incident ID, bank scope, detection trigger,
metrics and baseline, service and route relationships, evidence records with time,
source citations, historical incidents, applicable procedures, and knowledge version.

The advisory output should include incident ID, evidence-backed observations,
competing hypotheses, unknowns, next permissible checks and reviewable summary.
This is a **design proposal only**. No `/internal/ai/analyze-incident` route was added.
Confirm with Daniel's proposed v1.1 OpenAPI before introducing wire models or route.

Use synthetic `CASE-001` only for case analysis, not incident analysis.
