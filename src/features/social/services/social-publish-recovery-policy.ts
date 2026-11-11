import { normalizeSocialPlatformResults, type SocialPlatform } from "./platform-availability";

const SUPPORTED_PLATFORMS: readonly SocialPlatform[] = ["facebook", "facebook_reels", "youtube"];

function normalizePlatforms(value: unknown): SocialPlatform[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((platform): platform is SocialPlatform =>
    SUPPORTED_PLATFORMS.includes(platform as SocialPlatform),
  ))];
}

function isSuccessfulResult(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as { ok?: unknown; remoteId?: unknown };
  return result.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
}

/**
 * Persist the provider targets that may receive a remote side effect before
 * making any external request. If the worker disappears mid-request, recovery
 * can hold those targets for manual reconciliation instead of duplicating posts.
 */
export function buildSocialPublishInFlightMetadata(
  metadataInput: Record<string, unknown> | null | undefined,
  platformsInput: readonly SocialPlatform[],
  startedAt: string,
): Record<string, unknown> {
  if (!Number.isFinite(Date.parse(startedAt))) {
    throw new Error("Social publish in-flight marker requires a valid start timestamp.");
  }
  const platforms = [...new Set(platformsInput.filter(platform => SUPPORTED_PLATFORMS.includes(platform)))];
  if (platforms.length === 0) {
    throw new Error("Social publish in-flight marker requires at least one provider target.");
  }
  const metadata = metadataInput ?? {};
  return {
    ...metadata,
    inFlightPlatforms: platforms,
    inFlightStartedAt: startedAt,
  };
}

/** Clear the marker only after every provider result has been persisted. */
export function clearSocialPublishInFlightMetadata(
  metadataInput: Record<string, unknown> | null | undefined,
  platformsInput: readonly SocialPlatform[],
  startedAt: string,
  completedAt: string,
): Record<string, unknown> {
  if (!Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(completedAt))) {
    throw new Error("Social publish completion metadata requires valid timestamps.");
  }
  const metadata = metadataInput ?? {};
  const {
    inFlightPlatforms: _inFlightPlatforms,
    inFlightStartedAt: _inFlightStartedAt,
    ...rest
  } = metadata;
  return {
    ...rest,
    lastAttemptPlatforms: [...new Set(platformsInput.filter(platform => SUPPORTED_PLATFORMS.includes(platform)))],
    lastAttemptStartedAt: startedAt,
    lastAttemptCompletedAt: completedAt,
  };
}

export function buildStaleSocialPublishRecoveryMetadata(
  metadataInput: Record<string, unknown> | null | undefined,
  targetPlatformsInput: readonly string[],
  recoveredAt: string,
): {
  metadata: Record<string, unknown>;
  manualReconciliationPlatforms: SocialPlatform[];
  hasPriorSuccess: boolean;
} {
  if (!Number.isFinite(Date.parse(recoveredAt))) {
    throw new Error("Stale social publish recovery requires a valid recovery timestamp.");
  }
  const metadata = metadataInput ?? {};
  const declaredInFlight = normalizePlatforms(metadata.inFlightPlatforms);
  const hasStartMarker = typeof metadata.inFlightStartedAt === "string" && metadata.inFlightStartedAt.trim().length > 0;
  const targetPlatforms = normalizePlatforms(targetPlatformsInput);
  // If a partially written marker is found, conservatively treat every target
  // as uncertain. A false manual hold is safer than an accidental duplicate.
  const inFlight = declaredInFlight.length > 0
    ? declaredInFlight
    : hasStartMarker
      ? targetPlatforms
      : [];
  const results = normalizeSocialPlatformResults(metadata.platformResults);
  const uncertainPlatforms = inFlight.filter(platform => !isSuccessfulResult(results[platform]));

  for (const platform of uncertainPlatforms) {
    results[platform] = {
      platform,
      ok: false,
      error: "The publisher worker stopped while this provider request was in flight; remote outcome is unknown.",
      requiresReconciliation: true,
      interruptedAt: recoveredAt,
    };
  }

  const previousManual = normalizePlatforms(metadata.manualReconciliationPlatforms);
  const manualReconciliationPlatforms = [...new Set([...previousManual, ...uncertainPlatforms])];
  const {
    inFlightPlatforms: _inFlightPlatforms,
    inFlightStartedAt: _inFlightStartedAt,
    ...rest
  } = metadata;
  const hasPriorSuccess = Object.values(results).some(isSuccessfulResult);

  return {
    metadata: {
      ...rest,
      ...(uncertainPlatforms.length > 0 ? { platformResults: results } : {}),
      manualReconciliationPlatforms,
      inFlightPlatforms: [],
      inFlightStartedAt: null,
      staleRecovery: true,
      staleRecoveryAt: recoveredAt,
    },
    manualReconciliationPlatforms: uncertainPlatforms,
    hasPriorSuccess,
  };
}
