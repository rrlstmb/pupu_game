import { describe, expect, it } from 'vitest';
import { LEVEL_06 } from '../../src/data/levels/level06';
import { activeEventForChannel, createLevelSession, resetLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 6 authored definition', () => {
  it('validates cleanup visuals, stink unlock, cleaner roster, and bounded zones', () => {
    expect(validateLevelDefinition(LEVEL_06)).toEqual({ valid: true, definition: LEVEL_06 });
    expect(LEVEL_06.visual.profile).toBe('cleanup_day');
    expect(LEVEL_06.availablePoopTypes).toEqual(['normal_poop', 'stink_poop']);
    expect(LEVEL_06.spawn.definitions).toContainEqual({ npcType: 'cleaner', weight: 2 });
    expect(LEVEL_06.areaZone).toMatchObject({ maxActiveZones: 3, stackingRule: 'replace' });
    expect(LEVEL_06.spawn.maxActive).toBe(13);
  });

  it('activates cleanup and spawn channels together exactly once and resets them', () => {
    let session = createLevelSession({ ...LEVEL_06, countdownSeconds: 0 });
    session = updateLevelSession(session, 96);
    expect(session.triggeredEventIds).toEqual(['cleanup_truck', 'cleanup_spawn_rush', 'cleanup_presentation']);
    expect(activeEventForChannel(LEVEL_06, session, 'cleanupChannel')?.cleanup?.mode).toBe('all_active_zones');
    expect(spawnConfigForLevel(LEVEL_06, session)).toMatchObject({ intervalSeconds: 0.52, maxActive: 15 });
    expect(updateLevelSession(session, 1).triggeredEventIds).toEqual(session.triggeredEventIds);
    expect(resetLevelSession(session).triggeredEventIds).toEqual([]);
  });

  it('evaluates the single-zone control star without per-frame counting', () => {
    const miss = evaluateStars(LEVEL_06, { totalScore: 1750, highestCombo: 0, hitCount: 0, throwCount: 0, maxNpcAffectedBySingleZone: 2 });
    const pass = evaluateStars(LEVEL_06, { totalScore: 1750, highestCombo: 0, hitCount: 0, throwCount: 0, maxNpcAffectedBySingleZone: 3 });
    expect(miss.conditions[1].passed).toBe(false);
    expect(pass.conditions[1].passed).toBe(true);
  });
});
