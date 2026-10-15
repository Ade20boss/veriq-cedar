# Repository and frontend boundaries

Task 001.1 review draft, 15 October 2026. Python/FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, separate AI FastAPI and the shared monorepo are confirmed. Proactive operation is an explicit owner requirement. Detailed interfaces remain proposals pending review. Markdown is canonical for engineering documents.

## Current checkout and recovery

Working checkout remains `/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`. It has its original `.git` metadata, an unborn main branch and no remote. It was not recreated or moved. The requested `/home/kernelghost/Projects/veriq-cedar` is absent.

`findmnt -T /home/kernelghost` reports `/home` mounted `ro`; `findmnt -T /home/kernelghost/Documents/Codex` reports a separate `rw` mount. This establishes a read-only mount in the execution environment, beyond ordinary file permissions. It does not prove that the host's ordinary desktop terminal sees the same mount namespace. Previous granted write permissions did not change this mount. No permission-bypass attempt or destination overwrite is appropriate. Continue safe documentation here; the owner can transfer in a normal terminal if writable.

For a future transfer, preserve the fallback, refuse any existing destination and copy the whole checkout including `.git`. Compare relative file inventories and SHA-256 of every file including Git metadata before designating a new working checkout. Recheck branch, status and remote. Update CURRENT_STATE with verification and actual path; do not delete this fallback until confirmation. Task 001.1 has not performed or verified a transfer.

## Current physical layout

```text
veriq-cedar/
  .git/                          # original empty Git repository, preserved
  .gitignore
  AGENTS.md
  README.md
  apps/
    backend/README.md
    ai/README.md
    web/README.md                # legacy reservation; no frontend source
  contracts/
    openapi.yaml                 # unchanged Task 001 baseline
    demo.json                    # unchanged frozen demo contract
    README.md
    proposals/
      openapi-v1.1.proposed.yaml  # minimum P0 candidate; not canonical
      openapi-v1.1.secondary.proposed.yaml # optional secondary preview
      PRIORITY_MATRIX.json
      examples-v1.1.proposed.json
      README.md
  docs/
    specs/                       # original source files, manifest, explicit amendments
    decisions/                   # stack ADR and Task 001.1 decision record
    handoffs/                    # both task reports, inventory and validation records
    BACKEND_ARCHITECTURE.md
    BANK_ADAPTER_CONTRACT.md
    EVENT_PROCESSING.md
    STAFF_AND_UI_CONTRACTS.md
    FRONTEND_ALIGNMENT.md
    MINIMUM_DEMO_SCOPE.md
    DEMO_SEQUENCE_v1.1_PROPOSED.md
    CONTRACT_REVIEW.md
    REPOSITORY_ARCHITECTURE.md
    TEAM_ONBOARDING.md
  fixtures/README.md
  infra/README.md
  scripts/README.md
```

The generated Task 001.1 file inventory lists every actual file, including source filenames omitted from this compact tree. Proposed runtime paths below are not created apps.

## Proposed target layout after source review

```text
apps/
  backend/                       # Daniel; Cedar + Veriq core + connector composition
  ai/                            # Habeeb; independent advisory service
  cedar-customer/                # retain Usaamah's current Next.js design/source
  staff/                         # new Next.js app, rebuilt Cedar operations UI
    src/cedar-operations/        # bank-owned cases, transactions, interactions
    src/veriq-workbench/         # Veriq context, incidents, investigations, reviews
    src/demo/                   # restricted operator controls
packages/
  bank-integration-contracts/    # proposed Python-neutral schema definitions/ports
  api-types/                     # generated TypeScript; separate API clients
```

The current apps/web reservation is not the final frontend design and is retained solely to preserve earlier work. No apps are moved, imported or scaffolded. Actual Next.js repository locations/branches are not supplied. Original React/Vite prototype inventories are user-provided reports, not verified current Next.js capabilities. Migration/import requires Usaamah's source and explicit approval.

There are three experiences and a preferred two-frontend deployment: independent Cedar customer app and a staff app containing distinct Cedar operations and Veriq workbench areas. Customer design is preserved; staff UI is redesigned from scratch. The old staff prototype informs employee workflows but does not dictate screens or architecture. Shared deployment permits shared presentation primitives only; it confers no permissions and does not merge domain business logic, stores, services or API ownership. A bank support session does not automatically authorize Veriq access.

Cedar operations works without Veriq/AI: account and transaction inquiry, complaints, assignments, interactions and customer communication persist in Cedar. Veriq unavailable is an explicit integration state rather than an empty queue or a blocked bank operation. Customer and staff use the same persisted Cedar case/transfer IDs; localStorage is not authoritative. Customer client-side debit, outcome selection and scenario controls must be replaced by authoritative backend responses in a later authorized integration task.
