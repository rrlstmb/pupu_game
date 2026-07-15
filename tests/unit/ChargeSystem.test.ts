import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG, THROW_CHARGE_CONFIG } from '../../src/data/projectileConfig';
import type { ActionSnapshot } from '../../src/domain/input/ActionState';
import {
  cancelCharge,
  chargedProjectileConfig,
  chargeMeterLayout,
  chargeMeterState,
  createChargeState,
  getTargetYFromChargePower,
  updateCharge
} from '../../src/domain/projectile/ChargeSystem';
import { trajectoryStateAt } from '../../src/domain/projectile/ProjectileTrajectory';

describe('ChargeSystem', () => {
  it('starts on Space keydown and increases while held without exceeding one', () => {
    let state = updateCharge(createChargeState(), action(true, true, false), 0, true, THROW_CHARGE_CONFIG).state;
    expect(state).toMatchObject({
      isCharging: true,
      chargeTime: 0,
      chargePower: THROW_CHARGE_CONFIG.chargePercentMin
    });
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
    ['lower', 0.01, 463],
    ['middle', 0.5, 347.67676767676767],
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
      visible: true, fillRatio: 1, percent: 100, isMax: true, label: 'MAX 100%'
    });
    expect(chargeMeterState(cancelCharge(), THROW_CHARGE_CONFIG)).toMatchObject({
      visible: false, fillRatio: 0, isMax: false
    });
  });

  it.each([
    [0.01, 1],
    [0.21, 21],
    [0.5, 50],
    [1, 100]
  ])('uses one power value for %s meter fill and label', (chargePower, percent) => {
    const presentation = chargeMeterState(
      { isCharging: true, chargeTime: 0.5, chargePower },
      THROW_CHARGE_CONFIG
    );
    const innerWidth = THROW_CHARGE_CONFIG.chargeMeterWidth - THROW_CHARGE_CONFIG.chargeMeterFillPadding * 2;
    const innerHeight = THROW_CHARGE_CONFIG.chargeMeterHeight - THROW_CHARGE_CONFIG.chargeMeterFillPadding * 2;
    expect(presentation.percent).toBe(percent);
    expect(presentation.fillRatio).toBeCloseTo(chargePower, 8);
    expect(presentation.fillWidth).toBeCloseTo(innerWidth * chargePower, 8);
    expect(presentation.fillHeight).toBeCloseTo(innerHeight * chargePower, 8);
    expect(presentation.fillWidth).toBeGreaterThanOrEqual(0);
    expect(presentation.fillWidth).toBeLessThanOrEqual(innerWidth);
    expect(presentation.fillHeight).toBeGreaterThanOrEqual(0);
    expect(presentation.fillHeight).toBeLessThanOrEqual(innerHeight);
    expect(presentation.label).toContain(`${percent}%`);
  });

  it('anchors a vertical meter inside the right safe area across canonical and mobile viewports', () => {
    expect(THROW_CHARGE_CONFIG.chargeMeterOrientation).toBe('vertical');
    expect(THROW_CHARGE_CONFIG.chargeMeterAnchor).toBe('right');
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      const layout = chargeMeterLayout(THROW_CHARGE_CONFIG, viewport);
      expect(layout.right).toBe(viewport.width - THROW_CHARGE_CONFIG.chargeMeterMarginRight);
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.top).toBeGreaterThanOrEqual(THROW_CHARGE_CONFIG.chargeMeterAvoidHudPadding);
      expect(layout.bottom).toBeLessThanOrEqual(viewport.height - THROW_CHARGE_CONFIG.chargeMeterAvoidHudPadding);
      expect(layout.top).toBeGreaterThan(200);
    }
  });

  it('maps the same clamped charge power from near Y to far Y', () => {
    const targetAtOne = getTargetYFromChargePower(0.01, THROW_CHARGE_CONFIG);
    const targetAtHalf = getTargetYFromChargePower(0.5, THROW_CHARGE_CONFIG);
    const targetAtFull = getTargetYFromChargePower(1, THROW_CHARGE_CONFIG);

    expect(THROW_CHARGE_CONFIG.nearTargetY).toBeGreaterThan(THROW_CHARGE_CONFIG.farTargetY);
    expect(targetAtOne).toBe(THROW_CHARGE_CONFIG.nearTargetY);
    const expectedHalf = THROW_CHARGE_CONFIG.nearTargetY +
      (THROW_CHARGE_CONFIG.farTargetY - THROW_CHARGE_CONFIG.nearTargetY) * (0.5 - 0.01) / 0.99;
    expect(targetAtHalf).toBeCloseTo(expectedHalf, 8);
    expect(Math.abs(
      targetAtHalf - (THROW_CHARGE_CONFIG.nearTargetY + THROW_CHARGE_CONFIG.farTargetY) / 2
    )).toBeLessThan(2);
    expect(targetAtFull).toBe(THROW_CHARGE_CONFIG.farTargetY);
    expect(getTargetYFromChargePower(-10, THROW_CHARGE_CONFIG)).toBe(THROW_CHARGE_CONFIG.nearTargetY);
    expect(getTargetYFromChargePower(10, THROW_CHARGE_CONFIG)).toBe(THROW_CHARGE_CONFIG.farTargetY);
    expect(targetAtFull).toBeLessThan(targetAtHalf);
    expect(targetAtHalf).toBeLessThan(targetAtOne);
  });
});

function action(pressed: boolean, held: boolean, released: boolean): ActionSnapshot {
  return { pressed, held, released };
}
