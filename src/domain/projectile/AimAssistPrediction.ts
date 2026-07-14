import type { ProjectileConfig } from '../../data/projectileConfig';
import {
  groundProjectionAt,
  sampleGroundProjection,
  sampleVisualTrajectory,
  type TrajectoryInput,
  type TrajectoryPoint
} from './ProjectileTrajectory';

export type AimAssistPrediction = {
  readonly visualPath: readonly TrajectoryPoint[];
  readonly groundProjectionPath: readonly TrajectoryPoint[];
  readonly collisionPoint: TrajectoryPoint;
  readonly topLaneReach: { readonly minY: number; readonly maxY: number };
};

export function buildAimAssistPrediction(
  input: TrajectoryInput,
  config: ProjectileConfig
): AimAssistPrediction {
  return {
    visualPath: sampleVisualTrajectory(input, config.aimAssistSampleCount),
    groundProjectionPath: sampleGroundProjection(input, config.aimAssistSampleCount),
    collisionPoint: groundProjectionAt(input, input.travelDuration),
    topLaneReach: {
      minY: config.targetProjectionY - config.topLaneReachPadding,
      maxY: config.targetProjectionY + config.topLaneReachPadding
    }
  };
}
