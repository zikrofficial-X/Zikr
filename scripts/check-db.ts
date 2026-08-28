import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function checkDb() {
  const sql = postgres(connectionString!);
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in database:");
    tables.forEach(t => console.log(`- ${t.table_name}`));
    
    const usersCount = await sql`SELECT count(*) FROM users`;
    console.log(`Total users: ${usersCount[0].count}`);
  } catch (error) {
    console.error("Database check failed:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

checkDb();
