import { describe, expect, it } from 'vitest';
import { PLAYER_MOVEMENT_CONFIG } from '../../src/data/playerMovement';
import { createInitialPlayerState, updatePlayerMovement } from '../../src/domain/player/PlayerMovement';

const bounds = { minX: 100, maxX: 1180 };

describe('PlayerMovement', () => {
  it('accelerates right and clamps at max speed', () => {
    const state = updatePlayerMovement(createInitialPlayerState(bounds), 1, bounds, PLAYER_MOVEMENT_CONFIG, 1);

    expect(state.velocityX).toBe(PLAYER_MOVEMENT_CONFIG.maxSpeed);
    expect(state.visualState).toBe('move');
  });

  it('decelerates using delta time when no horizontal input is held', () => {
    const state = updatePlayerMovement(
      { x: 500, velocityX: 300, visualState: 'move' },
      0,
      bounds,
      PLAYER_MOVEMENT_CONFIG,
      0.05
    );

    expect(state.velocityX).toBeCloseTo(140, 5);
    expect(state.x).toBeCloseTo(507, 5);
  });

  it('does not move vertically or cross rooftop movement bounds', () => {
    const state = updatePlayerMovement(
      { x: bounds.minX + 1, velocityX: -300, visualState: 'move' },
      -1,
      bounds,
      PLAYER_MOVEMENT_CONFIG,
      1
    );

    expect(state.x).toBe(bounds.minX);
    expect(state.velocityX).toBe(0);
  });

  it('keeps different frame steps within a small tolerance', () => {
    let sixtyFps = createInitialPlayerState(bounds);
    for (let index = 0; index < 60; index += 1) {
      sixtyFps = updatePlayerMovement(sixtyFps, 1, bounds, PLAYER_MOVEMENT_CONFIG, 1 / 60);
    }

    let thirtyFps = createInitialPlayerState(bounds);
    for (let index = 0; index < 30; index += 1) {
      thirtyFps = updatePlayerMovement(thirtyFps, 1, bounds, PLAYER_MOVEMENT_CONFIG, 1 / 30);
    }

    expect(Math.abs(sixtyFps.x - thirtyFps.x)).toBeLessThan(16);
  });

  it('uses nervous visual state while aim is held', () => {
    const state = updatePlayerMovement(createInitialPlayerState(bounds), 0, bounds, PLAYER_MOVEMENT_CONFIG, 1 / 60, true);

    expect(state.visualState).toBe('nervous');
  });

  it('uses the same acceleration and bounds for a fractional mouse axis', () => {
    const state = updatePlayerMovement(createInitialPlayerState(bounds), 0.5, bounds, PLAYER_MOVEMENT_CONFIG, 1);
    expect(state.velocityX).toBe(PLAYER_MOVEMENT_CONFIG.maxSpeed * 0.5);
    const blocked = updatePlayerMovement({ ...state, x: bounds.maxX - 1 }, 1, bounds, PLAYER_MOVEMENT_CONFIG, 1);
    expect(blocked).toMatchObject({ x: bounds.maxX, velocityX: 0 });
  });

  it('applies the supplied stagger movement configuration to mouse intent', () => {
    const slowed = { ...PLAYER_MOVEMENT_CONFIG, maxSpeed: PLAYER_MOVEMENT_CONFIG.maxSpeed * 0.5 };
    const state = updatePlayerMovement(createInitialPlayerState(bounds), 1, bounds, slowed, 1);
    expect(state.velocityX).toBe(slowed.maxSpeed);
  });
});
