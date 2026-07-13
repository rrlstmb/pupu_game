import { describe, expect, it } from 'vitest';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import {
  canFireProjectile,
  createProjectileSystemState,
  fireProjectile,
  updateProjectileSystem
} from '../../src/domain/projectile/ProjectileSystem';

describe('ProjectileSystem', () => {
  it('applies cooldown so held throw cannot fire every frame', () => {
    let state = createProjectileSystemState();
    state = fireProjectile(state, { x: 500, y: 520 }, NORMAL_POOP_PROJECTILE_CONFIG);

    expect(state.projectiles).toHaveLength(1);
    expect(canFireProjectile(state)).toBe(false);

    const blocked = fireProjectile(state, { x: 500, y: 520 }, NORMAL_POOP_PROJECTILE_CONFIG);
    expect(blocked.projectiles).toHaveLength(1);
  });

  it('recovers cooldown with fixed delta updates', () => {
    let state = fireProjectile(createProjectileSystemState(), { x: 500, y: 520 }, NORMAL_POOP_PROJECTILE_CONFIG);
    state = updateProjectileSystem(state, NORMAL_POOP_PROJECTILE_CONFIG.cooldownSeconds, 720, NORMAL_POOP_PROJECTILE_CONFIG).state;

    expect(canFireProjectile(state)).toBe(true);
  });

  it('limits maximum active projectiles', () => {
    let state = createProjectileSystemState();

    for (let index = 0; index < NORMAL_POOP_PROJECTILE_CONFIG.maxActiveProjectiles + 2; index += 1) {
      state = fireProjectile({ ...state, cooldownRemainingSeconds: 0 }, { x: 500, y: 520 }, NORMAL_POOP_PROJECTILE_CONFIG);
    }

    expect(state.projectiles).toHaveLength(NORMAL_POOP_PROJECTILE_CONFIG.maxActiveProjectiles);
  });

  it('recycles projectiles when they land', () => {
    let state = fireProjectile(createProjectileSystemState(), { x: 500, y: 520 }, NORMAL_POOP_PROJECTILE_CONFIG);
    let landedCount = 0;

    for (let index = 0; index < 180; index += 1) {
      const update = updateProjectileSystem(state, 1 / 60, 720, NORMAL_POOP_PROJECTILE_CONFIG);
      landedCount += update.landed.length;
      state = update.state;
    }

    expect(landedCount).toBe(1);
    expect(state.projectiles).toHaveLength(0);
    expect(state.recycledCount).toBe(1);
  });
});

