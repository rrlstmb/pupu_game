import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { resolveProjectileNPCHits } from '../../src/domain/gameplay/HitDetection';
import type { NPCInstanceState } from '../../src/domain/npc/NPCModel';
import { updateNPCState } from '../../src/domain/npc/NPCStateMachine';
import { emptyProjectileRules, type Projectile } from '../../src/domain/projectile/ProjectileSystem';
import type { PoopType } from '../../src/domain/poop/PoopModel';
import { SeededRng } from '../../src/domain/random/SeededRng';

const office = NPC_DEFINITIONS[0];

describe('Poop behavior strategies', () => {
  it('sticky poop refreshes one slow effect and restores speed after expiry', () => {
    const hit = resolveProjectileNPCHits(
      [projectileAt(1, 'sticky_poop', 500, 320)],
      [npcAt(1, 500, 'Walking')],
      NPC_DEFINITIONS,
      new Set(),
      POOP_DEFINITIONS
    ).npcs[0];

    expect(hit.activeEffects).toHaveLength(1);
    const slowed = updateNPCState({ ...hit, state: 'Walking' }, office, 0.2, -80, new SeededRng('sticky'));
    expect(slowed.currentSpeed).toBeLessThan(office.baseSpeed);
    const restored = updateNPCState(slowed, office, 4, -80, new SeededRng('sticky'));
    expect(restored.activeEffects).toHaveLength(0);
    expect(restored.currentSpeed).toBe(office.baseSpeed);
  });

  it('splash poop affects multiple nearby NPCs once per effect instance', () => {
    const npcs = [npcAt(1, 500, 'Walking'), npcAt(2, 560, 'Walking'), npcAt(3, 750, 'Walking')];
    const first = resolveProjectileNPCHits(
      [projectileAt(1, 'splash_poop', 500, 320)],
      npcs,
      NPC_DEFINITIONS,
      new Set(),
      POOP_DEFINITIONS
    );
    const second = resolveProjectileNPCHits(
      [projectileAt(1, 'splash_poop', 500, 320)],
      first.npcs,
      NPC_DEFINITIONS,
      first.hitTokens,
      POOP_DEFINITIONS
    );

    expect(first.npcs.map((npc) => npc.validHitCount)).toEqual([1, 1, 0]);
    expect(second.events).toHaveLength(0);
  });

  it('jumbo poop marks hits as defense breaking', () => {
    const result = resolveProjectileNPCHits(
      [projectileAt(1, 'jumbo_poop', 500, 320)],
      [npcAt(1, 500, 'Walking')],
      NPC_DEFINITIONS,
      new Set(),
      POOP_DEFINITIONS
    );

    expect(result.events.find((event) => event.type === 'PROJECTILE_HIT')).toMatchObject({
      poopType: 'jumbo_poop',
      breaksDefense: true
    });
  });
});

function npcAt(id: number, x: number, state: NPCInstanceState['state']): NPCInstanceState {
  return {
    id,
    definitionId: 'office_worker',
    laneId: 'mid_sidewalk',
    x,
    y: 320,
    scale: 1,
    depth: 1,
    baseSpeed: office.baseSpeed,
    currentSpeed: office.baseSpeed,
    state,
    ageSeconds: 0,
    distanceTravelled: 100,
    validHitCount: 0,
    hitWindowId: 1,
    rantRemainingSeconds: 0,
    immunityRemainingSeconds: 0,
    reactionLevel: 0,
    activeEffects: [],
    dangerPhase: 'none',
    dangerRemainingSeconds: 0,
    cleanerCooldownSeconds: 0,
    alertPulse: 0,
    retaliationCount: 0
  };
}

function projectileAt(id: number, poopType: PoopType, x: number, y: number): Projectile {
  return {
    id,
    poopType,
    config: NORMAL_POOP_PROJECTILE_CONFIG,
    rules: emptyProjectileRules(),
    generation: 0,
    bounceCount: 0,
    hasSplit: false,
    trajectory: {
      origin: { x, y },
      initialVelocity: { x: 0, y: 0 },
      gravity: 0,
      windAccelerationX: 0,
      startProjectionY: y,
      targetProjectionY: y,
      apexHeight: 100,
      travelDuration: 1,
      windAffectX: 0,
      windAffectY: 0
    },
    ageSeconds: 0,
    previousPosition: { x, y, time: 0 },
    position: { x, y, time: 0 },
    previousVisualPosition: { x, y, time: 0 },
    visualPosition: { x, y, time: 0 },
    status: 'landed',
    landedAt: { x, y, time: 1 }
  };
}
