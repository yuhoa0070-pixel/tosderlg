# Waylo on Cloudflare

Waylo is hosted entirely by one Cloudflare Worker:

- Vite builds the React application into `dist/`.
- Cloudflare Static Assets serves the frontend and handles SPA navigation.
- `/api/trip-room` stores shared trip rooms in D1.
- `/api/resolve-map-link` expands supported Google Maps short links.
- Telegram CloudStorage synchronizes each user's trip plans between their
  Telegram mobile and desktop apps. Browser local storage remains the offline
  fallback. Local photo uploads stay on the device; shared room data stays in D1.

Vercel and `VITE_TRIP_ROOM_API_URL` are not required in production because the
frontend and API use the same `workers.dev` origin.

## Telegram account sync

Personal trip-plan sync uses Telegram's native CloudStorage API, so it does not
need another D1 migration or a bot-token secret. The first Telegram device to
open this version uploads its existing local trips; another device using the
same Telegram account restores them when the Mini App opens. Cloud values are
chunked below Telegram's per-value limit and local browser storage remains the
offline fallback.

## Deploy

From the repository root:

```bash
npm run deploy
```

That command builds the frontend and deploys the Worker, assets, API routes,
and D1 binding together. The production URL is:

```text
https://waylo-trip-rooms.yuhoa0070.workers.dev
```

## Database migrations

Only run the migration command when a new migration has been added:

```bash
npx wrangler@latest d1 migrations apply waylo-trip-rooms --remote
```

The initial `0001_create_trip_rooms.sql` migration has already been applied.
Apply `0002_create_trip_room_members.sql` before deploying the member-profile
feature so room joins can record and display participants.

## Local Cloudflare preview

```bash
npm run dev:cloudflare
```

This builds the latest frontend and serves the app, Worker API, and a local D1
database together at the URL printed by Wrangler.

## Manual deployments

Git pushes should not deploy this Worker. In Cloudflare, keep the Git repository
disconnected under **Worker > Settings > Builds**, then deploy a reviewed version
manually with `npm run deploy`. The root `wrangler.jsonc` remains the deployment
source of truth so the frontend assets, Worker API, and D1 binding are published
together.

## Retire Vercel

After confirming the Cloudflare URL loads and both trip invitations and Google
Maps links work, disconnect any custom domain from Vercel and then stop or
delete the Vercel project.

For the Telegram Mini App, open `@BotFather`, select the bot, and replace the
old Vercel URL anywhere it is configured under **Bot Settings > Menu Button**
or **Configure Mini App** with the Cloudflare production URL above.

If a custom domain is used later, add it to the Worker and include its origin
in `ALLOWED_ORIGINS` in `wrangler.jsonc`.
