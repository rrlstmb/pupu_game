import { describe, expect, it } from 'vitest';
import { ALERT_RULES } from '../../src/data/alertRules';
import { createWorldLayout } from '../../src/domain/layout/WorldLayout';
import { isPlayerInCover } from '../../src/domain/alert/CoverVisibility';
import {
  createAlertState,
  recordHit,
  recordThrow,
  resetAlert,
  riskMultiplierForAlert,
  stageForAlert,
  updateAlertOverTime
} from '../../src/domain/alert/AlertSystem';

describe('AlertSystem', () => {
  it('maps alert stage boundaries exactly', () => {
    expect(stageForAlert(0, ALERT_RULES)).toBe('safe');
    expect(stageForAlert(29, ALERT_RULES)).toBe('safe');
    expect(stageForAlert(30, ALERT_RULES)).toBe('suspicious');
    expect(stageForAlert(59, ALERT_RULES)).toBe('suspicious');
    expect(stageForAlert(60, ALERT_RULES)).toBe('high_alert');
    expect(stageForAlert(79, ALERT_RULES)).toBe('high_alert');
    expect(stageForAlert(80, ALERT_RULES)).toBe('exposed_soon');
    expect(stageForAlert(99, ALERT_RULES)).toBe('exposed_soon');
    expect(stageForAlert(100, ALERT_RULES)).toBe('caught');
  });

  it('records normal hit and repeated hit sources', () => {
    const state = recordHit(createAlertState(), 3, ALERT_RULES);

    expect(state.value).toBe(32);
    expect(state.recentChanges.map((change) => change.source)).toEqual(['repeat_hit', 'normal_hit']);
  });

  it('records rapid throw only inside the configured window', () => {
    const first = recordThrow(createAlertState(), ALERT_RULES);
    const slow = updateAlertOverTime(first, { deltaSeconds: 2, playerX: 0, isInCover: false, isThrowing: false }, ALERT_RULES);
    const noPenalty = recordThrow(slow, ALERT_RULES);
    const rapid = recordThrow(noPenalty, ALERT_RULES);

    expect(noPenalty.value).toBe(0);
    expect(rapid.value).toBe(ALERT_RULES.rapidThrowIncrease);
    expect(rapid.recentChanges[0].source).toBe('rapid_throw');
  });

  it('detects cover slots from shared layout data', () => {
    const layout = createWorldLayout();
    const cover = layout.rooftop.coverSlots[0];

    expect(isPlayerInCover(cover.x + cover.width / 2, layout.rooftop.coverSlots)).toBe(true);
    expect(isPlayerInCover(layout.width / 2, layout.rooftop.coverSlots)).toBe(false);
  });

  it('decays faster in cover than idle outside cover', () => {
    const raised = recordHit(recordHit(createAlertState(), 1, ALERT_RULES), 1, ALERT_RULES);
    const idle = updateAlertOverTime(raised, { deltaSeconds: 1, playerX: 0, isInCover: false, isThrowing: false }, ALERT_RULES);
    const covered = updateAlertOverTime(raised, { deltaSeconds: 1, playerX: 0, isInCover: true, isThrowing: false }, ALERT_RULES);

    expect(idle.value).toBe(26);
    expect(covered.value).toBe(20);
    expect(covered.recentChanges[0].source).toBe('cover_decay');
  });

  it('increases alert when staying in one exposed position too long', () => {
    const state = updateAlertOverTime(
      createAlertState(500),
      { deltaSeconds: 3, playerX: 502, isInCover: false, isThrowing: false },
      ALERT_RULES
    );

    expect(state.value).toBeGreaterThan(0);
    expect(state.recentChanges[0].source).toBe('stationary');
  });

  it('clamps to 100 and latches caught state', () => {
    let state = createAlertState();
    for (let index = 0; index < 10; index += 1) {
      state = recordHit(state, 3, ALERT_RULES);
    }

    expect(state.value).toBe(100);
    expect(state.stage).toBe('caught');
    expect(state.isCaught).toBe(true);
    expect(recordHit(state, 1, ALERT_RULES)).toBe(state);
  });

  it('resets alert for retry and exposes stage risk multipliers', () => {
    const caught = recordHit(recordHit(recordHit(createAlertState(), 3, ALERT_RULES), 3, ALERT_RULES), 3, ALERT_RULES);
    const reset = resetAlert(caught, 128);

    expect(reset.value).toBe(0);
    expect(reset.stage).toBe('safe');
    expect(reset.isCaught).toBe(false);
    expect(reset.lastPlayerX).toBe(128);
    expect(reset.recentChanges).toEqual([]);
    expect(
      riskMultiplierForAlert(recordHit(recordHit(recordHit(createAlertState(), 1, ALERT_RULES), 1, ALERT_RULES), 1, ALERT_RULES), ALERT_RULES)
    ).toBe(1.15);
  });

  it('reads alert stage boundaries from injected rules', () => {
    const customRules = {
      ...ALERT_RULES,
      stageThresholds: { suspicious: 10, highAlert: 20, exposedSoon: 30, caught: 40 }
    };

    expect(stageForAlert(15, customRules)).toBe('suspicious');
    expect(stageForAlert(35, customRules)).toBe('exposed_soon');
    expect(stageForAlert(40, customRules)).toBe('caught');
  });
});
