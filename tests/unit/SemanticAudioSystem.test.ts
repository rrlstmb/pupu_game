import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST } from '../../src/data/presentation/audioManifest';
import { SemanticAudioSystem } from '../../src/systems/audio/SemanticAudioSystem';

describe('SemanticAudioSystem', () => {
  it('resolves unique semantic events with bounded voice metadata', () => {
    expect(new Set(AUDIO_MANIFEST.map((entry) => entry.event)).size).toBe(AUDIO_MANIFEST.length);
    expect(AUDIO_MANIFEST.every((entry) => entry.concurrency > 0 && entry.durationMs > 0)).toBe(true);
  });

  it('supports muted and reset lifecycle without an audio device', () => {
    const audio = new SemanticAudioSystem();
    audio.setMuted(true);
    expect(audio.play('projectile_hit', 'hit:1')).toBe(false);
    expect(audio.stats()).toEqual({ activeVoices: 0, activeLoops: 0, playedTokens: 0 });
    audio.reset();
    audio.dispose();
    expect(audio.stats().activeVoices).toBe(0);
  });
});
