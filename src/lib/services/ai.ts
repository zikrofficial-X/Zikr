import { generateGeminiText } from './gemini-client';

interface AIContext {
  locale?: 'ar' | 'en';
  source?: string;
}

function fallbackExplanation(type: 'ayah' | 'hadith', locale: 'ar' | 'en' = 'en') {
  if (locale === 'ar') {
    return type === 'ayah'
      ? 'شرح مبدئي: سيتم إضافة تفسير موسع من مصادر موثوقة لاحقًا.'
      : 'شرح مبدئي: سيتم ربط شروح العلماء في تحديثات قادمة.';
  }

  return type === 'ayah'
    ? 'Starter explanation: detailed tafsir integration will be added from trusted public sources.'
    : 'Starter explanation: scholarly commentary linking is planned for future releases.';
}

export async function explainAyah(ayahText: string, context: AIContext = {}): Promise<string> {
  if (!ayahText.trim()) return 'No ayah text was provided.';

  try {
    const locale = context.locale ?? 'en';
    const prompt = `You are an Islamic assistant. Give a concise, respectful explanation of this Quran ayah in ${locale === 'ar' ? 'Arabic' : 'English'}.
Keep the answer under 120 words and avoid speculative claims.
Ayah: ${ayahText}`;

    const generated = await generateGeminiText(prompt);
    return generated ?? fallbackExplanation('ayah', locale);
  } catch {
    return fallbackExplanation('ayah', context.locale ?? 'en');
  }
}

export async function explainHadith(hadithText: string, context: AIContext = {}): Promise<string> {
  if (!hadithText.trim()) return 'No hadith text was provided.';

  try {
    const locale = context.locale ?? 'en';
    const prompt = `You are an Islamic assistant. Give a concise explanation of this hadith in ${locale === 'ar' ? 'Arabic' : 'English'}.
Mention lessons and keep it under 120 words.
Hadith: ${hadithText}`;

    const generated = await generateGeminiText(prompt);
    return generated ?? fallbackExplanation('hadith', locale);
  } catch {
    return fallbackExplanation('hadith', context.locale ?? 'en');
  }
}

export async function suggestDhikr(mood: string, context: AIContext = {}): Promise<string[]> {
  const normalized = mood.trim().toLowerCase();
  const defaults = context.locale === 'ar'
    ? ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ']
    : ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'];

  if (!normalized) return defaults;

  try {
    const locale = context.locale ?? 'en';
    const prompt = `Return exactly 3 short dhikr suggestions for someone feeling "${normalized}" in ${locale === 'ar' ? 'Arabic' : 'English transliteration'}.
Return one suggestion per line with no numbering.`;

    const generated = await generateGeminiText(prompt);
    if (!generated) return defaults;

    const parsed = generated
      .split('\n')
      .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    return parsed.length ? parsed : defaults;
  } catch {
    return defaults;
  }
}
