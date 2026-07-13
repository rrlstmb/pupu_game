export type PlayerMovementConfig = {
  readonly acceleration: number;
  readonly deceleration: number;
  readonly maxSpeed: number;
  readonly nervousSpeedThreshold: number;
  readonly width: number;
  readonly height: number;
};

export const PLAYER_MOVEMENT_CONFIG: PlayerMovementConfig = {
  acceleration: 2400,
  deceleration: 3200,
  maxSpeed: 420,
  nervousSpeedThreshold: 24,
  width: 54,
  height: 82
};

