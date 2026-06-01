/**
 * Cloudflare Pages Function — Server-Side Password Verification
 * GET  /api/verify → check if a server password has been set (no hash exposed)
 * POST /api/verify → verify a password server-side, returns { ok: bool }
 *
 * KV binding required: PORTAL_DATA
 */

const SECURE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: SECURE_HEADERS
  });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getStoredHash(env) {
  const kvHash = await env.PORTAL_DATA.get('_adminHash');
  return kvHash || (env.ADMIN_HASH || '');
}

// Only tells client whether a server password has been configured — no hash exposed
export async function onRequestGet({ env }) {
  if (!env.PORTAL_DATA) return jsonResponse({ error: 'KV not configured' }, 503);
  const storedHash = await getStoredHash(env);
  return jsonResponse({ serverHashEmpty: !storedHash });
}

// Verify a password server-side; returns { ok: true } or { ok: false }
export async function onRequestPost({ request, env }) {
  if (!env.PORTAL_DATA) return jsonResponse({ error: 'KV not configured' }, 503);

  // IP rate limiting: max 10 verify attempts per minute
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `_ratelimit_verify:${ip}`;
  try {
    const current = parseInt(await env.PORTAL_DATA.get(rateKey) || '0', 10);
    if (current >= 10) return jsonResponse({ error: 'Too many requests' }, 429);
    await env.PORTAL_DATA.put(rateKey, String(current + 1), { expirationTtl: 60 });
  } catch { /* KV error — allow through rather than blocking legitimate users */ }

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { password } = body;
  if (typeof password !== 'string') return jsonResponse({ ok: false }, 400);

  const storedHash = await getStoredHash(env);
  if (!storedHash) return jsonResponse({ ok: false, serverHashEmpty: true });

  const hash = await sha256(password);
  return jsonResponse({ ok: hash === storedHash });
}
