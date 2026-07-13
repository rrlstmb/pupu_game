import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { positionAt, predictLanding, sampleTrajectory, velocityAt } from '../../src/domain/projectile/ProjectileTrajectory';

const goldenCases = [
  {
    name: 'normal zero wind',
    input: { origin: { x: 640, y: 510 }, initialVelocity: { x: 360, y: -620 }, gravity: 980, windAccelerationX: 0 },
    groundY: 720,
    expectedX: 1195.5,
    expectedTime: 1.5430
  },
  {
    name: 'tail wind',
    input: { origin: { x: 640, y: 510 }, initialVelocity: { x: 360, y: -620 }, gravity: 980, windAccelerationX: 120 },
    groundY: 720,
    expectedX: 1338.35,
    expectedTime: 1.5430
  },
  {
    name: 'head wind',
    input: { origin: { x: 640, y: 510 }, initialVelocity: { x: 360, y: -620 }, gravity: 980, windAccelerationX: -90 },
    groundY: 720,
    expectedX: 1088.35,
    expectedTime: 1.5430
  },
  {
    name: 'low gravity',
    input: { origin: { x: 640, y: 510 }, initialVelocity: { x: 360, y: -620 }, gravity: 760, windAccelerationX: 0 },
    groundY: 720,
    expectedX: 1331.01,
    expectedTime: 1.9195
  },
  {
    name: 'faster throw',
    input: { origin: { x: 640, y: 510 }, initialVelocity: { x: 480, y: -700 }, gravity: 980, windAccelerationX: 0 },
    groundY: 720,
    expectedX: 1447.93,
    expectedTime: 1.6832
  }
] as const;

describe('ProjectileTrajectory', () => {
  it.each(goldenCases)('matches golden landing case: $name', ({ input, groundY, expectedX, expectedTime }) => {
    const landing = predictLanding(input, groundY, 1 / 120, 4);

    expect(landing.landed).toBe(true);
    expect(landing.point.x).toBeCloseTo(expectedX, 1);
    expect(landing.point.time).toBeCloseTo(expectedTime, 3);
    expect(landing.point.y).toBe(groundY);
  });

  it('uses the same source calculation for sampled prediction and direct position', () => {
    const input = {
      origin: { x: 100, y: 500 },
      initialVelocity: { x: 280, y: -540 },
      gravity: 900,
      windAccelerationX: 50
    };
    const points = sampleTrajectory(input, 0.25, 1);

    expect(points[2]).toEqual(positionAt(input, 0.5));
    expect(velocityAt(input, 0.5)).toEqual({ x: 305, y: -90 });
  });

  it('keeps predicted landing and simulated landing within tolerance', () => {
    const input = {
      origin: { x: 600, y: 505 },
      initialVelocity: NORMAL_POOP_PROJECTILE_CONFIG.initialVelocity,
      gravity: NORMAL_POOP_PROJECTILE_CONFIG.gravity,
      windAccelerationX: NORMAL_POOP_PROJECTILE_CONFIG.windAccelerationX
    };
    const predicted = predictLanding(input, 720, 1 / 120, 4);
    let simulated = positionAt(input, 0);

    for (let time = 0; time <= 4; time += 1 / 120) {
      simulated = positionAt(input, time);
      if (simulated.y >= 720) {
        break;
      }
    }

    expect(Math.abs(predicted.point.x - simulated.x)).toBeLessThan(NORMAL_POOP_PROJECTILE_CONFIG.landingTolerance);
  });
});
