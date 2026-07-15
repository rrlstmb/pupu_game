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
  readonly startProjectionY: number;
  readonly targetProjectionY: number;
  readonly apexHeight: number;
  readonly travelDuration: number;
  readonly collisionRadius: number;
  readonly aimAssistSampleCount: number;
  readonly topLaneReachPadding: number;
  readonly windAffectX: number;
  readonly windAffectY: number;
};

export type ChargeThrowConfig = {
  readonly chargePercentMin: number;
  readonly chargePercentMax: number;
  readonly minChargeTime: number;
  readonly maxChargeTime: number;
  readonly minThrowPower: number;
  readonly maxThrowPower: number;
  readonly nearTargetY: number;
  readonly farTargetY: number;
  readonly lowerLaneTargetRange: TargetYRange;
  readonly middleLaneTargetRange: TargetYRange;
  readonly topLaneTargetRange: TargetYRange;
  readonly apexHeightMin: number;
  readonly apexHeightMax: number;
  readonly travelDurationMin: number;
  readonly travelDurationMax: number;
  readonly collisionRadius: number;
  readonly chargeMeterWidth: number;
  readonly chargeMeterHeight: number;
  readonly chargeMeterFillPadding: number;
  readonly chargeMeterPosition: { readonly x: number; readonly y: number };
  readonly allowDebugTrajectoryOverlay: boolean;
  readonly maxReachTopPadding: number;
  readonly cooldownAfterThrow: number;
};

export type TargetYRange = {
  readonly farY: number;
  readonly nearY: number;
};

export const NORMAL_POOP_PROJECTILE_CONFIG: ProjectileConfig = {
  gravity: 980,
  windAccelerationX: 0,
  initialVelocity: {
    x: 0,
    y: -620
  },
  cooldownSeconds: 0.45,
  maxActiveProjectiles: 6,
  radius: 11,
  maxLifetimeSeconds: 3.2,
  predictionStepSeconds: 1 / 30,
  predictionMaxSeconds: 3.2,
  landingTolerance: 4,
  aimAssistEnabled: false,
  startProjectionY: 500,
  targetProjectionY: 230,
  apexHeight: 190,
  travelDuration: 1.55,
  collisionRadius: 11,
  aimAssistSampleCount: 32,
  topLaneReachPadding: 24,
  windAffectX: 1,
  windAffectY: 0
};

export const THROW_CHARGE_CONFIG: ChargeThrowConfig = {
  chargePercentMin: 0.01,
  chargePercentMax: 1,
  minChargeTime: 0.08,
  maxChargeTime: 1.2,
  minThrowPower: 0.01,
  maxThrowPower: 1,
  nearTargetY: 463,
  farTargetY: 230,
  lowerLaneTargetRange: { farY: 420, nearY: 463 },
  middleLaneTargetRange: { farY: 325, nearY: 380 },
  topLaneTargetRange: { farY: 230, nearY: 270 },
  apexHeightMin: 70,
  apexHeightMax: 190,
  travelDurationMin: 0.65,
  travelDurationMax: 1.55,
  collisionRadius: 11,
  chargeMeterWidth: 280,
  chargeMeterHeight: 20,
  chargeMeterFillPadding: 4,
  chargeMeterPosition: { x: 640, y: 676 },
  allowDebugTrajectoryOverlay: true,
  maxReachTopPadding: 24,
  cooldownAfterThrow: 0.45
};

export const THROW_WORLD_CONFIG = {
  originOffsetPlayerWidthRatio: 0.38,
  originOffsetY: -18,
  landingPlaneOffsetY: -4,
  debugWindStep: 90,
  debugWindLimit: 360
} as const;
