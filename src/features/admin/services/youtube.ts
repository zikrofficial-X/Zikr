export function parseYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  const match = input.match(
    /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/,
  );
  if (match?.[1]) return match[1];

  return /^[A-Za-z0-9_-]{11}$/.test(input) ? input : null;
}
