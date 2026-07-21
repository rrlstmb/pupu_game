import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { seedCompletedCampaignThroughLevel } from './save-fixtures';

test.beforeEach(async ({ page }) => seedCompletedCampaignThroughLevel(page, 10));

test('Gate E extra modes launch isolated RunContexts and return cleanly to Menu', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');
  const campaignBefore = await campaignSnapshot(page);

  const modes = [
    ['mode-crowd_blast', 'frenzy', 'level_04'],
    ['mode-stealth_crisis', 'challenge', 'level_09'],
    ['mode-endless_patrol', 'endless', 'level_07'],
    ['mode-daily_mission', 'daily', 'level_05']
  ] as const;
  for (const [role, modeId, levelId] of modes) {
    await clickRole(page, 'extra-modes');
    if (modeId === 'endless') await page.screenshot({ path: 'docs/evidence/gate-e-extra-modes.png', fullPage: true });
    await clickRole(page, role);
    await expect.poll(() => runContext(page)).toMatchObject({ modeId, levelId, progressionEligibility: 'mode_record_only' });
    const context = await runContext(page);
    if (modeId === 'daily') expect(context?.seed).toBe(`daily-local-${new Date().toLocaleDateString('en-CA')}`);
    else expect(context?.seed).toBeTruthy();
    await clickRole(page, 'return-menu');
    await expect.poll(() => activeScenes(page)).toContain('MenuScene');
    expect(await campaignSnapshot(page)).toEqual(campaignBefore);
  }
  expect(consoleErrors).toEqual([]);
});

async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key) ?? []);
}

async function runContext(page: Page) {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.runContext ?? null);
}

async function campaignSnapshot(page: Page) {
  return page.evaluate(() => {
    const save = window.__SHIMING_BIDA_DEBUG__?.saveState?.data;
    return {
      completed: save?.campaign.completed,
      completedLevelIds: save?.campaign.completedLevelIds,
      levelRecords: save?.campaign.levelRecords,
      levelIds: save?.unlocks.levelIds
    };
  });
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
      const bounds = find(scene.children.list)?.getBounds?.();
      if (bounds) return { x: bounds.centerX, y: bounds.centerY };
    }
    return null;
  }, role);
  if (!point) throw new Error(`Missing role ${role}`);
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Missing canvas');
  await page.mouse.click(box.x + point.x * box.width / 1280, box.y + point.y * box.height / 720);
}
