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

type MemorizationEvaluation = {
  score: number;
  summary: string;
  memorization: string;
  errors: string[];
  tajweed: string[];
  audioQuality: string;
  revisionPlan: string[];
};

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

  const outputContract = `أعد JSON فقط بدون Markdown وبدون أي نص خارج JSON، بالشكل:
{
  "score": 0,
  "summary": "",
  "memorization": "",
  "errors": [],
  "tajweed": [],
  "audioQuality": "",
  "revisionPlan": []
}
score رقم صحيح من 0 إلى 100.
errors قائمة بالأخطاء المسموعة فقط مع ذكر الكلمة/الموضع والتصحيح عند الإمكان.
tajweed قائمة قصيرة بأبرز الملاحظات المسموعة فعلًا. لا تخترع أحكامًا لم تسمعها.
revisionPlan قائمة من 3 إلى 5 خطوات عملية لمدة أسبوع.`;

  const audioPrompt = `أنت مصحح تسميع قرآن ومعلم تجويد. استمع للتسجيل الصوتي وقيّم أداء المستخدم بدقة باللغة العربية.
لا تغيّر النص القرآني المرجعي ولا تنشئ حكمًا شرعيًا جديدًا. لا تدّع سماع خطأ إن كان الصوت غير واضح.
${sharedContext}

${outputContract}

إذا كان التسجيل غير واضح، اجعل audioQuality يشرح المشكلة وخفّض الثقة في الاستنتاجات بدل اختلاق أخطاء.`;

  const textFallbackPrompt = `أنت مساعد في خطة حفظ القرآن ومراجعة التجويد. لا يوجد تسجيل صوتي؛ لا تدّع أنك قيّمت أداءً فعليًا.
المقرر:
${sharedContext}

${outputContract}

ضع score = 0، واجعل summary يوضح أن التقييم الشخصي يحتاج تسجيلًا صوتيًا، واستخدم errors فارغة، واذكر في tajweed نقاطًا تعليمية عامة مرتبطة بالمقرر فقط.`;

  function parseEvaluation(raw: string): MemorizationEvaluation | null {
    const cleaned = raw
      .replace(/^\s*```(?:json)?/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first >= 0 && last > first) {
        try { parsed = JSON.parse(cleaned.slice(first, last + 1)); } catch { parsed = null; }
      }
    }
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Record<string, unknown>;
    const arrayOfStrings = (input: unknown) =>
      Array.isArray(input)
        ? input.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean).slice(0, 8)
        : [];
    const score = Number(value.score);
    if (!Number.isFinite(score)) return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      summary: typeof value.summary === "string" ? value.summary.trim().slice(0, 600) : "",
      memorization: typeof value.memorization === "string" ? value.memorization.trim().slice(0, 400) : "",
      errors: arrayOfStrings(value.errors),
      tajweed: arrayOfStrings(value.tajweed),
      audioQuality: typeof value.audioQuality === "string" ? value.audioQuality.trim().slice(0, 300) : "",
      revisionPlan: arrayOfStrings(value.revisionPlan),
    };
  }

  function formatEvaluation(evaluation: MemorizationEvaluation): string {
    const score = `الدرجة: ${evaluation.score}/100`;
    const sections = [
      score,
      evaluation.summary ? `التقييم العام: ${evaluation.summary}` : "",
      evaluation.memorization ? `جودة الحفظ: ${evaluation.memorization}` : "",
      evaluation.audioQuality ? `جودة التسجيل: ${evaluation.audioQuality}` : "",
      evaluation.errors.length ? `أخطاء التسميع:\n- ${evaluation.errors.join("\n- ")}` : "أخطاء التسميع: لم تُرصد أخطاء محددة في التسجيل.",
      evaluation.tajweed.length ? `ملاحظات التجويد:\n- ${evaluation.tajweed.join("\n- ")}` : "",
      evaluation.revisionPlan.length ? `خطة المراجعة:\n- ${evaluation.revisionPlan.join("\n- ")}` : "",
    ].filter(Boolean);
    return sections.join("\n\n");
  }

  if (hasAudio) {
    const bytes = Buffer.from(await audio.arrayBuffer()).toString('base64');
    const response = await generateGeminiFromAudio(audioPrompt, { data: bytes, mimeType: audio.type || 'audio/webm' });
    if (response) {
      const structured = parseEvaluation(response);
      return structured ? formatEvaluation(structured) : response;
    }
  }

  const result = await generateGeminiText(textFallbackPrompt, 1600);
  if (result) {
    const structured = parseEvaluation(result);
    return structured ? formatEvaluation(structured) : result;
  }

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
