import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG, THROW_CHARGE_CONFIG } from '../../src/data/projectileConfig';
import type { ActionSnapshot } from '../../src/domain/input/ActionState';
import {
  cancelCharge,
  chargedProjectileConfig,
  chargeMeterState,
  createChargeState,
  updateCharge
} from '../../src/domain/projectile/ChargeSystem';
import { trajectoryStateAt } from '../../src/domain/projectile/ProjectileTrajectory';

describe('ChargeSystem', () => {
  it('starts on Space keydown and increases while held without exceeding one', () => {
    let state = updateCharge(createChargeState(), action(true, true, false), 0, true, THROW_CHARGE_CONFIG).state;
    expect(state).toMatchObject({ isCharging: true, chargeTime: 0, chargePower: 0 });
    state = updateCharge(state, action(false, true, false), 99, true, THROW_CHARGE_CONFIG).state;
    expect(state.chargePower).toBe(1);
    expect(state.chargeTime).toBe(THROW_CHARGE_CONFIG.maxChargeTime);
  });

  it('throws only on release and gives an extremely short press minimum power', () => {
    const update = updateCharge(
      createChargeState(),
      action(true, false, true),
      0,
      true,
      THROW_CHARGE_CONFIG
    );
    expect(update.releasedThrowPower).toBe(THROW_CHARGE_CONFIG.minThrowPower);
    expect(update.state).toEqual(createChargeState());
  });

  it('cancels without throwing when held input disappears on blur, pause, or reset', () => {
    const charging = updateCharge(
      createChargeState(), action(true, true, false), 0.4, true, THROW_CHARGE_CONFIG
    ).state;
    const cleared = updateCharge(charging, action(false, false, false), 1, true, THROW_CHARGE_CONFIG);
    expect(cleared).toEqual({ state: createChargeState() });
    expect(cancelCharge()).toEqual(createChargeState());
  });

  it.each([
    ['lower', THROW_CHARGE_CONFIG.minThrowPower, 451.35],
    ['middle', 0.45, 358.15],
    ['top', 1, 230]
  ])('maps %s charge to a deterministic lane target', (_lane, power, targetY) => {
    const config = chargedProjectileConfig(
      NORMAL_POOP_PROJECTILE_CONFIG, power, THROW_CHARGE_CONFIG, true
    );
    expect(config.targetProjectionY).toBeCloseTo(targetY, 2);
    const trajectory = {
      origin: { x: 600, y: config.startProjectionY },
      initialVelocity: config.initialVelocity,
      gravity: config.gravity,
      windAccelerationX: 0,
      startProjectionY: config.startProjectionY,
      targetProjectionY: config.targetProjectionY,
      apexHeight: config.apexHeight,
      travelDuration: config.travelDuration,
      windAffectX: config.windAffectX,
      windAffectY: config.windAffectY
    };
    const end = trajectoryStateAt(trajectory, trajectory.travelDuration);
    expect(end.groundProjection.x).toBe(600);
    expect(end.groundProjection.y).toBeCloseTo(targetY, 2);
    expect(trajectoryStateAt(trajectory, trajectory.travelDuration / 2).visualPosition.y)
      .toBeLessThan(trajectoryStateAt(trajectory, trajectory.travelDuration / 2).groundProjection.y);
  });

  it('keeps meter state synchronized, marks MAX, and resets after release/cancel', () => {
    const maxState = updateCharge(
      createChargeState(), action(true, true, false), 5, true, THROW_CHARGE_CONFIG
    ).state;
    expect(chargeMeterState(maxState, THROW_CHARGE_CONFIG)).toMatchObject({
      visible: true, fillRatio: 1, isMax: true, label: 'MAX'
    });
    expect(chargeMeterState(cancelCharge(), THROW_CHARGE_CONFIG)).toMatchObject({
      visible: false, fillRatio: 0, isMax: false
    });
  });
});

function action(pressed: boolean, held: boolean, released: boolean): ActionSnapshot {
  return { pressed, held, released };
}
