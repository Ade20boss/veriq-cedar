# Team onboarding and GitHub workflow

Shared repository: https://github.com/Ade20boss/veriq-cedar. Task 002-GIT authorizes publishing the existing monorepo and setting up collaboration. See docs/handoffs/CURRENT_STATE.md for confirmed push, invitation and protection status; access is not implied by this guide.

The current working checkout is /home/kernelghost/Documents/Codex/2026-10-15/files-pasted-by-the-user-veriq/outputs/veriq-cedar. The optional ~/Projects move is blocked by the execution environment's read-only /home mount. Continue the same writable checkout; do not initialize a replacement or overwrite another clone.

## Join and clone

Habeeb signs into GitHub as Hbboss226 and Usaamah as Barry1003. Accept the repository invitation if it is pending. Then, in a writable folder:

```bash
git clone https://github.com/Ade20boss/veriq-cedar.git
cd veriq-cedar
git status --short --branch
git remote -v
```

Use your own GitHub account and Git author identity. For authenticated HTTPS pushes, install/use the official GitHub CLI in your environment, then authenticate in the browser:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

Do not paste passwords or access tokens into an agent chat, commit them or add them to a remote URL. Public clone/read access does not imply write membership.

## Ownership and branch names

| Developer | GitHub identity | Feature branch | Primary responsibility |
|---|---|---|---|
| Daniel | Ade20boss (repository owner) | feat/backend-foundation | apps/backend, Cedar/Veriq backend and integration coordination |
| Habeeb | Hbboss226 | feat/ai-foundation | apps/ai, advisory extraction/reasoning and AI evaluation |
| Usaamah | Barry1003 | feat/frontend-foundation | Cedar Customer, rebuilt Cedar Operations and independent Veriq workbench |

Actual frontend directories remain subject to source review and the agreed migration plan. apps/web is a legacy reservation, not permission to import/move/replace Usaamah's applications. Preserve the customer design; staff UI is redesigned from approved workflow requirements. No frontend source is imported in this task.

Shared contracts, fixtures, infra and architecture decisions require affected-owner review. Daniel coordinates integration; ownership does not authorize silently changing another developer's files or financial/evidence semantics.

## Start a feature and open a PR

First read AGENTS.md, README.md, docs/handoffs/CURRENT_STATE.md, the relevant owner specification, accepted contracts and current decisions. Inspect existing changes before switching branches. For Habeeb:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/ai-foundation
# Make one bounded, authorized change; run its checks.
git add apps/ai/  # include other intended files explicitly if needed
git commit -m "Describe the AI change"
git push -u origin feat/ai-foundation
gh pr create --base main --head feat/ai-foundation --fill
```

Usaamah uses feat/frontend-foundation instead; stage only the agreed frontend paths after migration approval. Daniel uses feat/backend-foundation. If the branch already exists, switch to and update that branch rather than creating a replacement. Review the diff before committing; never force-push, overwrite teammates or reset away uncommitted work. Open a PR via GitHub's Compare & pull request UI if gh is unavailable.

Keep main for reviewed integration. The intended practical protection requires PRs, does not invent CI status checks, does not require Code Owners or an external approving review for every change, blocks force-push/deletion and leaves repository administrators able to maintain the project. Actual configured settings/limitations are recorded in the handoff. The owner can merge reviewed PRs and handle initial setup documentation without being locked out.

## Tests and current implementation

Task 002 implemented only the backend foundation. See apps/backend/README.md for project-local uv 0.13.1, Python 3.12.14, pinned dependencies, environment, PostgreSQL, Alembic/grants, startup and tests. Its recorded result is 33 passing tests, five using real PostgreSQL, plus live CLI/HTTP smoke; do not infer these ran again during this Git-only task. No business feature is implemented. AI/frontend scaffolding is not authorized by this setup request.

Keep secrets in ignored local .env files; commit placeholder .env.example only. Virtualenvs, caches, build output and downloaded/test database data must stay outside commits. Backend/AI services never expose credentials to browser NEXT_PUBLIC_ variables. Migration credentials remain separate from runtime roles. Existing limitations, including unavailable Compose execution in the agent environment, remain documented in the backend handoff.

## Contract and collaboration review

contracts/openapi.yaml is the accepted HTTP baseline; contracts/demo.json retains synthetic scenario truth and is never a browser/AI evidence payload. Original docs/specs sources stay unchanged. contracts/proposals contains explicitly proposed v1.1 drafts; publication is not approval. The minimum/secondary scope remains as documented. Record changed routes/fields/authority, affected owners, compatibility and examples/tests before adoption. Do not silently promote the proposal while implementing a workstream.

PR descriptions state resulting behavior, scope/contract compatibility, commands and actual results, known failures and risks. Include source/financial authority and privacy considerations when relevant, not boilerplate claims. Review another workstream's impacts with its owner. No mandatory CI is assumed until real workflows exist. Use the repository PR template; manual review remains necessary even when zero formal approvals are required by the rule.

Veriq remains proactive: automatic operational-anomaly investigations and complaint-triggered targeted work do not wait for Sarah/Michael. Cedar retains financial/complaint/communication ownership; bank-neutral adapters keep Veriq independent of Cedar persistence. Route findings do not establish an individual transfer outcome, UNKNOWN requires eligible evidence to advance and AI is advisory.

## Resume in Codex or Google Antigravity

Open the same existing checkout or your normal team clone. Read AGENTS, README, the latest CURRENT_STATE/report, accepted contracts, relevant specs and ADRs. Inspect git status, branch, log and diffs; compare the authorized task with actual code and tests. Do not recreate the monorepo or infer progress from an old conversation.

At each checkpoint record the branch/code baseline, objective/authorization, files and reasons, migration/seed state, actual tests, blockers, uncommitted work and next safe task. Commit handoff updates on the appropriate feature branch and include them in the PR. Preserve teammate changes and keep proposed contracts clearly separated from accepted ones. Switching tools does not expand task scope.
