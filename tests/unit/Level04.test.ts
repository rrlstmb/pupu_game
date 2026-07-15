import { describe, expect, it } from 'vitest';
import { LEVEL_04 } from '../../src/data/levels/level04';
import { createLevelSession, resetLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 4 authored definition', () => {
  it('validates market-evening crowd data and splash unlock', () => {
    expect(validateLevelDefinition(LEVEL_04)).toEqual({ valid: true, definition: LEVEL_04 });
    expect(LEVEL_04.visual.profile).toBe('market_evening');
    expect(LEVEL_04.availablePoopTypes).toEqual(['normal_poop', 'splash_poop']);
    expect(LEVEL_04.spawn.definitions).toEqual([
      { npcType: 'office_worker', weight: 3 },
      { npcType: 'phone_user', weight: 2 },
      { npcType: 'tourist', weight: 5 }
    ]);
  });

  it('triggers the bounded market-exit crowd once and resets with the same seed', () => {
    let session = createLevelSession({ ...LEVEL_04, countdownSeconds: 0 });
    session = updateLevelSession(session, 99.9);
    expect(session.triggeredEventIds).toEqual([]);
    session = updateLevelSession(session, 0.1);
    expect(session.triggeredEventIds).toEqual(['market_exit_crowd']);
    expect(spawnConfigForLevel(LEVEL_04, session)).toMatchObject({ intervalSeconds: 0.4, maxActive: 15 });
    expect(updateLevelSession(session, 2).triggeredEventIds).toEqual(['market_exit_crowd']);
    const reset = resetLevelSession(session);
    expect(reset.triggeredEventIds).toEqual([]);
    expect(reset.definition.seed).toBe('level-04-market-seed');
  });

  it('awards the feature star only for one splash reaching three legal targets', () => {
    const two = evaluateStars(LEVEL_04, {
      totalScore: 1400, highestCombo: 0, hitCount: 2, throwCount: 1, maxSplashTargetsHit: 2
    });
    const three = evaluateStars(LEVEL_04, {
      totalScore: 1400, highestCombo: 0, hitCount: 3, throwCount: 1, maxSplashTargetsHit: 3
    });
    expect(two.conditions.find((condition) => condition.id === 'splash_multi_hit_target')?.passed).toBe(false);
    expect(three.conditions.find((condition) => condition.id === 'splash_multi_hit_target')?.passed).toBe(true);
  });
});
