import { expect, test, type Page } from '@playwright/test';
import { seedCompletedCampaignThroughLevel } from './save-fixtures';

test.beforeEach(async ({ page }) => seedCompletedCampaignThroughLevel(page, 10));

test('Gate D campaign registry exposes ten levels and the next-level route terminates at level 10', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const roles = await page.evaluate(() => {
    const scene = window.__SHIMING_BIDA_DEBUG__?.game.scene.getScene('MenuScene');
    return scene?.children.list.map((child) => child.getData?.('role'))
      .filter((role): role is string => typeof role === 'string' && role.startsWith('start-')) ?? [];
  });
  expect(roles).toEqual([
    'start-game', 'start-level-02', 'start-level-03', 'start-level-04', 'start-level-05',
    'start-level-06', 'start-level-07', 'start-level-08', 'start-level-09', 'start-level-10'
  ]);
  await page.screenshot({ path: 'docs/evidence/gate-d-campaign-levels.png', fullPage: true });

  const canvas = page.locator('canvas');
  await clickCanvasPoint(page, canvas, 640, 390);
  for (let number = 1; number <= 10; number += 1) {
    await expect.poll(() => currentLevelId(page)).toBe(`level_${String(number).padStart(2, '0')}`);
    await startLevel(page);
    await settleCurrentLevel(page);
    if (number < 10) {
      await clickCanvasPoint(page, canvas, 750, 590);
    } else {
      await expect.poll(() => resultText(page)).toContain('重試或返回主選單');
    }
  }
  expect(consoleErrors).toEqual([]);
});

test('Gate D retry and menu soak keeps listeners, timers, queues, pools, and inventory at baseline', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  await clickCanvasPoint(page, canvas, 1040, 560);
  await startLevel(page);
  const baseline = await diagnostics(page);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await settleCurrentLevel(page);
    await clickCanvasPoint(page, canvas, 530, 590);
    await startLevel(page);
    expect(await diagnostics(page)).toEqual(baseline);
  }

  for (let visit = 0; visit < 5; visit += 1) {
    await clickCanvasPoint(page, canvas, 1196, 34);
    await expect.poll(() => activeScenes(page)).toContain('MenuScene');
    await clickCanvasPoint(page, canvas, 1040, 560);
    await startLevel(page);
    expect(await diagnostics(page)).toEqual(baseline);
  }
  await page.screenshot({ path: 'docs/evidence/gate-d-reset-soak.png', fullPage: true });
});

async function diagnostics(page: Page) {
  return page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    if (!debug?.levelSession || !debug.projectileSystem || !debug.npcSpawner) throw new Error('debug state unavailable');
    return {
      inputListeners: debug.inputListenerCount,
      eventListeners: debug.eventBusListenerCounts,
      sceneTimers: debug.sceneTimerCount,
      npcs: debug.npcSpawner.npcs.length,
      projectiles: debug.projectileSystem.projectiles.length,
      shadows: debug.projectileShadows?.length,
      counterInstances: debug.counterattackState?.instances.length,
      counterQueue: debug.counterattackState?.queue.length,
      eventCount: debug.levelSession.triggeredEventIds.length,
      selectedPoop: debug.poopInventory?.selectedIndex,
      score: debug.score?.totalScore,
      alert: debug.alert?.value
    };
  });
}

async function settleCurrentLevel(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    debug?.advanceLevelTime?.((debug.levelSession?.definition.durationSeconds ?? 0) + 3);
  });
  await expect.poll(async () => (await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase))).toBe('settled');
}

async function startLevel(page: Page): Promise<void> {
  await expect.poll(async () => (await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase))).toBe('countdown');
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.advanceLevelTime?.(3));
  await expect.poll(async () => (await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase))).toBe('running');
}

async function currentLevelId(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.definition.id ?? '');
}

async function resultText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudResultText ?? '');
}

async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key) ?? []);
}

async function clickCanvasPoint(page: Page, canvas: ReturnType<Page['locator']>, x: number, y: number): Promise<void> {
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * (x / 1280), box!.y + box!.height * (y / 720));
}
