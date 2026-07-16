import { describe, expect, it } from 'vitest';
import { LEVEL_08 } from '../../src/data/levels/level08';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { activeEventForChannel, createLevelSession, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';

describe('Level 08', () => {
  it('validates the deterministic live-event roster and bounded surveillance rules', () => {
    expect(validateLevelDefinition(LEVEL_08).valid).toBe(true);
    expect(LEVEL_08.name).toContain('全城直播');
    expect(LEVEL_08.seed).toBe('level-08-camera-seed');
    expect(LEVEL_08.spawn.definitions.map((entry) => entry.npcType)).toEqual(expect.arrayContaining(['camera_pedestrian', 'streamer']));
    expect(LEVEL_08.surveillance).toMatchObject({ schedulingPolicy: 'source_id_alternating', maxConcurrentSnapshotWindows: 1, maxConcurrentRecordingWindows: 1 });
  });

  it('keeps surveillance and spawn climax channels active independently and one-shot', () => {
    let session = createLevelSession(LEVEL_08);
    session = updateLevelSession(session, 3);
    session = updateLevelSession(session, LEVEL_08.durationSeconds - 34);
    expect(activeEventForChannel(LEVEL_08, session, 'surveillanceChannel')?.surveillance).toBeDefined();
    expect(activeEventForChannel(LEVEL_08, session, 'spawnChannel')?.spawn?.definitions).toEqual(expect.arrayContaining([expect.objectContaining({ npcType: 'streamer' })]));
    const ids = session.triggeredEventIds;
    session = updateLevelSession(session, 1);
    expect(session.triggeredEventIds).toEqual(ids);
  });

  it('evaluates snapshot and recording stars independently', () => {
    const base = { totalScore: 2100, highestCombo: 0, hitCount: 0, throwCount: 0 };
    expect(evaluateStars(LEVEL_08, { ...base, snapshotsAvoided: 2, recordingWindowsSurvived: 2 }).starsEarned).toBe(2);
    expect(evaluateStars(LEVEL_08, { ...base, snapshotsAvoided: 3, recordingWindowsSurvived: 2 }).starsEarned).toBe(3);
  });
});
