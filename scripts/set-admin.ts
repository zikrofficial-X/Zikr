import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
  }

  try {
    console.log(`Setting user with email ${email} as admin...`);
    
    // This is a bit tricky because profiles are linked to auth.users
    // We need to find the ID from auth.users first if possible, or just update the profile if it exists
    
    const users = await sql.unsafe(`SELECT id FROM auth.users WHERE email = $1`, [email]);
    if (users.length === 0) {
      console.error(`User with email ${email} not found in auth.users.`);
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`Found user ID: ${userId}`);

    await sql.unsafe(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE id = $1
    `, [userId]);

    console.log(`User ${email} is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to set admin:', error);
    process.exit(1);
  }
}

main();
