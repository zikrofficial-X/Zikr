export type GameSoundEvent =
  "start" | "move" | "jump" | "collect" | "success" | "miss" | "gameOver";

type ToneNote = {
  frequency: number;
  duration: number;
  delay?: number;
  volume?: number;
};

const EVENT_NOTES: Record<GameSoundEvent, ToneNote[]> = {
  start: [
    { frequency: 392, duration: 0.08, volume: 0.045 },
    { frequency: 523.25, duration: 0.12, delay: 0.08, volume: 0.05 },
  ],
  move: [{ frequency: 294, duration: 0.045, volume: 0.035 }],
  jump: [
    { frequency: 330, duration: 0.07, volume: 0.04 },
    { frequency: 494, duration: 0.1, delay: 0.055, volume: 0.045 },
  ],
  collect: [
    { frequency: 523.25, duration: 0.06, volume: 0.045 },
    { frequency: 659.25, duration: 0.09, delay: 0.06, volume: 0.05 },
  ],
  success: [
    { frequency: 392, duration: 0.08, volume: 0.045 },
    { frequency: 523.25, duration: 0.08, delay: 0.08, volume: 0.045 },
    { frequency: 659.25, duration: 0.14, delay: 0.16, volume: 0.05 },
  ],
  miss: [{ frequency: 220, duration: 0.1, volume: 0.04 }],
  gameOver: [
    { frequency: 247, duration: 0.1, volume: 0.045 },
    { frequency: 196, duration: 0.18, delay: 0.1, volume: 0.05 },
  ],
};

export class ToneFeedback {
  private context: AudioContext | null = null;
  private muted = false;

  setMuted(value: boolean) {
    this.muted = value;
    if (value) this.context?.suspend().catch(() => undefined);
  }

  play(frequency: number, duration = 0.08) {
    this.playNotes([{ frequency, duration }]);
  }

  playEvent(event: GameSoundEvent) {
    this.playNotes(EVENT_NOTES[event]);
  }

  private playNotes(notes: ToneNote[]) {
    if (this.muted || typeof window === "undefined") return;
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) return;
    if (!this.context) this.context = new AudioContextConstructor();

    const context = this.context;
    context.resume().catch(() => undefined);
    const now = context.currentTime;

    for (const note of notes) {
      const startAt = now + (note.delay ?? 0);
      const endAt = startAt + note.duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const peak = Math.max(0.01, Math.min(0.08, note.volume ?? 0.06));
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    }
  }

  dispose() {
    this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
