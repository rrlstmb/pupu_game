import type { MouseInputConfig } from '../../data/mouseInput';
import { horizontalIntent, type ActionSnapshot, type InputSnapshot } from './ActionState';

export type InputDevice = 'keyboard' | 'mouse';
export type ChargeInputOwner = InputDevice | null;

export type MouseInputSnapshot = {
  readonly horizontalAxis: number;
  readonly charge: ActionSnapshot;
  readonly pointerInside: boolean;
  readonly overUi: boolean;
  readonly activeThisFrame: boolean;
};

export type GameplayInputIntent = {
  readonly horizontalAxis: number;
  readonly chargePressed: boolean;
  readonly chargeHeld: boolean;
  readonly chargeReleased: boolean;
  readonly aimHeld: boolean;
  readonly switchPrevPressed: boolean;
  readonly switchNextPressed: boolean;
  readonly activeDevice: InputDevice;
};

export class GameplayInputController {
  private chargeOwner: ChargeInputOwner = null;
  private activeDevice: InputDevice = 'keyboard';

  resolve(keyboard: InputSnapshot, mouse: MouseInputSnapshot): GameplayInputIntent {
    const keyboardAxisActive = keyboard.left.held || keyboard.right.held;
    const keyboardUsed = keyboardAxisActive || Object.values(keyboard).some(
      (action) => action.pressed || action.released
    );
    if (keyboardUsed) this.activeDevice = 'keyboard';
    else if (mouse.activeThisFrame) this.activeDevice = 'mouse';

    if (this.chargeOwner === null) {
      if (keyboard.throw.pressed) this.chargeOwner = 'keyboard';
      else if (mouse.charge.pressed) this.chargeOwner = 'mouse';
    }

    const charge = this.chargeOwner === 'keyboard'
      ? keyboard.throw
      : this.chargeOwner === 'mouse' ? mouse.charge : EMPTY_ACTION;
    const resolvedOwner = this.chargeOwner;
    if (resolvedOwner !== null && (!charge.held || charge.released)) this.chargeOwner = null;

    return {
      horizontalAxis: keyboardAxisActive ? horizontalIntent(keyboard) : clamp(mouse.horizontalAxis, -1, 1),
      chargePressed: charge.pressed,
      chargeHeld: charge.held,
      chargeReleased: charge.released,
      aimHeld: keyboard.aim.held,
      switchPrevPressed: keyboard.switchPrev.pressed,
      switchNextPressed: keyboard.switchNext.pressed,
      activeDevice: this.activeDevice
    };
  }

  reset(): void {
    this.chargeOwner = null;
  }

  owner(): ChargeInputOwner {
    return this.chargeOwner;
  }
}

export function mouseHorizontalAxis(pointerWorldX: number, playerWorldX: number, config: MouseInputConfig): number {
  const distance = pointerWorldX - playerWorldX;
  if (!config.enabled || Math.abs(distance) <= config.deadZonePx) return 0;
  return clamp(distance / Math.max(config.deadZonePx, config.fullSpeedDistancePx), -1, 1);
}

export function pointerClientToWorld(
  client: { readonly x: number; readonly y: number },
  canvasBounds: { readonly left: number; readonly top: number; readonly width: number; readonly height: number },
  world: { readonly width: number; readonly height: number }
): { readonly x: number; readonly y: number; readonly inside: boolean } {
  const inside = client.x >= canvasBounds.left && client.x <= canvasBounds.left + canvasBounds.width &&
    client.y >= canvasBounds.top && client.y <= canvasBounds.top + canvasBounds.height;
  return {
    x: (client.x - canvasBounds.left) * world.width / Math.max(1, canvasBounds.width),
    y: (client.y - canvasBounds.top) * world.height / Math.max(1, canvasBounds.height),
    inside
  };
}

const EMPTY_ACTION: ActionSnapshot = { pressed: false, held: false, released: false };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
