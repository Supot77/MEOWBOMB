# Deploy MEOWBOMB to Cloudflare Workers + D1

Use Cloudflare **Workers**, not a static Pages deployment. The app's API uses `cloudflare:workers` and a D1 binding named `DB`.

## First deployment from your computer

Open PowerShell in `D:\MEOWBOMB\meowbomb` (the application is one level below the repository root).

1. Install locked dependencies: `npm run install:ci`.
2. Sign in: `npx wrangler login` (finish the Cloudflare browser sign-in yourself).
3. Create production storage: `npx wrangler d1 create meowbomb-db`.
4. Copy its actual `database_id` into `npm run cf:configure -- YOUR_DATABASE_ID`. This writes an ignored local configuration file; database IDs are not API tokens.
5. Build: `npm run build`.
6. Validate the deployment bundle without publishing: `npm run cf:check`.
7. Apply pending schema migrations to production: `npm run cf:migrate`. Review the database name in the prompt before accepting. This uses migration history rather than replaying the initial SQL on every deployment.
8. Publish: `npm run cf:deploy`.

Use the actual `https://meowbomb.<your-subdomain>.workers.dev` URL returned by Wrangler. Create a room there and share the invitation link. Local development rooms are separate from production and are not uploaded.

Future releases: `npm run build`, `npm run cf:check`, `npm run cf:migrate`, `npm run cf:deploy`. The script regenerates its Cloudflare configuration after each build without changing the Sites hosting identity. Never edit generated `dist/server/wrangler.json` by hand.

## GitHub-connected Workers Builds

After the first deployment, connect `Supot77/MEOWBOMB` in Cloudflare Workers Builds:

- Production branch: `main`
- Root directory: `meowbomb`
- Build command: `npm run build && npm run cf:prepare`
- Deploy command: `npm run cf:migrate && npm run cf:deploy`
- Build variable: `MEOWBOMB_D1_ID` = your actual production D1 database ID
- Node version: 24

Cloudflare provisions build authentication for its Git integration. If instead using another CI service, provide a least-privilege Cloudflare API token and account ID as that service's encrypted secrets. Never put a token in source files or invitation URLs.

## Cost and verification boundaries

Start with Workers Free for a small private group and watch the dashboard's request/CPU and D1 usage. D1 Free currently includes 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. Limits are shared across the account. The UI polls roughly every 850ms while visible, so this is not unlimited free hosting. The API now avoids writing every poll and refreshes presence at most every ten seconds per seat, except actual game changes and deadline resolution.

Production readiness still needs actual multiplayer checks on the deployed origin. Passing a local build does not prove remote migrations, Cloudflare account access or friend access. No production database or paid plan is created by the preparation command.

Sources checked 2026-10-22:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/reference/migrations/
