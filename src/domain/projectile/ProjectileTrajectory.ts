export type Vector2 = {
  readonly x: number;
  readonly y: number;
};

export type TrajectoryInput = {
  readonly origin: Vector2;
  readonly initialVelocity: Vector2;
  readonly gravity: number;
  readonly windAccelerationX: number;
  readonly startProjectionY: number;
  readonly targetProjectionY: number;
  readonly apexHeight: number;
  readonly travelDuration: number;
  readonly windAffectX: number;
  readonly windAffectY: number;
};

export type TrajectoryPoint = Vector2 & {
  readonly time: number;
};

export type LandingPrediction = {
  readonly point: TrajectoryPoint;
  readonly landed: boolean;
};

export type ProjectileTrajectoryState = {
  readonly progress: number;
  readonly groundProjection: TrajectoryPoint;
  readonly visualPosition: TrajectoryPoint;
};

export function positionAt(input: TrajectoryInput, time: number): TrajectoryPoint {
  return groundProjectionAt(input, time);
}

export function trajectoryProgress(input: TrajectoryInput, time: number): number {
  return Math.min(1, Math.max(0, time) / input.travelDuration);
}

export function groundProjectionAt(input: TrajectoryInput, time: number): TrajectoryPoint {
  const t = Math.min(Math.max(0, time), input.travelDuration);
  const progress = trajectoryProgress(input, t);
  const windY = 0.5 * input.windAccelerationX * input.windAffectY * t * t;

  return {
    time: t,
    x: input.origin.x + input.initialVelocity.x * t + 0.5 * input.windAccelerationX * input.windAffectX * t * t,
    y: lerp(input.startProjectionY, input.targetProjectionY, progress) + windY
  };
}

export function visualPositionAt(input: TrajectoryInput, time: number): TrajectoryPoint {
  const ground = groundProjectionAt(input, time);
  const progress = trajectoryProgress(input, time);
  const height = 4 * input.apexHeight * progress * (1 - progress);
  return { ...ground, y: ground.y - height };
}

export function trajectoryStateAt(input: TrajectoryInput, time: number): ProjectileTrajectoryState {
  return {
    progress: trajectoryProgress(input, time),
    groundProjection: groundProjectionAt(input, time),
    visualPosition: visualPositionAt(input, time)
  };
}

export function sampleVisualTrajectory(input: TrajectoryInput, sampleCount: number): readonly TrajectoryPoint[] {
  return sampleByCount(input, sampleCount, visualPositionAt);
}

export function sampleGroundProjection(input: TrajectoryInput, sampleCount: number): readonly TrajectoryPoint[] {
  return sampleByCount(input, sampleCount, groundProjectionAt);
}

export function predictLanding(input: TrajectoryInput): LandingPrediction {
  return { point: groundProjectionAt(input, input.travelDuration), landed: true };
}

function sampleByCount(
  input: TrajectoryInput,
  sampleCount: number,
  sampler: (trajectory: TrajectoryInput, time: number) => TrajectoryPoint
): readonly TrajectoryPoint[] {
  const count = Math.max(2, Math.floor(sampleCount));
  return Array.from({ length: count }, (_, index) =>
    sampler(input, input.travelDuration * index / (count - 1))
  );
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
