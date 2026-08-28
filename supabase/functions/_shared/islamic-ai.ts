export type IslamicAiCitation = {
  type: 'ayah' | 'hadith' | 'scholar' | 'source';
  reference: string;
  source: string;
};

export type IslamicAiAnswer = {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  citations: IslamicAiCitation[];
  safetyNotice: string;
};

const fallbackAnswer: IslamicAiAnswer = {
  answer:
    'لا أستطيع إصدار فتوى أو نسبة حكم بلا مصدر موثوق. يرجى الرجوع إلى عالم مؤهل، وسأعرض فقط ما توفر له دليل واضح من القرآن أو السنة أو مصادر علمية موثقة.',
  confidence: 'low',
  citations: [
    {
      type: 'source',
      reference: 'ZIKR Islamic AI safety policy',
      source: 'Authenticated answers require explicit citations before claims are shown.',
    },
  ],
  safetyNotice:
    'This assistant is for Islamic knowledge support, not a replacement for qualified scholars or emergency guidance.',
};

export function buildSafeFallback(): IslamicAiAnswer {
  return fallbackAnswer;
}

export function normalizeQuestion(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 1200);
}
