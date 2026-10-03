import type { PaginationMeta } from "@/lib/types/common";

export interface HadithBook {
  id: string;
  slug?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  available: number;
}

export interface Hadith {
  number: number;
  arab?: string;
  english?: string;
  id?: string;
}

export interface HadithResponse<T> {
  name: string;
  slug: string;
  total: number;
  pagination?: PaginationMeta;
  data: T;
}
