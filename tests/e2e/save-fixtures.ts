import type { Page } from '@playwright/test';

export const SAVE_KEY = 'shiming-bida.save.v1';

export async function seedCompletedCampaignThroughLevel(page: Page, completedThrough: number): Promise<void> {
  const levelIds = Array.from({ length: 10 }, (_, index) => `level_${String(index + 1).padStart(2, '0')}`);
  const completed = levelIds.slice(0, completedThrough);
  const unlocked = levelIds.slice(0, Math.min(10, completedThrough + 1));
  const records = Object.fromEntries(completed.map((levelId) => [levelId, {
    levelId, completed: true, completionCount: 1, bestScore: 1000, bestStars: 2,
    bestAccuracy: 0.75, bestCombo: 6, bestCompletionTimeMs: 50_000,
    firstCompletedAt: '2026-07-21T00:00:00.000Z', lastCompletedAt: '2026-07-21T00:00:00.000Z'
  }]));
  const complete = completedThrough >= 10;
  await page.addInitScript(({ key, value }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
  }, {
    key: SAVE_KEY,
    value: {
      schemaVersion: 1, revision: completedThrough,
      metadata: { createdAt: '2026-07-21T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' },
      campaign: {
        started: completedThrough > 0, completed: complete,
        highestUnlockedLevelId: unlocked.at(-1) ?? 'level_01', completedLevelIds: completed,
        openingSeen: true, levelRecords: records
      },
      unlocks: {
        levelIds: unlocked,
        poopTypeIds: ['normal_poop', 'sticky_poop', 'splash_poop', 'jumbo_poop', 'bouncy_poop', 'stink_poop', 'split_poop', 'golden_poop'],
        modeIds: complete ? ['free_play', 'precision', 'challenge', 'endless', 'frenzy', 'daily'] : completedThrough > 0 ? ['free_play', 'precision'] : [],
        tutorialIds: [], titleIds: []
      },
      modes: { challengeRecords: {} }, processedResultTokens: []
    }
  });
}
