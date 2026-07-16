import { describe, expect, it } from 'vitest';
import { LEVEL_01 } from '../../src/data/levels/level01';
import {
  createLevelSession,
  failLevelCaught,
  resetLevelSession,
  spawnConfigForLevel,
  toggleLevelPause,
  updateLevelMetrics,
  updateLevelSession
} from '../../src/domain/level/LevelDirector';
import { hitAccuracy } from '../../src/domain/level/ObjectiveSystem';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('LevelDirector', () => {
  it('projects the authored spawn schedule without scene-owned defaults', () => {
    const definition = {
      ...LEVEL_01,
      seed: 'injected-seed',
      spawn: { ...LEVEL_01.spawn, intervalSeconds: 2.5, maxActive: 3 }
    };
    expect(spawnConfigForLevel(definition)).toEqual({
      seed: 'injected-seed',
      ...definition.spawn
    });
  });

  it('runs countdown before consuming the 90 second level clock', () => {
    let session = createLevelSession(LEVEL_01);
    session = updateLevelSession(session, 2.5);
    expect(session).toMatchObject({ phase: 'countdown', countdownRemainingSeconds: 0.5, remainingSeconds: 90 });
    session = updateLevelSession(session, 0.5);
    expect(session).toMatchObject({ phase: 'running', remainingSeconds: 90 });
  });

  it('settles as timeout exactly once when time expires below target', () => {
    let session = createLevelSession({ ...LEVEL_01, countdownSeconds: 0 });
    session = updateLevelSession(session, 90);
    expect(session.result).toMatchObject({ outcome: 'timeout', totalScore: 0 });
    expect(session.completionCount).toBe(1);
    expect(updateLevelSession(session, 20)).toBe(session);
    expect(failLevelCaught(session)).toBe(session);
  });

  it('settles successfully once when target score is reached', () => {
    let session = createLevelSession({ ...LEVEL_01, countdownSeconds: 0 });
    session = updateLevelMetrics(session, { totalScore: LEVEL_01.targetScore - 1 });
    expect(session.phase).toBe('running');
    session = updateLevelMetrics(session, { totalScore: LEVEL_01.targetScore, highestCombo: 5, hitCount: 4, throwCount: 5 });
    expect(session.result).toMatchObject({ outcome: 'success', totalScore: 500, highestCombo: 5, hitCount: 4, throwCount: 5 });
    expect(session.completionCount).toBe(1);
    expect(updateLevelMetrics(session, { totalScore: 9999 })).toBe(session);
  });

  it('pauses countdown and gameplay time until resumed', () => {
    let session = createLevelSession({ ...LEVEL_01, countdownSeconds: 0 });
    session = updateLevelSession(session, 4);
    session = toggleLevelPause(session);
    const paused = updateLevelSession(session, 25);
    expect(paused.remainingSeconds).toBe(86);
    session = toggleLevelPause(paused);
    expect(updateLevelSession(session, 1).remainingSeconds).toBe(85);
  });

  it('latches caught failure and creates an immutable result snapshot', () => {
    const session = updateLevelMetrics(createLevelSession(LEVEL_01), { totalScore: 220, highestCombo: 3, hitCount: 2, throwCount: 4 });
    const caught = failLevelCaught(session);
    expect(caught.result).toMatchObject({ outcome: 'caught', totalScore: 220, accuracy: 0.5 });
    expect(caught.completionCount).toBe(1);
  });

  it('resets all metrics with the same seed and a new deterministic session id', () => {
    const played = updateLevelMetrics(createLevelSession(LEVEL_01), { totalScore: 320, highestCombo: 4, hitCount: 3, throwCount: 7 });
    const reset = resetLevelSession(played);
    expect(reset.definition.seed).toBe(played.definition.seed);
    expect(reset.id).toBe('level_01:level-01-seed:attempt-2');
    expect(reset.metrics).toEqual({
      totalScore: 0, highestCombo: 0, hitCount: 0, throwCount: 0,
      npcHitCounts: {}, interactionCounts: {}, maxSplashTargetsHit: 0,
      zoneAffectedNpcCount: 0, maxNpcAffectedBySingleZone: 0,
      counterattacksTelegraphed: 0, counterattacksFired: 0, counterattacksDodged: 0,
      counterattacksHitPlayer: 0, maxConcurrentCounterattacksObserved: 0,
      cameraTelegraphsStarted: 0, snapshotsActivated: 0, snapshotsAvoided: 0, snapshotCaptures: 0,
      recordingWindowsStarted: 0, recordingWindowsSurvived: 0, recordingCaptures: 0,
      maximumExposureReached: 0, capturesDuringThrow: 0, capturesDuringClimax: 0
    });
    expect(reset.result).toBeUndefined();
    expect(reset.remainingSeconds).toBe(90);
  });
});

describe('StarEvaluation', () => {
  it('treats accuracy as strictly greater than 60 percent', () => {
    const atBoundary = evaluateStars(LEVEL_01, { totalScore: 500, highestCombo: 5, hitCount: 3, throwCount: 5 });
    expect(atBoundary.conditions.map((condition) => condition.passed)).toEqual([true, true, false]);
    const aboveBoundary = evaluateStars(LEVEL_01, { totalScore: 500, highestCombo: 5, hitCount: 4, throwCount: 5 });
    expect(aboveBoundary.starsEarned).toBe(3);
  });

  it('returns zero accuracy for zero throws', () => {
    expect(hitAccuracy(0, 0)).toBe(0);
    expect(evaluateStars(LEVEL_01, { totalScore: 0, highestCombo: 0, hitCount: 0, throwCount: 0 }).starsEarned).toBe(0);
  });
});
