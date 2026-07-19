import { describe, expect, it } from 'vitest';
import { MOUSE_INPUT_CONFIG } from '../../src/data/mouseInput';
import { ActionStateStore, InputActions } from '../../src/domain/input/ActionState';
import { GameplayInputController, mouseHorizontalAxis, pointerClientToWorld, type MouseInputSnapshot } from '../../src/domain/input/GameplayInputController';

const neutralMouse = (overrides: Partial<MouseInputSnapshot> = {}): MouseInputSnapshot => ({
  horizontalAxis: 0,
  charge: { pressed: false, held: false, released: false },
  pointerInside: true,
  overUi: false,
  activeThisFrame: false,
  ...overrides
});

describe('mouse horizontal intent', () => {
  it('maps left, right, dead-zone, and full-speed distances without teleporting', () => {
    expect(mouseHorizontalAxis(400, 500, MOUSE_INPUT_CONFIG)).toBeLessThan(0);
    expect(mouseHorizontalAxis(600, 500, MOUSE_INPUT_CONFIG)).toBeGreaterThan(0);
    expect(mouseHorizontalAxis(510, 500, MOUSE_INPUT_CONFIG)).toBe(0);
    expect(mouseHorizontalAxis(0, 500, MOUSE_INPUT_CONFIG)).toBe(-1);
    expect(mouseHorizontalAxis(1000, 500, MOUSE_INPUT_CONFIG)).toBe(1);
  });

  it('maps resized canvas coordinates into the same canonical world', () => {
    expect(pointerClientToWorld(
      { x: 960, y: 540 }, { left: 0, top: 0, width: 1920, height: 1080 }, { width: 1280, height: 720 }
    )).toEqual({ x: 640, y: 360, inside: true });
    expect(pointerClientToWorld(
      { x: -1, y: 10 }, { left: 0, top: 0, width: 1280, height: 720 }, { width: 1280, height: 720 }
    ).inside).toBe(false);
  });
});

describe('GameplayInputController ownership', () => {
  it('gives held keyboard movement priority and restores mouse when keyboard is neutral', () => {
    const keyboard = new ActionStateStore();
    const controller = new GameplayInputController();
    keyboard.setHeld(InputActions.Left, true);
    expect(controller.resolve(keyboard.snapshot(), neutralMouse({ horizontalAxis: 1 })).horizontalAxis).toBe(-1);
    keyboard.setHeld(InputActions.Right, true);
    expect(controller.resolve(keyboard.snapshot(), neutralMouse({ horizontalAxis: 1 })).horizontalAxis).toBe(0);
    keyboard.clearAll();
    expect(controller.resolve(keyboard.snapshot(), neutralMouse({ horizontalAxis: 0.5 })).horizontalAxis).toBe(0.5);
  });

  it('lets the first charge source own release and ignores the other source', () => {
    const keyboard = new ActionStateStore();
    const controller = new GameplayInputController();
    keyboard.setHeld(InputActions.Throw, true);
    let intent = controller.resolve(keyboard.snapshot(), neutralMouse({
      charge: { pressed: true, held: true, released: false }
    }));
    expect(intent).toMatchObject({ chargePressed: true, chargeHeld: true, chargeReleased: false });
    expect(controller.owner()).toBe('keyboard');

    keyboard.clearTransient();
    intent = controller.resolve(keyboard.snapshot(), neutralMouse({
      charge: { pressed: false, held: false, released: true }
    }));
    expect(intent.chargeReleased).toBe(false);
    expect(controller.owner()).toBe('keyboard');

    keyboard.setHeld(InputActions.Throw, false);
    intent = controller.resolve(keyboard.snapshot(), neutralMouse());
    expect(intent.chargeReleased).toBe(true);
    expect(controller.owner()).toBeNull();
  });

  it('supports mouse ownership, one release, and reset cancellation', () => {
    const keyboard = new ActionStateStore();
    const controller = new GameplayInputController();
    let intent = controller.resolve(keyboard.snapshot(), neutralMouse({
      charge: { pressed: true, held: true, released: false }, activeThisFrame: true
    }));
    expect(intent).toMatchObject({ chargePressed: true, chargeHeld: true, activeDevice: 'mouse' });
    keyboard.setHeld(InputActions.Throw, true);
    intent = controller.resolve(keyboard.snapshot(), neutralMouse({
      charge: { pressed: false, held: true, released: false }
    }));
    expect(intent.chargePressed).toBe(false);
    keyboard.setHeld(InputActions.Throw, false);
    intent = controller.resolve(keyboard.snapshot(), neutralMouse({
      charge: { pressed: false, held: false, released: true }
    }));
    expect(intent.chargeReleased).toBe(true);
    expect(controller.owner()).toBeNull();
    keyboard.clearTransient();
    expect(controller.resolve(keyboard.snapshot(), neutralMouse()).chargeReleased).toBe(false);

    controller.resolve(keyboard.snapshot(), neutralMouse({ charge: { pressed: true, held: true, released: false } }));
    controller.reset();
    expect(controller.owner()).toBeNull();
    expect(controller.resolve(keyboard.snapshot(), neutralMouse()).chargeReleased).toBe(false);
  });
});
