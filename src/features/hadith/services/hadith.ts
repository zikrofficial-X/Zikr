import { getServerEnv } from "@/lib/env";
import { safeApiFetch } from "@/lib/services/http";
import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import type { Hadith, HadithBook, HadithResponse } from "@/features/hadith/types/hadith";
import type { PaginationMeta } from "@/lib/types/common";

const LEGACY_HADITH_API_BASE = "https://api.hadith.gading.dev";
const HADITH_API_BASE =
  getServerEnv().HADITH_API_BASE_URL || "https://ummahapi.com/api/hadith";
const IS_UMMAH_API = /ummahapi\.com\/api\/hadith/i.test(HADITH_API_BASE);

interface LegacyApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

type DbHadithBook = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  hadith_count: number | null;
};

type DbHadith = {
  hadith_number: string;
  text_ar: string;
  ref: string | null;
};

type UmmahCollection = {
  key?: string;
  name?: string;
  arabic_name?: string;
  total_hadiths?: number;
};

type UmmahHadith = {
  id?: string;
  hadithnumber?: number | string;
  arabic?: string;
  text_ar?: string;
};

type UmmahBooksResponse = {
  success?: boolean;
  data?: { collections?: UmmahCollection[] };
};

type UmmahCollectionResponse = {
  success?: boolean;
  data?: {
    collection?: string;
    collection_name?: string;
    page?: number;
    limit?: number;
    total?: number;
    hadiths?: UmmahHadith[];
  };
};

type UmmahSingleResponse = {
  success?: boolean;
  data?: UmmahHadith;
};

async function readSupabase<T>(path: string): Promise<T | null> {
  try {
    return await supabaseServerAnonRequest<T>(path);
  } catch (error) {
    console.error(
      "[hadith-service] Supabase content read failed; falling back to external API:",
      error,
    );
    return null;
  }
}

function mapDbHadithBook(book: DbHadithBook): HadithBook {
  return {
    id: book.slug,
    slug: book.slug,
    name: book.name_ar,
    available: book.hadith_count ?? 0,
  };
}

function mapDbHadith(hadith: DbHadith): Hadith {
  return {
    number: Number.parseInt(hadith.hadith_number, 10),
    arab: hadith.text_ar,
    id: hadith.ref ?? hadith.hadith_number,
  };
}

function mapUmmahBook(book: UmmahCollection): HadithBook | null {
  const slug = book.key?.trim();
  if (!slug) return null;

  return {
    id: slug,
    slug,
    name: book.arabic_name || book.name || slug,
    available: Number(book.total_hadiths) || 0,
  };
}

function mapUmmahHadith(hadith: UmmahHadith): Hadith | null {
  const rawNumber = Number(hadith.hadithnumber);
  const arab = hadith.arabic || hadith.text_ar;
  if (!Number.isFinite(rawNumber) || !arab) return null;

  return {
    number: rawNumber,
    arab,
    id: hadith.id || String(rawNumber),
  };
}

async function getUmmahBooks(): Promise<HadithBook[]> {
  const { data, error } = await safeApiFetch<UmmahBooksResponse>(
    `${HADITH_API_BASE.replace(/\/$/, "")}/collections`,
  );
  if (error || !data?.success) return [];

  return (data.data?.collections ?? [])
    .map(mapUmmahBook)
    .filter((book): book is HadithBook => Boolean(book));
}

async function getUmmahBook(
  slug: string,
  page: number,
  limit: number,
): Promise<HadithResponse<Hadith[]> | null> {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  const { data, error } = await safeApiFetch<UmmahCollectionResponse>(
    `${HADITH_API_BASE.replace(/\/$/, "")}/${encodeURIComponent(slug)}?${params.toString()}`,
  );
  const collection = data?.data;
  if (error || !data?.success || !collection) return null;

  const mapped = (collection.hadiths ?? [])
    .map(mapUmmahHadith)
    .filter((hadith): hadith is Hadith => Boolean(hadith));
  const total = Number(collection.total) || mapped.length;
  const pagination: PaginationMeta = {
    currentPage: Number(collection.page) || page,
    pageSize: Number(collection.limit) || limit,
    totalItems: total,
    totalPages: Math.max(
      1,
      Math.ceil(total / (Number(collection.limit) || limit)),
    ),
  };

  return {
    name: collection.collection_name || slug,
    slug: collection.collection || slug,
    total,
    pagination,
    data: mapped,
  };
}

async function getUmmahHadithByNumber(
  book: string,
  number: number,
): Promise<Hadith | null> {
  const { data, error } = await safeApiFetch<UmmahSingleResponse>(
    `${HADITH_API_BASE.replace(/\/$/, "")}/${encodeURIComponent(book)}/${number}`,
  );
  if (error || !data?.success) return null;
  return data.data ? mapUmmahHadith(data.data) : null;
}

export async function getHadithBooks(): Promise<HadithBook[]> {
  const dbBooks = await readSupabase<DbHadithBook[]>(
    "/rest/v1/hadith_books?select=id,slug,name_ar,name_en,hadith_count&order=slug.asc",
  );
  if (dbBooks?.length) return dbBooks.map(mapDbHadithBook);

  if (IS_UMMAH_API) return getUmmahBooks();

  const { data: res } = await safeApiFetch<
    LegacyApiResponse<Record<string, { name: string; available: number }>>
  >(`${HADITH_API_BASE || LEGACY_HADITH_API_BASE}/books`);
  return Object.entries(res?.data ?? {}).map(([id, value]) => ({
    id,
    slug: id,
    ...value,
  }));
}

export async function getHadithBook(
  slug: string,
  page = 1,
  limit = 20,
): Promise<HadithResponse<Hadith[]> | null> {
  const clean = slug.trim();
  if (!clean) return null;

  const dbBooks = await readSupabase<DbHadithBook[]>(
    `/rest/v1/hadith_books?select=id,slug,name_ar,name_en,hadith_count&slug=eq.${encodeURIComponent(clean)}&limit=1`,
  );
  if (dbBooks?.[0]) {
    const from = Math.max(0, (page - 1) * limit);
    const dbHadiths = await readSupabase<DbHadith[]>(
      `/rest/v1/hadiths?select=hadith_number,text_ar,ref&book_id=eq.${dbBooks[0].id}&published=eq.true&order=hadith_number.asc&offset=${from}&limit=${limit}`,
    );
    const total = dbBooks[0].hadith_count ?? dbHadiths?.length ?? 0;
    const pagination: PaginationMeta = {
      currentPage: page,
      pageSize: limit,
      totalItems: total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return {
      name: dbBooks[0].name_ar,
      slug: dbBooks[0].slug,
      total,
      pagination,
      data: (dbHadiths ?? []).map(mapDbHadith),
    };
  }

  if (IS_UMMAH_API) return getUmmahBook(clean, page, limit);

  try {
    const { data: result } = await safeApiFetch<
      LegacyApiResponse<{
        name: string;
        id: string;
        available: number;
        requested: number;
        hadiths: Hadith[];
      }>
    >(
      `${HADITH_API_BASE || LEGACY_HADITH_API_BASE}/books/${encodeURIComponent(clean)}?range=${page}-${page + limit - 1}`,
    );

    const total = result?.data?.available ?? 0;
    const pagination: PaginationMeta = {
      currentPage: page,
      pageSize: limit,
      totalItems: total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return {
      name: result?.data?.name ?? clean,
      slug: result?.data?.id ?? clean,
      total,
      pagination,
      data: result?.data?.hadiths ?? [],
    };
  } catch (error) {
    console.error("[hadith-service] Failed to fetch book:", clean, error);
    return null;
  }
}

export async function getHadithByNumber(
  book: string,
  number: number,
): Promise<Hadith | null> {
  if (!book.trim() || number < 1) return null;

  const dbBooks = await readSupabase<Pick<DbHadithBook, "id">[]>(
    `/rest/v1/hadith_books?select=id&slug=eq.${encodeURIComponent(book)}&limit=1`,
  );
  if (dbBooks?.[0]) {
    const dbHadiths = await readSupabase<DbHadith[]>(
      `/rest/v1/hadiths?select=hadith_number,text_ar,ref&book_id=eq.${dbBooks[0].id}&hadith_number=eq.${number}&published=eq.true&limit=1`,
    );
    if (dbHadiths?.[0]) return mapDbHadith(dbHadiths[0]);
  }

  if (IS_UMMAH_API) return getUmmahHadithByNumber(book, number);

  const { data: res } = await safeApiFetch<
    LegacyApiResponse<{ name: string; id: string; contents: Hadith }>
  >(
    `${HADITH_API_BASE || LEGACY_HADITH_API_BASE}/books/${encodeURIComponent(book)}/${number}`,
  );
  return res?.data?.contents ?? null;
}

export async function searchHadith(query: string): Promise<Hadith[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const escapedQuery = q.replace(/[*,()]/g, "");
  const dbHadiths = await readSupabase<DbHadith[]>(
    `/rest/v1/hadiths?select=hadith_number,text_ar,ref&published=eq.true&or=${encodeURIComponent(`(text_ar.ilike.*${escapedQuery}*,ref.ilike.*${escapedQuery}*)`)}&limit=50`,
  );
  if (dbHadiths?.length) return dbHadiths.map(mapDbHadith);

  const books = await getHadithBooks();
  const seedBooks = books.slice(0, 3);

  const collections = await Promise.all(
    seedBooks.map(book => getHadithBook(book.id, 1, 50)),
  );
  return collections
    .flatMap(collection => collection?.data ?? [])
    .filter(
      item => item.arab?.toLowerCase().includes(q) || item.id?.toLowerCase().includes(q),
    );
}
