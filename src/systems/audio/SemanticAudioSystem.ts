import { AUDIO_MANIFEST, type AudioSemanticEvent } from '../../data/presentation/audioManifest';
import { createPresentationLedger, reservePresentationToken, type PresentationLedgerState } from '../../domain/presentation/PresentationLedger';

export type AudioSystemStats = { readonly activeVoices: number; readonly activeLoops: number; readonly playedTokens: number };

export class SemanticAudioSystem {
  private context?: AudioContext;
  private ledger: PresentationLedgerState = createPresentationLedger();
  private activeVoices = 0;
  private activeLoops = 0;
  private muted = false;

  play(event: AudioSemanticEvent, token?: string): boolean {
    const definition = AUDIO_MANIFEST.find((candidate) => candidate.event === event);
    if (!definition || this.muted || this.activeVoices >= definition.concurrency) return false;
    if (token) {
      const reservation = reservePresentationToken(this.ledger, `${event}:${token}`, 256);
      this.ledger = reservation.state;
      if (!reservation.accepted) return false;
    }
    try {
      const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return false;
      this.context ??= new AudioCtor();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = definition.waveform === 'noise' ? 'triangle' : definition.waveform;
      oscillator.frequency.value = definition.frequency;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, definition.gain), this.context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + definition.durationMs / 1000);
      oscillator.connect(gain).connect(this.context.destination);
      this.activeVoices += 1;
      oscillator.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      oscillator.start();
      oscillator.stop(this.context.currentTime + definition.durationMs / 1000 + 0.02);
      void this.context.resume().catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean): void { this.muted = muted; }
  pause(): void { void this.context?.suspend().catch(() => undefined); }
  resume(): void { void this.context?.resume().catch(() => undefined); }
  reset(): void { this.ledger = createPresentationLedger(); this.activeLoops = 0; }
  dispose(): void { this.reset(); void this.context?.close().catch(() => undefined); this.context = undefined; this.activeVoices = 0; }
  stats(): AudioSystemStats { return { activeVoices: this.activeVoices, activeLoops: this.activeLoops, playedTokens: this.ledger.processedTokens.length }; }
}

export const audioSystem = new SemanticAudioSystem();
