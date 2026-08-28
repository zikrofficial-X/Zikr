import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const surahs = await sql`SELECT count(*) FROM quran_surahs`;
    const ayahs = await sql`SELECT count(*) FROM quran_ayahs`;
    console.log(`Current progress:`);
    console.log(`- Surahs: ${surahs[0].count}`);
    console.log(`- Ayahs: ${ayahs[0].count}`);
    process.exit(0);
  } catch (error) {
    console.error('Error checking progress:', error);
    process.exit(1);
  }
}

main();
