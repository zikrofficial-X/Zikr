export type StoryCategory = "prophets" | "sahaba" | "documentaries" | "history";

export interface StorySourceReference {
  label: string;
  url: string;
  type: "quran" | "hadith" | "history";
}

const PRIMARY_STORY_SOURCES: Record<string, StorySourceReference[]> = {
  "story-of-musa": [
    { label: "سورة القصص — القرآن الكريم", url: "https://quran.com/28", type: "quran" },
    { label: "سورة طه — القرآن الكريم", url: "https://quran.com/20", type: "quran" },
    { label: "سورة الشعراء — القرآن الكريم", url: "https://quran.com/26", type: "quran" },
  ],
  "story-of-yusuf": [
    { label: "سورة يوسف كاملة — القرآن الكريم", url: "https://quran.com/12", type: "quran" },
  ],
  "story-of-ibrahim": [
    { label: "سورة البقرة — القرآن الكريم", url: "https://quran.com/2", type: "quran" },
    { label: "سورة الأنعام — القرآن الكريم", url: "https://quran.com/6", type: "quran" },
    { label: "سورة مريم — القرآن الكريم", url: "https://quran.com/19", type: "quran" },
    { label: "سورة إبراهيم — القرآن الكريم", url: "https://quran.com/14", type: "quran" },
  ],
  "abu-bakr-siddiq": [
    { label: "صحيح البخاري — وفاة النبي ﷺ وموقف أبي بكر", url: "https://sunnah.com/bukhari:1241", type: "hadith" },
    { label: "صحيح البخاري — فضائل أبي بكر الصديق", url: "https://sunnah.com/bukhari/62", type: "hadith" },
  ],
  "omar-ibn-khattab": [
    { label: "صحيح البخاري — فضائل عمر بن الخطاب", url: "https://sunnah.com/bukhari:3683", type: "hadith" },
    { label: "صحيح مسلم — فضائل عمر", url: "https://sunnah.com/muslim:2398", type: "hadith" },
  ],
  "khalid-ibn-walid": [
    { label: "صحيح البخاري — فضائل خالد بن الوليد", url: "https://sunnah.com/bukhari:3757", type: "hadith" },
    { label: "صحيح البخاري — أخبار خالد في الجهاد", url: "https://sunnah.com/bukhari:3069", type: "hadith" },
  ],
  "battle-of-badr": [
    { label: "سورة الأنفال — القرآن الكريم", url: "https://quran.com/8", type: "quran" },
    { label: "سورة آل عمران — القرآن الكريم", url: "https://quran.com/3", type: "quran" },
    { label: "صحيح البخاري — أحداث بدر", url: "https://sunnah.com/bukhari:2915", type: "hadith" },
  ],
  "andalus-documentary": [
    { label: "الموسوعة البريطانية — Andalusia", url: "https://www.britannica.com/place/Andalusia", type: "history" },
  ],
};

export interface Story {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  category: StoryCategory;
  metadata?: Record<string, unknown>;
  primarySources?: StorySourceReference[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const FALLBACK_STORIES: Story[] = [
