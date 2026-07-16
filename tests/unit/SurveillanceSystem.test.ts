import { describe, expect, it } from 'vitest';
import { LEVEL_08 } from '../../src/data/levels/level08';
import {
  cancelSurveillanceForSource, createSurveillanceState, hasMinimumSurveillanceSafeSpace, isPlayerConcealed, updateSurveillance
} from '../../src/domain/surveillance/SurveillanceSystem';

const rules = LEVEL_08.surveillance!;
const bounds = { minX: 100, maxX: 1180 };

function step(state = createSurveillanceState(), overrides = {}) {
  return updateSurveillance(state, {
    deltaSeconds: 0.1, playerX: 640, isThrowing: false, isClimax: false, movementBounds: bounds,
    sources: [{ id: 1, x: 900, mode: 'snapshot' as const }], ...overrides
  }, rules);
}

describe('SurveillanceSystem', () => {
  it('telegraphs before an authoritative one-shot snapshot and does not track visual bounds', () => {
    let state = step().state;
    expect(state.instances[0].state).toBe('telegraph');
    const locked = state.instances[0].targetZone.centerX;
    state = updateSurveillance(state, {
      deltaSeconds: rules.snapshot.telegraphDurationSeconds, playerX: locked, isThrowing: false,
      isClimax: false, movementBounds: bounds, sources: [{ id: 1, x: 100, mode: 'snapshot' }]
    }, rules).state;
    expect(state.instances[0]).toMatchObject({ state: 'active', targetZone: { centerX: locked } });
    const resolved = updateSurveillance(state, {
      deltaSeconds: 0.2, playerX: locked, isThrowing: false, isClimax: false,
      movementBounds: bounds, sources: [{ id: 1, x: 400, mode: 'snapshot' }]
    }, rules);
    expect(resolved.results).toHaveLength(1);
    expect(resolved.results[0].outcome).toBe('captured');
    expect(resolved.state.stats.snapshotCaptures).toBe(1);
  });

  it('avoids a snapshot by movement or concealment, while cancelled sources do not count', () => {
    let state = step().state;
    state = updateSurveillance(state, { deltaSeconds: 2, playerX: 1170, isThrowing: false, isClimax: false, movementBounds: bounds, sources: [{ id: 1, x: 900, mode: 'snapshot' }] }, rules).state;
    const avoided = updateSurveillance(state, { deltaSeconds: 1, playerX: 1170, isThrowing: false, isClimax: false, movementBounds: bounds, sources: [{ id: 1, x: 900, mode: 'snapshot' }] }, rules);
    expect(avoided.results[0]?.outcome).toBe('avoided');
    expect(isPlayerConcealed(150, 'snapshot', rules.concealmentZones)).toBe(true);
    const cancelled = updateSurveillance(step().state, { deltaSeconds: 0.1, playerX: 640, isThrowing: false, isClimax: false, movementBounds: bounds, sources: [] }, rules);
    expect(cancelled.results[0]?.outcome).toBe('cancelled');
    expect(cancelled.state.stats.snapshotsAvoided).toBe(0);
  });

  it('records exposure, decays outside the zone, pauses at zero delta, and captures only once', () => {
    let state = updateSurveillance(createSurveillanceState(), {
      deltaSeconds: 0.1, playerX: 420, isThrowing: true, isClimax: true, movementBounds: bounds,
      sources: [{ id: 2, x: 900, mode: 'recording' }]
    }, rules).state;
    state = updateSurveillance(state, { deltaSeconds: 2, playerX: 420, isThrowing: true, isClimax: true, movementBounds: bounds, sources: [{ id: 2, x: 900, mode: 'recording' }] }, rules).state;
    state = updateSurveillance(state, { deltaSeconds: 0.5, playerX: 420, isThrowing: true, isClimax: true, movementBounds: bounds, sources: [{ id: 2, x: 900, mode: 'recording' }] }, rules).state;
    const paused = updateSurveillance(state, { deltaSeconds: 0, playerX: 420, isThrowing: true, isClimax: true, movementBounds: bounds, sources: [{ id: 2, x: 900, mode: 'recording' }] }, rules);
    expect(paused.state).toBe(state);
    const before = state.instances[0].exposure;
    state = updateSurveillance(state, { deltaSeconds: 0.5, playerX: 1100, isThrowing: false, isClimax: true, movementBounds: bounds, sources: [{ id: 2, x: 900, mode: 'recording' }] }, rules).state;
    expect(state.instances[0].exposure).toBeLessThan(before);
    const captured = updateSurveillance(state, { deltaSeconds: 5, playerX: 420, isThrowing: true, isClimax: true, movementBounds: bounds, sources: [{ id: 2, x: 900, mode: 'recording' }] }, rules);
    expect(captured.results.filter((result) => result.outcome === 'captured')).toHaveLength(1);
    expect(captured.state.instances).toHaveLength(0);
  });

  it('bounds queues and preserves minimum escape width deterministically', () => {
    expect(hasMinimumSurveillanceSafeSpace(bounds, [{ centerX: 640, halfWidth: 100 }], 180)).toBe(true);
    expect(hasMinimumSurveillanceSafeSpace(bounds, [{ centerX: 370, halfWidth: 270 }, { centerX: 910, halfWidth: 270 }], 180)).toBe(false);
    const sources = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, x: 900, mode: index % 2 ? 'recording' as const : 'snapshot' as const }));
    const first = updateSurveillance(createSurveillanceState(), { deltaSeconds: 0.1, playerX: 640, isThrowing: false, isClimax: false, movementBounds: bounds, sources }, rules).state;
    const second = updateSurveillance(createSurveillanceState(), { deltaSeconds: 0.1, playerX: 640, isThrowing: false, isClimax: false, movementBounds: bounds, sources }, rules).state;
    expect(first.queuedSourceIds.length).toBeLessThanOrEqual(rules.queueLimit);
    expect(first).toEqual(second);
  });

  it('interrupts a source without awarding avoidance and reset starts empty', () => {
    const active = step().state;
    const interrupted = cancelSurveillanceForSource(active, 1);
    expect(interrupted.instances).toEqual([]);
    expect(interrupted.stats.snapshotsAvoided).toBe(0);
    expect(createSurveillanceState()).toMatchObject({ instances: [], queuedSourceIds: [], throwLockSeconds: 0, invulnerabilitySeconds: 0 });
  });
});
