import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const cachePath = resolve(process.cwd(), ".next", "cache");
await rm(cachePath, { recursive: true, force: true });
console.log(`Removed non-runtime Next.js cache before Capacitor sync: ${cachePath}`);
