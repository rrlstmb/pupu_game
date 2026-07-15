import { describe, expect, it } from 'vitest';
import { LEVEL_05 } from '../../src/data/levels/level05';
import { THROW_CHARGE_CONFIG } from '../../src/data/projectileConfig';
import { getTargetYFromChargePower } from '../../src/domain/projectile/ChargeSystem';
import { resolveWindState, windOffsetX } from '../../src/domain/wind/WindSystem';

describe('WindSystem', () => {
  it('resolves stable calm, left, and right segments deterministically', () => {
    expect(resolveWindState(LEVEL_05.wind, 118, 'normal_poop')).toMatchObject({ direction: 'calm', accelerationX: 0 });
    const right = resolveWindState(LEVEL_05.wind, 100, 'normal_poop');
    const left = resolveWindState(LEVEL_05.wind, 70, 'normal_poop');
    expect(right.accelerationX).toBeGreaterThan(0);
    expect(left.accelerationX).toBeLessThan(0);
    expect(resolveWindState(LEVEL_05.wind, 100, 'normal_poop')).toEqual(right);
  });

  it('warns before activation and stronger wind creates more bounded offset', () => {
    expect(resolveWindState(LEVEL_05.wind, 111, 'normal_poop')).toMatchObject({
      direction: 'calm', warningSegmentId: 'right_breeze', warningDirection: 'right'
    });
    expect(Math.abs(windOffsetX(240, 1.5, 170))).toBeGreaterThan(Math.abs(windOffsetX(100, 1.5, 170)));
    expect(windOffsetX(1000, 10, 170)).toBe(170);
  });

  it('keeps charge-to-target Y independent from wind and reset resolves initial calm', () => {
    const before = getTargetYFromChargePower(0.5, THROW_CHARGE_CONFIG);
    resolveWindState(LEVEL_05.wind, 25, 'normal_poop');
    expect(getTargetYFromChargePower(0.5, THROW_CHARGE_CONFIG)).toBe(before);
    expect(resolveWindState(LEVEL_05.wind, LEVEL_05.durationSeconds, 'normal_poop')).toEqual({
      direction: 'calm', strength: 0, accelerationX: 0, warningRemainingSeconds: 0
    });
  });
});
