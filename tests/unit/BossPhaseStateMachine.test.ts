import { describe, expect, it } from 'vitest';
import { LEVEL_10 } from '../../src/data/levels/level10';
import {
  acceptFinalBossHit, consumeFinalGolden, createBossEncounterState, registerBossInteraction, updateBossEncounter
} from '../../src/domain/boss/BossPhaseStateMachine';

const rules = LEVEL_10.bossEncounter!;
const tick = (state: ReturnType<typeof createBossEncounterState>, deltaSeconds: number, overrides = {}) =>
  updateBossEncounter(state, { deltaSeconds, paused: false, phase1Score: 0, phase1UniqueInteractions: 0,
    paradeWaveCompleted: false, safetyAllowsProgress: true, ...overrides }, rules);

describe('BossPhaseStateMachine', () => {
  it('uses guarded one-shot transitions through all three phases', () => {
    let state = tick(createBossEncounterState('session-1', rules), 0.01);
    expect(state.phase).toBe('phase_1_parade');
    state = tick(state, 0.1, { phase1Score: 600, phase1UniqueInteractions: 2, paradeWaveCompleted: true });
    expect(state.phase).toBe('transition_1');
    const tokens = state.processedTransitionTokens;
    state = tick(state, 1);
    expect(state.phase).toBe('phase_2_protected_boss');
    expect(new Set(state.processedTransitionTokens).size).toBe(state.processedTransitionTokens.length);
    expect(state.processedTransitionTokens).not.toEqual(tokens);
  });

  it('enforces media, umbrella, and sticky protection dependencies with token dedupe', () => {
    let state = tick(createBossEncounterState('session-2', rules), 0.01);
    state = tick(state, 0.1, { phase1Score: 600, phase1UniqueInteractions: 2, paradeWaveCompleted: true });
    state = tick(state, 1);
    state = registerBossInteraction(state, 'jumbo_or_bounce', 'wrong', rules);
    expect(state.protections[0].state).toBe('active');
    state = registerBossInteraction(state, 'camera_interrupt', 'camera-1', rules);
    state = registerBossInteraction(state, 'camera_interrupt', 'camera-1', rules);
    expect(state.protections[0]).toMatchObject({ state: 'broken', progress: 1 });
    state = registerBossInteraction(state, 'jumbo_or_bounce', 'jumbo-1', rules);
    state = registerBossInteraction(state, 'sticky_slow', 'sticky-1', rules);
    expect(state.protections.every((gate) => gate.state === 'broken')).toBe(true);
  });

  it('grants final golden once and completes only from an active legal golden hit', () => {
    let state = tick(createBossEncounterState('session-3', rules), 0.01);
    state = tick(state, 0.1, { phase1Score: 600, phase1UniqueInteractions: 2, paradeWaveCompleted: true });
    state = tick(state, 1);
    for (const [kind, token] of [['camera_interrupt', 'c'], ['jumbo_or_bounce', 'j'], ['sticky_slow', 's']] as const) {
      state = registerBossInteraction(state, kind, token, rules);
    }
    state = tick(state, 0.1);
    state = tick(state, 1);
    expect(state).toMatchObject({ phase: 'phase_3_rooftop_lockdown', finalGoldenGranted: 2, finalGoldenRemaining: 2 });
    for (let index = 0; index < rules.safety.blockedStages.length; index += 1) {
      state = tick(state, 0.1);
      expect(state.blockadeWarningSeconds).toBeGreaterThan(0);
      state = tick(state, rules.safety.blockedStages[index].warningSeconds);
    }
    state = tick(state, 0.1);
    expect(state.finalWindowState).toBe('warning');
    expect(acceptFinalBossHit(state, 'golden_poop', 'early').phase).not.toBe('completed');
    state = tick(state, rules.finalWindow.warningSeconds);
    expect(state.finalWindowState).toBe('active');
    state = consumeFinalGolden(state);
    state = acceptFinalBossHit(state, 'golden_poop', 'final-1');
    expect(state).toMatchObject({ phase: 'completed', completionCount: 1, finalGoldenRemaining: 1 });
    expect(acceptFinalBossHit(state, 'golden_poop', 'final-2')).toEqual(state);
  });

  it('freezes on pause and reset creates clean deterministic state', () => {
    const started = tick(createBossEncounterState('session-4', rules), 0.01);
    const paused = updateBossEncounter(started, { deltaSeconds: 10, paused: true, phase1Score: 999,
      phase1UniqueInteractions: 9, paradeWaveCompleted: true, safetyAllowsProgress: true }, rules);
    expect(paused).toEqual(started);
    expect(createBossEncounterState('session-4', rules)).toEqual(createBossEncounterState('session-4', rules));
  });
});
