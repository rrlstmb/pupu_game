import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { groundProjectionShadow } from '../../src/domain/projectile/GroundProjectionShadow';
import { emptyProjectileRules, type Projectile } from '../../src/domain/projectile/ProjectileSystem';

describe('GroundProjectionShadow', () => {
  it('uses authoritative ground projection rather than visual arc position', () => {
    const projectile = fixture({ x: 640, y: 360 }, { x: 640, y: 210 });
    const shadow = groundProjectionShadow(projectile);
    expect(shadow).toMatchObject({ projectileId: 1, x: 640, y: 360 });
    expect(shadow.y).not.toBe(projectile.visualPosition.y);
    expect(shadow.scale).toBeLessThan(1);
    expect(shadow.alpha).toBeLessThan(0.42);
  });

  it('tracks projection updates deterministically and is strongest at ground level', () => {
    const first = groundProjectionShadow(fixture({ x: 600, y: 430 }, { x: 600, y: 330 }));
    const second = groundProjectionShadow(fixture({ x: 600, y: 300 }, { x: 600, y: 300 }));
    expect(first.y).toBe(430);
    expect(second.y).toBe(300);
    expect(second).toMatchObject({ scale: 1, alpha: 0.42 });
  });
});

function fixture(
  position: { readonly x: number; readonly y: number },
  visualPosition: { readonly x: number; readonly y: number }
): Projectile {
  return {
    id: 1,
    poopType: 'normal_poop',
    config: NORMAL_POOP_PROJECTILE_CONFIG,
    rules: emptyProjectileRules(),
    generation: 0,
    bounceCount: 0,
    hasSplit: false,
    trajectory: {
      origin: { x: 640, y: 500 },
      initialVelocity: { x: 0, y: 0 },
      gravity: 0,
      windAccelerationX: 0,
      startProjectionY: 500,
      targetProjectionY: 230,
      apexHeight: 190,
      travelDuration: 1.55,
      windAffectX: 0,
      windAffectY: 0
    },
    ageSeconds: 0.5,
    previousPosition: { ...position, time: 0.4 },
    position: { ...position, time: 0.5 },
    previousVisualPosition: { ...visualPosition, time: 0.4 },
    visualPosition: { ...visualPosition, time: 0.5 },
    status: 'active'
  };
}
