import { describe, expect, it } from 'vitest';
import { LEVEL_05 } from '../../src/data/levels/level05';
import { activeEventForChannel, createLevelSession, resetLevelSession, spawnConfigForLevel, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 5 authored definition', () => {
  it('validates windy visuals, wind schedule, bouncy unlock, surfaces, and bounded roster', () => {
    expect(validateLevelDefinition(LEVEL_05)).toEqual({ valid: true, definition: LEVEL_05 });
    expect(LEVEL_05.visual.profile).toBe('windy_afternoon');
    expect(LEVEL_05.availablePoopTypes).toEqual(['normal_poop', 'bouncy_poop']);
    expect(LEVEL_05.wind?.segments.map((segment) => segment.direction)).toEqual(['calm', 'right', 'left', 'right']);
    expect(LEVEL_05.bounceSurfaces).toHaveLength(1);
    expect(LEVEL_05.spawn.maxActive).toBe(12);
  });

  it('activates wind and spawn climax channels together without overwriting either', () => {
    let session = createLevelSession({ ...LEVEL_05, countdownSeconds: 0 });
    session = updateLevelSession(session, 97);
    expect(session.triggeredEventIds).toEqual(['climax_fast_rush', 'climax_strong_wind']);
    expect(spawnConfigForLevel(LEVEL_05, session)).toMatchObject({ intervalSeconds: 0.38, maxActive: 16 });
    expect(activeEventForChannel(LEVEL_05, session, 'windChannel')?.windSegmentId).toBe('climax_gale');
    expect(updateLevelSession(session, 1).triggeredEventIds).toEqual(session.triggeredEventIds);
    expect(resetLevelSession(session).triggeredEventIds).toEqual([]);
  });

  it('counts only tagged bounced hits for the authored feature star', () => {
    const miss = evaluateStars(LEVEL_05, { totalScore: 1650, highestCombo: 0, hitCount: 2, throwCount: 2, interactionCounts: { bounced_hit: 1 } });
    const pass = evaluateStars(LEVEL_05, { totalScore: 1650, highestCombo: 0, hitCount: 2, throwCount: 2, interactionCounts: { bounced_hit: 2 } });
    expect(miss.conditions[1].passed).toBe(false);
    expect(pass.conditions[1].passed).toBe(true);
  });
});
