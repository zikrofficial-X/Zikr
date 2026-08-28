'use server';

/**
 * @openapi
 * POST /memorization/evaluate (Server Action: evaluateMemorizationAction)
 *
 * Summary: Evaluate Quran recitation via AI
 * Description: Uses Google Gemini to evaluate a Quran recitation recording. Returns feedback on memorization quality, tajweed rules, overall score (0-100), and review advice in Arabic.
 * Tags: AI, Memorization
 * Auth: None
 *
 * Request (FormData):
 *   - target: string (optional) - Target passage reference
 *   - expectedText: string (optional) - Expected Quran text
 *   - audio: File (optional) - Audio recording (webm/wav)
 *
 * Response:
 *   - string: AI-generated evaluation in Arabic
 */
import { generateGeminiFromAudio, generateGeminiText } from '@/lib/services/gemini-client';

export async function evaluateMemorizationAction(formData: FormData) {
  const target = String(formData.get('target') ?? '').trim();
  const expectedText = String(formData.get('expectedText') ?? '').trim();
  const audio = formData.get('audio');

  const hasTarget = target.length > 0;
  const hasExpected = expectedText.length > 0;
  const hasAudio = audio instanceof File && audio.size > 0;

  const sharedContext = `
المقرر / الورد: ${hasTarget ? target : 'غير محدد — قيّم ما سمعت'}
النص المتوقع أو سؤال أكمل: ${hasExpected ? expectedText : 'غير محدد'}`;

  const audioPrompt = `أنت مصحح قرآني خبير ومعلم تجويد. استمع للتسجيل الصوتي وقيّم التسميع بدقة واحترافية باللغة العربية.

${sharedContext}

يجب أن يشمل تقييمك هذه المحاور بالترتيب:

**أولاً — جودة الحفظ**
حدد هل الحفظ سليم أم يوجد أخطاء. إن وُجدت أخطاء اذكرها بالتفصيل (الآية أو الكلمة الخاطئة وتصحيحها).

**ثانيًا — أحكام التجويد**
قيّم: المدود (مد طبيعي، مد واجب، مد لازم)، الغنة والإدغام، القلقلة، مخارج الحروف، الوقف والابتداء.

**ثالثًا — الدرجة الإجمالية**
أعطِ درجة من 100 مع مبررها.

**رابعًا — خطة المراجعة**
خطوات عملية محددة لتثبيت الحفظ وتحسين التجويد خلال أسبوع.

إذا كان الصوت غير واضح أو به تشويش، اذكر ذلك واطلب إعادة التسجيل في بيئة هادئة.`;

  const textFallbackPrompt = `أنت مصحح قرآني خبير ومعلم تجويد. المستخدم لم يرفع تسجيلًا صوتيًا، لكنه حدد المقرر الآتي:
${sharedContext}

بناءً على هذا المقرر:

**أولاً — معلومات عن هذا الجزء**
اذكر ما يميز هذا الجزء من القرآن من حيث المدود والأحكام الشائعة فيه.

**ثانيًا — أبرز أحكام التجويد في هذا الجزء**
اذكر 5 أحكام تجويد مهمة يجب التركيز عليها عند تسميع هذا الورد (مع أمثلة من الآيات إن أمكن).

**ثالثًا — الأخطاء الشائعة في هذا الجزء**
ما أكثر الأخطاء التي يقع فيها المتعلمون في هذا الجزء تحديدًا.

**رابعًا — خطة مراجعة أسبوعية**
جدول مقترح لمراجعة وتثبيت هذا الورد خلال 7 أيام.

**تنبيه:** سجّل تسميعك الصوتي في القسم أعلاه للحصول على تقييم شخصي دقيق لأدائك.`;

  if (hasAudio) {
    const bytes = Buffer.from(await audio.arrayBuffer()).toString('base64');
    const response = await generateGeminiFromAudio(audioPrompt, { data: bytes, mimeType: audio.type || 'audio/webm' });
    if (response) return response;
  }

  const result = await generateGeminiText(textFallbackPrompt, 2000);
  if (result) return result;

  return hasTarget
    ? `لم يتمكن النظام من الاتصال بالذكاء الاصطناعي حاليًا. المقرر المحدد: "${target}". تأكد من تفعيل GEMINI_API_KEY وحاول مجددًا.`
    : 'سجّل تسميعك الصوتي وحدد الورد للحصول على تقييم الحفظ والتجويد. تأكد من تفعيل GEMINI_API_KEY.';
}

// ---------------------------------------------------------------------------
// Memorization progress tracking (per-user, stored in Supabase)
// ---------------------------------------------------------------------------

export interface MemorizationEntry {
  id: string;
  surah_number: number;
  surah_name: string;
  total_ayahs: number;
  memorized_ayahs: number;
  last_reviewed_at: string | null;
}

export async function getMemorizationProgress(): Promise<{ entries: MemorizationEntry[]; loggedIn: boolean }> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entries: [], loggedIn: false };

    const { data } = await supabase
      .from('memorization_progress')
      .select('id, surah_number, surah_name, total_ayahs, memorized_ayahs, last_reviewed_at')
      .eq('user_id', user.id)
      .order('surah_number', { ascending: true });

    return { entries: (data as MemorizationEntry[]) ?? [], loggedIn: true };
  } catch {
    return { entries: [], loggedIn: false };
  }
}

export async function upsertMemorizationProgress(input: {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  memorizedAyahs: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { surahNumber, surahName, totalAyahs, memorizedAyahs } = input;
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return { ok: false, error: 'رقم سورة غير صالح' };
  }
  if (!Number.isInteger(memorizedAyahs) || memorizedAyahs < 0 || memorizedAyahs > totalAyahs) {
    return { ok: false, error: 'عدد آيات غير صالح' };
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'يجب تسجيل الدخول لحفظ تقدمك' };

    const { error } = await supabase
      .from('memorization_progress')
      .upsert(
        {
          user_id: user.id,
          surah_number: surahNumber,
          surah_name: surahName,
          total_ayahs: totalAyahs,
          memorized_ayahs: memorizedAyahs,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,surah_number' },
      );

    if (error) return { ok: false, error: 'تعذر حفظ التقدم. تأكد من تشغيل آخر migration.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'حدث خطأ غير متوقع' };
  }
}

export async function deleteMemorizationProgress(surahNumber: number): Promise<{ ok: boolean }> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    await supabase
      .from('memorization_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('surah_number', surahNumber);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
