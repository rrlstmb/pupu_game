import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { buildAimAssistPrediction } from '../../src/domain/projectile/AimAssistPrediction';
import { trajectoryStateAt, type TrajectoryInput } from '../../src/domain/projectile/ProjectileTrajectory';

const trajectory: TrajectoryInput = {
  origin: { x: 640, y: NORMAL_POOP_PROJECTILE_CONFIG.startProjectionY },
  initialVelocity: NORMAL_POOP_PROJECTILE_CONFIG.initialVelocity,
  gravity: NORMAL_POOP_PROJECTILE_CONFIG.gravity,
  windAccelerationX: 0,
  startProjectionY: NORMAL_POOP_PROJECTILE_CONFIG.startProjectionY,
  targetProjectionY: NORMAL_POOP_PROJECTILE_CONFIG.targetProjectionY,
  apexHeight: NORMAL_POOP_PROJECTILE_CONFIG.apexHeight,
  travelDuration: NORMAL_POOP_PROJECTILE_CONFIG.travelDuration,
  windAffectX: NORMAL_POOP_PROJECTILE_CONFIG.windAffectX,
  windAffectY: NORMAL_POOP_PROJECTILE_CONFIG.windAffectY
};

describe('AimAssistPrediction', () => {
  it('uses the same projection and visual samples as projectile movement', () => {
    const prediction = buildAimAssistPrediction(trajectory, NORMAL_POOP_PROJECTILE_CONFIG);
    const middleIndex = Math.floor(NORMAL_POOP_PROJECTILE_CONFIG.aimAssistSampleCount / 2);
    const time = trajectory.travelDuration * middleIndex /
      (NORMAL_POOP_PROJECTILE_CONFIG.aimAssistSampleCount - 1);
    const runtime = trajectoryStateAt(trajectory, time);

    expect(prediction.groundProjectionPath[middleIndex]).toEqual(runtime.groundProjection);
    expect(prediction.visualPath[middleIndex]).toEqual(runtime.visualPosition);
    expect(prediction.collisionPoint).toEqual(trajectoryStateAt(trajectory, trajectory.travelDuration).groundProjection);
  });

  it('includes the canonical top lane in Level 1 full-assist reach', () => {
    const prediction = buildAimAssistPrediction(trajectory, NORMAL_POOP_PROJECTILE_CONFIG);
    const topLaneY = 250.2;
    expect(topLaneY).toBeGreaterThanOrEqual(prediction.topLaneReach.minY);
    expect(topLaneY).toBeLessThanOrEqual(prediction.topLaneReach.maxY);
  });
});
