/**
 * Cloudflare Pages Function — Portal Data API
 * GET  /api/data  → read all portal data from KV (public)
 * POST /api/data  → write all portal data to KV (admin only, password-verified)
 *
 * KV binding required:     PORTAL_DATA  (set in CF Pages dashboard)
 * Environment secret:      ADMIN_HASH   (auto-set by GitHub Actions)
 */

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' }
  });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ env }) {
  if (!env.PORTAL_DATA) return jsonResponse(null);
  const data = await env.PORTAL_DATA.get('all', { type: 'json' });
  return jsonResponse(data || null);
}

export async function onRequestPost({ request, env }) {
  if (!env.PORTAL_DATA) return jsonResponse({ error: 'KV not configured' }, 503);

  const auth = request.headers.get('Authorization') || '';
  const password = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!password) return jsonResponse({ error: 'Unauthorized' }, 401);

  const hash = await sha256(password);
  if (hash !== (env.ADMIN_HASH || '')) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  if (typeof body !== 'object' || body === null) return jsonResponse({ error: 'Invalid data' }, 400);

  const payload = {
    websites:     Array.isArray(body.websites)                                  ? body.websites     : [],
    categories:   Array.isArray(body.categories)                                ? body.categories   : [],
    contactInfo:  (body.contactInfo  && typeof body.contactInfo  === 'object')  ? body.contactInfo  : {},
    siteSettings: (body.siteSettings && typeof body.siteSettings === 'object')  ? body.siteSettings : {},
    updatedAt: new Date().toISOString()
  };

  await env.PORTAL_DATA.put('all', JSON.stringify(payload));
  return jsonResponse({ ok: true, updatedAt: payload.updatedAt });
}
