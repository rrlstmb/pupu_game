import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { NPC_HIT_REACTION_RULES } from '../../src/data/npcHitRules';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { collectNPCStateTransitionEvents, GameplayEventTypes } from '../../src/domain/gameplay/GameplayEvents';
import { canNPCBeHit, removeHitTokensForProjectiles, resolveProjectileNPCHits } from '../../src/domain/gameplay/HitDetection';
import type { NPCInstanceState } from '../../src/domain/npc/NPCModel';
import { updateNPCState } from '../../src/domain/npc/NPCStateMachine';
import { emptyProjectileRules, type Projectile } from '../../src/domain/projectile/ProjectileSystem';
import { SeededRng } from '../../src/domain/random/SeededRng';

const office = NPC_DEFINITIONS.find((definition) => definition.id === 'office_worker')!;

describe('HitDetection and rant loop', () => {
  it('creates unique hit and rant events for a valid projectile/NPC collision', () => {
    const npc = npcAt(1, 500, 'Walking');
    const projectile = projectileAt(10, 500, 300);

    const result = resolveProjectileNPCHits([projectile], [npc], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS, 'level-01-attempt-1');

    expect(result.projectileIdsToRecycle).toEqual([10]);
    expect(result.npcs[0].state).toBe('Hit');
    expect(result.npcs[0].validHitCount).toBe(1);
    expect(result.events.map((event) => event.type)).toEqual([GameplayEventTypes.ProjectileHit]);
    expect(result.events[0].sessionId).toBe('level-01-attempt-1');
    expect(result.npcs[0]).toMatchObject({
      rantRemainingSeconds: NPC_HIT_REACTION_RULES[0].rantDurationSeconds,
      immunityRemainingSeconds: NPC_HIT_REACTION_RULES[0].immunitySeconds,
      reactionLevel: NPC_HIT_REACTION_RULES[0].reactionLevel
    });
    const hitEvent = result.events[0];
    expect(hitEvent.type).toBe(GameplayEventTypes.ProjectileHit);
    if (hitEvent.type === GameplayEventTypes.ProjectileHit) {
      expect(result.npcs[0].pendingRant?.eventId).toBe(hitEvent.token);
    }
  });

  it('deduplicates repeated collision callbacks with the same hit token', () => {
    const npc = npcAt(1, 500, 'Walking');
    const projectile = projectileAt(10, 500, 300);
    const first = resolveProjectileNPCHits([projectile], [npc], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);
    const second = resolveProjectileNPCHits([projectile], first.npcs, NPC_DEFINITIONS, first.hitTokens, POOP_DEFINITIONS);

    expect(second.events).toHaveLength(0);
    expect(second.npcs[0].validHitCount).toBe(1);
  });

  it('stops during rant, recovers, then allows a second valid hit only after walking', () => {
    const rng = new SeededRng('hit-loop');
    let npc = resolveProjectileNPCHits([projectileAt(10, 500, 300)], [npcAt(1, 500, 'Walking')], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS)
      .npcs[0];

    const hitNpc = npc;
    npc = updateNPCState(npc, office, 0.1, -80, rng);
    expect(npc.state).toBe('Ranting');
    expect(npc.currentSpeed).toBe(0);
    expect(canNPCBeHit(npc)).toBe(false);
    const rantEvents = collectNPCStateTransitionEvents([hitNpc], [npc]);
    expect(rantEvents.map((event) => event.type)).toEqual([GameplayEventTypes.NPCRantStarted]);

    npc = updateNPCState(npc, office, 1.2, -80, rng);
    expect(npc.state).toBe('Recovering');
    expect(canNPCBeHit(npc)).toBe(false);

    const immune = resolveProjectileNPCHits([projectileAt(11, npc.x, 300)], [npc], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);
    expect(immune.events).toHaveLength(0);
    expect(immune.npcs[0].validHitCount).toBe(1);

    const recoveringNpc = npc;
    npc = updateNPCState(npc, office, 0.6, -80, rng);
    expect(npc.state).toBe('Walking');
    expect(npc.currentSpeed).toBeGreaterThan(0);
    expect(npc.x).toBeLessThan(recoveringNpc.x);
    expect(collectNPCStateTransitionEvents([recoveringNpc], [npc]).map((event) => event.type)).toEqual([
      GameplayEventTypes.NPCRecovered
    ]);
    const second = resolveProjectileNPCHits([projectileAt(12, npc.x, 300)], [npc], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);
    expect(second.npcs[0].validHitCount).toBe(2);
  });

  it('does not hit exiting NPCs', () => {
    const result = resolveProjectileNPCHits([projectileAt(10, 500, 300)], [npcAt(1, 500, 'Exiting')], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);

    expect(result.events).toHaveLength(0);
    expect(result.npcs[0].validHitCount).toBe(0);
  });

  it('keeps simultaneous NPC hit states independent', () => {
    const npcs = [npcAt(1, 500, 'Walking'), npcAt(2, 700, 'Walking')];
    const projectiles = [projectileAt(10, 500, 300), projectileAt(11, 700, 300)];
    const result = resolveProjectileNPCHits(projectiles, npcs, NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);

    expect(result.npcs.map((npc) => npc.validHitCount)).toEqual([1, 1]);
    expect(result.events.filter((event) => event.type === GameplayEventTypes.ProjectileHit)).toHaveLength(2);
  });

  it('removes hit tokens when their projectile is recycled', () => {
    const tokens = new Set(['10:1:1:normal_poop', 'splash:11:2:1', '12:3:1:normal_poop']);

    expect([...removeHitTokensForProjectiles(tokens, [10, 11])]).toEqual(['12:3:1:normal_poop']);
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

function projectileAt(id: number, x: number, y: number): Projectile {
  return {
    id,
    poopType: 'normal_poop',
    config: NORMAL_POOP_PROJECTILE_CONFIG,
    rules: emptyProjectileRules(),
    generation: 0,
    bounceCount: 0,
    hasSplit: false,
    trajectory: {
      origin: { x, y },
      initialVelocity: { x: 0, y: 0 },
      gravity: 0,
      windAccelerationX: 0
    },
    ageSeconds: 0,
    previousPosition: { x, y, time: 0 },
    position: { x, y, time: 0 },
    status: 'active'
  };
}
