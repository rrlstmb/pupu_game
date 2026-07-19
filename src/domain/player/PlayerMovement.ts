import type { PlayerMovementConfig } from '../../data/playerMovement';

export type PlayerMovementBounds = {
  readonly minX: number;
  readonly maxX: number;
};

export type PlayerStateKind = 'idle' | 'move' | 'nervous';

export type PlayerState = {
  readonly x: number;
  readonly velocityX: number;
  readonly visualState: PlayerStateKind;
};

export function createInitialPlayerState(bounds: PlayerMovementBounds): PlayerState {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    velocityX: 0,
    visualState: 'idle'
  };
}

export function updatePlayerMovement(
  state: PlayerState,
  horizontalAxis: number,
  bounds: PlayerMovementBounds,
  config: PlayerMovementConfig,
  deltaSeconds: number,
  aimHeld = false
): PlayerState {
  const safeDelta = Math.max(0, deltaSeconds);
  const intent = clamp(horizontalAxis, -1, 1);
  const velocityX =
    intent === 0
      ? decelerateTowardZero(state.velocityX, config.deceleration * safeDelta)
      : accelerateToward(state.velocityX, intent * config.maxSpeed, config.acceleration * safeDelta);
  const nextX = clamp(state.x + velocityX * safeDelta, bounds.minX, bounds.maxX);
  const clampedVelocity =
    (nextX === bounds.minX && velocityX < 0) || (nextX === bounds.maxX && velocityX > 0) ? 0 : velocityX;

  return {
    x: nextX,
    velocityX: clampedVelocity,
    visualState: visualStateFor(aimHeld, clampedVelocity, config)
  };
}

function accelerateToward(current: number, target: number, amount: number): number {
  if (current < target) {
    return Math.min(current + amount, target);
  }

  return Math.max(current - amount, target);
}

function decelerateTowardZero(current: number, amount: number): number {
  if (current > 0) {
    return Math.max(0, current - amount);
  }

  if (current < 0) {
    return Math.min(0, current + amount);
  }

  return 0;
}

function visualStateFor(aimHeld: boolean, velocityX: number, config: PlayerMovementConfig): PlayerStateKind {
  if (aimHeld) {
    return 'nervous';
  }

  return Math.abs(velocityX) >= config.nervousSpeedThreshold ? 'move' : 'idle';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
