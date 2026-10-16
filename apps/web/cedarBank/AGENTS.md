# Cedar Bank customer application

This is a Next.js 16 App Router application using React 19, TypeScript strict mode, Tailwind CSS 4, and Lucide React.

## Development

- `pnpm dev` starts the Next.js development server on `$PORT` (default 8443 in the Figma Make environment).
- `pnpm build` creates the production build.
- `pnpm start` serves the production build.
- `pnpm format` runs oxfmt.

## Structure

- `src/app/layout.tsx` contains metadata and the root layout.
- `src/app/page.tsx` is the application route.
- `src/app/globals.css` loads the global stylesheet from `src/index.css`.
- `src/App.tsx` is the client-side customer experience and preserves the original demo flows.
- `src/data.ts` contains deterministic demo data and transaction evidence.
- `src/ui.tsx` contains shared presentation components.
- `src/lib/api.ts` is the typed mock API seam for future NestJS integration.
- `public/` contains static assets.

Interactive code that uses hooks, timers, or browser APIs must remain in client components. Keep browser-only access inside event handlers or effects. Preserve the fictional/demo nature of all account, transfer, complaint, and notification data.

Use Tailwind utilities for new styles and keep existing design tokens in `src/index.css`. Tailwind is configured through `postcss.config.mjs`; there is no Vite configuration or Vite entrypoint.

The customer experience intentionally remains a single client flow at `/` during this migration so transfer, complaint, and investigation state cannot reset between screens. Meaningful App Router route extraction (`/login`, `/dashboard`, `/transfer`, `/transactions`, and `/support`) is the next safe increment once shared state is moved into a provider or client store.
