const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const batchSize = Math.max(1, Math.min(100, Number(process.env.HADITH_TRANSLATION_BATCH_SIZE ?? 50)));
const apiBase = (process.env.HADITH_API_BASE_URL ?? "https://ummahapi.com/api/hadith").replace(/\/$/, "");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

type BookRow = { id: string; slug: string; name_en: string | null };
type HadithRow = { hadith_number: string; text_en: string | null; book_id: string; ref: string | null };
type UmmahResponse = {
  success?: boolean;
  data?: {
    hadith_english?: string;
    english?: string;
    text_en?: string;
  };
};

async function supabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function fetchEnglish(bookSlug: string, number: string): Promise<string | null> {
  const response = await fetch(
    `${apiBase}/${encodeURIComponent(bookSlug)}/${encodeURIComponent(number)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as UmmahResponse;
  if (!payload.success || !payload.data) return null;
  const text =
    payload.data.hadith_english ??
    payload.data.english ??
    payload.data.text_en ??
    "";
  return text.trim() || null;
}

async function main() {
  const books = await supabase<BookRow[]>(
    "/rest/v1/hadith_books?select=id,slug,name_en&order=slug.asc",
  );
  const bookById = new Map(books.map((book) => [book.id, book]));

  const rows = await supabase<HadithRow[]>(
    "/rest/v1/hadiths?select=hadith_number,text_en,book_id,ref&published=eq.true&or=(text_en.is.null,text_en.eq.)&order=book_id.asc,hadith_number.asc&limit=" + batchSize,
  );

  console.log(`Found ${rows.length} published Hadith records missing English.`);
  let synced = 0;
  for (const row of rows) {
    const book = bookById.get(row.book_id);
    if (!book?.slug) continue;

    try {
      const english = await fetchEnglish(book.slug, row.hadith_number);
      if (!english) {
        console.warn(`No English source returned for ${book.slug}/${row.hadith_number}`);
        continue;
      }

      await supabase(
        `/rest/v1/hadiths?book_id=eq.${encodeURIComponent(row.book_id)}&hadith_number=eq.${encodeURIComponent(row.hadith_number)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            text_en: english,
          }),
        },
      );
      synced += 1;
      console.log(`Synced ${book.slug}/${row.hadith_number}`);
    } catch (error) {
      console.error(`Hadith sync failed for ${book.slug}/${row.hadith_number}:`, error);
    }
  }

  console.log(`Hadith English sync complete: ${synced}/${rows.length} synced.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});