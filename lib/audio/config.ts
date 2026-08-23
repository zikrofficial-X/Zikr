export type AudioSlot = 'prayer' | 'dhikr' | 'salawat';

export type AudioChoice = {
  key: string;
  label: string;
  webUrl: string;
  nativeFile: string;
};

export const AUDIO_CHOICES: readonly AudioChoice[] = [
  {
    key: 'adhan-wav',
    label: 'الأذان — WAV',
    webUrl: '/audio/adhan.wav',
    nativeFile: 'adhan.wav',
  },
  {
    key: 'salawat-wav',
    label: 'الذكر والصلاة على النبي — WAV',
    webUrl: '/audio/salawat.wav',
    nativeFile: 'salawat.wav',
  },
  {
    key: 'adhan-mp3',
    label: 'الأذان البديل — MP3',
    webUrl: '/audio/adhan.mp3',
    nativeFile: 'adhan_alt.mp3',
  },
] as const;

export const DEFAULT_AUDIO_SETTINGS: Record<AudioSlot, string> = {
  prayer: 'adhan-wav',
  dhikr: 'salawat-wav',
  salawat: 'salawat-wav',
};

export type AudioSettings = Record<AudioSlot, string>;

export function isAudioChoiceKey(value: unknown): value is string {
  return typeof value === 'string' && AUDIO_CHOICES.some(choice => choice.key === value);
}

export function normalizeAudioSettings(value: Partial<Record<AudioSlot, unknown>> | null | undefined): AudioSettings {
  const normalized = { ...DEFAULT_AUDIO_SETTINGS };
  for (const slot of Object.keys(normalized) as AudioSlot[]) {
    if (isAudioChoiceKey(value?.[slot])) normalized[slot] = value[slot] as string;
  }
  return normalized;
}

export function getAudioChoice(key: string): AudioChoice {
  return AUDIO_CHOICES.find(choice => choice.key === key) ?? AUDIO_CHOICES[0];
}

export function getAudioSettingsFromStorage(): AudioSettings {
  if (typeof window === 'undefined') return normalizeAudioSettings(null);
  try {
    const raw = window.localStorage.getItem('zikr_audio_settings');
    return normalizeAudioSettings(raw ? JSON.parse(raw) as Partial<AudioSettings> : null);
  } catch {
    return normalizeAudioSettings(null);
  }
}

export function persistAudioSettings(value: Partial<Record<AudioSlot, unknown>>): AudioSettings {
  const normalized = normalizeAudioSettings(value);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('zikr_audio_settings', JSON.stringify(normalized));
    } catch {
      // Storage can be unavailable in private browsing contexts.
    }
  }
  return normalized;
}

export async function loadAudioSettings(): Promise<AudioSettings> {
  if (typeof window === 'undefined') return normalizeAudioSettings(null);
  try {
    const response = await fetch('/api/site-settings', { cache: 'no-store', headers: { Accept: 'application/json' } });
    const payload = await response.json() as { data?: { audioSettings?: Partial<Record<AudioSlot, unknown>> } | null };
    return persistAudioSettings(payload.data?.audioSettings ?? getAudioSettingsFromStorage());
  } catch {
    return getAudioSettingsFromStorage();
  }
}

export function getAudioUrl(slot: AudioSlot): string {
  const settings = getAudioSettingsFromStorage();
  return getAudioChoice(settings[slot]).webUrl;
}

export function getNativeAudio(slot: AudioSlot): { sound: string; channelId: string } {
  const settings = getAudioSettingsFromStorage();
  const choice = getAudioChoice(settings[slot]);
  return { sound: choice.nativeFile, channelId: `zikr-audio-${choice.key}-v1` };
}

export function getAudioSlotForNotification(tag: string): AudioSlot | null {
  if (tag.startsWith('prayer-')) return 'prayer';
  if (tag === 'dhikr-reminder') return 'dhikr';
  if (tag === 'salawat-reminder') return 'salawat';
  return null;
}
