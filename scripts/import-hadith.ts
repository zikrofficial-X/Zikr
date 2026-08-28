import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Starting Hadith import...");
  
  const books = [
    { slug: 'bukhari', nameAr: 'صحيح البخاري', nameEn: 'Sahih al-Bukhari', authorAr: 'الإمام البخاري', authorEn: 'Imam Bukhari' },
    { slug: 'muslim', nameAr: 'صحيح مسلم', nameEn: 'Sahih Muslim', authorAr: 'الإمام مسلم', authorEn: 'Imam Muslim' },
    { slug: 'tirmidhi', nameAr: 'جامع الترمذي', nameEn: 'Jami` at-Tirmidhi', authorAr: 'الإمام الترمذي', authorEn: 'Imam Tirmidhi' },
    { slug: 'abudawud', nameAr: 'سنن أبي داود', nameEn: 'Sunan Abi Dawud', authorAr: 'الإمام أبو داود', authorEn: 'Imam Abu Dawud' },
    { slug: 'nasai', nameAr: 'سنن النسائي', nameEn: 'Sunan an-Nasa\'i', authorAr: 'الإمام النسائي', authorEn: 'Imam An-Nasa\'i' },
    { slug: 'ibnmajah', nameAr: 'سنن ابن ماجه', nameEn: 'Sunan Ibn Majah', authorAr: 'الإمام ابن ماجه', authorEn: 'Imam Ibn Majah' }
  ];

  for (const b of books) {
    console.log(`Importing book: ${b.nameEn}`);
    const bookResult = await sql`
      insert into hadith_books (slug, name_ar, name_en, author_ar, author_en)
      values (${b.slug}, ${b.nameAr}, ${b.nameEn}, ${b.authorAr}, ${b.authorEn})
      on conflict (slug) do update set
        name_ar = excluded.name_ar,
        name_en = excluded.name_en,
        author_ar = excluded.author_ar,
        author_en = excluded.author_en,
        updated_at = now()
      returning id
    `;
    const bookId = bookResult[0].id;

    if (b.slug === 'bukhari') {
      const sampleHadiths = [
        { 
          number: '1', 
          textAr: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه', 
          narratorAr: 'عمر بن الخطاب', 
          gradeAr: 'صحيح', 
          chapter: 'بدء الوحي', 
          ref: 'bukhari:1' 
        },
        {
          number: '2',
          textAr: 'بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله، وإقام الصلاة، وإيتاء الزكاة، والحج، وصوم رمضان',
          narratorAr: 'عبد الله بن عمر',
          gradeAr: 'صحيح',
          chapter: 'الإيمان',
          ref: 'bukhari:8'
        }
      ];

      for (const h of sampleHadiths) {
        await sql`
          insert into hadiths (book_id, hadith_number, text_ar, narrator_ar, grade_ar)
          values (${bookId}, ${h.number}, ${h.textAr}, ${h.narratorAr}, ${h.gradeAr})
          on conflict (book_id, hadith_number) do update set
            text_ar = excluded.text_ar,
            narrator_ar = excluded.narrator_ar,
            grade_ar = excluded.grade_ar,
            updated_at = now()
        `;
      }
    }
  }

  console.log("Hadith import completed successfully.");
  await sql.end();
}

main().catch(error => {
  console.error("[import] failed:", error);
  process.exitCode = 1;
});
