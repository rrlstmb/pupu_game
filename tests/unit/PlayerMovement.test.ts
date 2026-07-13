import { describe, expect, it } from 'vitest';
import { PLAYER_MOVEMENT_CONFIG } from '../../src/data/playerMovement';
import { ActionStateStore, InputActions } from '../../src/domain/input/ActionState';
import { createInitialPlayerState, updatePlayerMovement } from '../../src/domain/player/PlayerMovement';

const bounds = { minX: 100, maxX: 1180 };

describe('PlayerMovement', () => {
  it('accelerates right and clamps at max speed', () => {
    const input = new ActionStateStore();
    input.setHeld(InputActions.Right, true);

    const state = updatePlayerMovement(createInitialPlayerState(bounds), input.snapshot(), bounds, PLAYER_MOVEMENT_CONFIG, 1);

    expect(state.velocityX).toBe(PLAYER_MOVEMENT_CONFIG.maxSpeed);
    expect(state.visualState).toBe('move');
  });

  it('decelerates using delta time when no horizontal input is held', () => {
    const input = new ActionStateStore();
    const state = updatePlayerMovement(
      { x: 500, velocityX: 300, visualState: 'move' },
      input.snapshot(),
      bounds,
      PLAYER_MOVEMENT_CONFIG,
      0.05
    );

    expect(state.velocityX).toBeCloseTo(140, 5);
    expect(state.x).toBeCloseTo(507, 5);
  });

  it('does not move vertically or cross rooftop movement bounds', () => {
    const input = new ActionStateStore();
    input.setHeld(InputActions.Left, true);

    const state = updatePlayerMovement(
      { x: bounds.minX + 1, velocityX: -300, visualState: 'move' },
      input.snapshot(),
      bounds,
      PLAYER_MOVEMENT_CONFIG,
      1
    );

    expect(state.x).toBe(bounds.minX);
    expect(state.velocityX).toBe(0);
  });

  it('keeps different frame steps within a small tolerance', () => {
    const input = new ActionStateStore();
    input.setHeld(InputActions.Right, true);

    let sixtyFps = createInitialPlayerState(bounds);
    for (let index = 0; index < 60; index += 1) {
      sixtyFps = updatePlayerMovement(sixtyFps, input.snapshot(), bounds, PLAYER_MOVEMENT_CONFIG, 1 / 60);
    }

    let thirtyFps = createInitialPlayerState(bounds);
    for (let index = 0; index < 30; index += 1) {
      thirtyFps = updatePlayerMovement(thirtyFps, input.snapshot(), bounds, PLAYER_MOVEMENT_CONFIG, 1 / 30);
    }

    expect(Math.abs(sixtyFps.x - thirtyFps.x)).toBeLessThan(16);
  });

  it('uses nervous visual state while aim is held', () => {
    const input = new ActionStateStore();
    input.setHeld(InputActions.Aim, true);

    const state = updatePlayerMovement(createInitialPlayerState(bounds), input.snapshot(), bounds, PLAYER_MOVEMENT_CONFIG, 1 / 60);

    expect(state.visualState).toBe('nervous');
  });
});

