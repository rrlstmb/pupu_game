import { describe, expect, it } from 'vitest';
import { createDefaultSave, type SaveClock } from '../../src/domain/persistence/SaveData';
import { migrateSave } from '../../src/domain/persistence/SaveMigration';
import { validateAndRepairSave } from '../../src/domain/persistence/SaveValidation';

const clock: SaveClock = { nowIso: () => '2026-07-21T00:00:00.000Z' };

describe('SaveData V1 schema', () => {
  it('creates a deterministic fresh save with only level 1 and normal poop unlocked', () => {
    const save = createDefaultSave(clock);
    expect(save.schemaVersion).toBe(1);
    expect(save.revision).toBe(0);
    expect(save.unlocks.levelIds).toEqual(['level_01']);
    expect(save.unlocks.poopTypeIds).toEqual(['normal_poop']);
    expect(save.campaign.completed).toBe(false);
    expect(save.campaign.openingSeen).toBe(false);
  });

  it('repairs duplicates and invalid ids/numbers without accepting transient fields', () => {
    const input = {
      ...createDefaultSave(clock),
      score: 999, finalGoldenRemaining: 8, bossPhase: 'completed',
      unlocks: { levelIds: ['level_01', 'level_01', 'level_404'], poopTypeIds: ['normal_poop', 'bogus'], modeIds: ['free_play', 'bogus'], tutorialIds: [], titleIds: [] },
      campaign: {
        ...createDefaultSave(clock).campaign,
        completedLevelIds: ['level_01', 'bad'],
        levelRecords: { level_01: { completed: true, completionCount: 1, bestScore: -4, bestStars: 20, bestAccuracy: 4, bestCombo: Number.NaN } }
      }
    };
    const result = validateAndRepairSave(input, clock);
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.data.unlocks.levelIds).toEqual(['level_01', 'level_02']);
    expect(result.data.unlocks.poopTypeIds).toEqual(['normal_poop']);
    expect(result.data.campaign.levelRecords.level_01).toMatchObject({ bestScore: 0, bestStars: 3, bestAccuracy: 1, bestCombo: 0 });
    expect(result.data).not.toHaveProperty('score');
    expect(result.data).not.toHaveProperty('finalGoldenRemaining');
  });

  it('migrates legacy V0, preserving records and inferring discoveries', () => {
    const migrated = migrateSave({
      completedLevelIds: ['level_01', 'level_02'], unlockedLevelIds: ['level_01', 'level_02'],
      levelRecords: { level_01: { completed: true, completionCount: 2, bestScore: 900, bestStars: 3, bestAccuracy: 0.8, bestCombo: 7 } }
    }, clock);
    expect(migrated.valid).toBe(true);
    if (!migrated.valid) return;
    expect(migrated.data.campaign.levelRecords.level_01.bestScore).toBe(900);
    expect(migrated.data.unlocks.levelIds).toContain('level_03');
    expect(migrated.data.unlocks.poopTypeIds).toEqual(expect.arrayContaining(['normal_poop', 'sticky_poop']));
  });

  it('rejects future schema versions without coercing them', () => {
    expect(migrateSave({ schemaVersion: 99 }, clock)).toEqual({ valid: false, reason: 'future schema 99' });
  });
});
