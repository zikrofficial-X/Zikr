import { existsSync } from "node:fs";
import { ADMIN_MODULES, ADMIN_ROUTE_ALIASES } from "../src/features/admin/config/modules";

const failures: string[] = [];
const seen = new Set<string>();
for (const module of ADMIN_MODULES) {
  if (seen.has(module.key)) failures.push(`Duplicate admin module key: ${module.key}`);
  seen.add(module.key);
  if (!module.basePath.startsWith("/admin")) failures.push(`Invalid module path: ${module.basePath}`);
  if (!module.sourceTables.length) failures.push(`Module has no declared source tables: ${module.key}`);
}
for (const alias of ADMIN_ROUTE_ALIASES) {
  if (!alias.from.startsWith("/admin") || !alias.to.startsWith("/admin")) failures.push(`Invalid admin alias: ${alias.from}`);
  if (String(alias.from) === String(alias.to)) failures.push(`Self-referencing admin alias: ${alias.from}`);
}
for (const required of ["src/app/admin/queues/page.tsx", "src/app/admin/video/page.tsx", "src/app/admin/video/requests/page.tsx", "src/app/admin/video/studio/page.tsx"]) {
  if (!existsSync(required)) failures.push(`Missing canonical admin route: ${required}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(`❌ ${failure}`));
  process.exit(1);
}
console.log(`✅ Admin module registry passed: ${ADMIN_MODULES.length} modules, ${ADMIN_ROUTE_ALIASES.length} aliases, canonical queue/video routes present.`);
