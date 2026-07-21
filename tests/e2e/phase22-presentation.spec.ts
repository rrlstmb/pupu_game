import { expect, test, type Locator, type Page } from '@playwright/test';
import { seedCompletedCampaignThroughLevel } from './save-fixtures';

test.beforeEach(async ({ page }) => seedCompletedCampaignThroughLevel(page, 10));

test('Opening skip, level intro isolation, polished characters, and mouse charge remain functional', async ({ page }) => {
  test.setTimeout(70_000);
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-game-ready', 'true');
  await clickWorld(page, canvas, 1180, 270);
  await expect.poll(() => activeScenes(page)).toContain('OpeningScene');
  await page.screenshot({ path: 'docs/evidence/phase-22-opening.png', fullPage: true });
  await clickWorld(page, canvas, 1120, 45);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase)).toBe('countdown');
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles.length ?? -1)).toBe(0);
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner ?? null)).toBeNull();

  await clickWorld(page, canvas, 640, 442);
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner ?? null)).toBeNull();
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.advanceLevelTime?.(3.1));
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase)).toBe('running');
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.spawnNPCSandbox?.('phone_user', 760, 'front_road'));
  await page.screenshot({ path: 'docs/evidence/phase-22-level-01-characters.png', fullPage: true });

  const playerX = await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.player?.x ?? 640);
  await moveWorld(page, canvas, playerX, 410);
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeMeter?.percent ?? 0)).toBeGreaterThan(10);
  await page.screenshot({ path: 'docs/evidence/phase-22-mouse-charge.png', fullPage: true });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.metrics.throwCount ?? 0)).toBe(1);
  expect(errors).toEqual([]);
});

async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key) ?? []);
}
async function clickWorld(page: Page, canvas: Locator, x: number, y: number): Promise<void> {
  const point = await screenPoint(canvas, x, y); await page.mouse.click(point.x, point.y);
}
async function moveWorld(page: Page, canvas: Locator, x: number, y: number): Promise<void> {
  const point = await screenPoint(canvas, x, y); await page.mouse.move(point.x, point.y);
}
async function screenPoint(canvas: Locator, x: number, y: number) {
  const box = await canvas.boundingBox(); if (!box) throw new Error('canvas unavailable');
  return { x: box.x + box.width * x / 1280, y: box.y + box.height * y / 720 };
}
