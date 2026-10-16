# Veriq frontend integration documentation

This is an evidence-based audit of the frontend applications and a coordination contract for the separate backend team. It distinguishes:

- **OBSERVED** — verified in source code or the accepted backend contract.
- **PROPOSED** — recommended but not implemented.
- **NEEDS CONFIRMATION** — requires an owner decision or backend check.

## Read first

1. [Frontend implementation](architecture/FRONTEND_IMPLEMENTATION.md)
2. [Gap analysis and roadmap](integration/GAP_ANALYSIS_AND_ROADMAP.md)
3. [Backend API contract](integration/BACKEND_API_CONTRACT.md)
4. [Security and tenancy](architecture/SECURITY_AND_TENANCY.md)

## Reference documents

- [Shared data models](integration/SHARED_DATA_MODELS.md)
- [Workflows and state machines](architecture/WORKFLOWS_AND_STATE_MACHINES.md)
- [Integration matrix](integration/INTEGRATION_MATRIX.md)
- [Realtime and async events](integration/REALTIME_AND_ASYNC_EVENTS.md)
- [Demonstration data contract](integration/DEMO_DATA_CONTRACT.md)
- [Live access report](handoffs/FRONTEND_BACKEND_ACCESS_REPORT.md)

## Scope and current status

The customer app is under `apps/web/cedarBank`; the Operations/Veriq app is under `apps/web/Cedar Bank Operations Design`. Both are Next.js 16/React 19 TypeScript applications with client-side feature navigation.

The accepted v1.0 backend contract remains `contracts/openapi.yaml`. Implemented FastAPI behavior is documented in `apps/backend/README.md` and `docs/handoffs/PITCH_BACKEND_STATUS.md`. Proposed endpoints in these documents are not accepted contract amendments.

This documentation task does not change application behavior, contracts, backend code, fixtures, or database state.

