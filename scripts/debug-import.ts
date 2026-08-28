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

  const surah = data.data.surahs[0];
  console.log(`Processing Surah ${surah.number}: ${surah.name}`);

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
    
    // Check for undefined values
    for (const [key, value] of Object.entries(mapped)) {
      if (value === undefined) {
        console.log(`FOUND UNDEFINED: key=${key}, value=${value}`);
      }
    }
    
    return mapped;
  });

  console.log("First ayah data:", ayahsData[0]);
  
  try {
    const chunk = ayahsData.slice(0, 1);
    console.log("Attempting single insert with sql(chunk)...");
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
    console.log("Insert successful!");
  } catch (err) {
    console.error("Insert failed:", err);
  }

  await sql.end();
}

main();
