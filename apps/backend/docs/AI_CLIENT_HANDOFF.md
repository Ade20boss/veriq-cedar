# Veriq AI bridge — backend handoff (v1.0)

**Status:** Transport adapter + no-network contract/boundary tests, NOT wired into the worker. No new bank endpoint, A3 incident route or database migration.

This patch is deliberately **isolated for Daniel's review**. The backend now assembles case bundles with `EVIDENCE_READY_AI_UNAVAILABLE`; only a later reviewed worker change should invoke the AI service *outside* DB transactions, fence on case revision, and persist reviewed advisory results.

## Approved routes

- `POST /internal/ai/extract-knowledge`
- `POST /internal/ai/analyze-case`

The `VeriqAIClient` sends `X-Internal-Service-Key`, rejects redirect following (avoid leaking the secret), applies a bounded timeout and response size, and rechecks source IDs/quotes, case IDs, financial outcome, and eligible evidence-ID membership. It maps provider errors to sanitized codes. The service's model-text safety guardrails remain separate. This adapter does not perform bank authorization.

## Development wiring (reviewed backend code only)

```python
from veriq_cedar.veriq.ai_client.client import VeriqAIClient, build_case_request

# On the server, obtain these from backend-only secret config (never frontend).
client = VeriqAIClient(base_url="http://127.0.0.1:8001", internal_key="backend-private-key")

# After staff/tenant permission checks, a fenced case snapshot and evidence
# authorization, and OUTSIDE any database transaction:
request = build_case_request(authorized_bank_id, authorized_case_bundle)
result = client.analyze_case(request)
# Treat result as unapproved advisory material. Do not auto-publish the draft.
```

`known_relationships` and `historical_incidents` are empty in the case-bundle projection because the existing bundle does not contain approved v1.0 typed records. This client does not fabricate case IDs for operational G2 incidents. A separate A3 contract review is still required.

## Local verification

From `apps/backend/` on Daniel's prepared environment:

```bash
uv run --locked pytest -q tests/test_ai_client.py
uv run --locked ruff check src/veriq_cedar/veriq/ai_client tests/test_ai_client.py
uv run --locked ruff format --check src/veriq_cedar/veriq/ai_client tests/test_ai_client.py
```

Then run the complete backend suite. Tests inject a fake transport; they make **no Groq calls** and do not need PostgreSQL.

## Required worker integration review

1. Read a bank-scoped, permitted immutable case snapshot with version/financial outcome; never send simulator-private state.
2. Call AI outside an open SQL transaction, with bounded timeout. AI errors must leave the original case and evidence intact.
3. When response returns, lock and recheck current case revision/evidence and financial outcome; discard stale responses.
4. Persist unapproved advisory observations separately; only authorized bank staff can review/approve communication. Do not auto-send customer_safe_update_draft.
5. Do not link G0 incident analysis to v1.0 analyze-case without a genuine case. Proposed A3 remains unapproved.
