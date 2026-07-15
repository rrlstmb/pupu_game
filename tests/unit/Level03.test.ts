import { describe, expect, it } from 'vitest';
import { LEVEL_03 } from '../../src/data/levels/level03';
import { createLevelSession, resetLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 3 authored definition', () => {
  it('validates rainy umbrella-defense data and jumbo unlock', () => {
    expect(validateLevelDefinition(LEVEL_03)).toEqual({ valid: true, definition: LEVEL_03 });
    expect(LEVEL_03.visual).toMatchObject({ profile: 'rainy', weather: { kind: 'rain', streakCount: 38 } });
    expect(LEVEL_03.availablePoopTypes).toEqual(['normal_poop', 'jumbo_poop']);
    expect(LEVEL_03.spawn.definitions).toEqual([
      { npcType: 'umbrella_pedestrian', weight: 6 },
      { npcType: 'office_worker', weight: 3 },
      { npcType: 'phone_user', weight: 1 }
    ]);
  });

  it('triggers the matching-company umbrella group once and resets deterministically', () => {
    let session = createLevelSession({ ...LEVEL_03, countdownSeconds: 0 });
    session = updateLevelSession(session, 84.9);
    expect(session.triggeredEventIds).toEqual([]);
    session = updateLevelSession(session, 0.1);
    expect(session.triggeredEventIds).toEqual(['matching_company_umbrella_group']);
    expect(spawnConfigForLevel(LEVEL_03, session)).toMatchObject({
      intervalSeconds: 0.5,
      maxActive: 14,
      definitions: [{ npcType: 'umbrella_pedestrian', weight: 1 }]
    });
    expect(updateLevelSession(session, 2).triggeredEventIds).toEqual(['matching_company_umbrella_group']);
    const reset = resetLevelSession(session);
    expect(reset.triggeredEventIds).toEqual([]);
    expect(reset.definition.seed).toBe('level-03-umbrella-seed');
  });

  it('counts only effective umbrella-crack interactions for its feature star', () => {
    const blocked = evaluateStars(LEVEL_03, {
      totalScore: 1100, highestCombo: 0, hitCount: 0, throwCount: 3,
      interactionCounts: { umbrella_blocks: 3 }
    });
    const cracked = evaluateStars(LEVEL_03, {
      totalScore: 1100, highestCombo: 0, hitCount: 3, throwCount: 3,
      interactionCounts: { umbrella_crack: 3 }
    });
    expect(blocked.conditions.find((condition) => condition.id === 'interaction_target')?.passed).toBe(false);
    expect(cracked.conditions.find((condition) => condition.id === 'interaction_target')?.passed).toBe(true);
  });
});
