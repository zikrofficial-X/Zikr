import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Applying migration: ${file}`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      // Split by semicolon and filter out empty statements to avoid issues with some SQL features
      // However, for complex migrations with triggers/functions, this might be tricky.
      // Let's try executing the whole block first.
      await sql.unsafe(content);
      console.log(`Successfully applied ${file}`);
    } catch (error) {
      console.error(`Error applying ${file}:`, error);
      // Depending on the error, we might want to continue or stop.
      // For now, let's stop on first error.
      process.exit(1);
    }
  }

  console.log('All migrations applied successfully.');
  process.exit(0);
}

main();
