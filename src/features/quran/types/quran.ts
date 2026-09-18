export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | Record<string, unknown>;
}

export interface Juz {
  number: number;
  ayahs: Ayah[];
  surahs: Record<string, Surah>;
  edition?: {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
  };
}

export interface QuranApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  baseUrlTemplate: string;
  type: 'surah' | 'ayah';
}
