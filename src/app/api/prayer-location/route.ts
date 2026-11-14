import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { parsePrayerCoordinate } from "@/features/prayer/services/prayer-location-validation";

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

  const parsedBody = await readBoundedJsonBody(request, 8 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (
    !parsedBody.value ||
    typeof parsedBody.value !== "object" ||
    Array.isArray(parsedBody.value)
  ) {
    return NextResponse.json({ error: "Invalid prayer location." }, { status: 400 });
  }
  const body = parsedBody.value as LocationPayload;
  const city = boundedText(body.city, 160);
  const country = boundedText(body.country, 160);
  const timezone = boundedText(body.timezone, 120);
  const latitude = parsePrayerCoordinate(body.latitude, -90, 90);
  const longitude = parsePrayerCoordinate(body.longitude, -180, 180);

  if (!city || !timezone || latitude === null || longitude === null || !validTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid prayer location." }, { status: 400 });
  }

  const supabase = await createClient();
  // The RPC changes the previous default and upserts this location in one
  // transaction, serialized per user. A failed insert can never leave no default.
  const { data, error } = await supabase.rpc("save_default_prayer_location", {
    p_city: city,
    p_country: country,
    p_latitude: latitude,
    p_longitude: longitude,
    p_timezone: timezone,
  }).single();
  if (error || !data) {
    console.error("[prayer-location] save failed:", error ?? "RPC returned no location row");
    return NextResponse.json({ error: "Unable to save prayer location." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
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
    { status: data.created ? 201 : 200, headers: { "Cache-Control": "private, no-store" } },
  );
}
