import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authToken = process.env.TEST_AUTH_JWT;

if (!url || !anonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join('reports', 'rls-auth', stamp);
mkdirSync(outDir, { recursive: true });

type Actor = 'anon' | 'authenticated' | 'service_role';

type Result = {
  actor: Actor;
  table: string;
  method: string;
  status: number;
  ok: boolean;
  body: string;
};

async function call(actor: Actor, table: string, method: string, body?: unknown): Promise<Result> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: anonKey };
  if (actor === 'authenticated' && authToken) headers.Authorization = `Bearer ${authToken}`;
  if (actor === 'service_role' && serviceRole) {
    headers.apikey = serviceRole;
    headers.Authorization = `Bearer ${serviceRole}`;
  }
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { actor, table, method, status: res.status, ok: res.ok, body: text.slice(0, 400) };
}

async function main() {
  const targets = ['profiles', 'favorites', 'reading_progress', 'reminders', 'subscriptions', 'payments'];
  const results: Result[] = [];

  for (const table of targets) {
    results.push(await call('anon', table, 'GET'));
    results.push(await call('anon', table, 'POST', {}));

    if (authToken) {
      results.push(await call('authenticated', table, 'GET'));
      results.push(await call('authenticated', table, 'POST', {}));
    }

    if (serviceRole) {
      results.push(await call('service_role', table, 'GET'));
      results.push(await call('service_role', table, 'POST', {}));
    }
  }

  writeFileSync(join(outDir, 'matrix.json'), JSON.stringify(results, null, 2));
  writeFileSync(join('reports', 'rls-auth', 'latest.txt'), `${outDir}\n`);
  console.log(`RLS/auth report written to: ${outDir}`);
}

main().catch((err) => {
  console.error('[rls-auth-check] failed:', err);
  process.exitCode = 1;
});
