import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  getSupabaseUser,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
  deviceId?: unknown;
  userAgent?: unknown;
  platform?: unknown;
  prayerContext?: {
    location?: {
      latitude?: unknown;
      longitude?: unknown;
      city?: unknown;
      country?: unknown;
      timezone?: unknown;
    };
    prayerReminders?: unknown;
  };
};

function asBoundedString(value: unknown, maxLength: number): string | null {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength
    ? value
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

function parseSubscription(body: SubscriptionBody) {
  const endpoint = asBoundedString(body.endpoint, 4096);
  const p256dh = asBoundedString(body.keys?.p256dh, 1024);
  const auth = asBoundedString(body.keys?.auth, 1024);
  if (!endpoint || !p256dh || !auth) return null;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return {
    endpoint,
    p256dh,
    auth,
    device_id: asBoundedString(body.deviceId, 128),
    user_agent: asBoundedString(body.userAgent, 1024),
    platform: asBoundedString(body.platform, 128),
  };
}

function parsePrayerContext(body: SubscriptionBody) {
  const location = body.prayerContext?.location;
  const city = asBoundedString(location?.city, 256);
  const timezone = asBoundedString(location?.timezone, 128);
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (
    !city ||
    !timezone ||
    !validTimezone(timezone) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const rawReminders = body.prayerContext?.prayerReminders;
  if (
    !rawReminders ||
    typeof rawReminders !== "object" ||
    Array.isArray(rawReminders)
  ) {
    return null;
  }

  const prayerReminders: Record<string, number | null> = {};
  for (const prayer of PRAYER_NAMES) {
    const value = (rawReminders as Record<string, unknown>)[prayer];
    if (value === null) {
      prayerReminders[prayer] = null;
      continue;
    }
    if (!Number.isInteger(value) || Number(value) < -60 || Number(value) > 60)
      return null;
    prayerReminders[prayer] = Number(value);
  }

  return {
    location: {
      city,
      country: asBoundedString(location?.country, 256),
      latitude,
      longitude,
      timezone,
    },
    prayerReminders,
  };
}

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseUser();
}

async function upsertPrayerContext(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  context: NonNullable<ReturnType<typeof parsePrayerContext>>
) {
  const { data: existingLocation, error: locationLookupError } = await admin
    .from("prayer_locations")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (locationLookupError) throw locationLookupError;

  const locationPatch = {
    user_id: userId,
    ...context.location,
    is_default: true,
    updated_at: new Date().toISOString(),
  };
  const { error: locationError } = existingLocation
    ? await admin
        .from("prayer_locations")
        .update(locationPatch)
        .eq("id", existingLocation.id)
    : await admin.from("prayer_locations").insert(locationPatch);
  if (locationError) throw locationError;

  const { error: preferenceError } = await admin
    .from("prayer_preferences")
    .upsert(
      {
        user_id: userId,
        prayer_reminders: context.prayerReminders,
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (preferenceError) throw preferenceError;
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SubscriptionBody;
  const parsed = parseSubscription(body);
  const prayerContext = parsePrayerContext(body);
  if (!parsed || !prayerContext) {
    return NextResponse.json(
      { error: "Invalid push subscription or prayer settings." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("push_subscriptions")
      .select("id, user_id")
      .eq("endpoint", parsed.endpoint)
      .maybeSingle();
    if (existingError) throw existingError;

    // Never allow a caller to silently hijack a subscription owned by another
    // account. The prior user must remove it by signing out on that device.
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Subscription belongs to a different account." },
        { status: 409 }
      );
    }

    await upsertPrayerContext(admin, user.id, prayerContext);

    const { error } = await admin.from("push_subscriptions").upsert(
      {
        ...(existing ? { id: existing.id } : {}),
        user_id: user.id,
        ...parsed,
        is_active: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("[push] Failed to save subscription:", error);
    return NextResponse.json(
      { error: "Unable to save subscription." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const endpoint = asBoundedString(
    ((await request.json().catch(() => ({}))) as { endpoint?: unknown })
      .endpoint,
    4096
  );
  if (!endpoint)
    return NextResponse.json(
      { error: "Invalid subscription." },
      { status: 400 }
    );

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push] Failed to remove subscription:", error);
    return NextResponse.json(
      { error: "Unable to remove subscription." },
      { status: 500 }
    );
  }
}
