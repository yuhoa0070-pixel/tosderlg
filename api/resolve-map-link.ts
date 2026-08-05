const SHORT_MAP_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

function sendJson(response: ApiResponse, body: unknown, status = 200) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.status(status).json(body);
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
    if (url.protocol !== 'https:' || !isGoogleHost) return false;
    return url.pathname.startsWith('/maps') || url.hostname === 'maps.google.com';
  } catch {
    return false;
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    sendJson(response, { error: 'Method not allowed' }, 405);
    return;
  }

  const queryUrl = request.query?.url;
  const rawUrl = Array.isArray(queryUrl) ? queryUrl[0] : queryUrl;
  if (!rawUrl || rawUrl.length > 2048) {
    sendJson(response, { error: 'A Google Maps short link is required' }, 400);
    return;
  }

  const shortUrl = isAllowedShortMapUrl(rawUrl);
  if (!shortUrl) {
    sendJson(response, { error: 'Only Google Maps short links are supported' }, 400);
    return;
  }

  try {
    const expandedResponse = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Waylo/1.0; +https://waylo.app)',
        'Accept-Language': 'en',
      },
    });
    const expandedUrl = expandedResponse.url;
    if (!expandedUrl || !isExpandedGoogleMapsUrl(expandedUrl)) {
      sendJson(response, { error: 'Google Maps did not return a usable location' }, 422);
      return;
    }
    sendJson(response, { url: expandedUrl });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: 'Google Maps short-link resolution failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    sendJson(response, { error: 'Could not resolve this Google Maps link' }, 502);
  }
}
