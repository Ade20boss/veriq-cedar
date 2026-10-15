"""Run the current real application locally with the labelled deterministic mock provider.

Works without launching Uvicorn or having a model API key. Never use real bank data.
"""
import json
import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
# Permit `python scripts/smoke_mock.py` from apps/ai without PYTHONPATH setup.
sys.path.insert(0, str(ROOT))
from app.main import app
os.environ["LLM_PROVIDER"] = "mock"
os.environ["INTERNAL_SERVICE_KEY"] = "local-script-only-secret-choose-a-random-value-for-real-use"
client = TestClient(app)
headers = {"X-Internal-Service-Key": os.environ["INTERNAL_SERVICE_KEY"]}

for fixture_name, endpoint, output_name in [
    ("extract_incident.json", "/internal/ai/extract-knowledge", "extract_mock_response.json"),
    ("extract_dependency.json", "/internal/ai/extract-knowledge", "dependency_mock_response.json"),
    ("case_unknown.json", "/internal/ai/analyze-case", "case_mock_response.json"),
]:
    payload = json.loads((ROOT / "fixtures" / fixture_name).read_text(encoding="utf8"))
    response = client.post(endpoint, json=payload, headers=headers)
    assert response.status_code == 200, f"{endpoint} failed: {response.status_code}: {response.text}"
    assert response.headers["x-veriq-ai-mode"] == "mock"
    result_path = ROOT / "docs" / "samples" / output_name
    result_path.write_text(json.dumps(response.json(), indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"MOCK, not live LLM: {fixture_name} => HTTP {response.status_code}, saved {result_path.relative_to(ROOT)}")
