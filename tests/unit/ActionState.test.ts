import { describe, expect, it } from 'vitest';
import { ActionStateStore, horizontalIntent, InputActions } from '../../src/domain/input/ActionState';

describe('ActionStateStore', () => {
  it('separates pressed, held, and released so held actions do not repeat pressed', () => {
    const store = new ActionStateStore();

    store.setHeld(InputActions.Throw, true);
    expect(store.snapshot().throw).toEqual({ pressed: true, held: true, released: false });

    store.clearTransient();
    expect(store.snapshot().throw).toEqual({ pressed: false, held: true, released: false });

    store.setHeld(InputActions.Throw, false);
    expect(store.snapshot().throw).toEqual({ pressed: false, held: false, released: true });
  });

  it('clears all held state on blur or pause', () => {
    const store = new ActionStateStore();
    store.setHeld(InputActions.Left, true);
    store.setHeld(InputActions.Aim, true);

    store.clearAll();

    expect(store.snapshot().left).toEqual({ pressed: false, held: false, released: false });
    expect(store.snapshot().aim).toEqual({ pressed: false, held: false, released: false });
  });

  it('uses neutral horizontal intent when left and right are both held', () => {
    const store = new ActionStateStore();
    store.setHeld(InputActions.Left, true);
    store.setHeld(InputActions.Right, true);

    expect(horizontalIntent(store.snapshot())).toBe(0);
  });
});

