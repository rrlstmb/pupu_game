import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import {
  groundProjectionAt,
  predictLanding,
  sampleGroundProjection,
  sampleVisualTrajectory,
  trajectoryStateAt,
  visualPositionAt,
  type TrajectoryInput
} from '../../src/domain/projectile/ProjectileTrajectory';

const input: TrajectoryInput = {
  origin: { x: 640, y: NORMAL_POOP_PROJECTILE_CONFIG.startProjectionY },
  initialVelocity: NORMAL_POOP_PROJECTILE_CONFIG.initialVelocity,
  gravity: NORMAL_POOP_PROJECTILE_CONFIG.gravity,
  windAccelerationX: NORMAL_POOP_PROJECTILE_CONFIG.windAccelerationX,
  startProjectionY: NORMAL_POOP_PROJECTILE_CONFIG.startProjectionY,
  targetProjectionY: NORMAL_POOP_PROJECTILE_CONFIG.targetProjectionY,
  apexHeight: NORMAL_POOP_PROJECTILE_CONFIG.apexHeight,
  travelDuration: NORMAL_POOP_PROJECTILE_CONFIG.travelDuration,
  windAffectX: NORMAL_POOP_PROJECTILE_CONFIG.windAffectX,
  windAffectY: NORMAL_POOP_PROJECTILE_CONFIG.windAffectY
};

describe('ProjectileTrajectory ground projection and visual arc', () => {
  it('starts and ends the ground projection at configured Y coordinates', () => {
    expect(groundProjectionAt(input, 0)).toMatchObject({ x: 640, y: 500, time: 0 });
    expect(groundProjectionAt(input, input.travelDuration)).toMatchObject({ y: 230, time: 1.55 });
  });

  it('separates maximum visual height from ground projection at midpoint', () => {
    const midpoint = trajectoryStateAt(input, input.travelDuration / 2);
    expect(midpoint.progress).toBe(0.5);
    expect(midpoint.groundProjection.y - midpoint.visualPosition.y).toBe(input.apexHeight);
    expect(midpoint.visualPosition.y).toBeLessThan(midpoint.groundProjection.y);
  });

  it('keeps visual and ground positions together at both endpoints', () => {
    expect(visualPositionAt(input, 0)).toEqual(groundProjectionAt(input, 0));
    expect(visualPositionAt(input, input.travelDuration)).toEqual(groundProjectionAt(input, input.travelDuration));
  });

  it('is deterministic for identical inputs', () => {
    expect(sampleGroundProjection(input, 32)).toEqual(sampleGroundProjection(input, 32));
    expect(sampleVisualTrajectory(input, 32)).toEqual(sampleVisualTrajectory(input, 32));
  });

  it('covers the canonical top lane with configured reach padding', () => {
    const canonicalTopLaneY = 250.2;
    const landing = predictLanding(input);
    expect(landing.point.y).toBeLessThanOrEqual(canonicalTopLaneY + NORMAL_POOP_PROJECTILE_CONFIG.topLaneReachPadding);
    expect(landing.point.y).toBeGreaterThanOrEqual(canonicalTopLaneY - NORMAL_POOP_PROJECTILE_CONFIG.topLaneReachPadding);
  });

  it('applies data-driven wind only through configured projection axes', () => {
    const windy = { ...input, windAccelerationX: 120 };
    const landing = groundProjectionAt(windy, windy.travelDuration);
    expect(landing.x).toBeCloseTo(784.15, 2);
    expect(landing.y).toBe(230);
  });

  it('clamps wind offset while preserving the authored target Y', () => {
    const windy = { ...input, windAccelerationX: 10_000, windMaxHorizontalOffset: 80 };
    const landing = groundProjectionAt(windy, windy.travelDuration);
    expect(landing.x).toBe(720);
    expect(landing.y).toBe(input.targetProjectionY);
  });
});
