const CANONICAL_ORIGIN = 'https://zikrmediaofficial.vercel.app';

const allowedOrigins = new Set(
  [CANONICAL_ORIGIN, ...(Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',')]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

export function corsHeaders(request: Request): HeadersInit {
  const origin = (request.headers.get('origin') ?? '').trim().replace(/\/$/, '');
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : CANONICAL_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function jsonResponse(request: Request, body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(request),
      ...(init.headers ?? {}),
    },
  });
}

export function handleOptions(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
