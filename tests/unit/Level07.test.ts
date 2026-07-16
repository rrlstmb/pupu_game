import { describe, expect, it } from 'vitest';
import { LEVEL_07 } from '../../src/data/levels/level07';
import { activeEventForChannel, createLevelSession, resetLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 7 authored definition', () => {
  it('validates residential visuals, angry roster, counterattack limits, and dodge star', () => {
    expect(validateLevelDefinition(LEVEL_07)).toEqual({ valid: true, definition: LEVEL_07 });
    expect(LEVEL_07.visual.profile).toBe('residential_alley');
    expect(LEVEL_07.seed).toBe('level-07-counterattack-seed');
    expect(LEVEL_07.spawn.definitions[0]).toEqual({ npcType: 'angry_pedestrian', weight: 6 });
    expect(LEVEL_07.counterattack).toMatchObject({
      targetMode: 'snapshot_player_x', maxConcurrentTelegraphs: 1, maxConcurrentProjectiles: 1, queueLimit: 4
    });
    expect(LEVEL_07.stars[1]).toMatchObject({ id: 'counter_dodge_target', targetCount: 3 });
  });

  it('activates hazard and spawn climax channels together once and resets deterministically', () => {
    let session = createLevelSession({ ...LEVEL_07, countdownSeconds: 0 });
    session = updateLevelSession(session, 98);
    expect(session.triggeredEventIds).toEqual(['anger_chain_hazard', 'anger_chain_spawn', 'anger_chain_presentation']);
    expect(activeEventForChannel(LEVEL_07, session, 'hazardChannel')?.counterattack).toMatchObject({ globalGapMultiplier: 0.72 });
    expect(spawnConfigForLevel(LEVEL_07, session)).toMatchObject({ intervalSeconds: 0.5, maxActive: 15 });
    expect(updateLevelSession(session, 1).triggeredEventIds).toEqual(session.triggeredEventIds);
    expect(resetLevelSession(session).triggeredEventIds).toEqual([]);
  });

  it('counts only completed dodges for the feature star', () => {
    const miss = evaluateStars(LEVEL_07, { totalScore: 1850, highestCombo: 0, hitCount: 0, throwCount: 0, counterattacksDodged: 2 });
    const pass = evaluateStars(LEVEL_07, { totalScore: 1850, highestCombo: 0, hitCount: 0, throwCount: 0, counterattacksDodged: 3 });
    expect(miss.conditions[1].passed).toBe(false);
    expect(pass.conditions[1].passed).toBe(true);
  });
});
