# Cedar Bank Operations

Cedar Bank Operations is the staff-facing synthetic banking workspace. It now runs as a Next.js App Router application with TypeScript, React, Tailwind CSS, and ESLint configuration.

## Development

```bash
pnpm install
pnpm dev
```

The default development URL is `http://localhost:3000`. Production checks are:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

The root route opens staff sign-in. App Router module routes are available at `/workspace`, `/queue`, `/customers`, `/transactions`, `/complaints`, `/payments`, `/exceptions`, and `/veriq`; the authenticated UI continues to enforce role permissions in the client shell.

All records and actions in this application are deterministic synthetic fixtures. UI refreshes and evidence approvals are demonstrations only; they do not write banking truth or establish financial outcomes. Backend integration should replace the typed fixture boundary with Daniel's approved Cedar APIs without adding browser-to-database or browser-to-AI access.

The existing Figma Make source and stylesheet are intentionally preserved while the Next entrypoints provide the application shell. The customer application under `apps/web/cedarBank` is out of scope for this migration.
