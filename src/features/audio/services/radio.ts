export interface RadioChannel {
  id: string;
  name: string;
  streamUrl: string;
  description: string;
  category: "quran" | "tawasheeh";
}

export const RADIO_CHANNELS: RadioChannel[] = [
  {
    id: "quran-sa",
    name: "إذاعة القرآن الكريم - السعودية",
    streamUrl: "https://qurango.net/radio/tarateel",
    description: "تلاوات خاشعة من القرآن الكريم",
    category: "quran",
  },
  {
    id: "quran-eg",
    name: "إذاعة القرآن الكريم - مصر",
    streamUrl: "https://qurango.net/radio/mishary_alafasy",
    description: "تلاوات قرآنية على مدار الساعة",
    category: "quran",
  },
  {
    id: "quran-minshawi",
    name: "إذاعة القرآن - المنشاوي",
    streamUrl: "https://qurango.net/radio/minshawi",
    description: "تلاوات الشيخ محمد صديق المنشاوي",
    category: "quran",
  },
  {
    id: "quran-abdulbasit",
    name: "إذاعة القرآن - عبد الباسط",
    streamUrl: "https://qurango.net/radio/abdulbasit",
    description: "تلاوات الشيخ عبد الباسط عبد الصمد",
    category: "quran",
  },
  {
    id: "quran-husary",
    name: "إذاعة القرآن - الحصري",
    streamUrl: "https://qurango.net/radio/husary",
    description: "تلاوات الشيخ محمود خليل الحصري",
    category: "quran",
  },
  {
    id: "quran-sudais",
    name: "إذاعة القرآن - السديس",
    streamUrl: "https://qurango.net/radio/sudais",
    description: "تلاوات الشيخ عبد الرحمن السديس",
    category: "quran",
  },
  {
    id: "tawasheeh-maher",
    name: "إذاعة تلاوات - ماهر المعيقلي",
    streamUrl: "https://qurango.net/radio/maher_al_muaiqly",
    description: "تلاوات الشيخ ماهر المعيقلي",
    category: "tawasheeh",
  },
  {
    id: "tawasheeh-ghamdi",
    name: "إذاعة القرآن - سعد الغامدي",
    streamUrl: "https://qurango.net/radio/saad_al_ghamdi",
    description: "تلاوات الشيخ سعد الغامدي",
    category: "tawasheeh",
  },
];

export function getRadioChannels(): RadioChannel[] {
  return RADIO_CHANNELS;
}
