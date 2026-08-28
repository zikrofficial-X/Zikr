import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Starting Tafsir import...");
  const rows = [
    {
      surah_id: 1,
      ayah_number: 1,
      text: "باسم الله أبدأ قراءتي، مستعينا به سبحانه، متبركا بذكر اسمه. و (الله) هو المألوه المعبود، الذي يتوجه إليه الخلق بالعبادة والتعظيم، وهو أخص أسماء الله تعالى، ولا يسمى به غيره سبحانه.",
      source: "التفسير الميسر",
    },
    {
      surah_id: 1,
      ayah_number: 2,
      text: "(الحمد لله) الثناء على الله بصفاته التي كلُّها كمال، وبنعمه الظاهرة والباطنة، الدينية والدنيوية، وفي ضمنه أمر لعباده أن يحمدوه، فهو المستحق له وحده، وهو سبحانه المنشئ للخلق، القائم بأمورهم، المربي لجميع خلقه بنعمه، ولأوليائه بالإيمان والعمل الصالح.",
      source: "التفسير الميسر",
    }
  ];

  for (const row of rows) {
    await sql`
      insert into quran_tafsir (surah_id, ayah_number, author, tafsir_ar)
      values (${row.surah_id}, ${row.ayah_number}, ${row.source}, ${row.text})
      on conflict (surah_id, ayah_number, author) do update set
        tafsir_ar = excluded.tafsir_ar,
        updated_at = now()
    `;
  }

  console.log("Tafsir import completed successfully.");
  await sql.end();
}

main().catch(error => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});
