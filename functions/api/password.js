/**
 * Cloudflare Pages Function — Admin Password API
 * GET  /api/password → return current admin hash (for client login verification)
 * POST /api/password → change admin password (stored in KV, all devices instant)
 *
 * KV binding required:  PORTAL_DATA
 * KV key used:          _adminHash  (falls back to env.ADMIN_HASH if not set)
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

export async function onRequestGet({ env }) {
  if (!env.PORTAL_DATA) return jsonResponse({ error: 'KV not configured' }, 503);
  const hash = await getStoredHash(env);
  return jsonResponse({ hash });
}

export async function onRequestPost({ request, env }) {
  if (!env.PORTAL_DATA) return jsonResponse({ error: 'KV not configured' }, 503);

  // IP 速率限制：每分钟最多 15 次
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `_ratelimit:${ip}`;
  try {
    const current = parseInt(await env.PORTAL_DATA.get(rateKey) || '0', 10);
    if (current >= 15) return jsonResponse({ error: 'Too many requests' }, 429);
    await env.PORTAL_DATA.put(rateKey, String(current + 1), { expirationTtl: 60 });
  } catch { /* KV 异常时放行，不因限流机制本身阻断正常请求 */ }

  const auth = request.headers.get('Authorization') || '';
  const password = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!password) return jsonResponse({ error: 'Unauthorized' }, 401);

  const currentHash = await sha256(password);
  const storedHash = await getStoredHash(env);
  if (!storedHash || currentHash !== storedHash) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { newHash } = body;
  if (!newHash || typeof newHash !== 'string' || !/^[a-f0-9]{64}$/.test(newHash)) {
    return jsonResponse({ error: 'Invalid hash format' }, 400);
  }

  await env.PORTAL_DATA.put('_adminHash', newHash);
  return jsonResponse({ ok: true });
}
