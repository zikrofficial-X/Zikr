import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LocationPayload = {
  city?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
};

function boundedText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max
    ? value.trim()
    : null;
}

function coordinate(value: unknown, min: number, max: number): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : null;
}

function validTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

async function getUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ location: null, authenticated: false });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prayer_locations")
    .select("id,city,country,latitude,longitude,timezone,is_default,updated_at")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    console.error("[prayer-location] GET failed:", error);
    return NextResponse.json({ error: "Unable to load saved prayer location." }, { status: 500 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      location: data
        ? {
            id: data.id,
            city: data.city,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone,
            isDefault: data.is_default,
            updatedAt: data.updated_at,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to save your prayer location across devices." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as LocationPayload;
  const city = boundedText(body.city, 160);
  const country = boundedText(body.country, 160);
  const timezone = boundedText(body.timezone, 120);
  const latitude = coordinate(body.latitude, -90, 90);
  const longitude = coordinate(body.longitude, -180, 180);

  if (!city || !timezone || latitude === null || longitude === null || !validTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid prayer location." }, { status: 400 });
  }

  const supabase = await createClient();

  // Keep the user's previous locations available but guarantee one durable
  // default location that survives reloads, browser changes and new devices.
  const { error: clearDefaultError } = await supabase
    .from("prayer_locations")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_default", true);

  if (clearDefaultError) {
    console.error("[prayer-location] clear default failed:", clearDefaultError);
    return NextResponse.json({ error: "Unable to update saved prayer location." }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("prayer_locations")
    .select("id")
    .eq("user_id", user.id)
    .eq("city", city)
    .eq("latitude", latitude)
    .eq("longitude", longitude)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    city,
    country,
    latitude,
    longitude,
    timezone,
    is_default: true,
    updated_at: new Date().toISOString(),
  };

  const query = existing
    ? supabase.from("prayer_locations").update(payload).eq("id", existing.id).select("id,city,country,latitude,longitude,timezone,is_default,updated_at").single()
    : supabase.from("prayer_locations").insert(payload).select("id,city,country,latitude,longitude,timezone,is_default,updated_at").single();

  const { data, error } = await query;
  if (error) {
    console.error("[prayer-location] save failed:", error);
    return NextResponse.json({ error: "Unable to save prayer location." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      location: {
        id: data.id,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isDefault: data.is_default,
        updatedAt: data.updated_at,
      },
    },
    { status: existing ? 200 : 201 },
  );
}
