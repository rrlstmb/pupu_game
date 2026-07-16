import { describe, expect, it } from 'vitest';
import { LEVEL_07 } from '../../src/data/levels/level07';
import { createCounterattackState, hasMinimumEscapeSpace, registerAngryHit, updateCounterattacks } from '../../src/domain/counterattack/CounterattackSystem';

const rules = LEVEL_07.counterattack!;
const source = { id: 7, x: 700, y: 330 };
const bounds = { minX: 110, maxX: 1170 };

describe('CounterattackSystem', () => {
  it('requires the hit threshold, dedupes a hit event, and permits one pending attack per source', () => {
    let state = registerAngryHit(createCounterattackState(), 'hit:1', source.id, rules);
    expect(state.queue).toEqual([]);
    state = registerAngryHit(state, 'hit:1', source.id, rules);
    expect(state.sourceProgress[source.id].anger).toBe(1);
    state = registerAngryHit(state, 'hit:2', source.id, rules);
    expect(state.queue).toEqual([source.id]);
    state = registerAngryHit(state, 'hit:3', source.id, rules);
    expect(state.queue).toEqual([source.id]);
  });

  it('telegraphs before flight, snapshots player X, and never tracks later movement', () => {
    let state = primed();
    let update = tick(state, 0, 500, [source]);
    state = update.state;
    expect(state.instances[0]).toMatchObject({ state: 'telegraph', lockedTargetX: 500 });
    expect(tick(state, 0, 900, [source]).state.instances[0].lockedTargetX).toBe(500);
    expect(tick(state, rules.telegraphDurationSeconds - 0.01, 900, [source]).state.instances[0].state).toBe('telegraph');
    update = tick(state, rules.telegraphDurationSeconds, 900, [source]);
    expect(update.state.instances[0]).toMatchObject({ state: 'flying', lockedTargetX: 500 });
  });

  it('hits a stationary player, applies bounded penalties, and does not create health', () => {
    let state = tick(primed(), 0, 500, [source]).state;
    state = tick(state, rules.telegraphDurationSeconds, 500, [source]).state;
    const update = tick(state, rules.projectileTravelDurationSeconds, 500, [source]);
    expect(update.results).toEqual([{ id: 'counter:1', sourceNpcId: source.id, outcome: 'hit' }]);
    expect(update.state.stats).toMatchObject({ hitPlayer: 1, dodged: 0, fired: 1 });
    expect(update.state.staggerSeconds).toBe(rules.staggerDurationSeconds);
    expect(update.state.throwLockSeconds).toBe(rules.throwLockSeconds);
    expect(update.state.invulnerabilitySeconds).toBe(rules.invulnerabilitySeconds);
    expect(update.state).not.toHaveProperty('health');
  });

  it('counts one dodge only after completed flight when the player leaves the locked zone', () => {
    let state = tick(primed(), 0, 500, [source]).state;
    state = tick(state, rules.telegraphDurationSeconds, 900, [source]).state;
    const update = tick(state, rules.projectileTravelDurationSeconds, 900, [source]);
    expect(update.results[0].outcome).toBe('missed');
    expect(update.state.stats).toMatchObject({ fired: 1, dodged: 1, hitPlayer: 0, recycled: 1 });
    expect(tick(update.state, 1, 900, [source]).state.stats.dodged).toBe(1);
  });

  it('freezes at zero delta and cancels a pending telegraph if its source exits', () => {
    const telegraph = tick(primed(), 0, 500, [source]).state;
    expect(tick(telegraph, 0, 500, [source]).state).toEqual(telegraph);
    const cancelled = tick(telegraph, 0.1, 500, []);
    expect(cancelled.results[0].outcome).toBe('cancelled');
    expect(cancelled.state.instances).toHaveLength(0);
  });

  it('bounds the queue, serializes sources by id, and resets all runtime state', () => {
    const tight = { ...rules, queueLimit: 2 };
    let state = createCounterattackState();
    for (const id of [3, 2, 1]) {
      state = registerAngryHit(state, `${id}:1`, id, tight);
      state = registerAngryHit(state, `${id}:2`, id, tight);
    }
    expect(state.queue).toHaveLength(2);
    const update = updateCounterattacks(state, {
      deltaSeconds: 0, playerX: 500, targetY: 640, movementBounds: bounds,
      sources: [{ id: 3, x: 700, y: 330 }, { id: 2, x: 720, y: 330 }, { id: 1, x: 740, y: 330 }]
    }, tight);
    expect(update.state.instances[0].sourceNpcId).toBe(2);
    expect(update.state.instances.filter((instance) => instance.state === 'telegraph').length).toBeLessThanOrEqual(tight.maxConcurrentTelegraphs);
    expect(createCounterattackState()).toMatchObject({ instances: [], queue: [], staggerSeconds: 0, throwLockSeconds: 0, invulnerabilitySeconds: 0 });
  });

  it('rejects danger coverage that removes the minimum escape width', () => {
    expect(hasMinimumEscapeSpace(bounds, [{ left: 450, right: 550 }], 170)).toBe(true);
    expect(hasMinimumEscapeSpace(bounds, [{ left: 110, right: 1170 }], 170)).toBe(false);
    expect(hasMinimumEscapeSpace(bounds, [{ left: 110, right: 650 }, { left: 650, right: 1170 }], 170)).toBe(false);
  });
});

function primed() {
  const state = registerAngryHit(createCounterattackState(), 'hit:1', source.id, rules);
  return registerAngryHit(state, 'hit:2', source.id, rules);
}

function tick(state: ReturnType<typeof createCounterattackState>, deltaSeconds: number, playerX: number, sources: readonly typeof source[]) {
  return updateCounterattacks(state, { deltaSeconds, playerX, targetY: 640, movementBounds: bounds, sources }, rules);
}
