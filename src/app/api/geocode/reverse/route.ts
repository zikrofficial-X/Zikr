import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function coordinate(value: string | null, min: number, max: number): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: NextRequest) {
  const lat = coordinate(request.nextUrl.searchParams.get('lat'), -90, 90);
  const lon = coordinate(request.nextUrl.searchParams.get('lon'), -180, 180);
  if (lat === null || lon === null) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1&accept-language=ar,en`,
      {
        headers: { 'User-Agent': 'Zikr-App/1.0 (Prayer location)' },
        signal: controller.signal,
        next: { revalidate: 86400 },
      },
    );
    if (!upstream.ok) return NextResponse.json({ error: 'Location name unavailable.' }, { status: 502 });
    const payload = await upstream.json() as {
      address?: Record<string, string | undefined>;
      display_name?: string;
    };
    const address = payload.address ?? {};
    const city = address.city || address.town || address.municipality || address.village || address.county || '';
    const country = address.country || '';
    const label = [city, country].filter(Boolean).join('، ') || payload.display_name?.split(',').slice(0, 2).join('، ') || '';
    return NextResponse.json({ city, country, label }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    return NextResponse.json({ error: timedOut ? 'Location lookup timed out.' : 'Location lookup failed.' }, { status: timedOut ? 504 : 502 });
  } finally {
    clearTimeout(timeout);
  }
}
