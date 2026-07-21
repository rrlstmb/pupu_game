import { describe, expect, it } from 'vitest';
import { LEVEL_01 } from '../../src/data/levels/level01';
import { applyChallengeOverride, CHALLENGE_DEFINITIONS, dailyChallengeSeed, normalizeCustomSeed, validateChallengeDefinition } from '../../src/domain/modes/ModeRegistry';

describe('ModeRegistry', () => {
  it('validates authored challenges and does not mutate LevelDefinition', () => {
    for (const challenge of CHALLENGE_DEFINITIONS) expect(validateChallengeDefinition(challenge)).toEqual([]);
    const original = LEVEL_01.durationSeconds;
    const overridden = applyChallengeOverride(LEVEL_01, CHALLENGE_DEFINITIONS[0]);
    expect(overridden).not.toBe(LEVEL_01);
    expect(LEVEL_01.durationSeconds).toBe(original);
  });

  it('uses deterministic local-date daily seeds and sanitizes custom seeds', () => {
    expect(dailyChallengeSeed('2026-07-21')).toBe('daily-local-2026-07-21');
    expect(dailyChallengeSeed('bad')).toBe('daily-local-1970-01-01');
    expect(normalizeCustomSeed('<b> hello world </b>')).not.toContain('<');
    expect(normalizeCustomSeed('a'.repeat(100))).toHaveLength(40);
  });

  it('rejects unknown override fields', () => {
    const invalid = { ...CHALLENGE_DEFINITIONS[0], overrides: { unsafeCollision: true } } as unknown as (typeof CHALLENGE_DEFINITIONS)[number];
    expect(validateChallengeDefinition(invalid)).toContain('override unsafeCollision is not allowed');
  });
});
