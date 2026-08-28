import { handleOptions, jsonResponse } from '../_shared/cors.ts';

// v1.1.0
Deno.serve((request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'GET') {
    return jsonResponse(request, { error: 'Method not allowed' }, { status: 405 });
  }

  return jsonResponse(request, {
    status: 'ok',
    service: 'zikr-edge-functions',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    region: Deno.env.get('DENO_REGION') ?? 'unknown',
  });
});
