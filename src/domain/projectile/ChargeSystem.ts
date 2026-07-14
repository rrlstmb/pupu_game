import type { ChargeThrowConfig, ProjectileConfig } from '../../data/projectileConfig';
import type { ActionSnapshot } from '../input/ActionState';

export type ChargeState = {
  readonly isCharging: boolean;
  readonly chargeTime: number;
  readonly chargePower: number;
};

export type ChargeUpdate = {
  readonly state: ChargeState;
  readonly releasedThrowPower?: number;
};

export type ChargeMeterState = {
  readonly visible: boolean;
  readonly fillRatio: number;
  readonly minimumRatio: number;
  readonly isMax: boolean;
  readonly label: string;
};

export function createChargeState(): ChargeState {
  return { isCharging: false, chargeTime: 0, chargePower: 0 };
}

export function updateCharge(
  state: ChargeState,
  input: ActionSnapshot,
  deltaSeconds: number,
  canStart: boolean,
  config: ChargeThrowConfig
): ChargeUpdate {
  let next = state;
  if (input.pressed && !state.isCharging && canStart) {
    next = { isCharging: true, chargeTime: 0, chargePower: 0 };
  }
  if (!next.isCharging) return { state: next };

  if (!input.held && !input.released) {
    return { state: createChargeState() };
  }

  const chargeTime = Math.min(config.maxChargeTime, next.chargeTime + Math.max(0, deltaSeconds));
  const chargePower = normalizedChargePower(chargeTime, config);
  next = { isCharging: true, chargeTime, chargePower };

  if (input.released) {
    return {
      state: createChargeState(),
      releasedThrowPower: clamp(
        Math.max(config.minThrowPower, chargePower),
        config.minThrowPower,
        config.maxThrowPower
      )
    };
  }
  return { state: next };
}

export function cancelCharge(): ChargeState {
  return createChargeState();
}

export function chargedProjectileConfig(
  base: ProjectileConfig,
  throwPower: number,
  config: ChargeThrowConfig,
  verticalOnly: boolean
): ProjectileConfig {
  const power = clamp(throwPower, config.minThrowPower, config.maxThrowPower);
  return {
    ...base,
    initialVelocity: {
      ...base.initialVelocity,
      x: verticalOnly ? 0 : base.initialVelocity.x
    },
    targetProjectionY: lerp(config.minTargetY, config.maxTargetY, power),
    apexHeight: lerp(config.apexHeightMin, config.apexHeightMax, power),
    travelDuration: lerp(config.travelDurationMin, config.travelDurationMax, power),
    collisionRadius: config.collisionRadius,
    cooldownSeconds: Math.max(base.cooldownSeconds, config.cooldownAfterThrow),
    topLaneReachPadding: config.maxReachTopPadding
  };
}

export function chargeMeterState(state: ChargeState, config: ChargeThrowConfig): ChargeMeterState {
  return {
    visible: state.isCharging,
    fillRatio: state.chargePower,
    minimumRatio: config.minThrowPower,
    isMax: state.isCharging && state.chargePower >= config.maxThrowPower,
    label: state.chargePower >= config.maxThrowPower ? 'MAX' : `POWER ${Math.round(state.chargePower * 100)}%`
  };
}

function normalizedChargePower(chargeTime: number, config: ChargeThrowConfig): number {
  const range = Math.max(Number.EPSILON, config.maxChargeTime - config.minChargeTime);
  return clamp((chargeTime - config.minChargeTime) / range, 0, 1);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
