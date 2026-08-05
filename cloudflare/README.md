# Waylo trip-room API

This Worker stores six-character trip rooms in Cloudflare D1 while the main
Waylo frontend remains deployed on Vercel.

## Deploy

From the repository root:

```bash
npx wrangler@latest login
npx wrangler@latest deploy --config cloudflare/wrangler.jsonc
npx wrangler@latest d1 migrations apply waylo-trip-rooms --remote --config cloudflare/wrangler.jsonc
```

Wrangler automatically provisions the D1 database during the first deploy and
writes its database ID into `cloudflare/wrangler.jsonc`. Copy the deployed
`workers.dev` URL into the Vercel environment variable:

```text
VITE_TRIP_ROOM_API_URL=https://waylo-trip-rooms.YOUR_SUBDOMAIN.workers.dev
```

Redeploy the Vercel project after adding the variable because Vite embeds
`VITE_` variables during the production build.

For production, replace `ALLOWED_ORIGINS: "*"` in `wrangler.jsonc` with the
comma-separated Vercel origins that should be allowed to call this API.
