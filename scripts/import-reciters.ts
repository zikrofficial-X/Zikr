import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Starting Reciters import...");
  const reciters = [
    {
      name_ar: "محمود خليل الحصري",
      name_en: "Mahmoud Khalil Al-Husary",
      code: "husary",
      style: "Murattal",
      base_url_template: "https://everyayah.com/data/Husary_128kbps",
    },
    {
      name_ar: "محمد صديق المنشاوي",
      name_en: "Mohamed Siddiq Al-Minshawi",
      code: "minshawi",
      style: "Murattal",
      base_url_template: "https://everyayah.com/data/Minshawy_Murattal_128kbps",
    },
    {
      name_ar: "عبد الباسط عبد الصمد",
      name_en: "AbdulBaset AbdulSamad",
      code: "abdulbaset",
      style: "Mujawwad",
      base_url_template: "https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com",
    },
    {
      name_ar: "مشاري راشد العفاسي",
      name_en: "Mishary Rashid Alafasy",
      code: "alafasy",
      style: "Murattal",
      base_url_template: "https://everyayah.com/data/Alafasy_128kbps",
    }
  ];

  for (const reciter of reciters) {
    await sql`
      insert into quran_reciters (name_ar, name_en, code, style, base_url_template)
      values (${reciter.name_ar}, ${reciter.name_en}, ${reciter.code}, ${reciter.style}, ${reciter.base_url_template})
      on conflict (code) do update set
        name_ar = excluded.name_ar,
        name_en = excluded.name_en,
        style = excluded.style,
        base_url_template = excluded.base_url_template,
        updated_at = now()
    `;
  }

  console.log("Reciters import completed successfully.");
  await sql.end();
}

main().catch(error => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});
