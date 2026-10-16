# Optional G2 CASE_ANALYSIS → AI integration

The AI worker is opt-in and has no effect on existing deterministic replay with VERIQ_AI_ENABLED=false. No contract changes, schema migrations, case-free A3 route or customer-message sending.

The worker assembles bank-authorized evidence inside a short transaction, closes it, invokes the existing AI client outside database transactions, then reacquires and fences the lease, case revision and evidence snapshot. On success the v1.0 status is FINDINGS_READY (never REVIEWED); ai_result remains unapproved. Rate-limit or temporary failures use bounded retries; permanent errors dead-letter the job without deleting its evidence.

Development configuration in apps/backend/.env (separate from private apps/ai/.env):

VERIQ_AI_ENABLED=true
VERIQ_AI_BASE_URL=http://127.0.0.1:8001
VERIQ_AI_INTERNAL_KEY=<must-match-the-private-ai-service-key>
VERIQ_AI_TIMEOUT_SECONDS=12

Keep credentials out of Git and run only with fictional synthetic data. Start apps/ai Uvicorn separately, then `uv run --locked python -m veriq_cedar.composition.g2 worker` from apps/backend. The authorized operator should first verify PostgreSQL migrations, bank data permissions and the private AI service independently. Production-like tests with actual PostgreSQL and concurrent worker leases are still REQUIRED before calling this a verified end-to-end integration.

Tests: `uv run --locked pytest -q tests/test_case_ai_worker.py tests/test_ai_client.py`, then `uv run --locked pytest -m "not postgres"`, then `uv run --locked ruff check src tests/test_case_ai_worker.py`.
