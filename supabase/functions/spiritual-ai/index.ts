import { requireBearerToken } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { buildSafeFallback, normalizeQuestion } from '../_shared/islamic-ai.ts';

// v1.1.0
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, { status: 405 });
  }

  try {
    requireBearerToken(request);
    const payload = await request.json().catch(() => ({}));
    const question = normalizeQuestion(payload.question);

    if (question.length < 3) {
      return jsonResponse(request, { error: 'Question is required.' }, { status: 400 });
    }

    return jsonResponse(request, {
      question,
      function_version: '1.1.0',
      ...buildSafeFallback(),
    });
  } catch (error) {
    return jsonResponse(
      request,
      { error: error instanceof Error ? error.message : 'Unauthorized request.' },
      { status: 401 },
    );
  }
});
