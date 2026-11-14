/**
 * Missing or malformed security settings must never disable destructive-action MFA.
 * Only an explicit JSON boolean false opts out; every other value fails closed.
 */
export function resolveDestructiveMfaRequirement(value: unknown): boolean {
  return value !== false;
}

/**
 * The policy can be disabled for ordinary destructive actions, but changing
 * the policy itself must always require a fresh AAL2 session.
 */
export function shouldRequireAdminStepUp(policyRequiresMfa: boolean, forceMfa = false): boolean {
  return forceMfa || policyRequiresMfa;
}
