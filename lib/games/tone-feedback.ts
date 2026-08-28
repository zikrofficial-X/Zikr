export class ToneFeedback {
  private context: AudioContext | null = null;
  private muted = false;

  setMuted(value: boolean) {
    this.muted = value;
    if (this.context) this.context.suspend().catch(() => undefined);
  }

  play(frequency: number, duration = 0.08) {
    if (this.muted || typeof window === "undefined") return;
    const AudioContextConstructor = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    if (!this.context) this.context = new AudioContextConstructor();
    const context = this.context;
    context.resume().catch(() => undefined);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  dispose() {
    this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
