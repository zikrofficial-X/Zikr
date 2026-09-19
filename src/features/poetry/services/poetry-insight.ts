import { generateGeminiText } from '@/features/spiritual-ai/services/gemini-client';

const MAX_TITLE_LENGTH = 200;
const MAX_POEM_LENGTH = 12_000;

export async function generatePoetryInsight(poem: string, title: string): Promise<string | null> {
  const cleanPoem = poem.trim();
  const cleanTitle = title.trim();

  if (!cleanPoem || !cleanTitle) return null;
  if (cleanTitle.length > MAX_TITLE_LENGTH || cleanPoem.length > MAX_POEM_LENGTH) return null;

  const prompt = `أنت متخصص في النقد الأدبي والشعر الإسلامي.
قصيدة بعنوان: "${cleanTitle}"
النص: "${cleanPoem}"

قدم تحليلاً قصيراً (3-4 أسطر فقط) للقصيدة يتضمن:
1. الفكرة الرئيسية
2. الأسلوب والجمال الأدبي
3. الرسالة الروحانية أو الأخلاقية

الرد يجب أن يكون باللغة العربية الفصحى وبسيط وجميل.`;

  const insight = await generateGeminiText(prompt);
  return insight?.trim() || null;
}
