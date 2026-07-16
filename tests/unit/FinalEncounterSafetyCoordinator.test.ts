import { describe, expect, it } from 'vitest';
import { evaluateFinalEncounterSafety } from '../../src/domain/boss/FinalEncounterSafetyCoordinator';

const base = {
  playerMovementBounds: { start: 100, end: 1180 }, playerX: 640,
  blockedIntervals: [{ start: 930, end: 1180 }], dangerIntervals: [{ start: 500, end: 650 }],
  coverIntervals: [{ start: 180, end: 310 }], bossReachableHitIntervals: [{ start: 300, end: 880 }],
  minimumReachableWidth: 500, minimumSafeWidth: 120, minimumThrowPositionWidth: 150, minimumBossHitPositionWidth: 150
};

describe('FinalEncounterSafetyCoordinator', () => {
  it('allows combined hazards only when movement, safety, throw, and Boss hit intervals remain', () => {
    const result = evaluateFinalEncounterSafety(base);
    expect(result.allowed).toBe(true);
    expect(result.safeIntervals.some((item) => item.end - item.start >= 120)).toBe(true);
    expect(result.bossHitIntervals.some((item) => item.end - item.start >= 150)).toBe(true);
  });

  it('rejects cross-hazard soft locks that isolated systems could miss', () => {
    const result = evaluateFinalEncounterSafety({ ...base,
      dangerIntervals: [{ start: 100, end: 1180 }], coverIntervals: [] });
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain('minimum_safe_width');
    expect(result.suggestedAction).toBe('delay');
  });

  it('returns deterministic relocation when a new blockade covers the player', () => {
    const result = evaluateFinalEncounterSafety({ ...base, playerX: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.suggestedAction).toBe('relocate_player');
    expect(result.relocationX).toBe(929);
  });
});
