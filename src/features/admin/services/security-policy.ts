/**
 * Missing or malformed security settings must never disable destructive-action MFA.
 * Only an explicit JSON boolean false opts out; every other value fails closed.
 */
export function resolveDestructiveMfaRequirement(value: unknown): boolean {
  return value !== false;
}
