# MEOWBOMB

Thai Original Edition multiplayer card game for 2–5 friends. Built with Next.js, Vercel Functions and Neon PostgreSQL. Current deployment guide: [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).

## Run

Node 24 recommended. `npm ci`, copy `.env.example` to `.env.local`, configure the server-only database URL, then `npm run db:migrate` and `npm run dev`. `npm run build` verifies the production Next.js bundle. Do not commit database credentials.

## Shared Neon database

MEOWBOMB uses its own `meowbomb` schema. It can share a Neon PostgreSQL database with another app without reusing that app's tables. Resources and permissions are still shared; use separate database roles or databases if stronger isolation is needed. Preview deployments must point to a separate Neon branch. No existing database has been accessed or migrated by this code preparation.

## Code

- `lib/game.ts`: base card catalog, setup, Attack debt, combos, Nope, Defuse, private views and victory.
- `lib/rooms.ts`: lobby, readiness, reconnect identity, replay and abandonment.
- `lib/postgres.ts`: server-only pooled pg connection and schema-qualified SQL adapter.
- `app/api/room/route.ts`: authenticated commands, conditional revision updates and deduplication.
- `scripts/migrate-neon.mjs`, `db/postgres/0001_rooms.sql`: transactional, versioned migration scoped to `meowbomb`.
- `app/page.tsx`, `app/globals.css`, `public/art/cards-atlas.png`: original generated cat art, fan-shaped hand and draw/play animations with reduced-motion support.

## Rules and digital adaptations

Publisher's 2025 Original Edition, LONS-202504-79, 56-card catalog, pairs/triples; no expansions or older five-different-card combo. Eight-second Nope response windows; Defuse automatically used on bomb draw; secret reinsertion choice. Ordinary turns do not time out. Room inactivity expiry is 24 hours. Per-tab reconnection secrets restore seats after refresh. Hidden tabs stop polling, and presence writes are throttled to ten seconds per player.

## Verification

`npm test` runs engine scenarios including 100 complete games and card conservation. `npm run typecheck` checks TypeScript. `tests/api-smoke.mjs` is a live API integration check; its default URL must be updated for the active server before use. The prior D1 adapter passed those API checks; these are not proof of Neon connectivity. Production Neon verification requires actual credentials and an initialized schema.

## Legacy deployment files

The `.openai` identity, Vite/Worker configuration, D1 `drizzle/` migrations and `cf:*` scripts are preserved from the original prototype. They do not configure this Next.js/Vercel deployment. Use only `db/postgres/` migrations with Neon. Prior local Wrangler rooms remain separate.
