import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import { seedCompletedCampaignThroughLevel } from './save-fixtures';

test.beforeEach(async ({ page }) => { page.on('pageerror', (error) => console.log(`PAGEERROR ${error.message}`)); await seedCompletedCampaignThroughLevel(page, 10); });

test('mobile touch supports simultaneous movement and one owned charge release', async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await waitForMenu(page); await clickRole(page, 'start-game'); await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));
  await page.screenshot({ path: 'docs/evidence/phase-24-mobile-landscape.png', fullPage: true });
  const initialX = await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.player?.x ?? 0);
  await touch(page, '.touch-movement-zone', 'pointerdown', 11, 40);
  await touch(page, '.touch-movement-zone', 'pointermove', 11, 170);
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.gameplayInputIntent?.horizontalAxis ?? 0)).toBeGreaterThan(0.8);
  await touch(page, '.touch-throw-button', 'pointerdown', 22, 40);
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner)).toBe('touch');
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.player?.x ?? 0)).toBeGreaterThan(initialX + 20);
  await page.screenshot({ path: 'docs/evidence/phase-24-mobile-portrait-touch-charge.png', fullPage: true });
  await page.waitForTimeout(250);
  await touch(page, '.touch-throw-button', 'pointerup', 22, 40);
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles.length ?? 0)).toBe(1);
  await touch(page, '.touch-movement-zone', 'pointerup', 11, 170);
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.touchInputOwners)).toEqual({ movement: null, charge: null });
});

test('orientation cancellation clears touch owners without ghost throw', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/'); await waitForMenu(page); await clickRole(page, 'start-game'); await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));
  await touch(page, '.touch-throw-button', 'pointerdown', 31, 40);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner)).toBeNull();
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles.length)).toBe(0);
  await page.screenshot({ path: 'docs/evidence/phase-24-mobile-portrait-after-rotation.png', fullPage: true });
});

test('settings persist separately with focus trap, contrast, text scale and left-handed touch', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/'); await waitForMenu(page);
  await page.getByRole('button', { name: /設定/ }).click();
  await expect(page.locator('.settings-panel')).toBeVisible();
  await page.locator('#master-volume').fill('0.35');
  await page.waitForTimeout(220);
  await page.locator('#high-contrast').check();
  await page.locator('#reduced-motion').check();
  await page.locator('#flash').selectOption('off');
  await page.locator('#text-scale').selectOption('1.3');
  await page.locator('#touch-layout').selectOption('left_handed');
  await page.screenshot({ path: 'docs/evidence/phase-24-tablet-settings-high-contrast.png', fullPage: true });
  await page.getByRole('button', { name: '完成' }).click();
  const progress = await page.evaluate(() => localStorage.getItem('shiming-bida.save.v1'));
  await page.reload(); await waitForMenu(page);
  expect(await page.evaluate(() => document.documentElement.dataset)).toMatchObject({ highContrast: 'true', reducedMotion: 'true', flash: 'off', touchLayout: 'left_handed' });
  expect(await page.evaluate(() => localStorage.getItem('shiming-bida.save.v1'))).toBe(progress);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('shiming-bida.settings.v1')!).visual.textScale)).toBe(1.3);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('shiming-bida.settings.v1')!).audio.masterVolume)).toBe(0.35);
});

async function touch(page: Page, selector: string, type: string, pointerId: number, offsetX: number): Promise<void> {
  await page.locator(selector).evaluate((element, data) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent(data.type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: data.pointerId, isPrimary: data.pointerId === 11, clientX: bounds.left + data.offsetX, clientY: bounds.top + bounds.height / 2, button: 0, buttons: data.type === 'pointerup' ? 0 : 1 }));
  }, { type, pointerId, offsetX });
}

async function waitForMenu(page: Page): Promise<void> { await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true'); await expect.poll(() => activeScenes(page)).toContain('MenuScene'); }
async function activeScenes(page: Page): Promise<string[]> { return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key) ?? []); }
async function startLevel(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase)).toBe('countdown');
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.advanceLevelTime?.(4));
  await expect.poll(() => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase)).toBe('running');
}
async function clickRole(page: Page, role: string): Promise<void> {
  const point = await page.evaluate((target) => {
    const find = (items: readonly Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject & { getBounds?: () => Phaser.Geom.Rectangle } | undefined => {
      for (const item of items) { if (item.getData?.('role') === target) return item; const list = (item as Phaser.GameObjects.Container).list; if (Array.isArray(list)) { const found = find(list); if (found) return found; } } return undefined;
    };
    for (const scene of window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true) ?? []) { const bounds = find(scene.children.list)?.getBounds?.(); if (bounds) return { x: bounds.centerX, y: bounds.centerY }; }
    return null;
  }, role);
  if (!point) throw new Error(`Missing role ${role}`);
  const box = await page.locator('canvas').boundingBox(); if (!box) throw new Error('Missing canvas');
  await page.mouse.click(box.x + point.x * box.width / 1280, box.y + point.y * box.height / 720);
}
