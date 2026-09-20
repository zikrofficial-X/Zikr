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
import { generateGeminiFromAudio, generateGeminiText } from '@/features/spiritual-ai/services/gemini-client';
import {
  deleteMemorizationProgress as deleteMemorizationProgressService,
  getCurrentMemorizationProgress,
  saveMemorizationProgress,
  type MemorizationEntry,
} from "@/features/memorization/services/progress";

export type { MemorizationEntry };


export async function evaluateMemorizationAction(formData: FormData) {
  const targetValue = formData.get('target');
  const expectedValue = formData.get('expectedText');
  const target = typeof targetValue === 'string' ? targetValue.trim().slice(0, 500) : '';
  const expectedText = typeof expectedValue === 'string' ? expectedValue.trim().slice(0, 5000) : '';
  const audio = formData.get('audio');

  const hasTarget = target.length > 0;
  const hasExpected = expectedText.length > 0;
  const hasAudio = audio instanceof File && audio.size > 0;

  if (audio instanceof File && audio.size > 10 * 1024 * 1024) {
    return 'حجم التسجيل كبير جدًا. الحد الأقصى المسموح به هو 10 ميجابايت.';
  }
  if (audio instanceof File && audio.type && !audio.type.startsWith('audio/')) {
    return 'صيغة التسجيل غير مدعومة. ارفع ملفًا صوتيًا فقط.';
  }
  if (!hasAudio && !hasTarget && !hasExpected) {
    return 'حدد الورد أو ارفع تسجيلًا صوتيًا للحصول على التقييم.';
  }

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

export async function getMemorizationProgress() {
  return getCurrentMemorizationProgress();
}

export async function upsertMemorizationProgress(input: {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  memorizedAyahs: number;
}) {
  return saveMemorizationProgress(input);
}

export async function deleteMemorizationProgress(surahNumber: number) {
  return deleteMemorizationProgressService(surahNumber);
}
