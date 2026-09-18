import { generateGeminiText } from '@/lib/services/gemini-client';
import { getSupabaseUser } from '@/lib/supabase/server';

/**
 * @openapi
 * POST /api/poetry-insight
 *
 * Summary: Generate AI literary analysis of a poem
 * Description: Uses Google Gemini to produce a short Arabic literary analysis of an Islamic poem.
 * Tags: AI, Poetry
 *
 * Request:
 *   Headers:
 *     - Content-Type: application/json (required)
 *   Body:
 *     - poem: string (required) - The poem text to analyze
 *     - title: string (required) - The poem title
 *
 * Responses:
 *   200:
 *     Body: { insight: string } - AI-generated analysis in Arabic
 *   400:
 *     Body: { error: "Missing poem or title" }
 *   401:
 *     Body: { error: "Authentication required." }
 *   500:
 *     Body: { error: "Failed to generate insight" | "Internal server error" }
 */
export async function POST(request: Request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Malformed JSON request body.' },
        { status: 400 },
      );
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 },
      );
    }
    const { poem, title } = body as { poem?: unknown; title?: unknown };

    if (typeof poem !== 'string' || typeof title !== 'string' || !poem.trim() || !title.trim()) {
      return Response.json(
        { error: 'Missing poem or title' },
        { status: 400 },
      );
    }
    if (title.length > 200 || poem.length > 12000) {
      return Response.json(
        { error: 'The poem or title is too long.' },
        { status: 400 },
      );
    }

    const prompt = `أنت متخصص في النقد الأدبي والشعر الإسلامي.
قصيدة بعنوان: "${title}"
النص: "${poem}"

قدم تحليلاً قصيراً (3-4 أسطر فقط) للقصيدة يتضمن:
1. الفكرة الرئيسية
2. الأسلوب والجمال الأدبي
3. الرسالة الروحانية أو الأخلاقية

الرد يجب أن يكون باللغة العربية الفصحى وبسيط وجميل.`;

    const insight = await generateGeminiText(prompt);

    if (!insight) {
      return Response.json(
        { error: 'Failed to generate insight' },
        { status: 500 },
      );
    }

    return Response.json({ insight });
  } catch (error) {
    console.error('[poetry-insight] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
