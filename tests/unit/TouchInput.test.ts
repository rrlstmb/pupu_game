import { describe, expect, it } from 'vitest';
import { TOUCH_INPUT_CONFIG } from '../../src/data/touchInput';
import { touchHorizontalAxis } from '../../src/domain/input/TouchInput';
import { GameplayInputController } from '../../src/domain/input/GameplayInputController';
import { ActionStateStore } from '../../src/domain/input/ActionState';

const action = (pressed = false, held = false, released = false) => ({ pressed, held, released });
const mouse = { horizontalAxis: 0, charge: action(), pointerInside: false, overUi: false, activeThisFrame: false };

describe('touch input', () => {
  it('maps drag through dead zone and clamps without moving a player coordinate', () => {
    expect(touchHorizontalAxis(100, 108, TOUCH_INPUT_CONFIG)).toBe(0);
    expect(touchHorizontalAxis(100, 148, TOUCH_INPUT_CONFIG)).toBeCloseTo(0.5);
    expect(touchHorizontalAxis(100, -200, TOUCH_INPUT_CONFIG)).toBe(-1);
    expect(touchHorizontalAxis(100, 500, TOUCH_INPUT_CONFIG)).toBe(1);
  });

  it('supports simultaneous movement and touch-owned charge once', () => {
    const controller = new GameplayInputController();
    const keyboard = new ActionStateStore().snapshot();
    const pressed = controller.resolve(keyboard, mouse, { horizontalAxis: -0.7, charge: action(true, true), activeThisFrame: true });
    expect(pressed).toMatchObject({ horizontalAxis: -0.7, chargePressed: true, chargeHeld: true, activeDevice: 'touch' });
    expect(controller.owner()).toBe('touch');
    const released = controller.resolve(keyboard, mouse, { horizontalAxis: -0.7, charge: action(false, false, true), activeThisFrame: true });
    expect(released.chargeReleased).toBe(true);
    expect(controller.owner()).toBeNull();
  });

  it('does not allow a non-owner source to release charge', () => {
    const controller = new GameplayInputController();
    const store = new ActionStateStore(); store.setHeld('throw', true);
    const keyboard = store.snapshot();
    controller.resolve(keyboard, mouse, { horizontalAxis: 0, charge: action(true, true), activeThisFrame: true });
    expect(controller.owner()).toBe('keyboard');
    const intent = controller.resolve(new ActionStateStore().snapshot(), mouse, { horizontalAxis: 0, charge: action(false, false, true), activeThisFrame: true });
    expect(intent.chargeReleased).toBe(false);
  });
});
