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

Publisher's 2025 Original Edition, LONS-202504-79, 56-card catalog, pairs/triples; no expansions or older five-different-card combo. Eight-second Nope response windows; Defuse automatically used on bomb draw; secret reinsertion choice. Ordinary turns do not time out. Room inactivity expiry is 1 hour after the last saved authenticated contact. Per-tab reconnection secrets restore seats after refresh. Hidden tabs stop polling, and presence writes are throttled to ten seconds per player.

## Verification

`npm test` runs engine scenarios including 100 complete games and card conservation. `npm run typecheck` checks TypeScript. `tests/api-smoke.mjs` is a live API integration check; its default URL must be updated for the active server before use. The prior D1 adapter passed those API checks; these are not proof of Neon connectivity. Production Neon verification requires actual credentials and an initialized schema.

## Legacy deployment files

The `.openai` identity, Vite/Worker configuration, D1 `drizzle/` migrations and `cf:*` scripts are preserved from the original prototype. They do not configure this Next.js/Vercel deployment. Use only `db/postgres/` migrations with Neon. Prior local Wrangler rooms remain separate.

Hand interaction update (2026-10-23): `components/game/card-hand.tsx` replaces the native horizontal hand scrollbar with a centered bounded fan. Horizontal pointer dragging continuously moves the focus across the hand; pointer capture begins only after a horizontal threshold, and a completed drag cannot confirm a card. Vertical page gestures remain available. The hand opens on turn arrival or a private Favor request and closes on turn departure; manual viewing is always possible. First tap raises one card; second tap submits only a legal single-card action. Favor still requires a target, Nope only submits during a response window, and off-turn ordinary actions remain blocked by both UI and engine. A separate combo mode preserves pair/triple selection. Arrow buttons/keyboard provide alternatives to dragging. Reduced motion suppresses transition/travel effects. Card arrival animation was adapted to the centered fan coordinates.

Future viewing update (2026-10-23): `components/game/future-viewer.tsx` renders a native modal dialog with card art in top-to-bottom order. Only the owner sees it; the explicit “ดูเสร็จแล้ว” button sends close_future. Escape is prevented and backdrop clicks do not dismiss it. The heading receives initial focus rather than the confirmation button. The engine already had no Future timeout; a new regression test verifies it persists after ten minutes, blocks draw and other-player confirmation, and preserves the deck and current turn after explicit confirmation. TypeScript and all 15 tests passed. The exact cause of the reported short viewing interval was not reproduced; this replaces the small inline result and makes confirmation explicit.

Pair interaction update (2026-10-23): after the usual Nope window, a two-card combo enters `pair_shuffle`. Only its target may shuffle their hand or confirm readiness. Then `pair_pick` locks that order and exposes only a slot count to the attacker; the attacker uses the same centered swipeable hand with backs and double-tap confirmation. No target card IDs or identities are serialized to that attacker. Only the attacker can pick a valid slot, exactly once. Empty target hands resolve immediately. Triple combos retain named-card transfer or loss with an explicit result log. Existing room JSON needs no database migration. Regression tests cover authorization, secrecy, invalid/duplicate picks, Nope cancellation, empty hands, and triple success/failure.

Combo navigation fix (2026-10-23): dragging, arrow keys and previous/next buttons now retain selected card IDs in combo mode. Previously each navigation path called onSelect([]), which erased the first card before a distant matching card could be chosen. Single-card browsing still clears the raised preview as before. Keyboard activation also resets the stale drag suppression flag. TypeScript passed; device-touch confirmation is pending the deployed update.


Room expiry update (2026-10-23): rooms reject access at exactly one hour since last persisted authenticated activity (including heartbeats). Expired reads return ROOM_EXPIRED/410, clear the browser seat and stop polling the dead room. Create-room traffic removes expired rows in batches of up to 1000, and access to a particular expired room removes that row. Conditional cleanup rechecks the timestamp to protect recently refreshed rooms. `app/api/cron/cleanup/route.ts` provides Bearer-secret authentication, fails closed without CRON_SECRET, and sweeps expired rows daily via Vercel Cron (20:00 UTC / 04:00 Singapore). Hobby supports daily jobs only; logical one-hour expiry is enforced separately on every API request. Actual deletion can occur later when no requests arrive. Use a more frequent authorized scheduler if tighter physical deletion is required.

One-time live cleanup: inspected 4 rooms, all older than one hour with zero recent rooms; deleted 4 from meowbomb.rooms and confirmed zero remained immediately afterward. No other schema was targeted. `npm run db:cleanup` is an expired-only manual sweep. A random CRON_SECRET was generated in ignored .env.local; copy it into Vercel Production environment variables and redeploy for scheduled cleanup to authenticate. No value was printed or committed. Expiry-boundary and safe-SQL tests pass (22 tests total); remote cron execution remains unverified until configuration/deployment.

Live Neon regression: an isolated transaction inserted expired and fresh fixtures, removed only the expired one at the exact one-hour boundary, verified that the fresh one survived, then rolled back every fixture change.

Production build passed. Local HTTP verification of /api/cron/cleanup rejected absent/wrong authorization (401) and accepted the configured local secret (200). This does not establish that Vercel Production has that secret yet.

Host and abuse policy update (2026-10-23): the owner can explicitly close a room after browser confirmation; the server validates the authenticated host and conditionally deletes by revision. Other clients receive room-gone on their next poll/focus. An owner offline for 2 minutes is replaced by the first connected seat on the next authenticated contact; returning does not reclaim ownership. New rounds start with ready online seats only (at least two), dropping offline lobby seats; active games retain disconnected participants. Invalidated seats clear their browser session rather than polling forever.

Room creation is capped at 5 attempts/10 minutes per hashed client IP using an atomic PostgreSQL upsert in meowbomb.creation_limits. Shared Wi-Fi users share that quota. The server trusts Vercel's forwarded client IP in production; this is a quota guard, not a substitute for platform DDoS protection. Counter cleanup is included in expired-room sweeps. Migration 0002_creation_limits was applied to Neon, scoped only to meowbomb. The migration runner now processes sorted versioned PostgreSQL SQL files.

Verification: 24 unit tests passed; production build passed. Live Neon rolled-back fixtures verified five accepts, sixth denial and expiry reset. Local HTTP tests against Neon verified unauthorized closure rejection, simulated two-minute host absence/transfer, no reclaim by old owner, and new owner closing the room for both seats. QA room was removed. Updated deployment must complete on Vercel before these UI controls are available online.

Manual hand ordering (2026-10-23): players can open Arrange from their own hand toolbar, move individual cards left/right with touch-sized buttons, inspect the draft in the centered fan, and explicitly confirm or cancel. Confirmation shows an aria-live success status. Ordering is presentation-only, scoped to room/player in sessionStorage; it does not change server hand order or Pair selection slots. Cards spent elsewhere are removed from saved order and incoming cards append; duplicate/stale saved IDs are discarded. PairPicker does not receive ordering controls. Storage-denied browsers still apply ordering for the current render and show a persistence warning. Tests cover reconciliation and immutable movement/cancellation.

Pass confirmation (2026-10-23): a successful server acknowledgement of pass displays “กดผ่านสำเร็จ ✓” as a live status. During the same pending response window, the button derives its disabled state and “ผ่านแล้ว ✓” label from the authoritative passes list, including after reload. A new Nope clears passes in the engine, so a new window allows passing again. Requests in flight remain guarded by the existing busy/lock mechanism; failed requests do not display success.

Requested card additions (2026-10-23): new rounds include Alter Future ×3 and Targeted Attack ×3, extending the catalog from 56 to 62 cards. Existing persisted games retain their already-dealt deck. Alter Future opens the private three-card viewer with arrow controls; the server accepts only a complete unique index permutation, reorders exactly the top available three cards and blocks other actions until confirmation. It handles shorter remaining decks. Targeted Attack alone assigns 2 turns to any living opponent; attack debt transfers and adds 2. The user-requested mixed Attack + Targeted Attack combo assigns 4 turns plus existing attack debt as a single Nope-able action. Same-title pairs/triples still work for new types. UI titles, help catalog, target selection and hand descriptions include both. Artwork reuses the existing Future/Attack illustrations with distinct reorder/crosshair badges; no new bitmap was generated. Regression coverage includes private access, timeout persistence, invalid reorder, short decks, debt transfer, mixed combo and Nope. No DB migration required.
