import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { poopDefinitionById, POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { resolveProjectileNPCHits } from '../../src/domain/gameplay/HitDetection';
import type { NPCInstanceState } from '../../src/domain/npc/NPCModel';
import { projectileRulesFor } from '../../src/domain/poop/PoopBehaviorStrategy';
import { createProjectileSystemState, fireProjectile, updateProjectileSystem, type BounceSurface } from '../../src/domain/projectile/ProjectileSystem';

const sign: BounceSurface = {
  id: 'alley_sign', tag: 'sign', enabled: true,
  bounds: { x: 370, y: 218, width: 540, height: 26 }, normal: { x: 0, y: 1 },
  allowedPoopTags: ['sign'], bounceCoefficient: 0.58
};

describe('Phase 16 bouncy poop surfaces', () => {
  it('bounces once on a legal named surface, follows the new projection, and lands', () => {
    const definition = poopDefinitionById('bouncy_poop');
    const config = { ...definition.projectile, initialVelocity: { ...definition.projectile.initialVelocity, x: 0 }, targetProjectionY: 230, travelDuration: 1 };
    let state = fireProjectile(createProjectileSystemState(), { x: 500, y: 500 }, config, definition.id, projectileRulesFor(definition));
    state = updateProjectileSystem(state, 1, 500, config, [sign]).state;
    expect(state.projectiles[0]).toMatchObject({ bounceCount: 1, lastSurfaceId: 'alley_sign', status: 'active' });
    const afterBounceX = state.projectiles[0].position.x;
    const landed = updateProjectileSystem(state, 0.58, 500, config, [sign]);
    expect(landed.state.bouncedCount).toBe(1);
    expect(landed.landed).toHaveLength(1);
    expect(landed.landed[0].landedAt?.x).toBe(afterBounceX);
  });

  it('does not bounce on illegal surfaces and ordinary poop never gains bounce capability', () => {
    const bouncy = poopDefinitionById('bouncy_poop');
    const ordinary = poopDefinitionById('normal_poop');
    const config = { ...bouncy.projectile, initialVelocity: { ...bouncy.projectile.initialVelocity, x: 0 }, targetProjectionY: 230, travelDuration: 1 };
    const outside = { ...sign, bounds: { ...sign.bounds!, x: 950 } };
    const bouncyUpdate = updateProjectileSystem(
      fireProjectile(createProjectileSystemState(), { x: 500, y: 500 }, config, bouncy.id, projectileRulesFor(bouncy)),
      1, 500, config, [outside]
    );
    expect(bouncyUpdate.state.bouncedCount).toBe(0);
    const ordinaryUpdate = updateProjectileSystem(
      fireProjectile(createProjectileSystemState(), { x: 500, y: 500 }, config, ordinary.id, projectileRulesFor(ordinary)),
      1, 500, config, [sign]
    );
    expect(ordinaryUpdate.state.bouncedCount).toBe(0);
  });

  it('adds one bounced-hit tag to a legal NPC hit without duplicate scoring tokens', () => {
    const definition = poopDefinitionById('bouncy_poop');
    const config = { ...definition.projectile, initialVelocity: { ...definition.projectile.initialVelocity, x: 0 }, targetProjectionY: 230, travelDuration: 1 };
    let state = fireProjectile(createProjectileSystemState(), { x: 500, y: 500 }, config, definition.id, projectileRulesFor(definition));
    state = updateProjectileSystem(state, 1, 500, config, [sign]).state;
    const landed = updateProjectileSystem(state, 0.58, 500, config, [sign]).landed;
    const hit = resolveProjectileNPCHits(landed, [npcAt(1, 500, 230)], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS, 'level-05');
    expect(hit.events).toHaveLength(1);
    expect(hit.events[0]).toMatchObject({ type: 'PROJECTILE_HIT' });
    const event = hit.events[0];
    expect(event.type === 'PROJECTILE_HIT' ? event.interactionTags : []).toContain('bounced_hit');
    expect(hit.projectileIdsToRecycle).toHaveLength(1);
  });
});

function npcAt(id: number, x: number, y: number): NPCInstanceState {
  const definition = NPC_DEFINITIONS.find((candidate) => candidate.id === 'office_worker')!;
  return {
    id, definitionId: definition.id, laneId: 'back_shop', x, y, scale: 0.82, depth: 108,
    baseSpeed: definition.baseSpeed, currentSpeed: definition.baseSpeed, state: 'Walking', ageSeconds: 0,
    distanceTravelled: 100, validHitCount: 0, hitWindowId: 1, rantRemainingSeconds: 0,
    immunityRemainingSeconds: 0, reactionLevel: 0, activeEffects: [], dangerPhase: 'none',
    dangerRemainingSeconds: 0, cleanerCooldownSeconds: 0, alertPulse: 0, retaliationCount: 0
  };
}
