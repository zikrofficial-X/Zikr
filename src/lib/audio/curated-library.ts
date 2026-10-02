export type CuratedAudioKind = "adhan" | "salawat" | "dhikr";

export type CuratedAudio = {
  key: string;
  kind: CuratedAudioKind;
  title: string;
  description: string;
  webUrl: string;
  sourceUrl: string;
  sourceName: string;
  license: string;
  attribution?: string;
  human: true;
};

const CLOUDINARY_AUDIO = "https://res.cloudinary.com/dcuveyab9/video/upload";

export const CURATED_AUDIO_LIBRARY: readonly CuratedAudio[] = [
  {
    key: "adhan:beautiful",
    kind: "adhan",
    title: "الأذان — Beautiful Adhan",
    description: "تسجيل أذان بشري منشور كعمل أصلي تحت CC0، مستضاف على Cloudinary لتثبيت التشغيل.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/adhan/beautiful-adhan.ogg`,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg",
    sourceName: "Wikimedia Commons — Adam-synagda",
    license: "CC0 1.0",
    attribution: "Adam-synagda",
    human: true,
  },
  {
    key: "adhan:short",
    kind: "adhan",
    title: "الأذان — تسجيل بشري قصير",
    description: "تسجيل أذان بشري منشور تحت CC0، مستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/adhan/adhan-short.ogg`,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adhan.ogg",
    sourceName: "Wikimedia Commons — Aishatu98",
    license: "CC0 1.0",
    attribution: "Aishatu98",
    human: true,
  },
  {
    key: "adhan:full",
    kind: "adhan",
    title: "الأذان — تسجيل بشري كامل",
    description: "تسجيل نداء الصلاة كاملًا، منشور تحت CC0 ومستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/adhan/adhan-full.ogg`,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Muslim_calling_to_prayer.ogg",
    sourceName: "Wikimedia Commons — Aishatu98",
    license: "CC0 1.0",
    attribution: "Aishatu98",
    human: true,
  },
  {
    key: "salawat:muhammad-pbuh",
    kind: "salawat",
    title: "الصلاة على النبي ﷺ — تسجيل بشري",
    description: "تسجيل بشري قصير للصلاة والسلام على النبي ﷺ، مستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/salawat/muhammad-peace.wav`,
    sourceUrl: "https://commons.wikimedia.org/wiki/Category:Arabic_pronunciation_of_names_of_prophets",
    sourceName: "Wikimedia Commons",
    license: "ترخيص ملف المصدر على Wikimedia Commons",
    human: true,
  },
  {
    key: "salawat:muhammad",
    kind: "salawat",
    title: "ذكر محمد ﷺ — تسجيل بشري",
    description: "مقطع بشري قصير مستقل يمكن استخدامه كتذكير صوتي، مستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/salawat/muhammad-name.wav`,
    sourceUrl: "https://commons.wikimedia.org/wiki/Category:Arabic_pronunciation_of_names_of_prophets",
    sourceName: "Wikimedia Commons",
    license: "ترخيص ملف المصدر على Wikimedia Commons",
    human: true,
  },
  {
    key: "dhikr:subhanallah-1",
    kind: "dhikr",
    title: "تسبيح — نطق بشري 1",
    description: "تسجيل بشري قصير من Lingua Libre لنطق كلمة «تسبيح»، مستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/dhikr/tasbih-1.wav`,
    sourceUrl: "https://www.wikidata.org/wiki/Q3595926",
    sourceName: "Wikidata / Lingua Libre — Spotless Mind1988",
    license: "CC BY-SA 4.0",
    attribution: "Spotless Mind1988",
    human: true,
  },
  {
    key: "dhikr:subhanallah-2",
    kind: "dhikr",
    title: "تسبيح — نطق بشري 2",
    description: "تسجيل بشري عربي آخر لنطق كلمة «تسبيح» من Lingua Libre، مستضاف على Cloudinary.",
    webUrl: `${CLOUDINARY_AUDIO}/zikr/audio/dhikr/tasbih-2.wav`,
    sourceUrl: "https://www.wikidata.org/wiki/Q3595926",
    sourceName: "Wikidata / Lingua Libre — Zinou2go",
    license: "CC BY-SA 4.0",
    attribution: "Zinou2go",
    human: true,
  },
];

export function getCuratedAudio(key: string): CuratedAudio | null {
  return CURATED_AUDIO_LIBRARY.find(audio => audio.key === key) ?? null;
}

export function getCuratedAudioByStoragePath(storagePath: string): CuratedAudio | null {
  if (!storagePath.startsWith("curated:")) return null;
  return getCuratedAudio(storagePath.slice("curated:".length));
}

export const CURATED_AUDIO_CHOICES = CURATED_AUDIO_LIBRARY.map(audio => ({
  key: "site:" + audio.key,
  label: audio.title,
  slot: (audio.kind === "adhan" ? "prayer" : audio.kind) as "prayer" | "salawat" | "dhikr",
  webUrl: audio.webUrl,
  nativeFile: null,
  human: true,
  sourceUrl: audio.sourceUrl,
  license: audio.license,
}));
