# Real S2 request for Habeeb's mock/Groq evaluation

This is a synthetic bank-authorized v1.0 request exported unchanged from the backend's immutable `CaseAI.request` snapshot, after a fresh real PostgreSQL S2 complaint workflow. It is not an invented Task005-shaped fixture. The permitted snapshot was sent to the actual merged AI mock by the standalone worker, accepted by independent backend validation, persisted and served by the existing authenticated investigator GET. Backend/worker ownership stays with Daniel; Habeeb owns AI output quality and provider evaluation. PR#9 is not used.

- Payload: [s2-ai-request.v1.json](s2-ai-request.v1.json). This file is the request body itself, with no extra wire fields or wrapper.
- Provenance/digests: [s2-ai-request.provenance.json](s2-ai-request.provenance.json).
- Sanitized run evidence: [request-export-runtime.json](request-export-runtime.json).

Case `eb83cd1f-9929-443a-a0f3-75b5155035e8`, bank CED, route `ROUTE-CED-ELM-G2`, transfer `ae13da02-2a82-4106-a33a-2ca99378e521`. Thirteen records retain genuine generated IDs, timestamps, source citations/checksums and verification flags; five source-backed DOCUMENTED relationships and one permitted SUSPECTED G2 incident retain their original context. No G3/Birch route is matched. The v1.0 historical_incidents array here carries the persisted, eligible operational suspicion; it is not an extracted historical-document cause claim. `verified_for_purpose=true` describes each record's permitted evidentiary purpose: a recorded sender debit or documented relationship is not beneficiary-credit evidence or confirmed causality. The single CUSTOMER_REPORT is the verifier's literal synthetic input and remains `verified_for_purpose=false`.

Sanitization comes from the existing bank-authorized export allowlist and entirely fictional inputs. No evidence IDs, flags, relationships or incident context were redacted or rewritten. No credentials, cookies, database URLs, simulator truth, recipient credit ledger or final-status reveal are present. The canonical request digest equals the persisted snapshot digest; the separate file SHA256 also covers the shared JSON's exact bytes. The contract and independent backend DTO both validated it.

Actual merged mock response inspected: five documented-topology observations, sender debit, two timeout records and G2 telemetry (7 timeouts/25 attempts), plus a tentative route-condition hypothesis citing the actual timeout and same-route metric with alternatives. That is nine observations and one hypothesis, not confirmed cause or finality. Two unknowns include the explicit MOCK_PROVIDER label; one recommended check requests authorized status verification. Backend financial_outcome remained UNKNOWN and customer_safe_updates stayed empty. The live Groq provider was not invoked during export; those counts are not a required quality target for Groq.

## Get the payload

After fetching origin, read this file on `feat/integration-verification-a3` (PR#10); main retains the old assertions until review/merge. No PostgreSQL or Docker is needed to evaluate this already-exported request through Habeeb's standalone AI service. Do not substitute IDs or invent baseline/finality evidence to improve a result. Original disposable DB IDs need not exist in the evaluator's local database; the AI endpoint consumes the self-contained request, not a bank DB connection.

## Send the same body once per chosen provider

Start the existing AI service with a private INTERNAL_SERVICE_KEY. Use LLM_PROVIDER=mock first. For Groq, Habeeb should use his approved private openai_compatible configuration/key/model and quota. Keep all service/provider keys server-side; do not put them in the payload, report or NEXT_PUBLIC variables. Use a free loopback port (8002 below). No automatic provider retry or new evaluation implementation is added here.

From `apps/ai`, using its Python environment with HTTPX installed and the matching INTERNAL_SERVICE_KEY privately exported:

```python
import json
import os
from pathlib import Path
import httpx

payload = json.loads(Path("../../docs/handoffs/task007/s2-ai-request.v1.json").read_text())
with httpx.Client(base_url="http://127.0.0.1:8002", timeout=90, trust_env=False) as client:
    response = client.post(
        "/internal/ai/analyze-case",
        headers={"X-Internal-Service-Key": os.environ["INTERNAL_SERVICE_KEY"]},
        json=payload,
    )
    print("HTTP", response.status_code)
    if response.status_code == 200:
        result = response.json()
        print("mode", response.headers.get("X-Veriq-AI-Mode"))
        print("outcome", result["financial_outcome"])
        print("counts", {k: len(result[k]) for k in (
            "observations", "hypotheses", "unknowns", "recommended_checks"
        )})
```

The snippet sends the approved request only to the local service, prints no keys or raw error/provider bodies, and does not certify schema, citations or model quality. Habeeb should apply the AI service's existing validation/evaluation checks and review unsupported/final assertions. Its current evaluate_provider.py CLI accepts only bundled fixture names; this payload is intentionally kept in the backend handoff rather than modifying his fixture list or evaluator. Quality experiments never change Cedar financial truth or authorize customer publication.

To reproduce a new export, run the backend's existing fresh-disposable integration verifier with `--request-artifact /new/path/request.json` (ENVIRONMENT=test and migrated/granted private database environment required; see the operator runbook). It refuses to overwrite an existing artifact, forces actual mock mode and writes only the successful run's exact permitted snapshot. A new run naturally gets new IDs and a new digest; retain this artifact when comparing providers.
