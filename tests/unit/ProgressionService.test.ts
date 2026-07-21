import { describe, expect, it } from 'vitest';
import { campaignRunContext, modeRunContext, CHALLENGE_DEFINITIONS } from '../../src/domain/modes/ModeRegistry';
import { createDefaultSave, type SaveClock } from '../../src/domain/persistence/SaveData';
import { applyLevelResult, continueLevelId, levelProgressState, type LevelCompletionResult } from '../../src/domain/progression/ProgressionService';

const clock: SaveClock = { nowIso: () => '2026-07-21T00:00:00.000Z' };
const success = (levelId: string, token = `token-${levelId}`): LevelCompletionResult => ({
  resultToken: token, levelSessionId: `session-${levelId}`, levelId, outcome: 'success', score: 800, stars: 2,
  accuracy: 0.75, maxCombo: 6, completionTimeMs: 50_000
});

describe('campaign progression', () => {
  it('unlocks only the next level after success and computes Continue', () => {
    const save = createDefaultSave(clock);
    expect(levelProgressState(save, 'level_02')).toBe('locked');
    const committed = applyLevelResult(save, success('level_01'), campaignRunContext('level_01'), clock.nowIso());
    expect(committed.data.unlocks.levelIds).toEqual(['level_01', 'level_02']);
    expect(committed.data.unlocks.modeIds).toEqual(expect.arrayContaining(['free_play', 'precision']));
    expect(continueLevelId(committed.data)).toBe('level_02');
  });

  it('does not persist failure and deduplicates a success token', () => {
    const save = createDefaultSave(clock);
    const failed = applyLevelResult(save, { ...success('level_01'), outcome: 'failure' }, campaignRunContext('level_01'), clock.nowIso());
    expect(failed.changed).toBe(false);
    const once = applyLevelResult(save, success('level_01'), campaignRunContext('level_01'), clock.nowIso());
    const twice = applyLevelResult(once.data, success('level_01'), campaignRunContext('level_01'), clock.nowIso());
    expect(twice.changed).toBe(false);
    expect(twice.data.campaign.levelRecords.level_01.completionCount).toBe(1);
  });

  it('updates best fields monotonically across distinct completions', () => {
    const first = applyLevelResult(createDefaultSave(clock), success('level_01', 'one'), campaignRunContext('level_01'), clock.nowIso()).data;
    const worse = applyLevelResult(first, { ...success('level_01', 'two'), score: 100, stars: 1, accuracy: 0.2, maxCombo: 1, completionTimeMs: 90_000 }, campaignRunContext('level_01'), clock.nowIso()).data;
    expect(worse.campaign.levelRecords.level_01).toMatchObject({ bestScore: 800, bestStars: 2, bestAccuracy: 0.75, bestCombo: 6, bestCompletionTimeMs: 50_000, completionCount: 2 });
  });

  it('marks level 10 complete without inventing level 11 and unlocks endgame modes', () => {
    const completed = applyLevelResult(createDefaultSave(clock), success('level_10'), campaignRunContext('level_10'), clock.nowIso()).data;
    expect(completed.campaign.completed).toBe(true);
    expect(completed.unlocks.levelIds).not.toContain('level_11');
    expect(completed.unlocks.modeIds).toEqual(expect.arrayContaining(['challenge', 'endless', 'frenzy', 'daily']));
  });

  it('keeps free play isolated and challenge records separate', () => {
    const save = createDefaultSave(clock);
    const free = applyLevelResult(save, success('level_01'), { modeId: 'free_play', levelId: 'level_01', seed: 'x', progressionEligibility: 'none' }, clock.nowIso());
    expect(free.changed).toBe(false);
    const challenge = CHALLENGE_DEFINITIONS[0];
    const result = applyLevelResult(save, success(challenge.levelId), modeRunContext(challenge, challenge.seed), clock.nowIso());
    expect(result.data.campaign.completedLevelIds).toEqual([]);
    expect(result.data.modes.challengeRecords[challenge.id]).toMatchObject({ attempts: 1, completions: 1, bestScore: 800, bestRank: 'A' });
  });
});
