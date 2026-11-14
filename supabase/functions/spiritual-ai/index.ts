import { AuthVerificationError, requireAuthenticatedUser } from '../_shared/auth.ts';
import { readBoundedJsonBody } from '../../../src/lib/request/bounded-json-body.ts';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { buildSafeFallback, normalizeQuestion } from '../_shared/islamic-ai.ts';

// v1.2.0
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, { status: 405 });
  }

  try {
    await requireAuthenticatedUser(request, {
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      anonKey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    });
  } catch (error) {
    const status = error instanceof AuthVerificationError ? error.status : 503;
    return jsonResponse(
      request,
      { error: status === 401 ? 'Unauthorized' : 'Authentication service unavailable' },
      { status },
    );
  }

  try {
    const parsedBody = await readBoundedJsonBody(request, 16 * 1024);
    if (!parsedBody.ok) {
      return jsonResponse(request, { error: parsedBody.error }, { status: parsedBody.status });
    }
    if (
      !parsedBody.value ||
      typeof parsedBody.value !== "object" ||
      Array.isArray(parsedBody.value)
    ) {
      return jsonResponse(request, { error: "Invalid request body" }, { status: 400 });
    }
    const question = normalizeQuestion(
      (parsedBody.value as Record<string, unknown>).question,
    );

    if (question.length < 3) {
      return jsonResponse(request, { error: 'Question is required.' }, { status: 400 });
    }

    return jsonResponse(request, {
      question,
      function_version: '1.2.0',
      ...buildSafeFallback(),
    });
  } catch {
    return jsonResponse(request, { error: 'Unable to process the request.' }, { status: 400 });
  }
});
