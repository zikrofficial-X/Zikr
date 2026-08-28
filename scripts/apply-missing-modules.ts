import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260605000010_0010_missing_content_modules.sql');
  const content = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying missing content modules migration...');
  
  try {
    // We'll execute the whole content. Since it uses "if not exists", it should be safe.
    await sql.unsafe(content);
    console.log('Successfully applied missing content modules migration.');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
