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

Hand interaction update (2026-10-23): `components/game/card-hand.tsx` replaces the native horizontal hand scrollbar with a centered bounded fan. Horizontal pointer dragging continuously moves the focus across the hand; pointer capture begins only after a horizontal threshold, and a completed drag cannot confirm a card. Vertical page gestures remain available. The hand opens on turn arrival or a private Favor request and closes on turn departure; manual viewing is always possible. First tap raises one card; second tap submits only a legal single-card action. Favor still requires a target, Nope only submits during a response window, and off-turn ordinary actions remain blocked by both UI and engine. A separate combo mode preserves pair/triple selection. Arrow buttons/keyboard provide alternatives to dragging. Reduced motion suppresses transition/travel effects. Card arrival animation was adapted to the centered fan coordinates.

Future viewing update (2026-10-23): `components/game/future-viewer.tsx` renders a native modal dialog with card art in top-to-bottom order. Only the owner sees it; the explicit “ดูเสร็จแล้ว” button sends close_future. Escape is prevented and backdrop clicks do not dismiss it. The heading receives initial focus rather than the confirmation button. The engine already had no Future timeout; a new regression test verifies it persists after ten minutes, blocks draw and other-player confirmation, and preserves the deck and current turn after explicit confirmation. TypeScript and all 15 tests passed. The exact cause of the reported short viewing interval was not reproduced; this replaces the small inline result and makes confirmation explicit.

Pair interaction update (2026-10-23): after the usual Nope window, a two-card combo enters `pair_shuffle`. Only its target may shuffle their hand or confirm readiness. Then `pair_pick` locks that order and exposes only a slot count to the attacker; the attacker uses the same centered swipeable hand with backs and double-tap confirmation. No target card IDs or identities are serialized to that attacker. Only the attacker can pick a valid slot, exactly once. Empty target hands resolve immediately. Triple combos retain named-card transfer or loss with an explicit result log. Existing room JSON needs no database migration. Regression tests cover authorization, secrecy, invalid/duplicate picks, Nope cancellation, empty hands, and triple success/failure.
