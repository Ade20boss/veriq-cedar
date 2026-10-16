# Security and tenancy

## Observed controls

- Customer and investigator APIs use server-provisioned `cedar_demo_session` cookies with separate opaque tokens/paths in the local pitch arrangement.
- Frontend API adapters use same-origin relative requests and `credentials: "same-origin"`.
- POST origin checks are active in FastAPI.
- Backend errors are sanitized and request IDs are available.
- Cedar owns financial truth; Veriq receives only a permitted bank-neutral projection.
- AI results are not live in the current pitch path.
- Synthetic identifiers/data are used; no real banking credentials or payment networks are involved.

## Required server enforcement

The backend must enforce authentication, institution membership, bank scope, ownership, permissions, session expiry, origin/CSRF policy, rate limits and audit logging. Local employee objects/access arrays are not an authorization boundary.

Tenant IDs must be derived from the session and checked on every query. A browser must not change institution, bank, customer, transfer owner or reviewer identity through request bodies. Cross-tenant resources should return a safe not-found/forbidden response according to the agreed policy.

## Proposed permission matrix

| Capability | Owner | Admin | Analyst | Investigator | Reviewer | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| Manage institution/members | ✓ | ✓ | — | — | — | — |
| Manage connectors | ✓ | ✓ | — | — | — | — |
| Read monitoring | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/assign investigation | ✓ | ✓ | — | ✓ | — | — |
| Upload evidence/knowledge | ✓ | ✓ | ✓ | ✓ | — | — |
| Review/approve findings | — | — | — | — | ✓ | — |
| Read audit history | ✓ | ✓ | — | — | ✓ | ✓ |
| Export approved report | ✓ | ✓ | — | — | ✓ | ✓ |
| Execute financial write | — | — | — | — | — | — |

This matrix is **PROPOSED** and requires identity-owner approval.

## Secret and evidence boundaries

Secrets belong in server-side connector services or secret managers. They must not appear in `NEXT_PUBLIC_*`, browser bundles, localStorage, committed env files, logs, event payloads or errors. Browser code must not access PostgreSQL, Redis, internal AI endpoints, private recipient truth or simulator policy.

Evidence should carry source, locator, timestamps, extraction/run provenance and trust status. An observation is not automatically a cause. Mask customer identifiers unless purpose and permission require more detail. Customer-safe updates must be explicitly approved/published.

## Review and audit

The person proposing a finding should not approve it. Every membership, connector, evidence, investigation, review, export and lifecycle decision should record actor, institution, resource, action, version, reason and timestamp. Raw sources/events remain immutable; corrections append observations.

## Synthetic/production distinction

Synthetic/demo status must be visible. Demo session minting is a private operator command, not production login. Production requires HTTPS, Secure/HttpOnly/SameSite cookies, reviewed session issuance/revocation, database least privilege, tenant isolation/RLS review and supervised workers.

