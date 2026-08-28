export async function resolveLocationLabel(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = await response.json() as { label?: unknown };
    return typeof payload.label === 'string' && payload.label.trim() ? payload.label.trim() : null;
  } catch {
    return null;
  }
}
