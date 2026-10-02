/**
 * Shared real-audio playback helpers for adhan, dhikr and salawat.
 * Synthesized tones remain technical fallbacks only.
 */

import { getAudioUrl, loadAudioSettings } from "@/lib/audio/config";

let ctx: AudioContext | null = null;
let masterVolume = 0.7;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function unlockAudioContext(): void {
  const context = getCtx();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(() => {});
}

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

function playFallbackTone(frequencies: number[], duration: number, peak = 0.35): void {
  const context = getCtx();
  if (!context || context.state !== "running") return;

  frequencies.forEach((frequency, index) => {
    const startTime = context.currentTime + index * (duration + 0.1);
    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(masterVolume * peak, startTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(context.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

export function playAzanTone(): void {
  playFallbackTone([440, 550, 660], 0.5, 0.4);
}

export const AZAN_CLIP_URL = "/audio/adhan.wav";
export const SALAWAT_CLIP_URL = "/audio/salawat.wav";

let azanEl: HTMLAudioElement | null = null;
let dhikrEl: HTMLAudioElement | null = null;
let salawatEl: HTMLAudioElement | null = null;
let refreshRequest: Promise<void> | null = null;

export function refreshSiteAudio(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!refreshRequest) {
    refreshRequest = loadAudioSettings()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

function configure(
  el: HTMLAudioElement,
  slot: "prayer" | "dhikr" | "salawat",
): HTMLAudioElement {
  const nextUrl = getAudioUrl(slot);
  const absoluteUrl = new URL(nextUrl, window.location.href).href;
  if (el.src !== absoluteUrl) el.src = nextUrl;
  el.preload = "none";
  el.volume = masterVolume;
  return el;
}

function getClipEl(kind: "azan" | "dhikr" | "salawat"): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (kind === "azan") {
    if (!azanEl) azanEl = new Audio();
    return configure(azanEl, "prayer");
  }
  if (kind === "dhikr") {
    if (!dhikrEl) dhikrEl = new Audio();
    return configure(dhikrEl, "dhikr");
  }
  if (!salawatEl) salawatEl = new Audio();
  return configure(salawatEl, "salawat");
}

export function playAzanClip(): void {
  const el = getClipEl("azan");
  if (!el) {
    playAzanTone();
    return;
  }
  el.currentTime = 0;
  el.play().catch(() => playAzanTone());
}

export function stopAzanClip(): void {
  if (azanEl) {
    azanEl.pause();
    azanEl.currentTime = 0;
  }
}

export function playDhikrClip(): void {
  const el = getClipEl("dhikr");
  if (!el) {
    playSalawatTone();
    return;
  }
  el.currentTime = 0;
  el.play().catch(() => playSalawatTone());
}

export function playSalawatClip(): void {
  const el = getClipEl("salawat");
  if (!el) {
    playSalawatTone();
    return;
  }
  el.currentTime = 0;
  el.play().catch(() => playSalawatTone());
}

export function stopSalawatClip(): void {
  if (salawatEl) {
    salawatEl.pause();
    salawatEl.currentTime = 0;
  }
}

export function playSalawatTone(): void {
  playFallbackTone([528], 1.5, 0.35);
}
