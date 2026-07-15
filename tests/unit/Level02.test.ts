import { describe, expect, it } from 'vitest';
import { LEVEL_02 } from '../../src/data/levels/level02';
import { createLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 2 authored definition', () => {
  it('is schema-valid and data-drives its evening rules and unlocks', () => {
    expect(validateLevelDefinition(LEVEL_02)).toEqual({ valid: true, definition: LEVEL_02 });
    expect(LEVEL_02.visual.profile).toBe('evening');
    expect(LEVEL_02.availablePoopTypes).toEqual(['normal_poop', 'sticky_poop']);
    expect(LEVEL_02.spawn.definitions).toEqual([
      { npcType: 'office_worker', weight: 5 },
      { npcType: 'phone_user', weight: 3 },
      { npcType: 'jogger', weight: 2 }
    ]);
  });

  it('activates the final-20-second rush schedule exactly once', () => {
    let session = createLevelSession({ ...LEVEL_02, countdownSeconds: 0 });
    session = updateLevelSession(session, 79.9);
    expect(session.triggeredEventIds).toEqual([]);
    expect(spawnConfigForLevel(LEVEL_02, session).intervalSeconds).toBe(1.05);

    session = updateLevelSession(session, 0.1);
    expect(session.remainingSeconds).toBeCloseTo(20);
    expect(session.triggeredEventIds).toEqual(['final_20_second_rush']);
    expect(spawnConfigForLevel(LEVEL_02, session)).toMatchObject({ intervalSeconds: 0.45, maxActive: 14 });

    session = updateLevelSession(session, 5);
    expect(session.triggeredEventIds).toEqual(['final_20_second_rush']);
  });

  it('awards the high-speed star only after two jogger hits', () => {
    const oneHit = evaluateStars(LEVEL_02, {
      totalScore: 850, highestCombo: 0, hitCount: 1, throwCount: 1, npcHitCounts: { jogger: 1 }
    });
    const twoHits = evaluateStars(LEVEL_02, {
      totalScore: 850, highestCombo: 0, hitCount: 2, throwCount: 2, npcHitCounts: { jogger: 2 }
    });
    expect(oneHit.conditions.find((condition) => condition.id === 'npc_hit_target')?.passed).toBe(false);
    expect(twoHits.conditions.find((condition) => condition.id === 'npc_hit_target')?.passed).toBe(true);
  });
});
