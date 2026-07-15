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
  readonly fillWidth: number;
  readonly percent: number;
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
    next = { isCharging: true, chargeTime: 0, chargePower: config.chargePercentMin };
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
  const power = normalizeChargePower(throwPower, config);
  return {
    ...base,
    initialVelocity: {
      ...base.initialVelocity,
      x: verticalOnly ? 0 : base.initialVelocity.x
    },
    targetProjectionY: getTargetYFromChargePower(power, config),
    apexHeight: lerp(config.apexHeightMin, config.apexHeightMax, power),
    travelDuration: lerp(config.travelDurationMin, config.travelDurationMax, power),
    collisionRadius: config.collisionRadius,
    cooldownSeconds: Math.max(base.cooldownSeconds, config.cooldownAfterThrow),
    topLaneReachPadding: config.maxReachTopPadding
  };
}

export function chargeMeterState(state: ChargeState, config: ChargeThrowConfig): ChargeMeterState {
  const power = state.isCharging ? normalizeChargePower(state.chargePower, config) : 0;
  const innerWidth = Math.max(0, config.chargeMeterWidth - config.chargeMeterFillPadding * 2);
  const percent = Math.round(power * 100);
  return {
    visible: state.isCharging,
    fillRatio: power,
    fillWidth: clamp(innerWidth * power, 0, innerWidth),
    percent,
    minimumRatio: config.chargePercentMin,
    isMax: state.isCharging && power >= config.chargePercentMax,
    label: power >= config.chargePercentMax ? 'MAX 100%' : `POWER ${percent}%`
  };
}

export function getTargetYFromChargePower(
  chargePower: number,
  range: Pick<ChargeThrowConfig, 'chargePercentMin' | 'chargePercentMax' | 'nearTargetY' | 'farTargetY'>
): number {
  const power = clamp(chargePower, range.chargePercentMin, range.chargePercentMax);
  const quantizedPower = Math.round(power * 100) / 100;
  const powerRange = Math.max(Number.EPSILON, range.chargePercentMax - range.chargePercentMin);
  const progress = (quantizedPower - range.chargePercentMin) / powerRange;
  return lerp(range.nearTargetY, range.farTargetY, progress);
}

export function normalizeChargePower(chargePower: number, config: ChargeThrowConfig): number {
  return Math.round(clamp(chargePower, config.chargePercentMin, config.chargePercentMax) * 100) / 100;
}

function normalizedChargePower(chargeTime: number, config: ChargeThrowConfig): number {
  const range = Math.max(Number.EPSILON, config.maxChargeTime - config.minChargeTime);
  const progress = clamp((chargeTime - config.minChargeTime) / range, 0, 1);
  return normalizeChargePower(
    lerp(config.chargePercentMin, config.chargePercentMax, progress),
    config
  );
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
