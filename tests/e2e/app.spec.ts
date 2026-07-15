import { expect, test, type Page } from '@playwright/test';

test('loads menu and enters the empty game scene without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  await page.screenshot({ path: 'docs/evidence/phase-01-menu.png', fullPage: true });

  await expect.poll(() => activeScenes(page)).toContain('MenuScene');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();

  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await expect.poll(() => activeScenes(page)).toContain('HUDScene');

  await page.setViewportSize({ width: 900, height: 900 });
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox!.width / canvasBox!.height).toBeCloseTo(16 / 9, 1);

  await page.mouse.click(canvasBox!.x + canvasBox!.width - 84, canvasBox!.y + 34);
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');
  expect(consoleErrors).toEqual([]);
});

test.describe('phase 02 layout', () => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 390, height: 844 }
  ]) {
    test(`renders layered world without canvas overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

      const canvas = page.locator('canvas');
      const menuBox = await canvas.boundingBox();
      expect(menuBox).not.toBeNull();
      await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);

      await expect.poll(() => activeScenes(page)).toContain('GameScene');
      await page.keyboard.press('KeyL');
      await expect.poll(() => debugOverlayVisible(page)).toBe(true);

      const layout = await worldLayout(page);
      expect(layout?.zones.map((zone) => zone.id)).toEqual(['skyline', 'alley', 'rooftop']);
      expect(layout?.lanes.map((lane) => lane.id)).toEqual(['back_shop', 'mid_sidewalk', 'front_road']);
      expect(layout?.rooftop.coverSlots).toHaveLength(2);

      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox!.x).toBeGreaterThanOrEqual(0);
      expect(canvasBox!.y).toBeGreaterThanOrEqual(0);
      expect(canvasBox!.x + canvasBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(canvasBox!.y + canvasBox!.height).toBeLessThanOrEqual(viewport.height);
      expect(canvasBox!.width / canvasBox!.height).toBeCloseTo(16 / 9, 1);

      if (viewport.width === 1280 && viewport.height === 720) {
        await page.screenshot({ path: 'docs/evidence/phase-02-layout-debug.png', fullPage: true });
      }

      expect(consoleErrors).toEqual([]);
    });
  }
});

test('phase 03 keyboard movement stays horizontal, bounded, and does not duplicate input listeners', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);

  const firstEntryListeners = await inputListenerCount(page);
  const initial = await playerState(page);
  expect(firstEntryListeners).toBe(6);

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyD');
  const movedRight = await playerState(page);
  expect(movedRight.x).toBeGreaterThan(initial.x);

  await page.keyboard.down('KeyA');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyA');
  const leftBound = await playerState(page);
  const layout = await worldLayout(page);
  expect(layout).not.toBeNull();
  expect(leftBound.x).toBeGreaterThanOrEqual(layout!.rooftop.minX);

  await page.keyboard.down('KeyA');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(200);
  const neutral = await playerState(page);
  expect(Math.abs(neutral.velocityX)).toBeLessThan(430);
  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyD');

  await page.keyboard.down('ShiftLeft');
  await expect.poll(async () => (await playerState(page)).visualState).toBe('nervous');
  await page.keyboard.up('ShiftLeft');

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width - 84, box!.y + 34);
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');

  const secondMenuBox = await canvas.boundingBox();
  expect(secondMenuBox).not.toBeNull();
  await page.mouse.click(secondMenuBox!.x + secondMenuBox!.width / 2, secondMenuBox!.y + secondMenuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  expect(await inputListenerCount(page)).toBe(firstEntryListeners);
  await page.screenshot({ path: 'docs/evidence/phase-03-player-move.png', fullPage: true });
});

test('phase 04 charges on hold, throws on release, and shows no production trajectory helper', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);

  await page.keyboard.down('ShiftLeft');
  await expect.poll(() => aimAssistVisible(page)).toBe(false);
  await page.keyboard.up('ShiftLeft');
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));

  const playerX = (await playerState(page)).x;
  await page.keyboard.down('Space');
  await expect.poll(() => chargeMeterVisible(page)).toBe(true);
  expect((await projectileSystem(page)).projectiles).toHaveLength(0);
  await page.keyboard.up('Space');
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length).toBe(1);
  const shortThrow = (await projectileSystem(page)).projectiles[0];
  expect(shortThrow.targetProjectionY).toBeGreaterThan(430);
  expect(shortThrow.originX).toBeCloseTo(playerX, 5);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 12_000 }).toBe(0);

  await page.keyboard.down('Space');
  const initialMeter = await chargeMeter(page);
  await expect.poll(async () => (await chargeMeter(page)).percent).toBeGreaterThanOrEqual(21);
  const meterAtTwentyOne = await chargeMeter(page);
  expect(meterAtTwentyOne.label).toBe(`POWER ${meterAtTwentyOne.percent}%`);
  expect(meterAtTwentyOne.fillRatio).toBeCloseTo(meterAtTwentyOne.percent / 100, 2);
  expect(meterAtTwentyOne.orientation).toBe('vertical');
  expect(meterAtTwentyOne.renderedFillHeight).toBeCloseTo(meterAtTwentyOne.fillHeight, 5);
  expect(meterAtTwentyOne.fillHeight).toBeGreaterThan(initialMeter.fillHeight);
  expect(meterAtTwentyOne.bounds.left).toBeGreaterThan(1200);
  expect(meterAtTwentyOne.bounds.right).toBeLessThanOrEqual(1280);
  expect(meterAtTwentyOne.bounds.top).toBeGreaterThan(200);
  await page.screenshot({ path: 'docs/evidence/phase-04-throw-aim.png', fullPage: true });
  await expect.poll(async () => (await chargeMeter(page)).percent).toBeGreaterThanOrEqual(45);
  await page.keyboard.up('Space');
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length).toBe(1);
  const mediumThrow = (await projectileSystem(page)).projectiles[0];
  expect(mediumThrow.targetProjectionY).toBeLessThan(shortThrow.targetProjectionY);
  expect(mediumThrow.targetProjectionY).toBeGreaterThan(325);
  expect(mediumThrow.targetProjectionY).toBeLessThan(380);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 12_000 }).toBe(0);

  await page.keyboard.down('Space');
  await expect.poll(async () => (await chargeMeter(page)).percent, { timeout: 15_000 }).toBe(100);
  const maxMeter = await chargeMeter(page);
  expect(maxMeter).toMatchObject({ percent: 100, fillRatio: 1, isMax: true, label: 'MAX 100%' });
  expect(maxMeter.renderedFillHeight).toBeCloseTo(maxMeter.fillHeight, 5);
  expect(maxMeter.fillHeight).toBeGreaterThan(meterAtTwentyOne.fillHeight);
  await page.keyboard.up('Space');
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length).toBe(1);
  await expect.poll(async () => (await projectileShadows(page)).length).toBe(1);
  const longThrow = (await projectileSystem(page)).projectiles[0];
  const firstShadow = (await projectileShadows(page))[0];
  expect(firstShadow.projectileId).toBe(longThrow.id);
  await expect.poll(async () => {
    const state = await projectileAndShadow(page);
    if (!state) return Number.POSITIVE_INFINITY;
    return Math.hypot(
      state.projectile.position.x - state.shadow.x,
      state.projectile.position.y - state.shadow.y
    );
  }).toBeLessThan(0.001);
  await expect.poll(async () => {
    const projectile = (await projectileSystem(page)).projectiles[0];
    const shadow = (await projectileShadows(page))[0];
    return projectile && shadow ? Math.abs(projectile.visualPosition.y - shadow.y) : 0;
  }).toBeGreaterThan(20);
  await page.screenshot({ path: 'docs/evidence/phase-04-projectile-shadow.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('paused');
  const shadowBeforePause = (await projectileShadows(page))[0];
  await page.waitForTimeout(300);
  expect((await projectileShadows(page))[0]).toMatchObject({
    x: shadowBeforePause.x,
    y: shadowBeforePause.y
  });
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('running');
  expect(longThrow.targetProjectionY).toBeLessThan(shortThrow.targetProjectionY);
  expect(longThrow.targetProjectionY).toBeLessThan(mediumThrow.targetProjectionY);
  expect(longThrow.targetProjectionY).toBeLessThan(260);
  expect(Math.abs(longThrow.position.x - playerX)).toBeLessThan(2);
  await expect.poll(() => chargeMeterVisible(page)).toBe(false);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 12_000 }).toBe(0);
  await expect.poll(async () => (await projectileShadows(page)).length).toBe(0);

  await page.keyboard.down('Space');
  await expect.poll(() => chargeMeterVisible(page)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(async () => (await chargeState(page)).isCharging).toBe(false);
  await expect.poll(() => chargeMeterVisible(page)).toBe(false);
  await page.keyboard.up('Space');
  expect((await projectileSystem(page)).projectiles).toHaveLength(0);

  await page.keyboard.down('Space');
  await expect.poll(() => chargeMeterVisible(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('paused');
  expect((await chargeState(page)).isCharging).toBe(false);
  expect(await chargeMeterVisible(page)).toBe(false);
  await page.keyboard.up('Space');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('running');
  expect((await projectileSystem(page)).projectiles).toHaveLength(0);
});

test('phase 04 high charge hits a top-lane NPC while visual arc and collision remain separate', async ({ page }) => {
  test.setTimeout(45_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);

  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));
  await page.keyboard.down('Space');
  await expect.poll(async () => (await chargeState(page)).chargePower, { timeout: 15_000 }).toBeGreaterThan(0.95);
  await spawnForChargedLandingAndRelease(page, 'office_worker', 118, 'back_shop', 1);
  expect((await npcSpawner(page)).npcs[0].laneId).toBe('back_shop');
  const scoreBefore = (await scoreState(page)).totalScore;

  await expect.poll(async () => {
    const projectile = (await projectileSystem(page)).projectiles[0];
    return projectile ? Math.abs(projectile.visualPosition.y - projectile.position.y) : 0;
  }).toBeGreaterThan(20);
  await expect.poll(async () => (await gameplayEvents(page)).some(
    (event) => event.type === 'NPC_RANT_STARTED'
  ), { timeout: 15_000 }).toBe(true);
  await expect.poll(async () => (await scoreState(page)).totalScore).toBeGreaterThan(scoreBefore);
  expect(consoleErrors).toEqual([]);
});

test('landing hit window scales horizontal tolerance with NPC world width', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-game-ready', 'true');
  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  expect(await debugOverlayVisible(page)).toBe(false);

  await instantMinimumThrowAtSpawnedOffset(page, 'jogger', 210, 0);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 8_000 }).toBe(0);
  await expect.poll(async () => windowLandingHit(page).then((hit) => hit?.projectiles.length ?? 0)).toBeGreaterThan(0);
  const firstLandingHit = await windowLandingHit(page);
  if (!firstLandingHit?.selectedNpcIds.length) {
    throw new Error(`Expected small NPC in-range hit: ${JSON.stringify(firstLandingHit)}`);
  }
  await expect.poll(async () => (await gameplayEvents(page)).filter(
    (event) => event.type === 'NPC_RANT_STARTED'
  ).length).toBe(1);

  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 8_000 }).toBe(0);
  const firstProjectileId = firstLandingHit.projectiles[0].id;
  await instantMinimumThrowAtSpawnedOffset(page, 'jogger', 210, 35);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 8_000 }).toBe(0);
  await expect.poll(async () => windowLandingHit(page).then((hit) => hit?.projectiles[0]?.id)).not.toBe(firstProjectileId);
  expect((await gameplayEvents(page)).filter((event) => event.type === 'NPC_RANT_STARTED')).toHaveLength(1);

  await instantMinimumThrowAtSpawnedOffset(page, 'delivery_rider', 260, 25);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 8_000 }).toBe(0);
  const largeHitEvents = (await gameplayEvents(page)).filter((event) => event.type === 'NPC_RANT_STARTED');
  if (largeHitEvents.length !== 2) {
    const snapshot = await windowLandingHit(page);
    throw new Error(`Expected large NPC wider-tolerance hit: ${JSON.stringify(snapshot)}`);
  }
  expect(consoleErrors).toEqual([]);
});

test('retro Gate A survives ten scene entries, pause, blur, and projectile view reuse', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  let activeLifecycleBaseline: { readonly shutdown: number; readonly destroy: number } | undefined;
  let inactiveLifecycleBaseline: { readonly shutdown: number; readonly destroy: number } | undefined;

  for (let cycle = 0; cycle < 10; cycle += 1) {
    await clickMenuStart(page, canvas);
    await expect.poll(() => activeScenes(page)).toContain('GameScene');
    expect(await inputListenerCount(page)).toBe(6);
    const activeListenerCounts = await gameSceneLifecycleListenerCounts(page);
    activeLifecycleBaseline ??= activeListenerCounts;
    expect(activeListenerCounts).toEqual(activeLifecycleBaseline);

    await clickReturnToMenu(page, canvas);
    await expect.poll(() => activeScenes(page)).toContain('MenuScene');
    const inactiveListenerCounts = await gameSceneLifecycleListenerCounts(page);
    inactiveLifecycleBaseline ??= inactiveListenerCounts;
    expect(inactiveListenerCounts).toEqual(inactiveLifecycleBaseline);
    expect(await hasStaleGameDebugState(page)).toBe(false);
  }

  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await playerState(page)).velocityX).toBeGreaterThan(0);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.pause('GameScene'));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.game.scene.resume('GameScene'));
  await page.waitForTimeout(350);
  const settledAfterPause = await playerState(page);
  await page.waitForTimeout(250);
  expect(Math.abs((await playerState(page)).x - settledAfterPause.x)).toBeLessThan(2);
  await page.keyboard.up('KeyD');

  await page.keyboard.down('KeyA');
  await expect.poll(async () => (await playerState(page)).velocityX).toBeLessThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(350);
  const settledAfterBlur = await playerState(page);
  await page.waitForTimeout(250);
  expect(Math.abs((await playerState(page)).x - settledAfterBlur.x)).toBeLessThan(2);
  await page.keyboard.up('KeyA');

  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await playerState(page)).velocityX).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
  });
  await page.waitForTimeout(350);
  const settledAfterHidden = await playerState(page);
  await page.waitForTimeout(250);
  expect(Math.abs((await playerState(page)).x - settledAfterHidden.x)).toBeLessThan(2);
  await page.keyboard.up('KeyD');

  await chargeThrow(page, 0);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length).toBe(1);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length, { timeout: 10_000 }).toBe(0);
  const afterFirstRecycle = await projectileViewPool(page);
  expect(afterFirstRecycle.activeShadows).toBe(afterFirstRecycle.active);
  expect(afterFirstRecycle.active).toBe(0);
  expect(afterFirstRecycle.pooled).toBeGreaterThanOrEqual(1);

  await chargeThrow(page, 0);
  await expect.poll(async () => (await projectileViewPool(page)).reused).toBeGreaterThanOrEqual(1);
  expect((await projectileViewPool(page)).activeShadows).toBe((await projectileViewPool(page)).active);
  await page.screenshot({ path: 'docs/evidence/gate-a-retro.png', fullPage: true });
});

test('phase 05 spawns pooled NPCs moving right to left with distinct behavior', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await page.keyboard.press('KeyL');

  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.());
  await spawnNPCSandboxSlot(page, 0);
  await spawnNPCSandboxSlot(page, 1);
  await spawnNPCSandboxSlot(page, 2);

  await expect.poll(async () => (await npcSpawner(page)).npcs.length).toBeGreaterThan(0);
  const first = (await npcSpawner(page)).npcs[0];
  expect(first.x).toBeGreaterThan(1280);

  await page.waitForTimeout(500);
  const moved = (await npcSpawner(page)).npcs.find((npc) => npc.id === first.id);
  expect(moved).toBeDefined();
  expect(moved!.x).toBeLessThan(first.x);

  await expect.poll(async () => new Set((await npcSpawner(page)).npcs.map((npc) => npc.definitionId)).size, { timeout: 12_000 }).toBeGreaterThanOrEqual(3);
  await expect.poll(async () => (await npcSpawner(page)).npcs.some((npc) => npc.state === 'Distracted'), { timeout: 12_000 }).toBe(true);

  await page.screenshot({ path: 'docs/evidence/phase-05-npc-debug.png', fullPage: true });
  await page.waitForTimeout(10_000);
  const state = await npcSpawner(page);
  expect(state.npcs.length).toBeLessThanOrEqual(10);
  await expect
    .poll(() => page.evaluate(() => {
      const debug = window.__SHIMING_BIDA_DEBUG__;
      return (debug?.npcViewCount ?? -1) - (debug?.npcSpawner?.npcs.length ?? -2);
    }))
    .toBe(0);
  expect(state.recycledCount).toBeGreaterThan(0);
  expect(state.skippedSpawnCount).toBeGreaterThanOrEqual(0);
  const layout = await worldLayout(page);
  for (const npc of state.npcs) {
    const lane = layout?.lanes.find((candidate) => candidate.id === npc.laneId);
    expect(lane).toBeDefined();
    expect(npc.y).toBe(lane!.y);
    expect(npc.scale).toBe(lane!.scale);
    expect(npc.depth).toBe(lane!.depth + 8);
  }
  const pool = await npcViewPool(page);
  expect(pool.created).toBeLessThanOrEqual(10);
  expect(pool.reused).toBeGreaterThan(0);
});

test('phase 06 projectile hit stops NPC ranting, recovers, then allows a second hit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await clearAndSpawnNPC(page, 'office_worker', 850, 'front_road', true);

  const targetId = await fireAtHittableNPCAndWaitForRant(page);
  await expect.poll(async () => npcById(page, targetId).then((npc) => npc?.validHitCount ?? 0), { timeout: 5_000 }).toBe(1);
  expect((await gameplayEvents(page)).some(
    (event) => event.type === 'NPC_RANT_STARTED' && event.npcId === targetId
  )).toBe(true);
  expect((await npcById(page, targetId))?.validHitCount).toBe(1);

  await page.screenshot({ path: 'docs/evidence/phase-06-hit-rant.png', fullPage: true });
  await expect.poll(async () => npcById(page, targetId).then((npc) => npc?.state), { timeout: 8_000 }).toBe('Walking');
  expect((await gameplayEvents(page)).filter((event) => event.type === 'NPC_RECOVERED' && event.npcId === targetId)).toHaveLength(1);
  await debugMinimumRepeatThrow(page, targetId);
  await expect.poll(async () => npcById(page, targetId).then((npc) => npc?.validHitCount ?? 0), { timeout: 15_000 }).toBe(2);

  const events = await gameplayEvents(page);
  expect(events.filter((event) => event.type === 'NPC_RANT_STARTED' && event.npcId === targetId)).toHaveLength(2);
  expect(events.filter((event) => event.type === 'NPC_RECOVERED' && event.npcId === targetId).length).toBeGreaterThanOrEqual(1);
});

test('phase 07 scores rant events, displays combo HUD, and resets combo on timeout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await clearAndSpawnNPC(page, 'office_worker', 850, 'front_road', true);

  const targetId = await fireAtHittableNPCAndWaitForRant(page);
  await expect.poll(async () => (await scoreState(page)).breakdowns.length, { timeout: 5_000 }).toBe(1);
  const firstScore = await scoreState(page);
  expect(firstScore.totalScore).toBeGreaterThan(0);
  expect(firstScore.comboCount).toBe(1);
  expect(firstScore.breakdowns[0]).toMatchObject({
    npcId: targetId,
    ammoType: 'normal_poop',
    poopAdaptationMultiplier: 1,
    specialEventScore: 0
  });

  await expect.poll(() => hudScoreText(page)).toContain(`Score ${firstScore.totalScore}`);
  await expect.poll(() => hudScoreText(page)).toContain('Combo 1');
  await expect.poll(() => hudBreakdownText(page)).toContain(firstScore.breakdowns[0].eventId);

  await expect.poll(async () => npcById(page, targetId).then((npc) => npc?.state), { timeout: 8_000 }).toBe('Walking');
  await debugMinimumRepeatThrow(page, targetId);
  await expect.poll(async () => (await scoreState(page)).breakdowns.length, { timeout: 8_000 }).toBe(2);
  const secondScore = await scoreState(page);
  expect(secondScore.totalScore).toBeGreaterThan(firstScore.totalScore);
  expect(secondScore.comboCount).toBeGreaterThanOrEqual(1);
  await expect.poll(() => hudScoreText(page)).toContain(`Combo ${secondScore.comboCount}`);

  await page.screenshot({ path: 'docs/evidence/phase-07-score-combo-hud.png', fullPage: true });
  await expect.poll(async () => (await scoreState(page)).comboCount, { timeout: 8_000 }).toBe(0);
  const expiredScore = await scoreState(page);
  expect(expiredScore.totalScore).toBe(secondScore.totalScore);
  await expect.poll(() => hudScoreText(page)).toContain('Combo 0');
});

test('phase 08 raises alert, decays in cover, fails at 100, and retries cleanly', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await page.keyboard.press('BracketRight');
  await expect.poll(() => windAccelerationX(page)).toBe(90);
  const inputListenersBeforeRetry = await inputListenerCount(page);
  const lifecycleListenersBeforeRetry = await gameSceneLifecycleListenerCounts(page);
  const eventBusListenersBeforeRetry = await eventBusListenerCounts(page);

  await fireRapidThrows(page, 6);
  await expect.poll(async () => (await alertState(page)).value, { timeout: 5_000 }).toBeGreaterThan(0);
  const raised = await alertState(page);
  expect(raised.recentChanges.some((change) => change.source === 'rapid_throw')).toBe(true);
  await expect.poll(() => hudAlertText(page)).toContain('Alert');

  const beforeCoverDecay = raised.value;
  await moveToLeftCover(page);
  await page.waitForTimeout(1600);
  await expect.poll(async () => (await alertState(page)).value, { timeout: 3_000 }).toBeLessThan(beforeCoverDecay);
  expect(await isPlayerInCover(page)).toBe(true);

  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await playerState(page)).x, { timeout: 6_000 }).toBeGreaterThan(500);
  await page.keyboard.up('KeyD');
  expect(await isPlayerInCover(page)).toBe(false);
  await fireRapidThrowsWithoutTargets(page, 24);
  await expect.poll(() => isGameOver(page), { timeout: 10_000 }).toBe(true);
  const failed = await alertState(page);
  expect(failed.value).toBe(100);
  expect(failed.stage).toBe('caught');
  const scoreAtFailure = await scoreState(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(100);
  expect((await chargeState(page)).isCharging).toBe(false);
  await page.keyboard.up('Space');
  await page.waitForTimeout(800);
  expect((await scoreState(page)).totalScore).toBe(scoreAtFailure.totalScore);

  await expect.poll(() => hudResultText(page)).toContain('被抓包了');
  await page.keyboard.press('KeyR');
  await expect.poll(() => isGameOver(page), { timeout: 5_000 }).toBe(false);
  const resetAlert = await alertState(page);
  const resetScore = await scoreState(page);
  const resetProjectiles = await projectileSystem(page);
  const resetNpcs = await npcSpawner(page);
  expect(resetAlert.value).toBe(0);
  expect(resetScore.totalScore).toBe(0);
  expect(resetScore.comboCount).toBe(0);
  expect(resetProjectiles.projectiles).toHaveLength(0);
  expect(resetNpcs.npcs).toHaveLength(0);
  expect(await gameplayEvents(page)).toEqual([]);
  expect(await hitTokenCount(page)).toBe(0);
  expect(await windAccelerationX(page)).toBe(0);
  expect(await inputListenerCount(page)).toBe(inputListenersBeforeRetry);
  expect(await gameSceneLifecycleListenerCounts(page)).toEqual(lifecycleListenersBeforeRetry);
  expect(await eventBusListenerCounts(page)).toEqual(eventBusListenersBeforeRetry);
  expect(eventBusListenersBeforeRetry).toEqual({ score: 1, alert: 1, inventory: 1, level: 1 });
  await startLevelForTest(page);
  await expect.poll(async () => (await npcSpawner(page)).npcs.length).toBeGreaterThan(0);
  expect((await npcSpawner(page)).npcs[0]).toMatchObject({ id: 1, validHitCount: 0 });
  await expect
    .poll(async () => (await npcViewPool(page)).active - (await npcSpawner(page)).npcs.length)
    .toBe(0);
  await page.screenshot({ path: 'docs/evidence/phase-08-alert-failure-retry.png', fullPage: true });
});

test('retro Gate B completes hit, rant, score, combo, alert, recover, and repeat decision loop', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await clearAndSpawnNPC(page, 'office_worker', 850, 'front_road', true);

  const targetId = await fireAtHittableNPCAndWaitForRant(page);
  const firstEvents = await gameplayEvents(page);
  const hitIndex = firstEvents.findIndex((event) => event.type === 'PROJECTILE_HIT' && event.npcId === targetId);
  const rantIndex = firstEvents.findIndex((event) => event.type === 'NPC_RANT_STARTED' && event.npcId === targetId);
  expect(hitIndex).toBeGreaterThanOrEqual(0);
  expect(rantIndex).toBeGreaterThan(hitIndex);
  const firstScore = await scoreState(page);
  const firstAlert = await alertState(page);
  expect(firstScore.totalScore).toBeGreaterThan(0);
  expect(firstScore.comboCount).toBe(1);
  expect(firstAlert.value).toBeGreaterThan(0);

  await expect.poll(async () => npcById(page, targetId).then((npc) => npc?.state), { timeout: 8_000 }).toBe('Walking');
  await expect
    .poll(async () => (await gameplayEvents(page)).filter((event) => event.type === 'NPC_RECOVERED' && event.npcId === targetId).length)
    .toBe(1);

  expect((await npcById(page, targetId))?.validHitCount).toBe(1);
  expect((await scoreState(page)).totalScore).toBe(firstScore.totalScore);
  expect((await alertState(page)).value).toBeLessThan(100);
  expect(await hitTokenCount(page)).toBe(0);

  await page.screenshot({ path: 'docs/evidence/gate-b-retro.png', fullPage: true });
});

test('phase 09 switches tactical poop, applies sticky, and blocks depleted jumbo stock', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await expect.poll(() => hudPoopText(page)).toContain('普通便');

  await selectArsenalSlot(page, 1);
  await page.keyboard.press('KeyE');
  await expect.poll(() => hudPoopText(page)).toContain('黏黏便');
  await clearAndSpawnNPC(page, 'office_worker', 850, 'front_road', true);
  const stickyTargetId = await fireAtHittableNPCAndWaitForRant(page, false);
  await expect.poll(async () => npcById(page, stickyTargetId).then((npc) => npc?.activeEffectCount ?? 0), { timeout: 5_000 }).toBe(1);
  await expect.poll(async () => npcById(page, stickyTargetId).then((npc) => npc?.state), { timeout: 8_000 }).toBe('Walking');
  await expect.poll(async () => npcById(page, stickyTargetId).then((npc) => npc?.currentSpeed ?? Number.POSITIVE_INFINITY), { timeout: 2_000 }).toBeLessThan(118);

  await page.keyboard.press('KeyE');
  await expect.poll(() => hudPoopText(page)).toContain('飛濺便');
  await page.keyboard.press('KeyE');
  await expect.poll(() => hudPoopText(page)).toContain('巨無霸便');
  await chargeThrow(page, 0);
  await expect.poll(async () => (await poopInventory(page)).selectedStock).toBe(1);
  await expect.poll(async () => (await poopInventory(page)).cooldownRemainingSeconds, { timeout: 5_000 }).toBe(0);
  await chargeThrow(page, 0);
  await expect.poll(async () => (await poopInventory(page)).selectedStock, { timeout: 2_000 }).toBe(0);
  await expect.poll(async () => (await poopInventory(page)).cooldownRemainingSeconds, { timeout: 5_000 }).toBe(0);
  const beforeIds = (await projectileSystem(page)).projectiles.map((projectile) => projectile.id);
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  expect((await poopInventory(page)).selectedStock).toBe(0);
  expect((await projectileSystem(page)).projectiles.map((projectile) => projectile.id)).toEqual(beforeIds);

  await page.screenshot({ path: 'docs/evidence/phase-09-tactical-poop-hud.png', fullPage: true });
});

test('phase 10 arsenal sandbox demonstrates eight tactical poop types without leaking objects', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true));

  const labels = ['普通便', '黏黏便', '飛濺便', '巨無霸便', '彈跳便', '臭氣便', '分裂便', '黃金便'];
  for (let index = 0; index < labels.length; index += 1) {
    await selectArsenalSlot(page, index + 1);
    await expect.poll(() => hudPoopText(page)).toContain(labels[index]);
  }

  await page.keyboard.down('KeyA');
  await expect.poll(async () => (await playerState(page)).x, { timeout: 10_000 }).toBeLessThan(205);
  await page.keyboard.up('KeyA');

  await selectArsenalSlot(page, 5);
  await page.keyboard.press('Space');
  await expect
    .poll(async () => (await projectileSystem(page)).projectiles.some((projectile) => projectile.poopType === 'bouncy_poop'), {
      timeout: 2_000
    })
    .toBe(true);
  await expect
    .poll(async () => (await projectileSystem(page)).bouncedCount, {
      timeout: 5_000
    })
    .toBeGreaterThanOrEqual(1);

  await selectArsenalSlot(page, 6);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await environmentalEffects(page)).activeCount, { timeout: 7_000 }).toBe(1);
  const activeZoneStats = await environmentalEffects(page);
  expect(activeZoneStats.createdCount).toBe(1);

  await selectArsenalSlot(page, 7);
  await page.waitForTimeout(2600);
  await page.keyboard.press('Space');
  await expect
    .poll(async () => (await projectileSystem(page)).splitSpawnedCount, {
      timeout: 8_000
    })
    .toBeGreaterThanOrEqual(3);
  expect((await projectileSystem(page)).projectiles.length).toBeLessThanOrEqual(18);

  await selectArsenalSlot(page, 8);
  await page.waitForTimeout(2600);
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await playerState(page)).x, { timeout: 6_000 }).toBeGreaterThan(500);
  await page.keyboard.up('KeyD');
  await clearAndSpawnNPC(page, 'office_worker', 850);
  await fireAtHittableNPCAndWaitForRant(page);
  await expect.poll(async () => (await scoreState(page)).breakdowns.length, { timeout: 5_000 }).toBeGreaterThan(0);
  const goldenBreakdown = (await scoreState(page)).breakdowns.find((breakdown) => breakdown.ammoType === 'golden_poop');
  expect(goldenBreakdown).toMatchObject({
    ammoType: 'golden_poop',
    specialEventScore: 250
  });
  expect((await poopInventory(page)).selectedStock).toBe(0);

  await page.waitForTimeout(5_000);
  const finalProjectiles = await projectileSystem(page);
  const finalZones = await environmentalEffects(page);
  expect(finalProjectiles.projectiles.length).toBeLessThanOrEqual(18);
  expect(finalZones.activeCount).toBe(0);
  expect(finalZones.recycledCount).toBeGreaterThanOrEqual(1);

  await page.screenshot({ path: 'docs/evidence/phase-10-arsenal-sandbox.png', fullPage: true });
});

test('phase 11 npc sandbox spawns complete roster with visible tactical states', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');

  const canvas = page.locator('canvas');
  const menuBox = await canvas.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(menuBox!.x + menuBox!.width / 2, menuBox!.y + menuBox!.height * 0.56);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);
  await page.keyboard.press('KeyL');

  const expectedTypes = [
    'office_worker',
    'phone_user',
    'jogger',
    'umbrella_pedestrian',
    'delivery_rider',
    'dog_walker',
    'cleaner',
    'angry_pedestrian',
    'camera_pedestrian',
    'tourist',
    'security_guard'
  ];

  for (let index = 0; index < expectedTypes.length; index += 1) {
    await spawnNPCSandboxSlot(page, index);
  }

  await expect
    .poll(async () => {
      const spawnedTypes = new Set((await npcSpawner(page)).npcs.map((npc) => npc.definitionId));
      return expectedTypes.every((type) => spawnedTypes.has(type));
    }, { timeout: 5_000 })
    .toBe(true);

  await expect
    .poll(async () => (await npcSpawner(page)).npcs.some((npc) => npc.definitionId === 'security_guard' && npc.state === 'Searching'), {
      timeout: 8_000
    })
    .toBe(true);

  await page.screenshot({ path: 'docs/evidence/phase-11-npc-sandbox.png', fullPage: true });
});

test('phase 12 runs Level 1 through pause, timeout result, and deterministic clean retry', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');

  const initial = await levelSession(page);
  expect(initial.definition).toMatchObject({
    id: 'level_01', durationSeconds: 90, targetScore: 500, seed: 'level-01-seed',
    availablePoopTypes: ['normal_poop'], aimAssist: 'disabled'
  });
  expect(initial.phase).toBe('countdown');
  await expect.poll(() => hudLevelText(page)).toContain('倒數');
  await advanceLevelTime(page, 3);
  await expect.poll(async () => (await levelSession(page)).phase).toBe('running');
  await expect.poll(() => aimAssistVisible(page)).toBe(false);

  await expect.poll(async () => (await npcSpawner(page)).npcs.length).toBeGreaterThan(0);
  const firstSpawn = (await npcSpawner(page)).npcs[0];
  expect(firstSpawn.definitionId).toBe('office_worker');
  const listenersBeforeRetry = await eventBusListenerCounts(page);
  const lifecycleBeforeRetry = await gameSceneLifecycleListenerCounts(page);

  await clearAndSpawnNPC(page, 'office_worker', 850);
  await fireAtHittableNPCAndWaitForRant(page);
  await expect.poll(async () => (await scoreState(page)).comboRemainingSeconds).toBeGreaterThan(0);

  await page.waitForTimeout(500);
  await clearAndSpawnNPC(page, 'office_worker', 1260);
  await chargeThrow(page, 0);
  await expect.poll(async () => (await projectileSystem(page)).projectiles.length).toBeGreaterThan(0);

  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('paused');
  const pausedSnapshot = await levelSession(page);
  const comboBeforePause = (await scoreState(page)).comboRemainingSeconds;
  const npcsBeforePause = (await npcSpawner(page)).npcs;
  const projectilesBeforePause = (await projectileSystem(page)).projectiles;
  const alertBeforePause = await alertState(page);
  await page.waitForTimeout(800);
  expect((await levelSession(page)).remainingSeconds).toBe(pausedSnapshot.remainingSeconds);
  expect((await scoreState(page)).comboRemainingSeconds).toBe(comboBeforePause);
  expect((await npcSpawner(page)).npcs).toEqual(npcsBeforePause);
  expect((await projectileSystem(page)).projectiles).toEqual(projectilesBeforePause);
  expect(await alertState(page)).toEqual(alertBeforePause);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await levelSession(page)).phase).toBe('running');

  await advanceLevelTime(page, 90);
  await expect.poll(async () => (await levelSession(page)).phase).toBe('settled');
  const settled = await levelSession(page);
  expect(settled.completionCount).toBe(1);
  expect(settled.result).toMatchObject({ outcome: 'timeout', seed: 'level-01-seed' });
  expect(settled.result?.totalScore).toBeGreaterThan(0);
  expect(settled.result?.stars.conditions.map((condition) => condition.passed)).toEqual([false, false, false]);
  await expect.poll(() => hudResultText(page)).toContain('時間到');
  expect(await hudResultText(page)).toContain('[MISS] 命中率高於 60%');
  await page.screenshot({ path: 'docs/evidence/phase-12-level-01-results.png', fullPage: true });

  const firstSessionId = settled.id;
  await clickResultRetry(page, canvas);
  await expect.poll(async () => (await levelSession(page)).id).not.toBe(firstSessionId);
  const retried = await levelSession(page);
  expect(retried).toMatchObject({ attempt: 2, phase: 'countdown', remainingSeconds: 90 });
  expect(retried.definition.seed).toBe(settled.definition.seed);
  expect(retried.metrics).toEqual({ totalScore: 0, highestCombo: 0, hitCount: 0, throwCount: 0, npcHitCounts: {} });
  expect((await npcSpawner(page)).npcs).toHaveLength(0);
  expect((await projectileSystem(page)).projectiles).toHaveLength(0);
  expect((await scoreState(page)).comboCount).toBe(0);
  expect((await alertState(page)).value).toBe(0);
  expect((await chargeState(page)).isCharging).toBe(false);
  expect(await chargeMeterVisible(page)).toBe(false);
  expect(await hitTokenCount(page)).toBe(0);
  expect(await gameplayEvents(page)).toHaveLength(0);
  expect(await eventBusListenerCounts(page)).toEqual(listenersBeforeRetry);
  expect(await gameSceneLifecycleListenerCounts(page)).toEqual(lifecycleBeforeRetry);

  await advanceLevelTime(page, 3);
  await expect.poll(async () => (await npcSpawner(page)).npcs.length).toBeGreaterThan(0);
  const retryFirstSpawn = (await npcSpawner(page)).npcs[0];
  expect({ type: retryFirstSpawn.definitionId, lane: retryFirstSpawn.laneId }).toEqual({
    type: firstSpawn.definitionId,
    lane: firstSpawn.laneId
  });

  const inputListenersBeforeMenuCycle = await inputListenerCount(page);
  const eventListenersBeforeMenuCycle = await eventBusListenerCounts(page);
  await clickReturnToMenu(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('MenuScene');
  await expect.poll(() => hasStaleGameDebugState(page)).toBe(false);
  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  expect(await inputListenerCount(page)).toBe(inputListenersBeforeMenuCycle);
  expect(await eventBusListenerCounts(page)).toEqual(eventListenersBeforeMenuCycle);
});

test('phase 13 plays Level 2 with sticky poop and triggers the final rush once', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height * (475 / 720));
  await expect.poll(() => activeScenes(page)).toContain('GameScene');

  let session = await levelSession(page);
  expect(session.definition).toMatchObject({
    id: 'level_02', seed: 'level-02-rush-seed', availablePoopTypes: ['normal_poop', 'sticky_poop'],
    visual: { profile: 'evening' }
  });
  await advanceLevelTime(page, 3);
  await page.keyboard.press('KeyE');
  await expect.poll(async () => (await poopInventory(page)).selectedPoopType).toBe('sticky_poop');

  const initialRants = (await gameplayEvents(page)).filter((event) => event.type === 'NPC_RANT_STARTED').length;
  await instantMinimumThrowAtSpawnedOffset(page, 'jogger', 210, 0);
  const joggerId = await waitForNewRantEvent(page, initialRants, 12_000);
  expect(joggerId).not.toBeNull();
  await expect.poll(async () => (await scoreState(page)).totalScore).toBeGreaterThan(0);
  expect((await scoreState(page)).breakdowns.at(-1)?.ammoType).toBe('sticky_poop');
  expect((await levelSession(page)).metrics.npcHitCounts?.jogger).toBe(1);

  const beforeRush = await levelSession(page);
  await advanceLevelTime(page, beforeRush.remainingSeconds - 20);
  session = await levelSession(page);
  expect(session.remainingSeconds).toBeLessThanOrEqual(20);
  expect(session.remainingSeconds).toBeGreaterThan(19);
  expect(session.triggeredEventIds).toEqual(['final_20_second_rush']);
  await advanceLevelTime(page, 1);
  expect((await levelSession(page)).triggeredEventIds).toEqual(['final_20_second_rush']);
  await page.screenshot({ path: 'docs/evidence/phase-13-level-02-rush.png', fullPage: true });

  await advanceLevelTime(page, 20);
  await expect.poll(async () => (await levelSession(page)).phase).toBe('settled');
  expect((await levelSession(page)).completionCount).toBe(1);
  await expect.poll(() => hudResultText(page)).toContain('時間到');
  expect(consoleErrors).toEqual([]);
});

test('phase 12 settles Level 1 success once from legal normal-poop scoring', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-game-ready', 'true');
  const canvas = page.locator('canvas');
  await clickMenuStart(page, canvas);
  await expect.poll(() => activeScenes(page)).toContain('GameScene');
  await startLevelForTest(page);

  for (let hit = 0; hit < 6 && (await levelSession(page)).phase !== 'settled'; hit += 1) {
    await clearAndSpawnNPC(page, 'office_worker', 1260, 'front_road', true);
    await page.waitForTimeout(50);
    if ((await levelSession(page)).phase === 'settled') break;
    await fireAtHittableNPCAndWaitForRant(page);
  }

  await expect.poll(async () => (await levelSession(page)).phase, { timeout: 8_000 }).toBe('settled');
  const session = await levelSession(page);
  expect(session.completionCount).toBe(1);
  expect(session.result?.outcome).toBe('success');
  expect(session.result?.totalScore).toBeGreaterThanOrEqual(session.definition.targetScore);
  expect(session.result?.hitCount).toBeGreaterThan(0);
  expect(session.result?.throwCount).toBeGreaterThanOrEqual(session.result?.hitCount ?? 0);
  expect(session.result?.accuracy).toBeCloseTo((session.result?.hitCount ?? 0) / (session.result?.throwCount ?? 1), 8);
  expect(session.result?.stars.conditions.find((condition) => condition.id === 'score_target')?.passed).toBe(true);
  await expect.poll(() => hudResultText(page)).toContain('任務成功');
  await expect.poll(() => hudResultText(page)).toContain('[PASS] 達成目標分數 500');
  await page.screenshot({ path: 'docs/evidence/phase-12-level-01-success.png', fullPage: true });
});

async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = window.__SHIMING_BIDA_DEBUG__?.game;
    if (!game) {
      return [];
    }

    return game.scene.getScenes(true).map((scene) => scene.scene.key);
  });
}

async function debugOverlayVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.debugOverlayVisible ?? false);
}

async function worldLayout(page: Page): Promise<{
  readonly zones: ReadonlyArray<{ readonly id: string }>;
  readonly lanes: ReadonlyArray<{
    readonly id: string;
    readonly y: number;
    readonly scale: number;
    readonly depth: number;
  }>;
  readonly rooftop: {
    readonly minX: number;
    readonly maxX: number;
    readonly coverSlots: ReadonlyArray<{ readonly x: number; readonly width: number }>;
  };
} | null> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.layout ?? null);
}

async function playerState(page: Page): Promise<{ x: number; velocityX: number; visualState: string }> {
  return page.evaluate(() => {
    const player = window.__SHIMING_BIDA_DEBUG__?.player;
    if (!player) {
      throw new Error('Player debug state is not available');
    }

    return player;
  });
}

async function inputListenerCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.inputListenerCount ?? -1);
}

async function eventBusListenerCounts(
  page: Page
): Promise<{ readonly score: number; readonly alert: number; readonly inventory: number; readonly level: number }> {
  return page.evaluate(() => {
    const counts = window.__SHIMING_BIDA_DEBUG__?.eventBusListenerCounts;
    if (!counts) {
      throw new Error('Event bus listener counts are not available');
    }
    return counts;
  });
}

async function levelSession(page: Page) {
  return page.evaluate(() => {
    const session = window.__SHIMING_BIDA_DEBUG__?.levelSession;
    if (!session) throw new Error('Level session debug state is not available');
    return session;
  });
}

async function advanceLevelTime(page: Page, seconds: number): Promise<void> {
  await page.evaluate((delta) => window.__SHIMING_BIDA_DEBUG__?.advanceLevelTime?.(delta), seconds);
}

async function startLevelForTest(page: Page): Promise<void> {
  const phase = (await levelSession(page)).phase;
  if (phase === 'countdown') {
    await advanceLevelTime(page, 3);
  }
  await expect.poll(async () => (await levelSession(page)).phase).toBe('running');
}

async function hudLevelText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudLevelText ?? '');
}

async function hudResultText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudResultText ?? '');
}

async function clickResultRetry(page: Page, canvas: ReturnType<Page['locator']>): Promise<void> {
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box!.x + box!.width * ((640 - 110) / 1280),
    box!.y + box!.height * (590 / 720)
  );
}

async function gameSceneLifecycleListenerCounts(
  page: Page
): Promise<{ readonly shutdown: number; readonly destroy: number }> {
  return page.evaluate(() => {
    const scene = window.__SHIMING_BIDA_DEBUG__?.game.scene.getScene('GameScene');
    return {
      shutdown: scene?.events.listenerCount('shutdown') ?? -1,
      destroy: scene?.events.listenerCount('destroy') ?? -1
    };
  });
}

async function hasStaleGameDebugState(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    return Boolean(debug?.player || debug?.layout || debug?.projectileSystem || debug?.spawnNPCSandbox);
  });
}

async function aimAssistVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.aimAssistVisible ?? false);
}

async function windAccelerationX(page: Page): Promise<number> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.windAccelerationX ?? Number.NaN);
}

async function chargeState(page: Page): Promise<{ isCharging: boolean; chargeTime: number; chargePower: number }> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeState ?? {
    isCharging: false, chargeTime: 0, chargePower: 0
  });
}

async function chargeMeterVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.chargeMeterVisible ?? false);
}

async function chargeMeter(page: Page): Promise<{
  visible: boolean;
  fillRatio: number;
  fillWidth: number;
  fillHeight: number;
  renderedFillWidth: number;
  renderedFillHeight: number;
  orientation: 'vertical';
  bounds: { left: number; right: number; top: number; bottom: number };
  percent: number;
  isMax: boolean;
  label: string;
}> {
  return page.evaluate(() => {
    const meter = window.__SHIMING_BIDA_DEBUG__?.chargeMeter;
    if (!meter) throw new Error('Charge meter debug state is not available');
    return meter;
  });
}

async function projectileShadows(page: Page): Promise<readonly {
  projectileId: number; x: number; y: number; scale: number; alpha: number;
}[]> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.projectileShadows ?? []);
}

async function projectileAndShadow(page: Page) {
  return page.evaluate(() => {
    const projectile = window.__SHIMING_BIDA_DEBUG__?.projectileSystem?.projectiles[0];
    const shadow = window.__SHIMING_BIDA_DEBUG__?.projectileShadows?.[0];
    return projectile && shadow ? { projectile, shadow } : null;
  });
}

async function windowLandingHit(page: Page) {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.landingHit ?? null);
}

type ProjectileDebugState = {
  id: number;
  poopType: string;
  initialVelocityX: number;
  ageSeconds: number;
  position: { readonly x: number; readonly y: number };
  visualPosition: { readonly x: number; readonly y: number };
  targetProjectionY: number;
  originX: number;
  bounceCount: number;
  generation: number;
  parentId?: number;
};

async function projectileSystem(page: Page): Promise<{
  projectiles: ProjectileDebugState[];
  recycledCount: number;
  bouncedCount: number;
  splitSpawnedCount: number;
}> {
  return page.evaluate(() => {
    const state = window.__SHIMING_BIDA_DEBUG__?.projectileSystem;
    if (!state) {
      throw new Error('Projectile system debug state is not available');
    }

    return {
      projectiles: state.projectiles.map((projectile) => ({
        id: projectile.id,
        poopType: projectile.poopType,
        initialVelocityX: projectile.trajectory.initialVelocity.x,
        ageSeconds: projectile.ageSeconds,
        position: projectile.position,
        visualPosition: projectile.visualPosition,
        targetProjectionY: projectile.trajectory.targetProjectionY,
        originX: projectile.trajectory.origin.x,
        bounceCount: projectile.bounceCount,
        generation: projectile.generation,
        parentId: projectile.parentId
      })),
      recycledCount: state.recycledCount,
      bouncedCount: state.bouncedCount,
      splitSpawnedCount: state.splitSpawnedCount
    };
  });
}

async function projectileViewPool(page: Page): Promise<{
  readonly active: number;
  readonly pooled: number;
  readonly created: number;
  readonly reused: number;
  readonly activeShadows: number;
}> {
  return page.evaluate(() => {
    const stats = window.__SHIMING_BIDA_DEBUG__?.projectileViewPool;
    if (!stats) {
      throw new Error('Projectile view pool stats are not available');
    }
    return stats;
  });
}

async function clickMenuStart(page: Page, canvas: ReturnType<Page['locator']>): Promise<void> {
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height * 0.56);
}

async function clickReturnToMenu(page: Page, canvas: ReturnType<Page['locator']>): Promise<void> {
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width - 84, box!.y + 34);
}

type NPCDebugState = {
  id: number;
  definitionId: string;
  laneId: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  state: string;
  currentSpeed: number;
  validHitCount: number;
  activeEffectCount: number;
  dangerPhase: string;
  dangerKind?: string;
};

async function npcSpawner(page: Page): Promise<{
  npcs: NPCDebugState[];
  recycledCount: number;
  skippedSpawnCount: number;
}> {
  return page.evaluate(() => {
    const state = window.__SHIMING_BIDA_DEBUG__?.npcSpawner;
    if (!state) {
      throw new Error('NPC spawner debug state is not available');
    }

    return {
      npcs: state.npcs.map((npc) => ({
        id: npc.id,
        definitionId: npc.definitionId,
        laneId: npc.laneId,
        x: npc.x,
        y: npc.y,
        scale: npc.scale,
        depth: npc.depth,
        state: npc.state,
        currentSpeed: npc.currentSpeed,
        validHitCount: npc.validHitCount,
        activeEffectCount: npc.activeEffects.length,
        dangerPhase: npc.dangerPhase,
        dangerKind: npc.dangerKind
      })),
      recycledCount: state.recycledCount,
      skippedSpawnCount: state.skippedSpawnCount
    };
  });
}

async function npcViewPool(page: Page): Promise<{
  readonly active: number;
  readonly pooled: number;
  readonly created: number;
  readonly reused: number;
}> {
  return page.evaluate(() => {
    const stats = window.__SHIMING_BIDA_DEBUG__?.npcViewPool;
    if (!stats) {
      throw new Error('NPC view pool stats are not available');
    }
    return stats;
  });
}

async function hitTokenCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hitTokenCount ?? -1);
}

async function fireAtHittableNPCAndWaitForRant(page: Page, _stableOnly = true): Promise<number> {
  void _stableOnly;
  const initialRantEvents = (await gameplayEvents(page)).filter((event) => event.type === 'NPC_RANT_STARTED').length;
  await instantMinimumThrowAtSpawnedOffset(page, 'office_worker', 118, 0);
  const npcId = await waitForNewRantEvent(page, initialRantEvents, 12_000, false);
  if (npcId === null) throw new Error(`Controlled throw missed: ${JSON.stringify({ landing: await windowLandingHit(page), projectile: await projectileSystem(page), charge: await chargeState(page), inventory: await poopInventory(page) })}`);
  return npcId;
}

async function chargeThrow(page: Page, minimumPower: number): Promise<void> {
  await page.keyboard.down('Space');
  await expect.poll(async () => (await chargeState(page)).isCharging).toBe(true);
  if (minimumPower > 0) {
    await expect.poll(async () => (await chargeState(page)).chargePower, { timeout: 15_000 }).toBeGreaterThanOrEqual(minimumPower);
  }
  await page.keyboard.up('Space');
}

async function debugMinimumRepeatThrow(page: Page, npcId: number): Promise<void> {
  const player = await playerState(page);
  await page.evaluate(
    ({ id, x }) => {
      window.__SHIMING_BIDA_DEBUG__?.setNPCX?.(id, x);
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
    },
    { id: npcId, x: player.x + 118 * (0.65 + (1.55 - 0.65) * 0.01) + 118 / 60 }
  );
}

async function instantMinimumThrowAtSpawnedOffset(
  page: Page,
  npcType: string,
  npcSpeed: number,
  landingOffsetX: number
): Promise<void> {
  const playerX = (await playerState(page)).x;
  const minimumTravelDuration = 0.65 + (1.55 - 0.65) * 0.01;
  const spawnX = playerX - landingOffsetX + npcSpeed * minimumTravelDuration + npcSpeed / 60;
  await page.evaluate(
    ({ type, x }) => {
      window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(true);
      window.__SHIMING_BIDA_DEBUG__?.spawnNPCSandbox?.(type, x, 'front_road');
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
    },
    { type: npcType, x: spawnX }
  );
}

async function spawnForChargedLandingAndRelease(
  page: Page,
  npcType: string,
  npcSpeed: number,
  laneId: 'back_shop' | 'mid_sidewalk' | 'front_road',
  power: number
): Promise<void> {
  const playerX = (await playerState(page)).x;
  const travelDuration = 0.65 + (1.55 - 0.65) * power;
  const spawnX = playerX + npcSpeed * travelDuration + npcSpeed / 60 + 12;
  await page.evaluate(
    ({ type, x, lane }) => {
      window.__SHIMING_BIDA_DEBUG__?.spawnNPCSandbox?.(type, x, lane);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
    },
    { type: npcType, x: spawnX, lane: laneId }
  );
  await page.keyboard.up('Space');
}

async function npcById(page: Page, npcId: number): Promise<NPCDebugState | null> {
  return (await npcSpawner(page)).npcs.find((npc) => npc.id === npcId) ?? null;
}

async function gameplayEvents(page: Page): Promise<Array<{ type: string; npcId?: number; npcType?: string }>> {
  return page.evaluate(() => [...(window.__SHIMING_BIDA_DEBUG__?.gameplayEvents ?? [])]);
}

async function scoreState(page: Page): Promise<{
  totalScore: number;
  comboCount: number;
  comboMultiplier: number;
  comboRemainingSeconds: number;
  breakdowns: Array<{
    eventId: string;
    npcId: number;
    ammoType: string;
    poopAdaptationMultiplier: number;
    specialEventScore: number;
  }>;
}> {
  return page.evaluate(() => {
    const score = window.__SHIMING_BIDA_DEBUG__?.score;
    if (!score) {
      throw new Error('Score debug state is not available');
    }

    return {
      totalScore: score.totalScore,
      comboCount: score.comboCount,
      comboMultiplier: score.comboMultiplier,
      comboRemainingSeconds: score.comboRemainingSeconds,
      breakdowns: score.breakdowns.map((breakdown) => ({
        eventId: breakdown.eventId,
        npcId: breakdown.npcId,
        ammoType: breakdown.ammoType,
        poopAdaptationMultiplier: breakdown.poopAdaptationMultiplier,
        specialEventScore: breakdown.specialEventScore
      }))
    };
  });
}

async function hudScoreText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudScoreText ?? '');
}

async function hudBreakdownText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudBreakdownText ?? '');
}

async function hudPoopText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudPoopText ?? '');
}

async function poopInventory(page: Page): Promise<{
  selectedStock: number | 'infinite';
  selectedPoopType: string;
  cooldownRemainingSeconds: number;
}> {
  return page.evaluate(() => {
    const inventory = window.__SHIMING_BIDA_DEBUG__?.poopInventory;
    if (!inventory) {
      throw new Error('Poop inventory debug state is not available');
    }
    const slot = inventory.slots[inventory.selectedIndex];
    return {
      selectedStock: slot.stock,
      selectedPoopType: slot.poopType,
      cooldownRemainingSeconds: slot.cooldownRemainingSeconds
    };
  });
}

async function environmentalEffects(page: Page): Promise<{
  activeCount: number;
  createdCount: number;
  recycledCount: number;
}> {
  return page.evaluate(() => {
    const state = window.__SHIMING_BIDA_DEBUG__?.environmentalEffects;
    if (!state) {
      throw new Error('Environmental effect debug state is not available');
    }

    return {
      activeCount: state.stats.activeCount,
      createdCount: state.stats.createdCount,
      recycledCount: state.stats.recycledCount
    };
  });
}

async function alertState(page: Page): Promise<{
  value: number;
  stage: string;
  isCaught: boolean;
  recentChanges: Array<{ source: string; amount: number; valueAfter: number }>;
}> {
  return page.evaluate(() => {
    const alert = window.__SHIMING_BIDA_DEBUG__?.alert;
    if (!alert) {
      throw new Error('Alert debug state is not available');
    }

    return {
      value: alert.value,
      stage: alert.stage,
      isCaught: alert.isCaught,
      recentChanges: alert.recentChanges.map((change) => ({
        source: change.source,
        amount: change.amount,
        valueAfter: change.valueAfter
      }))
    };
  });
}

async function hudAlertText(page: Page): Promise<string> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.hudAlertText ?? '');
}

async function isGameOver(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.isGameOver ?? false);
}

async function isPlayerInCover(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.isPlayerInCover ?? false);
}

async function fireRapidThrows(page: Page, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(520);
  }
}

async function fireRapidThrowsWithoutTargets(page: Page, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await page.evaluate(() => window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.());
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  }
}

async function moveToLeftCover(page: Page): Promise<void> {
  const layout = await worldLayout(page);
  expect(layout).not.toBeNull();
  const [leftCover] = layout!.rooftop.coverSlots;
  const coverMinX = leftCover.x;
  const coverMaxX = leftCover.x + leftCover.width;
  const targetX = (coverMinX + coverMaxX) / 2;

  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyD');
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const player = await playerState(page);
    const centeredInCover = player.x > coverMinX + 12 && player.x < coverMaxX - 12;
    if (centeredInCover && Math.abs(player.velocityX) < 35) {
      break;
    }

    const key = player.x > targetX ? 'KeyA' : 'KeyD';
    await page.keyboard.down(key);
    await page.waitForTimeout(55);
    await page.keyboard.up(key);
    await page.waitForTimeout(75);
  }

  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyD');
  await expect
    .poll(async () => {
      const player = await playerState(page);
      return player.x > coverMinX + 8 && player.x < coverMaxX - 8 && Math.abs(player.velocityX) < 50;
    }, { timeout: 3_000 })
    .toBe(true);
  await expect.poll(() => isPlayerInCover(page), { timeout: 2_000 }).toBe(true);
}

async function selectArsenalSlot(page: Page, index: number): Promise<void> {
  await page.keyboard.down('AltLeft');
  await page.keyboard.press(`Digit${index}`);
  await page.keyboard.up('AltLeft');
}

async function spawnNPCSandboxSlot(page: Page, index: number): Promise<void> {
  const codes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];
  await page.keyboard.down('AltLeft');
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.press(codes[index]);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('AltLeft');
}

async function clearAndSpawnNPC(
  page: Page,
  npcType: string,
  x: number,
  laneId?: 'back_shop' | 'mid_sidewalk' | 'front_road',
  disableAutoSpawn = false
): Promise<void> {
  await page.evaluate(
    ({ npcType, x, laneId, disableAutoSpawn }) => {
      window.__SHIMING_BIDA_DEBUG__?.clearNPCSandbox?.(disableAutoSpawn);
      window.__SHIMING_BIDA_DEBUG__?.spawnNPCSandbox?.(npcType, x, laneId);
    },
    { npcType, x, laneId, disableAutoSpawn }
  );
}

async function waitForNewRantEvent(
  page: Page,
  seenRantEvents: number,
  timeoutMs: number,
  stableLegacyOnly = false
): Promise<number | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const events = (await gameplayEvents(page)).filter((event) => event.type === 'NPC_RANT_STARTED');
    const candidates = events.slice(seenRantEvents);
    const allowedTypes = stableLegacyOnly
      ? new Set(['office_worker', 'phone_user'])
      : new Set(['office_worker', 'phone_user', 'jogger']);
    const event = candidates.find((candidate) => candidate.npcType !== undefined && allowedTypes.has(candidate.npcType));
    if (event?.npcId !== undefined) {
      return event.npcId;
    }
    await page.waitForTimeout(50);
  }

  return null;
}
