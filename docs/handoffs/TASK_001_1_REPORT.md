# Veriq Cedar Task 001.1 technical review report

15 October 2026 · Architecture and proposed contract reconciliation only.

The repository has been preserved and the proactive correction is reflected throughout the current design. Veriq automatically investigates validated operational anomalies before complaints or staff action. Complaint intake independently triggers targeted work and evidence-backed correlation. Cedar staff receive status/results and perform human review, verification, assignment and escalation. Financial truth remains Cedar's responsibility and requires authoritative evidence; AI remains advisory.

The customer frontend design is retained. Cedar Staff Operations is redesigned from workflow requirements; the old portal is not the design specification. Veriq is an independent product domain/workbench. The supplied Cedar Operations document is a requirements proposal, not authorization to implement all its features. No application functionality, frontend screen or migration was scaffolded or implemented.

## 1 Repository recovery outcome

The original fallback checkout remains at:

`/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`

Requested `/home/kernelghost/Projects/veriq-cedar` remains absent. Inspection shows `/home` mounted read-only in this execution namespace, while `/home/kernelghost/Documents/Codex` has a separate writable mount. This explains why earlier permission grants did not enable creating ~/Projects. This evidence concerns the execution namespace; whether the ordinary desktop terminal sees a writable host mount remains unverified. Repeating the known failed write or asking again for the same permission would not resolve the mount.

No destination was overwritten, no copy/transfer was claimed, and the fallback was not deleted. All 18 original Git metadata files match the Task 001 archive; the existing main branch is unborn, with no remote. Safe documentation work continued in place. The requested-path requirement remains outstanding and needs a writable normal terminal or remounted workspace.

Before any future transfer, refuse an existing destination; copy the entire checkout including .git; compare relative file lists and SHA-256 for every file, including Git metadata; inspect Git branch/status/remote; then update CURRENT_STATE and designate the new checkout. Preserve the fallback until that verification succeeds. No post-copy verification can be reported before a copy actually occurs.

### Optional transfer in a writable normal terminal

The following recovery command is supplied for the owner and was NOT run here. It refuses an existing destination and verifies every copied file including Git metadata. If the host terminal also reports read-only filesystem, stop and resolve that mount rather than retrying or overwriting another checkout.

```bash
python3 - <<'RECOVER'
from pathlib import Path
import hashlib, shutil, subprocess
source = Path('/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar')
destination = Path.home() / 'Projects' / 'veriq-cedar'
if destination.exists() or destination.is_symlink():
    raise SystemExit('Destination exists; inspect it, do not overwrite.')
assert (source / '.git' / 'HEAD').is_file()
def manifest(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}
before = manifest(source)
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copytree(source, destination, symlinks=True)
assert manifest(source) == before == manifest(destination)
for args in [('status', '--short', '--branch'), ('remote', '-v')]:
    old = subprocess.check_output(['git', '-C', str(source), *args])
    new = subprocess.check_output(['git', '-C', str(destination), *args])
    assert old == new
print('Verified copy:', destination)
print('Keep the fallback; update CURRENT_STATE before adopting the copy.')
RECOVER
```

## 2 Exact repository structure

Current physical directories are unchanged except contracts/proposals:

```text
veriq-cedar/
  .git/
  apps/backend/       # README only
  apps/ai/            # README only
  apps/web/           # legacy reservation, README only
  contracts/proposals/
  docs/specs/
  docs/decisions/
  docs/handoffs/
  fixtures/           # README only
  infra/              # README only
  scripts/            # README only
  .gitignore
  AGENTS.md
  README.md
```

TASK_001_1_FILE_INVENTORY.txt enumerates every actual project file; REPOSITORY_ARCHITECTURE.md documents this tree and the proposed future tree. Proposed apps/cedar-customer and apps/staff, packages/api-types and neutral integration-contract packages are not created or imported. Apps/backend and apps/ai still contain no source or dependency manifests.

## 3 Proposed Cedar-to-Veriq adapters

BANK_ADAPTER_CONTRACT.md defines seven neutral ports:

| Port | Allowed capability |
|---|---|
| KnowledgeSourcePort | authorized immutable source/chunk retrieval and provenance |
| OperationalEventPort | normalized replayable events/cursors and durable acknowledgement |
| TransactionEvidencePort | permitted sender-side transaction evidence and authoritative known outcome |
| RouteMetricsPort | source-backed route/service window/baseline metrics |
| StatusVerificationPort | policy-authorized asynchronous banking query and resulting evidence |
| BankCasePort | bank case facts and constrained correlation candidates |
| InvestigationResultPort | idempotent versioned permitted progress/results into Cedar's inbox |

Core Veriq code depends only on these ports/normalized DTOs. Cedar implements them at composition time. No Cedar ORM/repository import, direct bank SQL, private simulator dependency or generic privileged session is permitted in core investigation logic. Tests should enforce import boundaries, fake-adapter interchangeability, real PostgreSQL grants, serialization allowlists, bank/purpose/time scoping and crash/retry behavior. Shared Python process is logical modularity with constraints, not production security isolation.

## 4 Frontend boundaries and scope

Retain Usaamah's current customer Next.js design and integrate baseline authoritative APIs in a later task. Replace frontend debit arithmetic, outcome/scenario selection and local authoritative case records during integration. Preserve other screen designs without claiming secondary/unwired features work.

Rebuild staff operations around basic customer lookup/profile, transaction inquiry, case queues/detail/intake/interactions, assignment/escalation and approved customer communication. Sarah sees the same bank case as Ada, with automatically linked investigation information; her handoff to Michael does not start the investigation. Michael opens a separately authorized Veriq workbench to inspect automatic work and request verification/review. Cedar banking workflows remain usable when Veriq/AI is unavailable.

Preferred two deployments: customer app and staff app, with separate Cedar operations/Veriq clients, domain state, navigation and backend permissions. A shared staff deployment/cookie does not imply shared authorization. Proposed ports: customer 3000, staff 3002, backend 8000, AI 8001, subject to source/setup review. No current Next.js repository/branch has been supplied; historical React/Vite inventories are user-provided reports, not verified current builds. No source import/restructure occurred; migration requires supplied repositories and Usaamah's explicit approval.

## 5 Proposed versioned API amendments

Accepted contracts/openapi.yaml and contracts/demo.json are byte-identical to Task 001. Frozen source documents are preserved. The recommended minimum draft is:

`contracts/proposals/openapi-v1.1.proposed.yaml` — version 1.1.0-proposed.1, 49 paths and 54 operations: all 28 baseline operations plus 26 proposed P0 additions. Its 93 shared schemas include neutral-port and secondary DTO definitions; an unused schema does not authorize an endpoint.

| Minimum addition group | Operations |
|---|---:|
| Demo session lifecycle | 3 |
| Staff customer lookup/profile | 2 |
| Staff transaction search/inquiry | 2 |
| Case queue/intake/detail/activity/interactions/assignment/escalation | 7 |
| Staff communication list/draft/publish | 3 |
| Cedar investigation-result inbox list | 1 |
| Veriq automatic investigation list/detail/review + verification create/list | 5 |
| Entity labels and persisted assertion list | 2 |
| Case-free incident AI analysis | 1 |
| Total proposed P0 additions | 26 |

The separate secondary preview adds 13 optional operations, for 60 paths/67 total operations. They cover additional customer history/case/timeline/structured communication reads, formal staff case resolution, result detail/connector health, chunk/job detail, new general manual-run route and optional private HTTP event/result transport. PRIORITY_MATRIX.json identifies exact routes; every operation is tagged BASELINE, P0_PROPOSED or SECONDARY_PROPOSED. No secondary operation is included in the minimum candidate.

P0 uses typed in-process bank ports with durable domain inbox/outbox, polls baseline source lists and investigation status, and reads detailed permitted result-list items. Existing manual case-investigate remains optional reinvestigation. Structured bank communication publication atomically mirrors approved text into existing Complaint.customer_safe_updates, so the retained customer view does not require a new communications endpoint.

All 27 original component schemas and baseline request/success shapes are retained. Explicit proposed compatibility changes are standard Error bodies, 404/409/503 semantics and X-CSRF-Token on legacy browser mutations. Those require client migration/review; success-schema preservation alone does not make the draft fully backward-compatible. Existing security cookie/key names remain. No accepted contract was silently amended.

IncidentInvestigation and CaseInvestigation are distinct closed schemas. An incident may exist with zero bank cases and has no financial_outcome property. Case investigation uses a real bank case ID and copies current eligible Cedar outcome. New AIIncidentInput/Output plus analyze-incident need Habeeb's review; four old case/extraction AI roots remain unchanged. Incident evidence jobs proceed automatically even if AI is unavailable. If the team elects an evidence-only first incident demo, this one proposed AI operation can be deferred explicitly rather than inventing a complaint ID.

Knowledge gaps receive precise proposals: /entities resolves edge labels; /assertions returns persisted assertion_id/status without changing old AIClaim; source/chunk locator/checksum and backend run provenance are explicit; detailed source-job/chunk HTTP reads are secondary. Customer extra history/notification/PIN features are not required to invent a new banking capability for the first demo.

## 6 Data ownership, security and proactive jobs

Cedar owns accounts, integer-kobo balanced append-only ledger, transfer/outcome evidence, customer/staff identity, bank case, interactions, assignments, escalations and published customer messages. Veriq owns source-backed context, incidents, investigation/run/job history, hypotheses and review decisions. Bank case IDs, incident IDs, investigation IDs, runs/jobs/verification/delivery IDs are separate. Cedar's inbox is a permitted Veriq projection, not shared ownership of investigation internals.

Operational event ingestion has no staff-session dependency. A validated threshold crossing atomically creates/reuses one SUSPECTED incident and its INCIDENT investigation, records rule/window/evidence trigger, queues durable work and emits progress delivery. Complaint persistence/outbox automatically assembles case evidence, starts distinct BANK_CASE work, and associates supporting route/time/signature evidence. New material evidence coalesces new runs; no LLM call per telemetry event. No bank operator Detect Incident action is required.

Durable jobs use PostgreSQL leases/fencing, idempotent receipts/side effects, bounded retries/dead-letter status and automatic restart recovery. Worker/provider calls occur outside financial database transactions. Jobs and human review have different lifecycles. Delayed AI/result versions cannot overwrite newer evidence. Automatic initiation does not imply automatic approval, unsafe customer publication or financial action.

Proposed grants restrict simulator private data from Cedar-visible export and all Veriq/AI queries. Even allowlisted bank views are accessed only inside the adapter; core reads its own persistence. Bank/role/purpose/tenant/time filtering and export allowlists are tested independently. AI has no DB credentials. Route findings cannot confirm recipient credit/failure. Status verification requests are authorized queries, not outcome setters; S2 remains UNKNOWN until the allowed banking status response. All banking invariants and T01–T16 remain.

## 7 Planning documents changed

Updated root README/AGENTS, backend/AI/web ownership notes, onboarding, backend architecture, contract review and the explicit proposed engineering amendment. Added repository/frontend boundaries, neutral adapter contract, autonomous job processing, staff/UI guide, minimum-demo scope, revised demo sequence and ADR-002. Added minimal/secondary OpenAPI drafts, priority matrix, 17 labelled synthetic review examples, preserved new request/feedback Markdown and owner clarification records. Updated CURRENT_STATE; historical Task 001 report/inventory/log/verification and original source manifests are unchanged.

The changed/new file hash manifest is TASK_001_1_CHANGES.json. Markdown is canonical for engineering documents. Neither this task nor the attached staff proposal approves frontend/backend feature implementation, model/provider choice or source migration.

## 8 Decisions requiring technical/affected-owner review

- Approve/revise the 26-addition P0 candidate or explicitly narrow it; secondary scope must not become default implementation work.
- Confirm role/department capabilities, session TTL/credentials, Origin/CSRF/cookie policy and two-frontend proxy setup.
- Confirm source/chunk identity and exact-quote convention; adapter capability/export policy and database grants.
- Confirm complaint/incident correlation time windows, late-event/watermark policy, incident active-signature lifecycle and evidence-revision coalescing.
- Review proposed lease/heartbeat/AI timeout/retry defaults and dead-letter recovery policy.
- Habeeb reviews case-free incident AI endpoint/schema and evaluations; preserve legacy case outcome equality and citation checks.
- Agree investigation review versus Cedar communication approval/publication rights; no financial authority through reviews.
- Obtain actual frontend repositories/branches and explicit migration approval; verify current customer implementation instead of assuming prototype equivalence.
- Resolve requested-path recovery in a writable normal-terminal namespace and verify copy before adopting it.

No peer acknowledgement or additional signoff is invented. C01–C16 in CONTRACT_REVIEW maps proposals to owners/gates.

## 9 Recommended next backend implementation task

After revised contract review and an explicit new task, implement one G0 slice: bank-neutral fake adapter → normalized qualifying telemetry → automatic suspected incident/INCIDENT investigation/durable job → permitted Cedar status inbox. Test no customer complaint/staff session, duplicate delivery, restart after commit, AI unavailable and private-truth denial. This proves the central correction before expanding banking/UI. Then progress to Cedar balanced/idempotent S0/S2 transfers, durable complaints/correlation and the continuous customer→staff→workbench journey. This is a recommendation, not authorization to start.

The revised demo sequence shows onboarding, autonomous incident investigation before Ada's transfer/complaint, automatic case linking, Sarah receiving and escalating existing work, Michael reviewing/verifying, then authorized status confirmation and approved customer update in the same Cedar context. No reset between acts or frontend-only state transition.

## 10 Commands and validation results

TASK_001_1_COMMAND_LOG.md records commands/results and mount output. Task-local work/task0011 scripts generated documentation/schema proposals and validated them; no scripts were installed into apps. One draft generation attempt failed because the proposal directory was missing; corrected before successful generation. No dependency install, remote/commit/push, service, deployment, source import or teammate message occurred.

Validation passed: accepted/historical SHA-256 preservation; 17 archived source records; original 27 schemas and 28 success/request shapes; local reference resolution and path parameter/security/error/priority consistency; P0/secondary separation; apps remain README-only; original 18 Git metadata files preserved. All 93 draft schema models compiled transiently in preinstalled Pydantic. Seventeen examples validated and seven invalid examples were rejected, including float/bool/zero kobo, incident financial_outcome, missing real case, client-granted role and mismatched event payload. Paired AI fixture IDs/outcomes/quotes were checked statically.

These checks do not prove application behavior. No TypeScript generator/compiler, standards-complete OpenAPI validator, business tests T01–T16/P01–P10, PostgreSQL integration or live demo rehearsal ran. No implementation exists. Draft timing/permission/cross-field rules still need runtime acceptance tests after approval. No requested-path transfer was executed.

Stop here for technical review. The unresolved filesystem location is reported explicitly; the existing fallback and a verified review archive preserve the work.
