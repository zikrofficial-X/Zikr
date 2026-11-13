/**
 * Preserve intentional Cloudinary folder hierarchy while sanitizing each
 * segment independently. Treat slashes as path separators, not user data.
 */
export function normalizeCloudinaryFolderPath(
  value: string,
  fallback = "zikr",
): string {
  const segments = value
    .split("/")
    .map((segment) =>
      segment
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120),
    )
    .filter(Boolean);

  return segments.join("/") || fallback;
}
