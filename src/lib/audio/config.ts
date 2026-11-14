import { Capacitor } from "@capacitor/core";
import { saveOfflinePreference } from "@/lib/offline-settings";
import { CURATED_AUDIO_CHOICES } from "@/lib/audio/curated-library";

export type AudioSlot = "prayer" | "dhikr" | "salawat";

export type AudioChoice = {
  key: string;
  label: string;
  webUrl: string;
  nativeFile: string | null;
  slot: AudioSlot;
  human?: boolean;
  sourceUrl?: string;
  license?: string;
};

const BUNDLED_AUDIO_CHOICES: readonly AudioChoice[] = [
  { key: "adhan-01", label: "الأذان المحلي — احتياط", webUrl: "/audio/adhan-01-charon.wav", nativeFile: "adhan_01_charon.wav", slot: "prayer" },
  { key: "adhan-02", label: "الأذان المحلي 2 — احتياط", webUrl: "/audio/adhan-02-algieba.wav", nativeFile: "adhan_02_algieba.wav", slot: "prayer" },
  { key: "adhan-03", label: "الأذان المحلي 3 — احتياط", webUrl: "/audio/adhan-03-enceladus.wav", nativeFile: "adhan_03_enceladus.wav", slot: "prayer" },
  { key: "adhan-04", label: "الأذان المحلي 4 — احتياط", webUrl: "/audio/adhan-04-iapetus.wav", nativeFile: "adhan_04_iapetus.wav", slot: "prayer" },
  { key: "adhan-05", label: "الأذان المحلي 5 — احتياط", webUrl: "/audio/adhan-05-alnilam.wav", nativeFile: "adhan_05_alnilam.wav", slot: "prayer" },
  { key: "salawat-wav", label: "الصلاة على النبي — احتياط محلي", webUrl: "/audio/salawat.wav", nativeFile: "salawat.wav", slot: "salawat" },
  { key: "adhan-mp3", label: "الأذان البديل — MP3 احتياط", webUrl: "/audio/adhan.mp3", nativeFile: "adhan_alt.mp3", slot: "prayer" },
] as const;

export const AUDIO_CHOICES: readonly AudioChoice[] = [
  ...BUNDLED_AUDIO_CHOICES,
  ...CURATED_AUDIO_CHOICES,
];

export const DEFAULT_AUDIO_SETTINGS: Record<AudioSlot, string> = {
  prayer: "site:adhan:beautiful",
  dhikr: "site:dhikr:subhanallah-1",
  salawat: "site:salawat:muhammad-pbuh",
};

export type AudioSettings = Record<AudioSlot, string>;

const AUDIO_SETTINGS_KEY = "zikr_audio_settings";
let remoteAudioChoices: AudioChoice[] = [];

function allChoices(): readonly AudioChoice[] {
  return [...AUDIO_CHOICES, ...remoteAudioChoices];
}

function getBundledFallback(slot: AudioSlot): AudioChoice {
  return (
    BUNDLED_AUDIO_CHOICES.find(choice => choice.slot === slot) ??
    BUNDLED_AUDIO_CHOICES[0]
  );
}

export function registerAudioChoices(choices: readonly AudioChoice[]): void {
  // Callers provide the complete current server snapshot. Do not retain choices
  // that were unpublished or removed; failed fetches must skip this function.
  const current = new Map<string, AudioChoice>();
  for (const choice of choices) current.set(choice.key, choice);
  remoteAudioChoices = Array.from(current.values());
}

export function isAudioChoiceKey(value: unknown): value is string {
  return typeof value === "string" && allChoices().some(choice => choice.key === value);
}

export function isAudioChoiceKeyForSlot(value: unknown, slot: AudioSlot): value is string {
  if (typeof value !== "string") return false;
  const knownChoice = allChoices().find(choice => choice.key === value);
  // Keep unknown server-library IDs while offline; getAudioChoice will use a
  // safe slot-specific bundled fallback until the remote catalog is available.
  return knownChoice ? knownChoice.slot === slot : value.startsWith("site:id:");
}

export function normalizeAudioSettings(
  value: Partial<Record<AudioSlot, unknown>> | null | undefined,
): AudioSettings {
  const normalized = { ...DEFAULT_AUDIO_SETTINGS };
  for (const slot of Object.keys(normalized) as AudioSlot[]) {
    if (isAudioChoiceKeyForSlot(value?.[slot], slot)) normalized[slot] = value[slot] as string;
  }
  return normalized;
}

export function getAudioChoice(key: string, slot: AudioSlot = "prayer"): AudioChoice {
  return allChoices().find(choice => choice.key === key && choice.slot === slot) ?? getBundledFallback(slot);
}

export function getAudioSettingsFromStorage(): AudioSettings {
  if (typeof window === "undefined") return normalizeAudioSettings(null);
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    return normalizeAudioSettings(raw ? (JSON.parse(raw) as Partial<AudioSettings>) : null);
  } catch {
    return normalizeAudioSettings(null);
  }
}

export function hasStoredAudioSettings(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUDIO_SETTINGS_KEY) !== null;
}

export function persistAudioSettings(
  value: Partial<Record<AudioSlot, unknown>>,
): AudioSettings {
  const normalized = normalizeAudioSettings(value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalized));
    } catch {
      // IndexedDB remains the durable fallback when Web Storage is restricted.
    }
    void saveOfflinePreference(AUDIO_SETTINGS_KEY, normalized);
    window.dispatchEvent(new CustomEvent("zikr:audio-settings-changed"));
  }
  return normalized;
}

export async function loadAudioSettings(): Promise<AudioSettings> {
  if (typeof window === "undefined") return normalizeAudioSettings(null);

  try {
    const [settingsResponse, audioResponse] = await Promise.all([
      fetch("/api/site-settings", { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch("/api/site-audio", { cache: "no-store", headers: { Accept: "application/json" } }),
    ]);

    const settingsPayload = (await settingsResponse.json()) as {
      data?: { audioSettings?: Partial<Record<AudioSlot, unknown>> } | null;
    };
    const audioPayload = (await audioResponse.json()) as {
      library?: Array<{
        id: string;
        kind: "adhan" | "salawat" | "dhikr";
        title: string | null;
        url: string;
        isPrimary: boolean;
        sourceUrl?: string | null;
        license?: string | null;
      }>;
    };

    const remote = (audioPayload.library ?? []).map(choice => {
      const slot: AudioSlot = choice.kind === "adhan" ? "prayer" : choice.kind;
      return {
        key: "site:id:" + choice.id,
        label: choice.title ?? "مقطع صوتي",
        webUrl: choice.url,
        nativeFile: null,
        slot,
        human: true,
        sourceUrl: choice.sourceUrl ?? undefined,
        license: choice.license ?? undefined,
      } satisfies AudioChoice;
    });

    if (audioResponse.ok) registerAudioChoices(remote);

    const stored = getAudioSettingsFromStorage();
    const configured = settingsPayload.data?.audioSettings;
    if (configured && Object.keys(configured).length) return persistAudioSettings(configured);
    if (hasStoredAudioSettings()) return stored;

    const primary = Object.fromEntries(
      (audioPayload.library ?? [])
        .filter(item => item.isPrimary)
        .map(item => {
          const slot: AudioSlot = item.kind === "adhan" ? "prayer" : item.kind;
          return [slot, "site:id:" + item.id];
        }),
    );

    return persistAudioSettings({ ...DEFAULT_AUDIO_SETTINGS, ...primary });
  } catch {
    return getAudioSettingsFromStorage();
  }
}

export function getAudioUrl(slot: AudioSlot): string {
  return getAudioChoice(getAudioSettingsFromStorage()[slot], slot).webUrl;
}

export function getNativeAudio(
  slot: AudioSlot,
  platform: string = Capacitor.getPlatform(),
): {
  sound: string;
  channelId: string;
} {
  const settings = getAudioSettingsFromStorage();
  const choice = getAudioChoice(settings[slot], slot);
  const native = choice.nativeFile ? choice : getBundledFallback(slot);

  // iOS notification sounds must be present in the native app bundle and use
  // supported WAV/CAF formats. The iOS target ships only adhan.wav/salawat.wav;
  // remote choices and the Android-only MP3 fallback remain foreground audio.
  const sound = platform === "ios"
    ? slot === "salawat" ? "salawat.wav" : "adhan.wav"
    : native.nativeFile as string;

  return {
    sound,
    channelId: "zikr-audio-" + slot + "-" + settings[slot] + "-v3",
  };
}

export function getAudioSlotForNotification(tag: string): AudioSlot | null {
  if (tag.startsWith("prayer-")) return "prayer";
  if (tag === "dhikr-reminder") return "dhikr";
  if (tag === "salawat-reminder") return "salawat";
  return null;
}
