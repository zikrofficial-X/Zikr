import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hadiths'
    `;
    console.log('Columns in hadiths:');
    result.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking columns:', error);
    process.exit(1);
  }
}

main();
