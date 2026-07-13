import { describe, expect, it } from 'vitest';
import { SCORE_RULES } from '../../src/data/scoreRules';
import {
  applyMissPenalty,
  comboMultiplierForCount,
  createScoreState,
  precisionForDistance,
  repeatMultiplierForHitCount,
  scoreRantEvent,
  updateComboTimer
} from '../../src/domain/score/ScoreCalculator';

describe('ScoreCalculator', () => {
  it('calculates deterministic score breakdowns from validated rant events', () => {
    const state = scoreRantEvent(
      createScoreState(),
      {
        eventId: '1:2:1',
        npcId: 2,
        npcType: 'office_worker',
        ammoType: 'normal_poop',
        validHitCount: 1,
        impactDistance: 8
      },
      SCORE_RULES
    );

    expect(state.totalScore).toBe(150);
    expect(state.comboCount).toBe(1);
    expect(state.comboRemainingSeconds).toBe(3.5);
    expect(state.breakdowns[0]).toMatchObject({
      eventId: '1:2:1',
      baseScore: 100,
      poopAdaptationMultiplier: 1,
      comboMultiplier: 1,
      precisionGrade: 'perfect',
      precisionMultiplier: 1.5,
      riskMultiplier: 1,
      repeatHitMultiplier: 1,
      specialEventScore: 0,
      finalScore: 150
    });
  });

  it('uses data-driven precision grades and combo extensions', () => {
    expect(precisionForDistance(9, SCORE_RULES).grade).toBe('perfect');
    expect(precisionForDistance(20, SCORE_RULES).grade).toBe('clean');
    expect(precisionForDistance(42, SCORE_RULES).grade).toBe('graze');
    expect(precisionForDistance(999, SCORE_RULES).grade).toBe('graze');
  });

  it('uses data-driven combo thresholds', () => {
    expect(comboMultiplierForCount(1, SCORE_RULES)).toBe(1);
    expect(comboMultiplierForCount(3, SCORE_RULES)).toBe(1.25);
    expect(comboMultiplierForCount(6, SCORE_RULES)).toBe(1.5);
    expect(comboMultiplierForCount(10, SCORE_RULES)).toBe(1.8);
    expect(comboMultiplierForCount(15, SCORE_RULES)).toBe(2.1);
    expect(comboMultiplierForCount(20, SCORE_RULES)).toBe(2.5);
    expect(comboMultiplierForCount(30, SCORE_RULES)).toBe(3);
  });

  it('reduces repeated hit value through data-driven repeat multipliers', () => {
    expect(repeatMultiplierForHitCount(1, SCORE_RULES)).toBe(1);
    expect(repeatMultiplierForHitCount(2, SCORE_RULES)).toBe(0.85);
    expect(repeatMultiplierForHitCount(4, SCORE_RULES)).toBe(0.55);
    expect(repeatMultiplierForHitCount(99, SCORE_RULES)).toBe(0.55);
  });

  it('rounds final score after multiplying all configured factors', () => {
    let state = createScoreState();
    for (let index = 0; index < 3; index += 1) {
      state = scoreRantEvent(
        state,
        {
          eventId: `event-${index}`,
          npcId: index,
          npcType: 'phone_user',
          ammoType: 'normal_poop',
          validHitCount: 2,
          impactDistance: 20
        },
        SCORE_RULES
      );
    }

    expect(state.breakdowns[2].comboCount).toBe(3);
    expect(state.breakdowns[2].comboMultiplier).toBe(1.25);
    expect(state.breakdowns[2].finalScore).toBe(159);
  });

  it('lets misses reduce remaining combo time without immediate reset', () => {
    const scored = scoreRantEvent(
      createScoreState(),
      {
        eventId: '1:2:1',
        npcId: 2,
        npcType: 'office_worker',
        ammoType: 'normal_poop',
        validHitCount: 1,
        impactDistance: 8
      },
      SCORE_RULES
    );
    const penalized = applyMissPenalty(scored, SCORE_RULES);

    expect(penalized.comboCount).toBe(1);
    expect(penalized.comboRemainingSeconds).toBe(2.75);
  });

  it('resets combo when the game-clock window expires', () => {
    const scored = scoreRantEvent(
      createScoreState(),
      {
        eventId: '1:2:1',
        npcId: 2,
        npcType: 'office_worker',
        ammoType: 'normal_poop',
        validHitCount: 1,
        impactDistance: 8
      },
      SCORE_RULES
    );

    expect(updateComboTimer(scored, 1).comboCount).toBe(1);
    expect(updateComboTimer(scored, 4).comboCount).toBe(0);
  });

  it('does not score the same rant event id twice', () => {
    const event = {
      eventId: 'stable-rant-event',
      npcId: 2,
      npcType: 'office_worker' as const,
      ammoType: 'normal_poop' as const,
      validHitCount: 1,
      impactDistance: 8
    };
    const scored = scoreRantEvent(createScoreState(), event, SCORE_RULES);
    const duplicate = scoreRantEvent(scored, event, SCORE_RULES);

    expect(duplicate).toBe(scored);
    expect(duplicate.breakdowns).toHaveLength(1);
    expect(duplicate.comboCount).toBe(1);
  });
});
