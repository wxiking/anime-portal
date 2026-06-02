/**
 * Cloudflare Pages Function — Website Metadata Fetcher
 * GET /api/meta?url=https://example.com
 * Returns { title, description, keywords[] } parsed from the target page <head>
 */

const SECURE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: SECURE_HEADERS });
}

export async function onRequestGet({ request, env }) {
  // Rate limiting: 15 requests per minute per IP
  if (env.PORTAL_DATA) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateKey = `_ratelimit_meta:${ip}`;
    try {
      const current = parseInt(await env.PORTAL_DATA.get(rateKey) || '0', 10);
      if (current >= 15) return jsonResponse({ error: 'Too many requests' }, 429);
      await env.PORTAL_DATA.put(rateKey, String(current + 1), { expirationTtl: 60 });
    } catch { /* KV unavailable — allow through */ }
  }

  const urlParam = new URL(request.url).searchParams.get('url');
  if (!urlParam) return jsonResponse({ error: 'Missing url parameter' }, 400);

  let target;
  try {
    target = new URL(urlParam);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return jsonResponse({ error: 'Only http/https URLs are supported' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid URL' }, 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (!resp.ok) return jsonResponse({ error: `Target returned HTTP ${resp.status}` }, 502);

    const meta = { title: '', description: '', ogTitle: '', ogDescription: '', keywords: '' };

    const rewriter = new HTMLRewriter()
      .on('title', {
        text(chunk) {
          if (meta.title.length < 200) meta.title += chunk.text;
        }
      })
      .on('meta', {
        element(el) {
          const name = (el.getAttribute('name') || '').toLowerCase().trim();
          const property = (el.getAttribute('property') || '').toLowerCase().trim();
          const content = (el.getAttribute('content') || '').trim();
          if (!content) return;
          if (name === 'description' && !meta.description) meta.description = content;
          if (name === 'keywords' && !meta.keywords) meta.keywords = content;
          if (property === 'og:title' && !meta.ogTitle) meta.ogTitle = content;
          if (property === 'og:description' && !meta.ogDescription) meta.ogDescription = content;
        }
      });

    await rewriter.transform(resp).text();

    const title = (meta.ogTitle || meta.title || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const description = (meta.ogDescription || meta.description || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const keywords = meta.keywords
      ? meta.keywords.split(/[,，、;；\s]+/).map(k => k.trim()).filter(k => k.length >= 1 && k.length <= 15).slice(0, 5)
      : [];

    return jsonResponse({ title, description, keywords });
  } catch (err) {
    if (err.name === 'AbortError') return jsonResponse({ error: 'Request timed out' }, 504);
    return jsonResponse({ error: 'Failed to fetch target site' }, 502);
  }
}
