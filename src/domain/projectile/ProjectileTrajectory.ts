export type Vector2 = {
  readonly x: number;
  readonly y: number;
};

export type TrajectoryInput = {
  readonly origin: Vector2;
  readonly initialVelocity: Vector2;
  readonly gravity: number;
  readonly windAccelerationX: number;
};

export type TrajectoryPoint = Vector2 & {
  readonly time: number;
};

export type LandingPrediction = {
  readonly point: TrajectoryPoint;
  readonly landed: boolean;
};

export function positionAt(input: TrajectoryInput, time: number): TrajectoryPoint {
  const t = Math.max(0, time);

  return {
    time: t,
    x: input.origin.x + input.initialVelocity.x * t + 0.5 * input.windAccelerationX * t * t,
    y: input.origin.y + input.initialVelocity.y * t + 0.5 * input.gravity * t * t
  };
}

export function velocityAt(input: TrajectoryInput, time: number): Vector2 {
  const t = Math.max(0, time);

  return {
    x: input.initialVelocity.x + input.windAccelerationX * t,
    y: input.initialVelocity.y + input.gravity * t
  };
}

export function sampleTrajectory(input: TrajectoryInput, stepSeconds: number, maxSeconds: number): readonly TrajectoryPoint[] {
  const step = Math.max(stepSeconds, 1 / 240);
  const max = Math.max(0, maxSeconds);
  const points: TrajectoryPoint[] = [];

  for (let time = 0; time <= max + step / 2; time += step) {
    points.push(positionAt(input, time));
  }

  return points;
}

export function predictLanding(
  input: TrajectoryInput,
  groundY: number,
  stepSeconds: number,
  maxSeconds: number
): LandingPrediction {
  const step = Math.max(stepSeconds, 1 / 240);
  const max = Math.max(0, maxSeconds);
  let previous = positionAt(input, 0);
  let hasBeenAboveGround = previous.y < groundY;

  if (previous.y >= groundY && input.initialVelocity.y >= 0) {
    return { point: { ...previous, y: groundY }, landed: true };
  }

  for (let time = step; time <= max + step / 2; time += step) {
    const current = positionAt(input, time);
    hasBeenAboveGround ||= current.y < groundY;

    if (hasBeenAboveGround && previous.y < groundY && current.y >= groundY) {
      const segmentDy = current.y - previous.y;
      const ratio = segmentDy === 0 ? 0 : (groundY - previous.y) / segmentDy;
      const landingTime = previous.time + (current.time - previous.time) * ratio;
      return {
        point: {
          ...positionAt(input, landingTime),
          y: groundY
        },
        landed: true
      };
    }

    previous = current;
  }

  return {
    point: previous,
    landed: false
  };
}
