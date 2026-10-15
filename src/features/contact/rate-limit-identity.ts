import { createHash } from "node:crypto";

/**
 * Derives a stable opaque UUID from a caller identifier. The raw IP address is
 * never stored in the database rate-limit table.
 */
export function getContactRateLimitActorId(clientIdentifier: string): string {
  const hex = createHash("sha256")
    .update(clientIdentifier.trim() || "unknown")
    .digest("hex")
    .slice(0, 32)
    .split("");

  // Mark a name-based UUID version/variant while retaining deterministic hashing.
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);

  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}
