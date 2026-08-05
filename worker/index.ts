const SHORT_MAP_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isAllowedShortMapUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !SHORT_MAP_HOSTS.has(url.hostname)) return null;
    if (url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps/')) return null;
    return url;
  } catch {
    return null;
  }
}

function isExpandedGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isGoogleHost = url.hostname === 'google.com' || url.hostname.endsWith('.google.com');
    return url.protocol === 'https:' && isGoogleHost && url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname !== '/api/resolve-map-link') {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const rawUrl = requestUrl.searchParams.get('url');
    if (!rawUrl || rawUrl.length > 2048) {
      return json({ error: 'A Google Maps short link is required' }, 400);
    }

    const shortUrl = isAllowedShortMapUrl(rawUrl);
    if (!shortUrl) {
      return json({ error: 'Only Google Maps short links are supported' }, 400);
    }

    try {
      const response = await fetch(shortUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': 'Waylo map link resolver' },
      });
      const expandedUrl = response.headers.get('Location');
      if (!expandedUrl || !isExpandedGoogleMapsUrl(expandedUrl)) {
        return json({ error: 'Google Maps did not return a usable location' }, 422);
      }
      return json({ url: expandedUrl });
    } catch (error) {
      console.error(
        JSON.stringify({
          message: 'Google Maps short-link resolution failed',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return json({ error: 'Could not resolve this Google Maps link' }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
