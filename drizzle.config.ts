import { defineConfig } from "drizzle-kit";

const suffixes = [
  "",
  ...Object.keys(process.env)
    .map(key => key.match(/_(\d+)$/)?.[1])
    .filter((suffix): suffix is string => Boolean(suffix))
    .sort((a, b) => Number(a) - Number(b))
    .map(suffix => `_${suffix}`),
];

function resolveEnv(name: string): string | undefined {
  for (const suffix of suffixes) {
    const value = process.env[`${name}${suffix}`]?.trim();
    if (value) return value;
  }
  return undefined;
}

// For Supabase + Drizzle migrations, use the non-pooling (direct) connection URL.
// Supabase's Vercel integration may expose numbered env vars when multiple
// projects are linked to the same account, so keep this resolver aligned with
// lib/env.ts and scripts/validate-deployment-env.mjs.
const connectionString =
  resolveEnv("POSTGRES_URL_NON_POOLING") ||
  resolveEnv("DATABASE_URL") ||
  resolveEnv("POSTGRES_URL") ||
  resolveEnv("POSTGRES_PRISMA_URL");

if (!connectionString) {
  throw new Error(
    "A database connection URL is required. Set POSTGRES_URL_NON_POOLING (or DATABASE_URL / POSTGRES_URL)."
  );
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
