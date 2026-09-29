export type RadioCategory = "quran" | "tawasheeh";

export interface RadioChannel {
  id: string;
  name: string;
  streamUrl: string;
  description: string;
  category: RadioCategory;
  tags: string[];
}

export const RADIO_CHANNELS: RadioChannel[] = [
  {
    id: "quran-sa",
    name: "إذاعة القرآن الكريم - السعودية",
    streamUrl: "https://qurango.net/radio/tarateel",
    description: "بث قرآني مستمر مناسب للاستماع الهادئ والتدبر.",
    category: "quran",
    tags: ["قرآن", "السعودية", "مباشر"],
  },
  {
    id: "quran-eg",
    name: "إذاعة القرآن الكريم - مصر",
    streamUrl: "https://qurango.net/radio/mishary_alafasy",
    description: "تلاوات قرآنية على مدار الساعة.",
    category: "quran",
    tags: ["قرآن", "مصر", "مباشر"],
  },
  {
    id: "quran-minshawi",
    name: "إذاعة القرآن - المنشاوي",
    streamUrl: "https://qurango.net/radio/minshawi",
    description: "تلاوات الشيخ محمد صديق المنشاوي.",
    category: "quran",
    tags: ["المنشاوي", "مرتل", "قرآن"],
  },
  {
    id: "quran-abdulbasit",
    name: "إذاعة القرآن - عبد الباسط",
    streamUrl: "https://qurango.net/radio/abdulbasit",
    description: "تلاوات الشيخ عبد الباسط عبد الصمد.",
    category: "quran",
    tags: ["عبد الباسط", "قرآن"],
  },
  {
    id: "quran-husary",
    name: "إذاعة القرآن - الحصري",
    streamUrl: "https://qurango.net/radio/husary",
    description: "تلاوات الشيخ محمود خليل الحصري.",
    category: "quran",
    tags: ["الحصري", "قرآن"],
  },
  {
    id: "quran-sudais",
    name: "إذاعة القرآن - السديس",
    streamUrl: "https://qurango.net/radio/sudais",
    description: "تلاوات الشيخ عبد الرحمن السديس.",
    category: "quran",
    tags: ["السديس", "قرآن"],
  },
  {
    id: "quran-maher",
    name: "إذاعة القرآن - ماهر المعيقلي",
    streamUrl: "https://qurango.net/radio/maher_al_muaiqly",
    description: "تلاوات الشيخ ماهر المعيقلي.",
    category: "quran",
    tags: ["ماهر المعيقلي", "قرآن"],
  },
  {
    id: "quran-ghamdi",
    name: "إذاعة القرآن - سعد الغامدي",
    streamUrl: "https://qurango.net/radio/saad_al_ghamdi",
    description: "تلاوات الشيخ سعد الغامدي.",
    category: "quran",
    tags: ["سعد الغامدي", "قرآن"],
  },
  {
    id: "quran-yasser",
    name: "إذاعة القرآن - ياسر الدوسري",
    streamUrl: "https://qurango.net/radio/yasser_al_dosari",
    description: "تلاوات الشيخ ياسر الدوسري.",
    category: "quran",
    tags: ["ياسر الدوسري", "قرآن"],
  },
  {
    id: "quran-nasser",
    name: "إذاعة القرآن - ناصر القطامي",
    streamUrl: "https://qurango.net/radio/nasser_al_qatami",
    description: "تلاوات الشيخ ناصر القطامي.",
    category: "quran",
    tags: ["ناصر القطامي", "قرآن"],
  },
  {
    id: "quran-idris",
    name: "إذاعة القرآن - إدريس أبكر",
    streamUrl: "https://qurango.net/radio/idrees_abkar",
    description: "تلاوات الشيخ إدريس أبكر.",
    category: "quran",
    tags: ["إدريس أبكر", "قرآن"],
  },
  {
    id: "quran-ajmi",
    name: "إذاعة القرآن - أحمد العجمي",
    streamUrl: "https://qurango.net/radio/ahmed_al_ajmi",
    description: "تلاوات الشيخ أحمد العجمي.",
    category: "quran",
    tags: ["أحمد العجمي", "قرآن"],
  },
  {
    id: "quran-shuraim",
    name: "إذاعة القرآن - سعود الشريم",
    streamUrl: "https://qurango.net/radio/shuraim",
    description: "تلاوات الشيخ سعود الشريم.",
    category: "quran",
    tags: ["الشريم", "قرآن"],
  },
  {
    id: "tawasheeh-maher",
    name: "إذاعة تلاوات - ماهر المعيقلي",
    streamUrl: "https://qurango.net/radio/maher_al_muaiqly",
    description: "قناة مخصصة لتلاوات ماهر المعيقلي.",
    category: "tawasheeh",
    tags: ["تلاوات", "ماهر المعيقلي"],
  },
  {
    id: "tawasheeh-ghamdi",
    name: "إذاعة التلاوات - سعد الغامدي",
    streamUrl: "https://qurango.net/radio/saad_al_ghamdi",
    description: "قناة تلاوات سعد الغامدي للاستماع الطويل.",
    category: "tawasheeh",
    tags: ["تلاوات", "سعد الغامدي"],
  },
];

export function getRadioChannels(): RadioChannel[] {
  return RADIO_CHANNELS;
}
