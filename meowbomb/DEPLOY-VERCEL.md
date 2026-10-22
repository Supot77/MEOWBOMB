# Deploy to Vercel + Neon

This is the current deployment target. The production app uses Next.js and PostgreSQL, not Cloudflare D1. The older Cloudflare files are historical and are not used by `npm run build` or the API.

## Use the database from คำต้องเชื่อม

You may reuse the existing Neon PostgreSQL database. MEOWBOMB only creates and accesses `meowbomb.rooms` and `meowbomb.schema_migrations`; it does not query `public.rooms` or change another game's tables. The SQL migration runs in a transaction and is tracked, so it can run again safely.

Sharing a database also shares compute, storage, connection limits and failure domain. A schema separates names, not database privileges. If desired, create a dedicated MEOWBOMB database role with access only to the meowbomb schema after the owner applies migration. A separate database on the same Neon project provides stronger administrative separation. Use a separate Neon branch for Preview, not the live connection from either game.

The old project's provider and connection have not been verified in this workspace. These instructions apply if it is Neon/PostgreSQL. Do not reuse a SQLite, D1 or unrelated provider connection string.

## Vercel settings

Import `Supot77/MEOWBOMB`:

- Production branch: `main`
- Root Directory: `meowbomb`
- Framework: Next.js
- Node.js: 24.x
- Install: `npm ci`
- Build: `npm run build`
- Output Directory: use the Next.js default (do not set `dist`)
- Region: Singapore (`sin1`, also in vercel.json); choose database and function regions close together.

Add `DATABASE_URL` to Production environment variables: use the existing database's **pooled** connection string. Copy it within Neon/Vercel, not into chat or Git. Do not prefix with `NEXT_PUBLIC_`. For Preview use a separate branch connection. The current Vercel config runs migrations separately, not during every preview build.

## Apply the schema once before opening the game

From `D:\MEOWBOMB\meowbomb`:

1. `npm ci`
2. Copy `.env.example` to `.env.local` if it does not already exist. Preserve any existing environment values.
3. Set `DATABASE_URL` to the pooled URL. Set `DATABASE_URL_UNPOOLED` to the direct URL from the **same database/branch** for migrations.
4. `npm run db:migrate`
5. `npm run build`

Alternatively, execute `db/postgres/0001_rooms.sql` in the selected database's Neon SQL Editor. This creates only the MEOWBOMB schema/table/index. The migration script additionally tracks migration version and will safely reconcile the existing table on its next run. Do not execute older `drizzle/` SQLite migrations in Neon.

If using a restricted app role, apply the schema with a database owner/migration role, then grant the app role `USAGE ON SCHEMA meowbomb` and `SELECT, INSERT, UPDATE, DELETE ON meowbomb.rooms`. Keep the owner connection out of the Vercel app settings.

## Deploy and verify

Once the schema exists and `DATABASE_URL` is saved, click Deploy (or Redeploy if you previously deployed). Open the returned `.vercel.app` URL, create a room and join from another device. Confirm readiness/start, private hands and reconnect. A successful build alone does not verify the actual database connection.

For local use, `npm run dev` serves Next.js. The old Wrangler local rooms are not transferred into Neon. A new deployment never imports those old private game states.

## Verified here

The connection adapter preserves conditional revision writes (`UPDATE ... WHERE revision=...`) and conflict-safe room creation (`ON CONFLICT DO NOTHING`). It uses a process-level pg pool with at most two connections and Vercel pool lifecycle management. Missing DATABASE_URL fails without printing a connection string. No real Neon credentials were present during preparation, so production connection/migration/gameplay remain unverified.

Preparation verification (2026-10-22): the Next.js production build compiled and typechecked; engine tests (10) and PostgreSQL SQL-adapter tests (4) passed. `npm run db:migrate` correctly stops when database configuration is absent. Remote database migration and a live Neon game remain untested until connection configuration is available. API smoke target defaults to localhost:3000; set MEOWBOMB_TEST_URL for another test origin and use a development database.

Live deployment test 2026-10-23: https://meowbomb.vercel.app passed API create/join/readiness/start, private hand filtering, invalid-token rejection, concurrent draw, command deduplication and state reconnect. A separate two-player API round finished after 94 steps, exercising Attack, Shuffle, draw, Skip, Favor with target giving, Future private view and Defuse reinsertion. Two independent browser tabs created/joined/started a room and refresh restored the original seat. Live Nope/combos, five-player UI and 360px viewport are not covered by this run. Tab switching revealed stale-state retries; the UI now refreshes on focus/visibility changes (TypeScript passed). That UI fix needs the subsequent Vercel deployment before live confirmation. Test rooms were QA-only and expire by the existing 24h policy; no other application's tables were accessed.


## Automatic room expiration

Rooms are closed after one hour without saved authenticated contact. Browsers still connected and polling maintain the room. After expiration, the API returns HTTP 410, the client removes the old seat session and offers a fresh lobby. This is independent of the physical deletion schedule.

Set CRON_SECRET in Vercel Production from the locally generated value in .env.local (do not paste into Git or chat), then redeploy. Vercel sends the Bearer secret to GET /api/cron/cleanup. Without it, the route returns 503 and performs no deletion; incorrect authorization returns 401. The checked-in daily schedule is compatible with Hobby: 20:00 UTC / 04:00 Asia/Singapore. Each sweep deletes at most 1000 expired rooms. Room creation and stale access also clean up expired rows. Physical deletion without incoming traffic may wait until the daily sweep; no exact one-hour deletion guarantee is implied. A more frequent scheduler can call the same protected endpoint if enabled under a suitable plan. No existing cleanup function from another project is reused.

Manual maintenance: npm run db:cleanup deletes only rooms already past the one-hour cutoff. This never clears active rooms or touches other schemas.
