const CLOUDINARY_VIDEO_HOST = "res.cloudinary.com";

/**
 * Only the trusted Cloudinary video delivery origin is accepted for server-side
 * social uploads. Queue rows are durable and admin-managed, so validating the
 * host here prevents a bad or compromised row from turning YouTube uploads into
 * arbitrary server-side HTTP fetches (including localhost and cloud metadata IPs).
 */
export function assertCloudinaryVideoUrl(videoUrl: string, target: string): string {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    throw new Error(\`\${target} publishing requires an absolute Cloudinary video URL\`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(\`\${target} publishing requires HTTPS media URLs\`);
  }
  if (
    parsed.hostname.toLowerCase() !== CLOUDINARY_VIDEO_HOST ||
    parsed.username ||
    parsed.password ||
    (parsed.port && parsed.port !== "443")
  ) {
    throw new Error(\`\${target} publishing only accepts trusted Cloudinary video assets\`);
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (
    segments.length < 4 ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(segments[0] ?? "") ||
    segments[1] !== "video" ||
    segments[2] !== "upload"
  ) {
    throw new Error(\`\${target} publishing requires a Cloudinary /video/upload asset path\`);
  }

  return parsed.toString();
}
