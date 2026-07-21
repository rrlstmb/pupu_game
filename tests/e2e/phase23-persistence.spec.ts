import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { SAVE_KEY, seedCompletedCampaignThroughLevel } from './save-fixtures';

test('fresh save locks later levels and persisted progress survives reload with clean Continue state', async ({ page }) => {
  test.setTimeout(45_000);
  await openMenu(page);
  expect(await saveSnapshot(page)).toMatchObject({ unlocked: ['level_01'], completed: false, revision: 0 });
  await clickRole(page, 'start-level-02');
  expect(await activeScenes(page)).not.toContain('GameScene');
  await page.screenshot({ path: 'docs/evidence/phase-23-fresh-level-select.png', fullPage: true });

  await page.evaluate((key) => {
    const raw = JSON.parse(localStorage.getItem(key)!) as Record<string, unknown>;
    const now = '2026-07-21T00:00:00.000Z';
    const levelRecord = { levelId: 'level_01', completed: true, completionCount: 1, bestScore: 900, bestStars: 2, bestAccuracy: 0.8, bestCombo: 6, bestCompletionTimeMs: 50_000, firstCompletedAt: now, lastCompletedAt: now };
    const campaign = raw.campaign as Record<string, unknown>;
    const unlocks = raw.unlocks as Record<string, unknown>;
    raw.revision = 1;
    raw.campaign = { ...campaign, started: true, highestUnlockedLevelId: 'level_02', completedLevelIds: ['level_01'], levelRecords: { level_01: levelRecord } };
    raw.unlocks = { ...unlocks, levelIds: ['level_01', 'level_02'], poopTypeIds: ['normal_poop'], modeIds: ['free_play', 'precision'] };
    localStorage.setItem(key, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload();
  await waitForMenu(page);
  expect(await saveSnapshot(page)).toMatchObject({ unlocked: ['level_01', 'level_02'], revision: 1 });
  await page.screenshot({ path: 'docs/evidence/phase-23-level-02-unlocked.png', fullPage: true });
  await clickRole(page, 'continue-campaign');
  await expect.poll(() => currentLevel(page)).toBe('level_02');
  expect(await page.evaluate(() => ({
    score: window.__SHIMING_BIDA_DEBUG__?.score?.totalScore,
    alert: window.__SHIMING_BIDA_DEBUG__?.alert?.value,
    owner: window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner,
    projectiles: window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles.length
  }))).toEqual({ score: 0, alert: 0, owner: null, projectiles: 0 });
});

test('corrupt and future saves recover safely without overwriting future data', async ({ page }) => {
  await openMenu(page);
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), SAVE_KEY);
  await page.reload();
  await waitForMenu(page);
  expect((await saveSnapshot(page)).availability).toBe('recovered');
  await page.screenshot({ path: 'docs/evidence/phase-23-corrupt-recovery.png', fullPage: true });

  const future = JSON.stringify({ schemaVersion: 99, sentinel: 'keep' });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: future });
  await page.reload();
  await waitForMenu(page);
  expect((await saveSnapshot(page)).availability).toBe('incompatible');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(future);
});

test('Reset Progress requires cancel or explicit confirmation and never creates gameplay input', async ({ page }) => {
  await seedCompletedCampaignThroughLevel(page, 10);
  await openMenu(page);
  await clickRole(page, 'reset-progress');
  await page.screenshot({ path: 'docs/evidence/phase-23-reset-dialog.png', fullPage: true });
  await clickRole(page, 'reset-cancel');
  expect((await saveSnapshot(page)).completed).toBe(true);
  await clickRole(page, 'reset-progress');
  await clickRole(page, 'reset-confirm');
  await expect.poll(async () => (await saveSnapshot(page)).unlocked).toEqual(['level_01']);
  expect(await saveSnapshot(page)).toMatchObject({ completed: false, openingSeen: false });
  expect(await activeScenes(page)).not.toContain('GameScene');
});

test('Free Play and authored challenge use isolated RunContext and challenge records', async ({ page }) => {
  await seedCompletedCampaignThroughLevel(page, 10);
  await openMenu(page);
  const campaignBefore = await saveSnapshot(page);
  await clickRole(page, 'extra-modes');
  await clickRole(page, 'free-play');
  await clickRole(page, 'start-game');
  await expect.poll(() => currentMode(page)).toBe('free_play');
  await settle(page);
  await clickRole(page, 'return-menu');
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');
  expect((await saveSnapshot(page)).completedLevels).toEqual(campaignBefore.completedLevels);

  await clickRole(page, 'extra-modes');
  await clickRole(page, 'mode-precision_delivery');
  await expect.poll(() => currentMode(page)).toBe('precision');
  await settle(page);
  await expect.poll(async () => (await saveSnapshot(page)).challengeAttempts).toBe(1);
  expect((await saveSnapshot(page)).completedLevels).toEqual(campaignBefore.completedLevels);
  await page.screenshot({ path: 'docs/evidence/phase-23-challenge-record.png', fullPage: true });
  await page.reload();
  await waitForMenu(page);
  expect((await saveSnapshot(page)).challengeAttempts).toBe(1);
});

test('storage write failure keeps result in memory and reports nonblocking status', async ({ page }) => {
  await seedCompletedCampaignThroughLevel(page, 10);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    let initialized = false;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (initialized && key.startsWith('shiming-bida.save')) throw new DOMException('quota', 'QuotaExceededError');
      original.call(this, key, value);
      initialized = true;
    };
  });
  await openMenu(page);
  await clickRole(page, 'extra-modes');
  await clickRole(page, 'mode-precision_delivery');
  await settle(page);
  await expect.poll(async () => (await saveSnapshot(page)).availability).toBe('memory_only');
});

async function openMenu(page: Page): Promise<void> {
  await page.goto('/');
  await waitForMenu(page);
}

async function waitForMenu(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');
}

async function clickRole(page: Page, role: string): Promise<void> {
  const point = await page.evaluate((targetRole) => {
    const find = (objects: readonly Phaser.GameObjects.GameObject[]): (Phaser.GameObjects.GameObject & { getBounds?: () => Phaser.Geom.Rectangle }) | undefined => {
      for (const child of objects) {
        if (child.getData?.('role') === targetRole) return child as Phaser.GameObjects.GameObject & { getBounds?: () => Phaser.Geom.Rectangle };
        const nested = (child as Phaser.GameObjects.Container).list;
        if (Array.isArray(nested)) {
          const match = find(nested);
          if (match) return match;
        }
      }
      return undefined;
    };
    for (const scene of window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true) ?? []) {
      const object = find(scene.children.list);
      const bounds = object?.getBounds?.();
      if (bounds) return { x: bounds.centerX, y: bounds.centerY };
    }
    return undefined;
  }, role);
  if (!point) throw new Error(`role not found: ${role}`);
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas unavailable');
  await page.mouse.click(box.x + box.width * point.x / 1280, box.y + box.height * point.y / 720);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.advanceLevelTime?.(3));
  await page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    debug?.advanceLevelTime?.((debug.levelSession?.definition.durationSeconds ?? 0) + 5);
  });
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase)).toBe('settled');
}

async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key) ?? []);
}
async function currentLevel(page: Page): Promise<string> { return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.definition.id ?? ''); }
async function currentMode(page: Page): Promise<string> { return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.runContext?.modeId ?? ''); }
async function saveSnapshot(page: Page) {
  return page.evaluate(() => {
    const state = window.__SHIMING_BIDA_DEBUG__?.saveState;
    return {
      availability: state?.availability,
      revision: state?.data.revision,
      unlocked: state?.data.unlocks.levelIds,
      completed: state?.data.campaign.completed,
      completedLevels: state?.data.campaign.completedLevelIds,
      openingSeen: state?.data.campaign.openingSeen,
      challengeAttempts: state?.data.modes.challengeRecords.precision_delivery?.attempts ?? 0
    };
  });
}
