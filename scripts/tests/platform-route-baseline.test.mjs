import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EXPECTED_PLATFORM_APIS,
  EXPECTED_PLATFORM_PAGES,
  isPlatformRouteInventoryValid,
} from "../platform-route-baseline.mjs";

assert.equal(
  isPlatformRouteInventoryValid(EXPECTED_PLATFORM_PAGES, EXPECTED_PLATFORM_APIS),
  true,
  "the exact reviewed route inventory must pass",
);
assert.equal(
  isPlatformRouteInventoryValid(EXPECTED_PLATFORM_PAGES + 1, EXPECTED_PLATFORM_APIS),
  false,
  "an unreviewed page route must fail the inventory gate",
);
assert.equal(
  isPlatformRouteInventoryValid(EXPECTED_PLATFORM_PAGES, EXPECTED_PLATFORM_APIS + 1),
  false,
  "an unreviewed API route must fail the inventory gate",
);
assert.equal(
  isPlatformRouteInventoryValid(EXPECTED_PLATFORM_PAGES, EXPECTED_PLATFORM_APIS - 1),
  false,
  "a removed API route must fail the inventory gate",
);

const routesVerifier = readFileSync("scripts/verify-platform-routes.mjs", "utf8");
const integrityVerifier = readFileSync("scripts/verify-project-integrity.mjs", "utf8");
assert.ok(
  routesVerifier.includes("isPlatformRouteInventoryValid(pages.length, apis.length)") &&
    routesVerifier.includes("failures.push("),
  "the route verifier must turn inventory drift into a hard failure",
);
assert.ok(
  integrityVerifier.includes("isPlatformRouteInventoryValid(platformPageRoutes, platformApiRoutes)") &&
    integrityVerifier.includes("failures.push("),
  "the project-integrity verifier must turn inventory drift into a hard failure",
);

console.log("Platform route inventory drift is a hard failure.");
