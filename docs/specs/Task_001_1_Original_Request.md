# VERIQ + CEDAR — CODEX TASK 001.1
## Repository Recovery, Team Alignment and Contract Reconciliation

You have completed Task 001 and produced the initial repository skeleton and architecture documents.

The technical lead has reviewed your report, together with feedback from the frontend developer, Usaamah.

The initial architectural direction is accepted, subject to the amendments below.

**Do not restart the project. Preserve the existing work.**

## 1. Recover the working repository

Your previous report stated that the requested location:

`~/Projects/veriq-cedar`

could not be created because of a read-only filesystem error.

The prepared repository exists at:

`/home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar`

First, inspect the source directory and the requested destination.

Determine whether the failure resulted from the execution sandbox's filesystem permissions or a genuinely read-only host filesystem.

If necessary, request appropriate workspace access or ask the project owner to move the repository using a normal terminal.

Do not overwrite an existing destination.

Verify the copied repository, including its Git metadata, against the source before designating it as the working checkout.

Do not delete the fallback copy until the new checkout is confirmed valid.

If the move is blocked, report the exact cause and stop the affected operation. Continue only with safe documentation work in an accessible workspace.

## 2. Update the frontend architecture proposal

The frontend developer reports that existing source code is available for:

- Cedar's customer banking application.
- Cedar's bank staff operations portal.

Preserve these existing applications and their functionality.

The intended product has three user experiences:

A. Cedar customer banking.

B. Cedar staff operations.

C. Veriq institutional intelligence and investigation.

For the hackathon, the preferred deployment plan is:

- An independent Cedar customer Next.js application.
- An independent staff-facing Next.js application with clearly separated Cedar operations and Veriq workbench areas.

The Cedar staff area and Veriq workbench must not share business logic or bypass backend authorization merely because they appear in one frontend deployment.

Veriq's backend remains an independent product domain.

Do not restructure or import Usaamah's source code until he supplies the repositories and explicitly approves the migration.

Remove the assumption that one `apps/web` directory is the final frontend architecture.

Propose an updated repository layout that preserves the existing frontend work.

## 3. Establish an explicit Cedar-to-Veriq adapter boundary

This is mandatory.

Veriq must not depend directly on Cedar-specific SQLAlchemy models, repository classes or private database tables for its investigation logic.

Define proposed bank adapter interfaces for:

- Authorized institutional knowledge sources.
- Normalized operational events.
- Permitted transaction evidence.
- Service and route metrics.
- Authorized transaction-status verification.
- Bank complaint/case correlation.
- Returning permitted investigation results.

Cedar will implement these interfaces for the hackathon.

The Veriq core must consume normalized, source-backed evidence through the interfaces.

Keep private simulator ground truth inaccessible to Veriq and the AI service.

Specify how this boundary can be enforced and tested in a modular FastAPI application.

Clearly distinguish logical modularity from security isolation; do not claim that a shared Python process provides production-grade isolation.

## 4. Draft the missing Cedar staff operations contracts

Extend the proposed contract design to support a minimal bank-owned operations workflow:

- Staff authentication and role authorization.
- Customer lookup.
- Transaction inquiry.
- Complaint listing and filtering.
- Complaint details and activity history.
- Staff-created complaints.
- Staff assignment/escalation.
- Launching a linked Veriq investigation.
- Receiving permitted Veriq investigation results.
- Recording customer-safe communications.

Prioritize the Sarah-to-Michael investigation handoff.

Do not implement full workforce management or advanced supervisor operations yet.

Define stable bank case IDs and separate Veriq investigation IDs.

Do not silently edit the frozen original API specification.

Produce a proposed versioned contract amendment for technical review.

## 5. Resolve existing contract gaps

Review and propose precise resolutions for:

- Demo customer/staff authentication and sessions.
- Transaction-history listing.
- Customer-safe transaction timeline.
- Knowledge-entity labels and relationships.
- Source ingestion job tracking.
- Persisted assertion IDs and review status.
- Structured customer communication history.
- Evidence provenance and chunk locators.
- Investigation verification requests.
- Financial-outcome authority.
- HTTP error responses and status semantics.

Make sure proposed responses can be represented by Pydantic models and generated into TypeScript types for Usaamah.

Coordinate internal AI schemas with Habeeb's existing AI build specification.

## 6. Confirm engineering decisions

The following decisions are approved:

- Python/FastAPI backend.
- SQLAlchemy 2 and Alembic.
- PostgreSQL persistence.
- Separate FastAPI AI service.
- Shared Git monorepo.
- Cedar and Veriq as distinct business domains.
- Separate institutional knowledge from AI model state.
- Double-entry financial ledger with integer kobo.
- Transaction stage separate from final financial outcome.
- AI findings must not determine financial truth.
- Private simulator ground truth must not leak into Veriq.
- One continuous hackathon demonstration.

Maintain these invariants in AGENTS.md and the current architecture documentation.

## 7. Update developer coordination documents

Update the proposed:

- Repository architecture.
- Team onboarding instructions.
- Shared workstream ownership.
- Contract review.
- Current state/handoff report.
- FastAPI engineering amendment.

Markdown is the canonical engineering-document format.

Preserve original specifications and record amendments explicitly.

Account for development switching between Codex and Google Antigravity.

## 8. Reporting requirements

Produce a detailed technical review report containing:

1. Repository recovery outcome.
2. Exact directory structure.
3. Proposed Cedar-to-Veriq adapter interfaces.
4. Frontend application boundaries.
5. Proposed API contract changes.
6. Data ownership and security boundaries.
7. Changes made to existing planning documents.
8. Unresolved decisions requiring approval.
9. Recommended next backend implementation task.
10. Commands executed and validation results.

This task authorizes repository recovery, documentation changes and proposed contract amendments only.

**Do not scaffold the FastAPI applications or implement banking functionality yet.**

Stop when the report is complete and wait for review.