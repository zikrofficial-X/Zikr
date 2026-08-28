import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const result = await sql`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM
        pg_constraint c
      JOIN
        pg_namespace n ON n.oid = c.connamespace
      WHERE
        n.nspname = 'public'
        AND conrelid = 'quran_ayahs'::regclass;
    `;
    console.log('Constraints on quran_ayahs:');
    result.forEach(row => console.log(`- ${row.constraint_name} (${row.constraint_type}): ${row.constraint_definition}`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking constraints:', error);
    process.exit(1);
  }
}

main();
