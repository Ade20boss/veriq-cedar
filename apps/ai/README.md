# Veriq internal AI — A0/A1 + initial A2 (v1.0 wire contract)

This is **Habeeb's standalone Python service** to be placed at `apps/ai/` inside the shared Veriq/Cedar monorepo. Daniel's FastAPI backend runs independently; the Next.js frontend **never calls this private AI service directly**.

## What is implemented

- `POST /internal/ai/extract-knowledge` — v1.0 typed request/response, model-driven candidate claims, exact source quotation and chunk-ID checks, unresolved mentions. Does **not** write accepted institutional knowledge.
- `POST /internal/ai/analyze-case` — v1.0 typed request/response, observations/hypotheses with eligible evidence references, strict preservation of caller-provided `financial_outcome`.
- `GET /health` — runtime mode and process health, **not** a model availability guarantee.
- `X-Internal-Service-Key` service authentication, controlled error envelope, configurable provider (`mock` or `openai_compatible`).
- Offline fixture-mode sample outputs and 37 tests. **A3 incident endpoint is NOT introduced** while its v1.1 contract is awaiting review.

## Windows / PyCharm quick start

From the directory containing this README (`apps/ai`):

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Edit `apps/ai/.env` before starting. Replace `INTERNAL_SERVICE_KEY` with a **long, random, private** secret shared only with Daniel's backend. Keep `LLM_PROVIDER=mock` for fully offline testing. No Groq API key is needed for mock mode.

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

Open `http://127.0.0.1:8001/docs` and expand either internal endpoint. Click **Try it out**, paste the relevant JSON from `fixtures/` into **Request body**, supply your private `X-Internal-Service-Key` header, then click **Execute**. Alternatively use the script below.

**Use fictional/synthetic data only.** `.env` is excluded from Git. Never upload your real key, bank customer records or hidden simulator truth to an AI provider.

## Test and repeatable offline examples

```powershell
python -m pytest -q
python scripts/smoke_mock.py
```

The script invokes the app through FastAPI's test client (no live server needed) and writes two actual **mock-provider** JSON responses to `docs/samples/`. Mock extraction responses include `MOCK_PROVIDER` under `warnings`; both endpoints expose the non-breaking response header `X-Veriq-AI-Mode: mock`. Case v1.0 lacks a warnings field, so inspect that header and `/health` for the provider mode.

Mock response is **not** proof an LLM reasoned correctly. It only proves transport, contracts, workflow and core validation; the fixture-specific mock is intentionally limited. Real model testing and quality metrics remain outstanding.

## Configure a real provider (when your account has access)

Update `apps/ai/.env`:

```dotenv
LLM_PROVIDER=openai_compatible
LLM_API_KEY=put-your-real-private-key-here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=use-an-id-from-your-provider-account
LLM_TIMEOUT_SECONDS=30
LLM_JSON_MODE=true
```

Model IDs are account/provider-specific; don't assume an example name is accessible. Providers using the compatible `/chat/completions` endpoint may work with changes to the base URL and model. Disable `LLM_JSON_MODE` when necessary for a model not supporting JSON response mode. Each call asks for JSON and Pydantic validates its response. Provider failures return an explicit 502/503 `{ "error": { "code": "...", "message": "..." } }`; **no silent successful fallback**. Daniel must keep complaint persistence and investigation evidence independent of AI availability.

## Input/output schema authority

The shared repository's accepted v1.0 canonical contract lives in `../../contracts/openapi.yaml`. Do not replace it with the standalone starter copy. `app/schemas.py` matches its two AI operations exactly and forbids unknown request/response fields. Test `tests/test_contract.py` verifies top-level fields against the YAML.

**Extract input:** `{bank_id, source_id, source_kind, chunks:[{chunk_id,text}]}`.
**Extract output:** `{source_id, claims, unresolved_mentions, warnings}`.
Each claim: `{claim_id, subject:{type,external_id}, predicate, object, source_locator, quoted_evidence, classification, needs_review}`.

**Case input:** `{case_id,bank_id,financial_outcome,question,evidence,known_relationships,historical_incidents}`.
**Case output:** `{case_id,financial_outcome,observations,hypotheses,unknowns,recommended_checks,customer_safe_update_draft}`.

`source_locator` is currently required to be the exact `chunk_id` used in the same request, and every `quoted_evidence` must be an exact substring of that chunk. This is an implementation convention requiring Daniel's acceptance. Unknown aliases belong in `unresolved_mentions[]`, not fabricated subject IDs. Model output is candidate knowledge only; Daniel owns deduplication, normalization, validation and persistence.

`verified_for_purpose` is treated as an eligibility flag: only eligible input evidence IDs may appear in AI findings; the backend additionally enforces bank/customer permission checks and final payment status. `UNKNOWN` cannot be upgraded by AI.

## Directory structure

```text
apps/ai/
  .env.example
  requirements.txt
  requirements-dev.txt
  README.md
  app/
    main.py            # FastAPI endpoints and service-key auth
    schemas.py         # Exact v1.0 wire DTOs
    config.py          # environment variables
    providers.py       # scripted mock / compatible live LLM
    prompts.py         # task-specific prompts
    service.py         # orchestrates response validation
    guardrails.py      # quote, ID, bank scope and UNKNOWN checks
    errors.py          # service error codes
  fixtures/             # fictional Cedar sources and case evidence
  tests/                # contract, extraction, case, provider regression tests
  scripts/smoke_mock.py
  docs/AI_HANDOFF.md
  docs/A3_INCIDENT_DESIGN_NOT_ENDPOINT.md
  docs/samples/
contracts/
  openapi.yaml               # Existing shared contract; not part of this overlay
  demo.json                  # Existing shared synthetic fixture; not part of this overlay
```

## What this service does not do

No banking database access, no SQL writes, no source-upload parsing, no direct payment status checks, no anomaly detection/triggering, no evidence retrieval from Cedar and no browser-facing API. Those responsibilities belong to Daniel's backend. No incident-analysis route until the **proposed** v1.1 contract is approved. No vector DB or OCR in this baseline.

For integration boundaries, gaps and test evidence see `docs/AI_HANDOFF.md`.

## GitHub integration for the shared repository

This app is a repo-ready addition for `Ade20boss/veriq-cedar` on the AI owner branch `feat/ai-foundation`. Extract the integration ZIP at the root of an up-to-date repository checkout; only `apps/ai/` is included. Preserve existing files under `apps/backend/`, `contracts/`, `docs/`, and `fixtures/`. The existing `apps/ai/README.md` placeholder will be replaced by this implementation README.

The AI owner account is `Hbboss226` (canonical GitHub casing may be `HBboss226`), while `Barry1003` is identified in repo onboarding as the frontend owner. Have the correct collaborator accept the pending repository invitation before pushing.

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/ai-foundation   # use existing branch if already created
# Extract integration ZIP in this repository root first
cd apps/ai
python -m pytest -q
cd ../..
git add apps/ai
git diff --cached --stat
git commit -m "feat(ai): add v1 extraction and case reasoning foundation"
git push -u origin feat/ai-foundation
# Open a PR into main; do not merge without team review
```

Do not stage local `.env`, virtual environments or provider credentials.

## Financial truth and customer communication safety (A2 review hardening)

- The v1.0 `financial_outcome` is copied **exactly** from the caller. The AI service cannot establish credit, failure, refund or reversal.
- An `UNKNOWN` outcome invokes conservative, normalized assertion checks across observations, hypotheses, alternatives, missing-information descriptions, recommendations and the draft. These lexical checks intentionally reject suspicious assertions, but **cannot prove the semantics of every possible sentence**. Schema validation, eligible evidence IDs, backend authoritative evidence checks and human review are still required.
- **No model-generated customer wording is forwarded as a bank-approved communication.** The `customer_safe_update_draft` returned by the service is an outcome-neutral deterministic template, even when the model proposes different wording. It is an **unapproved draft only** and must never be automatically published. Daniel's banking backend must independently validate and authorize any customer-facing message using Cedar's latest authoritative state and its bank-controlled approval workflow.
- The AI service contains **no publish/send API** and cannot call Cedar's notification or banking APIs. Client/frontend must not call internal AI routes directly.
- Model recommendations that appear to instruct financial actions (including resends, reversals, refunds and account credits) are rejected rather than executed. Approved **verification checks** remain possible. These checks provide defense-in-depth, not a production safety certification.
- Regression tests include outcome paraphrases, Unicode text evasion, assertions hidden inside alternatives/unknowns/recommendations, malicious customer drafts and improper payment-action recommendations.
