import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { createVideoGenerationRequest } from '@/lib/services/video-automation';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const body = await request.json();
    const { title, description, category, narration, content } = body;
    
    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim() || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { error: 'العنوان والوصف والتصنيف حقول مطلوبة.' },
        { status: 400 }
      );
    }

    let contentObject: Record<string, unknown> = {};
    // The simple UI sends narration directly. Keep parsing legacy content only for
    // existing clients; the JSON field is no longer required from administrators.
    if (content !== undefined) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid content');
        contentObject = parsed as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: 'بيانات المحتوى القديمة غير صالحة.' }, { status: 400 });
      }
    }

    const narrationText = typeof narration === 'string' && narration.trim()
      ? narration
      : ['prompt', 'script', 'text']
          .map((field) => contentObject[field])
          .find((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? '';
    const normalizedNarration = narrationText.replace(/\s+/g, ' ').trim();
    if (normalizedNarration.length < 30) {
      return NextResponse.json(
        { error: 'اكتب نصًا صوتيًا واضحًا لا يقل عن 30 حرفًا.' },
        { status: 400 },
      );
    }
    contentObject = { ...contentObject, type: category, text: normalizedNarration, prompt: normalizedNarration };

    // Validate category
    const validCategories = ['quran', 'hadith', 'story', 'dua', 'adhkar', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }
    
    const result = await createVideoGenerationRequest({
      title: title.trim(),
      description: description.trim(),
      category,
      content: contentObject,
    });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create video request' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[api] Failed to create video request:', error);
    return NextResponse.json(
      { error: 'Failed to create video request' },
      { status: 500 }
    );
  }
}
