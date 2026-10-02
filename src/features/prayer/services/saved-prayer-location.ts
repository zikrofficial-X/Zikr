export type SavedPrayerLocation = {
  id?: string;
  city: string;
  country?: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  isDefault?: boolean;
  updatedAt?: string | null;
};

const LOCAL_KEY = "zikr_prayer_location_v2";

function normalize(value: unknown): SavedPrayerLocation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const latitude = Number(item.latitude ?? item.lat);
  const longitude = Number(item.longitude ?? item.lon);
  if (
    typeof item.city !== "string" ||
    !item.city.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    typeof item.timezone !== "string" ||
    !item.timezone.trim()
  ) {
    return null;
  }

  return {
    id: typeof item.id === "string" ? item.id : undefined,
    city: item.city.trim(),
    country: typeof item.country === "string" ? item.country.trim() : null,
    latitude,
    longitude,
    timezone: item.timezone.trim(),
    isDefault: item.isDefault !== false,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
  };
}

export function loadLocalPrayerLocation(): SavedPrayerLocation | null {
  if (typeof window === "undefined") return null;
  try {
    return normalize(JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function saveLocalPrayerLocation(location: SavedPrayerLocation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(location));
  } catch {
    // Local persistence is best-effort for signed-out users.
  }
}

export async function getSavedPrayerLocation(): Promise<SavedPrayerLocation | null> {
  try {
    const response = await fetch("/api/prayer-location", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { location?: unknown };
      const location = normalize(payload.location);
      if (location) {
        saveLocalPrayerLocation(location);
        return location;
      }
      if (payload.location === null) return loadLocalPrayerLocation();
    }
  } catch {
    // Anonymous/offline path falls back to local storage.
  }

  return loadLocalPrayerLocation();
}

export async function persistPrayerLocation(location: SavedPrayerLocation): Promise<void> {
  const normalized = normalize(location);
  if (!normalized) return;

  saveLocalPrayerLocation(normalized);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("zikr:prayer-location-updated", { detail: normalized }));
  }

  try {
    const response = await fetch("/api/prayer-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });
    if (response.ok) {
      const payload = (await response.json()) as { location?: unknown };
      const saved = normalize(payload.location);
      if (saved) {
        saveLocalPrayerLocation(saved);
        window.dispatchEvent(new CustomEvent("zikr:prayer-location-saved", { detail: saved }));
      }
    }
  } catch {
    // Keep the local copy so signed-out and offline users never lose their selection.
  }
}
