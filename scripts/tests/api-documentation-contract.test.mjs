import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const docs = read("docs/api/README.md");
const authActions = read("src/features/auth/actions.ts");
const authCallback = read("src/app/auth/callback/route.ts");
const supabaseServer = read("src/lib/supabase/server.ts");
const middleware = read("src/lib/supabase/middleware.ts");
const poetryRoute = read("src/app/api/poetry-insight/route.ts");
const profileRoute = read("src/app/api/user/profile/route.ts");
const favoritesRoute = read("src/app/api/user/favorites/route.ts");

assert.match(docs, /not a complete route inventory/i);
assert.match(docs, /Server Action is a framework-managed function call/i);
assert.doesNotMatch(docs, /sb_access_token|sb_refresh_token|setSessionAction|password \(min 6 chars\)/i);
assert.doesNotMatch(docs, /POST \/auth\/login|POST \/auth\/set-session/i);
assert.match(docs, /12–128 character password/i);
assert.match(authActions, /MIN_PASSWORD_LENGTH = 12/);
assert.match(authActions, /MAX_PASSWORD_LENGTH = 128/);
assert.match(authActions, /exchangeCodeForSession|signInWithPassword/);
assert.match(authCallback, /exchangeCodeForSession/);
assert.match(docs, /exchangeCodeForSession/);
assert.match(supabaseServer, /createServerClient/);
assert.match(middleware, /request\.cookies\.getAll\(\)/);
assert.match(middleware, /response\.cookies\.set\(name, value, options\)/);
assert.match(docs, /cookie names, chunking, and token lifetimes are managed/i);
assert.match(poetryRoute, /getSupabaseUser\(\)/);
assert.match(docs, /POST \| \/api\/poetry-insight/);
assert.match(profileRoute, /requireSupabaseAuth\(\)/);
assert.match(docs, /GET \| \/api\/user\/profile/);
assert.match(favoritesRoute, /requireSupabaseAuth\(\)/);
assert.match(docs, /GET \| \/api\/user\/favorites/);
assert.match(docs, /docs\/admin\/ADMIN_API_PERMISSION_MATRIX_2026-11-06\.md/);

console.log("API documentation contract tests passed.");
