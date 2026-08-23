/**
 * spiritual-tones.ts
 * Pure Web Audio API tone generator — no external dependencies.
 * Browsers block autoplay until a user gesture has occurred.
 * Call unlockAudioContext() inside a click/touch handler to prime the context.
 */

import { getAudioUrl } from '@/lib/audio/config';

let ctx: AudioContext | null = null;
let masterVolume = 0.7; // 0.0 – 1.0

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Call this on the first intentional user gesture to unlock the AudioContext. */
export function unlockAudioContext(): void {
  const context = getCtx();
  if (!context) return;
  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }
}

/** Returns true when the AudioContext is ready to play. */
export function isAudioUnlocked(): boolean {
  const context = getCtx();
  return !!context && context.state === "running";
}

export function setToneVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
}

export function getToneVolume(): number {
  return masterVolume;
}

/**
 * Play a 3-note rising tone sequence to signal prayer time.
 * 440 Hz → 550 Hz → 660 Hz, ~2 sec total.
 * Gracefully no-ops if audio context is suspended.
 */
export function playAzanTone(): void {
  const context = getCtx();
  if (!context || context.state !== "running") return;

  const notes = [440, 550, 660];
  const noteDuration = 0.5;
  const gapDuration = 0.1;

  notes.forEach((freq, i) => {
    const startTime = context.currentTime + i * (noteDuration + gapDuration);

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(masterVolume * 0.4, startTime + 0.05);
    gainNode.gain.setValueAtTime(
      masterVolume * 0.4,
      startTime + noteDuration - 0.1
    );
    gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

/**
 * Real audio clip URLs.
 * - Azan: full adhan (call to prayer) recitation.
 * - Salawat: a local Arabic voice clip containing salawat and short authentic dhikr phrases.
 * Both clips are packaged locally so foreground playback also works offline.
 */
export const AZAN_CLIP_URL = "/audio/adhan.wav";
export const SALAWAT_CLIP_URL = "/audio/salawat.wav";

let azanEl: HTMLAudioElement | null = null;
let dhikrEl: HTMLAudioElement | null = null;
let salawatEl: HTMLAudioElement | null = null;
function getClipEl(kind: "azan" | "dhikr" | "salawat"): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (kind === "azan") {
    if (!azanEl) {
      azanEl = new Audio(getAudioUrl('prayer') || AZAN_CLIP_URL);
      azanEl.preload = "none";
    }
    return azanEl;
  }
  if (kind === 'dhikr') {
    if (!dhikrEl) {
      dhikrEl = new Audio(getAudioUrl('dhikr') || SALAWAT_CLIP_URL);
      dhikrEl.preload = 'none';
    }
    return dhikrEl;
  }
  if (!salawatEl) {
    salawatEl = new Audio(getAudioUrl('salawat') || SALAWAT_CLIP_URL);
    salawatEl.preload = "none";
  }
  return salawatEl;
}

/**
 * Play the real adhan clip. Falls back to the synthesized tone
 * if the audio fails to load or autoplay is blocked.
 */
export function playAzanClip(): void {
  const el = getClipEl("azan");
  if (!el) {
    playAzanTone();
    return;
  }
  el.volume = masterVolume;
  el.currentTime = 0;
  el.play().catch(() => playAzanTone());
}

/** Stop the currently playing adhan clip. */
export function stopAzanClip(): void {
  if (azanEl) {
    azanEl.pause();
    azanEl.currentTime = 0;
  }
}

/**
 * Play the real "صلي على رسول الله" salawat clip.
 * Falls back to the soft bell tone if playback fails.
 */
export function playDhikrClip(): void {
  const el = getClipEl('dhikr');
  if (!el) {
    playSalawatTone();
    return;
  }
  el.volume = masterVolume;
  el.currentTime = 0;
  el.play().catch(() => playSalawatTone());
}

export function playSalawatClip(): void {
  const el = getClipEl("salawat");
  if (!el) {
    playSalawatTone();
    return;
  }
  el.volume = masterVolume;
  el.currentTime = 0;
  el.play().catch(() => playSalawatTone());
}

/** Stop the currently playing salawat clip. */
export function stopSalawatClip(): void {
  if (salawatEl) {
    salawatEl.pause();
    salawatEl.currentTime = 0;
  }
}

/**
 * Play a soft synthesized fallback tone to signal the Salawat reminder.
 * 528 Hz (solfeggio MI tone), ~1.5 sec.
 */
export function playSalawatTone(): void {
  const context = getCtx();
  if (!context || context.state !== "running") return;

  const osc = context.createOscillator();
  const gainNode = context.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(528, context.currentTime);

  gainNode.gain.setValueAtTime(0, context.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    masterVolume * 0.35,
    context.currentTime + 0.08
  );
  gainNode.gain.setValueAtTime(masterVolume * 0.35, context.currentTime + 0.8);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);

  osc.connect(gainNode);
  gainNode.connect(context.destination);

  osc.start(context.currentTime);
  osc.stop(context.currentTime + 1.6);
}
