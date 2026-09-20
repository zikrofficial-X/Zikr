import "server-only";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_INTERVALS = new Set([15, 30, 60, 120]);

export type ReminderPreferences = {
  user_id: string;
  dhikr_enabled: boolean;
  dhikr_interval_minutes: number;
  salawat_enabled: boolean;
  salawat_interval_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at?: string;
};

export type ReminderPreferenceUpdate = {
  dhikr_enabled?: boolean;
  dhikr_interval_minutes?: number;
  salawat_enabled?: boolean;
  salawat_interval_minutes?: number;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
};

const DEFAULT_PREFERENCES = {
  dhikr_enabled: false,
  dhikr_interval_minutes: 60,
  salawat_enabled: false,
  salawat_interval_minutes: 60,
  quiet_hours_start: null,
  quiet_hours_end: null,
} as const;

function isClockTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function parseUpdate(value: unknown): ReminderPreferenceUpdate | { error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Invalid body" };
  }

  const body = value as Record<string, unknown>;
  const updates: ReminderPreferenceUpdate = {};

  for (const key of ["dhikr_enabled", "salawat_enabled"] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "boolean") {
        return { error: "Invalid enabled value" };
      }
      updates[key] = body[key];
    }
  }

  for (const key of [
    "dhikr_interval_minutes",
    "salawat_interval_minutes",
  ] as const) {
    if (body[key] !== undefined) {
      if (
        typeof body[key] !== "number" ||
        !Number.isInteger(body[key]) ||
        !ALLOWED_INTERVALS.has(body[key])
      ) {
        return { error: "Invalid interval" };
      }
      updates[key] = body[key];
    }
  }

  for (const key of ["quiet_hours_start", "quiet_hours_end"] as const) {
    if (body[key] !== undefined) {
      const value = body[key];
      if (value !== null && !isClockTime(value)) {
        return { error: "Invalid quiet hours" };
      }
      updates[key] = value;
    }
  }

  return updates;
}

export async function getCurrentReminderPreferences(): Promise<ReminderPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("background_reminder_preferences")
    .select(
      "user_id,dhikr_enabled,dhikr_interval_minutes,salawat_enabled,salawat_interval_minutes,quiet_hours_start,quiet_hours_end,updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return (
    (data as ReminderPreferences | null) ?? {
      user_id: user.id,
      ...DEFAULT_PREFERENCES,
    }
  );
}

export async function updateCurrentReminderPreferences(
  input: unknown,
): Promise<
  | { ok: true; data: ReminderPreferences }
  | { ok: false; error: string }
  | null
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const parsed = parseUpdate(input);
  if ("error" in parsed) return parsed;

  const payload = {
    user_id: user.id,
    ...parsed,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("background_reminder_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "user_id,dhikr_enabled,dhikr_interval_minutes,salawat_enabled,salawat_interval_minutes,quiet_hours_start,quiet_hours_end,updated_at",
    )
    .single();

  if (error) throw error;
  return { ok: true, data: data as ReminderPreferences };
}
