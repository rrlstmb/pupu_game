import { expect, test, type Locator, type Page } from '@playwright/test';

test('mouse-only Level 1 movement, charge, throw, and hit use the shared gameplay intent', async ({ page }) => {
  test.setTimeout(70_000);
  const errors = collectErrors(page);
  const canvas = await openLevel(page, 640, 390);
  await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));

  await moveWorld(page, canvas, 1000, 410);
  await expect.poll(async () => (await player(page)).x, { timeout: 12_000 }).toBeGreaterThan(700);
  await moveWorld(page, canvas, 280, 410);
  await expect.poll(async () => (await player(page)).x, { timeout: 12_000 }).toBeLessThan(650);
  const stopX = (await player(page)).x;
  await moveWorld(page, canvas, stopX, 410);
  await expect.poll(async () => Math.abs((await player(page)).velocityX), { timeout: 12_000 }).toBeLessThan(30);

  await moveWorld(page, canvas, (await player(page)).x, 410);
  await page.mouse.down();
  await expect.poll(() => mouseDebug(page)).toMatchObject({ owner: 'mouse', meterVisible: true });
  const startX = (await player(page)).x;
  await moveWorld(page, canvas, startX + 320, 410);
  await expect.poll(async () => (await player(page)).x).toBeGreaterThan(startX + 30);
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'docs/evidence/pre-phase-22-mouse-charge.png', fullPage: true });
  await page.mouse.up();
  await expect.poll(async () => (await projectiles(page)).length, { timeout: 8_000 }).toBe(0);

  await moveWorld(page, canvas, (await player(page)).x, 410);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
  const shortTargetY = await waitForProjectileTarget(page);
  await expect.poll(async () => (await projectiles(page)).length, { timeout: 8_000 }).toBe(0);

  await moveWorld(page, canvas, (await player(page)).x, 410);
  await page.mouse.down();
  await page.waitForTimeout(1_250);
  await expect.poll(async () => (await mouseDebug(page)).chargePercent).toBe(100);
  await page.mouse.up();
  const longTargetY = await waitForProjectileTarget(page);
  expect(longTargetY).toBeLessThan(shortTargetY);
  await page.screenshot({ path: 'docs/evidence/pre-phase-22-mouse-throw.png', fullPage: true });
  await expect.poll(async () => (await projectiles(page)).length, { timeout: 8_000 }).toBe(0);

  await moveWorld(page, canvas, (await player(page)).x, 410);
  await expect.poll(async () => Math.abs((await player(page)).velocityX), { timeout: 12_000 }).toBeLessThan(20);
  const originX = (await player(page)).x;
  const minimumTravelDuration = 0.65 + (1.55 - 0.65) * 0.01;
  await page.evaluate(
    (x) => window.__SHIMING_BIDA_DEBUG__?.spawnNPCSandbox?.('office_worker', x, 'front_road'),
    originX + 118 * minimumTravelDuration + 118 / 60
  );
  await page.mouse.down();
  await page.mouse.up();
  await expect.poll(async () => (await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.score?.totalScore ?? 0)), { timeout: 10_000 }).toBeGreaterThan(0);
  expect((await mouseDebug(page)).activeDevice).toBe('mouse');
  expect(errors).toEqual([]);
});

test('mouse UI isolation, arsenal selection, cancellation, and non-left buttons do not create ghost throws', async ({ page }) => {
  test.setTimeout(45_000);
  const canvas = await openLevel(page, 640, 560);
  await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));

  await clickWorld(page, canvas, 78, 130);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.poopInventory?.selectedIndex)).toBe(1);
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.poopInventory?.slots[1].poopType)).toBe('jumbo_poop');
  expect(await projectiles(page)).toHaveLength(0);
  expect((await mouseDebug(page)).owner).toBeNull();
  await page.screenshot({ path: 'docs/evidence/pre-phase-22-mouse-arsenal.png', fullPage: true });

  await clickWorld(page, canvas, 1200, 100);
  expect((await mouseDebug(page)).owner).toBeNull();
  expect(await projectiles(page)).toHaveLength(0);

  await moveWorld(page, canvas, 640, 410);
  await page.mouse.click((await screenPoint(canvas, 640, 410)).x, (await screenPoint(canvas, 640, 410)).y, { button: 'right' });
  await page.mouse.click((await screenPoint(canvas, 640, 410)).x, (await screenPoint(canvas, 640, 410)).y, { button: 'middle' });
  expect((await mouseDebug(page)).owner).toBeNull();

  await page.mouse.down();
  await expect.poll(async () => (await mouseDebug(page)).owner).toBe('mouse');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await projectiles(page)).toHaveLength(0);
  expect(await mouseDebug(page)).toMatchObject({ owner: null, capture: false, meterVisible: false });
});

test('mouse movement handles representative hazards and can fire into a Boss gate', async ({ page }) => {
  test.setTimeout(100_000);
  const canvas = await openLevel(page, 1040, 560);
  await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.setPlayerX?.(640));
  await moveWorld(page, canvas, 640, 410);
  await expect.poll(async () => Math.abs((await player(page)).velocityX)).toBeLessThan(30);
  await page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    debug?.clearNPCSandbox?.(true);
    debug?.spawnNPCSandbox?.('angry_pedestrian', 760, 'front_road');
  });
  const angryIds = await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.npcSpawner?.npcs.map((npc) => npc.id) ?? []);
  await page.evaluate((ids) => window.__SHIMING_BIDA_DEBUG__?.primeCounterattackSandbox?.(ids), angryIds);
  await moveWorld(page, canvas, 1100, 410);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.counterattackState?.instances[0]?.state), { timeout: 8_000 }).toBe('telegraph');
  const lockedX = await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.counterattackState?.instances[0]?.lockedTargetX ?? 640);
  await expect.poll(async () => (await player(page)).x, { timeout: 6_000 }).toBeGreaterThan(lockedX + 50);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.counterattackState?.stats.dodged ?? 0), { timeout: 8_000 }).toBe(1);

  await returnToMenu(page, canvas);
  await clickWorld(page, canvas, 240, 560);
  await startLevel(page);
  await page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    debug?.clearNPCSandbox?.(true);
    debug?.spawnNPCSandbox?.('camera_pedestrian', 950, 'mid_sidewalk');
  });
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.surveillanceState?.instances.length ?? 0), { timeout: 8_000 }).toBeGreaterThan(0);
  await moveWorld(page, canvas, 150, 410);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.surveillanceState?.stats.snapshotsAvoided ?? 0), { timeout: 8_000 }).toBeGreaterThan(0);

  await returnToMenu(page, canvas);
  await clickWorld(page, canvas, 240, 475);
  await startLevel(page);
  await moveWorld(page, canvas, 250, 410);
  await expect.poll(async () => (await player(page)).x).toBeLessThan(330);
  expect(await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.isPlayerInCover)).toBe(true);

  await returnToMenu(page, canvas);
  await clickWorld(page, canvas, 1040, 475);
  await startLevel(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.primeBossPhaseOneSandbox?.());
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.bossState?.phase), { timeout: 6_000 }).toBe('phase_2_protected_boss');
  await page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    debug?.clearNPCSandbox?.(true);
    debug?.spawnNPCSandbox?.('camera_pedestrian', 760, 'front_road');
  });
  await moveWorld(page, canvas, (await player(page)).x, 410);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect.poll(async () => (await projectiles(page)).length).toBe(1);
  expect((await mouseDebug(page)).activeDevice).toBe('mouse');
});

test('mouse retry and menu soak keeps pointer listeners, owner, capture, and projectiles clean', async ({ page }) => {
  test.setTimeout(70_000);
  const canvas = await openLevel(page, 640, 390);
  await startLevel(page);
  const baseline = await mouseDebug(page);
  expect(baseline).toMatchObject({ pointerListeners: 7, owner: null, capture: false });

  for (let index = 0; index < 5; index += 1) {
    await page.evaluate(() => {
      const debug = window.__SHIMING_BIDA_DEBUG__;
      debug?.game.scene.getScene('GameScene').scene.restart({ levelDefinition: debug.levelSession?.definition });
    });
    await startLevel(page);
    expect(await mouseDebug(page)).toMatchObject({ pointerListeners: 7, owner: null, capture: false, meterVisible: false });
    expect(await projectiles(page)).toHaveLength(0);
  }

  for (let index = 0; index < 5; index += 1) {
    await returnToMenu(page, canvas);
    await clickWorld(page, canvas, 640, 390);
    await startLevel(page);
    expect(await mouseDebug(page)).toMatchObject({ pointerListeners: 7, owner: null, capture: false, meterVisible: false });
    expect(await projectiles(page)).toHaveLength(0);
  }
});

async function openLevel(page: Page, x: number, y: number): Promise<Locator> {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-game-ready', 'true');
  await clickWorld(page, canvas, x, y);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.levelSession?.phase ?? '')).toBe('countdown');
  return canvas;
}

async function startLevel(page: Page): Promise<void> {
  await expect.poll(async () => page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    if (debug?.levelSession?.phase === 'countdown') debug.advanceLevelTime?.(3.1);
    return debug?.levelSession?.phase;
  })).toBe('running');
}

async function waitForProjectileTarget(page: Page): Promise<number> {
  let target: number | undefined;
  await expect.poll(async () => {
    target = (await projectiles(page))[0]?.trajectory.targetProjectionY;
    return target;
  }).toBeGreaterThan(0);
  return target as number;
}

async function returnToMenu(page: Page, canvas: Locator): Promise<void> {
  await clickWorld(page, canvas, 1196, 34);
  await expect.poll(async () => page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.getScenes(true).map((scene) => scene.scene.key))).toContain('MenuScene');
}

async function mouseDebug(page: Page) {
  return page.evaluate(() => ({
    owner: window.__SHIMING_BIDA_DEBUG__?.chargeInputOwner ?? null,
    capture: window.__SHIMING_BIDA_DEBUG__?.pointerCaptureActive ?? false,
    pointerListeners: window.__SHIMING_BIDA_DEBUG__?.pointerListenerCount ?? -1,
    meterVisible: window.__SHIMING_BIDA_DEBUG__?.chargeMeterVisible ?? false,
    chargePercent: window.__SHIMING_BIDA_DEBUG__?.chargeMeter?.percent ?? 0,
    activeDevice: window.__SHIMING_BIDA_DEBUG__?.gameplayInputIntent?.activeDevice
  }));
}

async function player(page: Page) {
  return page.evaluate(() => {
    const state = window.__SHIMING_BIDA_DEBUG__?.player;
    if (!state) throw new Error('player unavailable');
    return state;
  });
}

async function projectiles(page: Page) {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles ?? []);
}

async function moveWorld(page: Page, canvas: Locator, x: number, y: number): Promise<void> {
  const point = await screenPoint(canvas, x, y);
  await page.mouse.move(point.x, point.y);
}

async function clickWorld(page: Page, canvas: Locator, x: number, y: number): Promise<void> {
  const point = await screenPoint(canvas, x, y);
  await page.mouse.click(point.x, point.y);
}

async function screenPoint(canvas: Locator, x: number, y: number) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas unavailable');
  return { x: box.x + box.width * x / 1280, y: box.y + box.height * y / 720 };
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}
