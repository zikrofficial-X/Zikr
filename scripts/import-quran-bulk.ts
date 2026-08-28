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

  const surahs = data.data.surahs;
  console.log(`Found ${surahs.length} surahs. Starting bulk import...`);

  for (const surah of surahs) {
    console.log(`Processing Surah ${surah.number}: ${surah.name}`);
    
    // Insert Surah
    await sql`
      insert into quran_surahs (id, name_ar, name_en, name_translation, ayahs_count, revelation_place, "order", slug)
      values (
        ${surah.number || 0},
        ${surah.name || ''},
        ${surah.englishName || ''},
        ${surah.englishNameTranslation || null},
        ${surah.numberOfAyahs || 0},
        ${(surah.revelationType || '').toLowerCase()},
        ${surah.number || 0},
        ${(surah.englishName || '').toLowerCase().replace(/\s+/g, "-")}
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

    // Prepare Ayahs for bulk insert
    const ayahsData = surah.ayahs.map((ayah: Record<string, unknown>) => {
      const mapped = {
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
      
      // Final safety check for any undefined values
      Object.keys(mapped).forEach(key => {
        if (mapped[key] === undefined) mapped[key] = null;
      });
      
      return mapped;
    });

    // Bulk insert Ayahs in chunks to avoid large query issues
    const chunkSize = 50;
    for (let i = 0; i < ayahsData.length; i += chunkSize) {
      const chunk = ayahsData.slice(i, i + chunkSize);
      try {
        await sql`
          insert into quran_ayahs ${sql(chunk)}
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
      } catch (err) {
        console.error(`Failed to insert chunk for surah ${surah.number}:`, err);
        // If bulk fails, try one by one as fallback
        for (const ayah of chunk) {
          await sql`
            insert into quran_ayahs (surah_id, ayah_number, text_ar, text_uthmani, text_simple, page, juz, hizb, rub, sajda)
            values (
              ${ayah.surah_id},
              ${ayah.ayah_number},
              ${ayah.text_ar},
              ${ayah.text_uthmani},
              ${ayah.text_simple},
              ${ayah.page},
              ${ayah.juz},
              ${ayah.hizb},
              ${ayah.rub},
              ${ayah.sajda}
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
    }
  }

  console.log("Bulk import completed successfully.");
  await sql.end();
}

main().catch(error => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});
