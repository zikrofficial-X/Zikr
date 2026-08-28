import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

async function main() {
  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/`;
    console.log(`Checking Supabase REST at: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    console.log(`Response status: ${response.status}`);
    if (response.ok) {
      console.log('Supabase REST is reachable and authenticated.');
      const data = await response.json();
      console.log('Available tables/views:', Object.keys(data.definitions || {}));
    } else {
      const errorText = await response.text();
      console.error('Supabase REST authentication failed:', errorText);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Error connecting to Supabase REST:', error);
    process.exitCode = 1;
  }
}

main();
