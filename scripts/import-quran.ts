import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Fetching Quran data...");
  const data = await fetch(
    "https://api.alquran.cloud/v1/quran/quran-uthmani"
  ).then(response => response.json());

  if (!data?.data?.surahs) {
    throw new Error("Failed to fetch surahs data");
  }

  for (const surah of data.data.surahs) {
    console.log(`Importing Surah ${surah.number}: ${surah.name}`);
    
    const surahValues = {
      id: surah.number || 0,
      name_ar: surah.name || '',
      name_en: surah.englishName || '',
      name_translation: surah.englishNameTranslation || null,
      ayahs_count: surah.numberOfAyahs || 0,
      revelation_place: (surah.revelationType || '').toLowerCase(),
      order: surah.number || 0,
      slug: (surah.englishName || '').toLowerCase().replace(/\s+/g, "-")
    };

    await sql`
      insert into quran_surahs (id, name_ar, name_en, name_translation, ayahs_count, revelation_place, "order", slug)
      values (
        ${surahValues.id},
        ${surahValues.name_ar},
        ${surahValues.name_en},
        ${surahValues.name_translation},
        ${surahValues.ayahs_count},
        ${surahValues.revelation_place},
        ${surahValues.order},
        ${surahValues.slug}
      )
      on conflict (id) do update set
        name_ar = excluded.name_ar,
        name_en = excluded.name_en,
        name_translation = excluded.name_translation,
        ayahs_count = excluded.ayahs_count,
        revelation_place = excluded.revelation_place,
        "order" = excluded."order",
        slug = excluded.slug,
        updated_at = now()
    `;

    for (const ayah of surah.ayahs) {
      const ayahValues = {
        surah_id: surah.number || 0,
        ayah_number: ayah.numberInSurah || 0,
        text_ar: ayah.text || '',
        text_uthmani: ayah.text || '',
        text_simple: ayah.text || '',
        page: ayah.page || null,
        juz: ayah.juz || null,
        hizb: ayah.hizbQuarter || null,
        rub: ayah.hizbQuarter || null,
        sajda: ayah.sajda !== undefined ? Boolean(ayah.sajda) : false
      };

      await sql`
        insert into quran_ayahs (surah_id, ayah_number, text_ar, text_uthmani, text_simple, page, juz, hizb, rub, sajda)
        values (
          ${ayahValues.surah_id},
          ${ayahValues.ayah_number},
          ${ayahValues.text_ar},
          ${ayahValues.text_uthmani},
          ${ayahValues.text_simple},
          ${ayahValues.page},
          ${ayahValues.juz},
          ${ayahValues.hizb},
          ${ayahValues.rub},
          ${ayahValues.sajda}
        )
        on conflict (surah_id, ayah_number) do update set
          text_ar = excluded.text_ar,
          text_uthmani = excluded.text_uthmani,
          text_simple = excluded.text_simple,
          page = excluded.page,
          juz = excluded.juz,
          hizb = excluded.hizb,
          rub = excluded.rub,
          sajda = excluded.sajda,
          updated_at = now()
      `;
    }
  }

  console.log("Import completed successfully.");
  await sql.end();
}

main().catch(error => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});
