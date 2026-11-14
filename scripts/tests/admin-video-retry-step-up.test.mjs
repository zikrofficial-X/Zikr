import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("src/app/api/admin/videos/[id]/retry/route.ts");
const client = read("src/features/admin/video-requests/components/admin-video-requests-client.tsx");
const verifier = read("scripts/verify-admin-api-guards.mjs");
const generationRoute = read("src/app/api/admin/video-generation/route.ts");

assert.match(
  route,
  /import \{ requireAdminStepUpApi \} from ['"]@\/features\/admin\/services\/security['"]/,
  "video retry must use the centralized step-up policy",
);
assert.match(
  route,
  /requireAdminStepUpApi\(['"]video\.manage['"],\s*['"]\/admin\/video\/requests['"]\)/,
  "re-queuing a failed video generation request must require video.manage plus configured MFA step-up",
);
assert.doesNotMatch(route, /requireAdminApi\s*\(/, "the retry route must not retain the permission-only bypass");
assert.ok(
  route.indexOf("requireAdminStepUpApi") < route.indexOf("supabaseServerAdminRequest"),
  "step-up authorization must run before any privileged database read or mutation",
);
assert.match(
  client,
  /data\.error === ["']step_up_required["'][\s\S]*?redirectToAdminStepUp\(data\.nextPath\)/,
  "the retry UI must send administrators through the step-up flow instead of showing a generic error",
);
assert.match(
  verifier,
  /videoRetrySource[\s\S]*requireAdminStepUpApi/,
  "the canonical admin API guard verifier must retain the retry-specific step-up contract",
);

assert.match(generationRoute, /readBoundedJsonBody\(request,/);
assert.equal((generationRoute.match(/readBoundedJsonBody\(request,/g) || []).length, 2, "video generation DELETE and PATCH bodies must both use bounded JSON parsing");
assert.doesNotMatch(generationRoute, /request\.json\(\)/, "the admin video-generation route must not parse unbounded JSON bodies");
assert.match(generationRoute, /rawIds\.length > 500/, "bulk deletion must cap the number of selected request IDs");
assert.match(generationRoute, /VIDEO_REQUEST_ID_PATTERN/, "video request IDs must be validated as UUIDs before building PostgREST filters");

console.log("Admin video retry step-up regression contract passed.");
