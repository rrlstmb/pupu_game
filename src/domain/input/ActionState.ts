export const InputActions = {
  Left: 'left',
  Right: 'right',
  Throw: 'throw',
  Aim: 'aim',
  SwitchPrev: 'switchPrev',
  SwitchNext: 'switchNext'
} as const;

export type InputAction = (typeof InputActions)[keyof typeof InputActions];

export type ActionSnapshot = {
  readonly pressed: boolean;
  readonly held: boolean;
  readonly released: boolean;
};

export type InputSnapshot = Record<InputAction, ActionSnapshot>;

type MutableActionState = {
  pressed: boolean;
  held: boolean;
  released: boolean;
};

export class ActionStateStore {
  private readonly actions = new Map<InputAction, MutableActionState>();

  constructor() {
    for (const action of Object.values(InputActions)) {
      this.actions.set(action, { pressed: false, held: false, released: false });
    }
  }

  setHeld(action: InputAction, held: boolean): void {
    const state = this.getMutable(action);

    if (held === state.held) {
      return;
    }

    state.held = held;
    if (held) {
      state.pressed = true;
    } else {
      state.released = true;
    }
  }

  clearTransient(): void {
    for (const state of this.actions.values()) {
      state.pressed = false;
      state.released = false;
    }
  }

  clearAll(): void {
    for (const state of this.actions.values()) {
      state.pressed = false;
      state.held = false;
      state.released = false;
    }
  }

  snapshot(): InputSnapshot {
    return Object.fromEntries(
      Object.values(InputActions).map((action) => {
        const state = this.getMutable(action);
        return [
          action,
          {
            pressed: state.pressed,
            held: state.held,
            released: state.released
          }
        ];
      })
    ) as InputSnapshot;
  }

  private getMutable(action: InputAction): MutableActionState {
    const state = this.actions.get(action);
    if (!state) {
      throw new Error(`Unknown input action: ${action}`);
    }
    return state;
  }
}

export function horizontalIntent(input: Pick<InputSnapshot, 'left' | 'right'>): -1 | 0 | 1 {
  if (input.left.held === input.right.held) {
    return 0;
  }

  return input.left.held ? -1 : 1;
}

