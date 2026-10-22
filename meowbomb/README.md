# MEOWBOMB

Thai multiplayer Original Edition game, 2–5 players. Sources use the publisher's 2025 rules (LONS-202504-79). No expansions or five-different-card combo.

## Run locally

Requires Node 22.13+ (Node 24 used for verification).

```powershell
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_foamy_franklin_storm.sql
npm start
```

Apply the migration only once per local database. Open http://127.0.0.1:8787. On Windows where npm.cmd resolves incorrectly, invoke `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'` in place of `npm`.

## Code map

- `lib/game.ts`: card catalog, setup, turn debt, combos, Nope window, private results and victory.
- `lib/rooms.ts`: readiness, room lifecycle, sanitized views and session hashing.
- `app/api/room/route.ts`: D1 persistence, revision checks, command deduplication and authenticated actions.
- `app/page.tsx`, `app/globals.css`: Thai lobby/table, private choices, hand and responsive presentation.
- `db/schema.ts`, `drizzle/`: persistent room schema and migrations.

Eight-second Nope windows are a digital adaptation. Defuse is used automatically when drawing a bomb; its owner chooses the secret insertion position. Ordinary turns have no timeout. Disconnected seats remain reserved; refresh restores the seat in the same tab. Room expiry is 24 hours without authenticated activity. Hidden tabs stop polling; another device cannot recover the same seat.

## Verification

- `node --test tests/game.test.mjs`: 10 passing tests including 100 complete games and card conservation.
- `node tests/api-smoke.mjs`: local live API creation/join/start, privacy, authentication, concurrent draw, deduplication and reconnect checks.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- Production build: passed.
- Desktop browser: landing and create-room inspected. Further multi-tab/browser testing is recorded in the task handoff.

The initial Sites deployment is owner-private. Publishing privately does not grant friends access; sharing permissions must be configured before online friend sessions. Do not describe a local URL as internet-accessible. Mobile CSS exists but a 360px browser viewport has not yet been verified.

## Card art and motion (2026-10-22)

Original artwork generated with the built-in imagegen tool is stored in `public/art/cards-atlas.png`. It is one 4×4 atlas: base card types in catalog order, followed by card back, winner and group art. Production prompt: original mischievous cartoon cats, charcoal ink, cream paper, coral/mint/gold/lavender; 16 equal cells; no text, logos or publisher artwork. The CSS samples equal atlas cells without modifying the generated bitmap.

The hand now overlaps and fans around its center; hover, keyboard focus and selection raise a card. Touch selection raises cards and the hand can scroll. Newly received cards animate into the hand, the deck pulses on receipt and a changed discard animates onto the table. Reduced-motion users receive no travel animation. These visual updates do not change rules. Gameplay tests were paused at the user's request; type checking passes after the visual update.

## Deploy to your own Cloudflare account

Recommended hosting: Cloudflare Workers + D1. Follow [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md) for first-time sign-in, real database binding, migration, dry-run and publication, plus GitHub-connected build settings. `scripts/cloudflare.mjs` adapts the existing generated bundle; the Sites project identity is preserved. `cf:prepare` refuses an unset production database. Room status checks now write presence at ten-second intervals rather than on every poll. No production deployment has been verified yet.
