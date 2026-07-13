export type ProjectileConfig = {
  readonly gravity: number;
  readonly windAccelerationX: number;
  readonly initialVelocity: {
    readonly x: number;
    readonly y: number;
  };
  readonly cooldownSeconds: number;
  readonly maxActiveProjectiles: number;
  readonly radius: number;
  readonly maxLifetimeSeconds: number;
  readonly predictionStepSeconds: number;
  readonly predictionMaxSeconds: number;
  readonly landingTolerance: number;
  readonly aimAssistEnabled: boolean;
};

export const NORMAL_POOP_PROJECTILE_CONFIG: ProjectileConfig = {
  gravity: 980,
  windAccelerationX: 0,
  initialVelocity: {
    x: 360,
    y: -620
  },
  cooldownSeconds: 0.45,
  maxActiveProjectiles: 6,
  radius: 11,
  maxLifetimeSeconds: 3.2,
  predictionStepSeconds: 1 / 30,
  predictionMaxSeconds: 3.2,
  landingTolerance: 4,
  aimAssistEnabled: true
};

export const THROW_WORLD_CONFIG = {
  originOffsetPlayerWidthRatio: 0.38,
  originOffsetY: -18,
  landingPlaneOffsetY: -4,
  debugWindStep: 90,
  debugWindLimit: 360
} as const;
