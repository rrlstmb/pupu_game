import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { NPC_POOP_INTERACTIONS, SAFE_DEFAULT_INTERACTION } from '../../src/data/npcPoopInteractions';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { createEnvironmentalEffectState, createStinkZone, clearEnvironmentalEffectsNearNPCs } from '../../src/domain/poop/EnvironmentalEffectZone';
import { resolveProjectileNPCHits } from '../../src/domain/gameplay/HitDetection';
import {
  interactionFor,
  isBlockedByInteraction,
  validateInteractionMatrix
} from '../../src/domain/npc/NPCInteractionMatrix';
import type { NPCDefinition, NPCInstanceState, NPCType } from '../../src/domain/npc/NPCModel';
import { createNPCInstance, updateNPCState } from '../../src/domain/npc/NPCStateMachine';
import { emptyProjectileRules, type Projectile } from '../../src/domain/projectile/ProjectileSystem';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { SeededRng } from '../../src/domain/random/SeededRng';

const poopTypes = POOP_DEFINITIONS.map((definition) => definition.id);
const npcTypes = NPC_DEFINITIONS.map((definition) => definition.id);

describe('NPC interaction matrix and advanced roster', () => {
  it('validates matrix coverage and uses safe defaults for missing pairs', () => {
    const validation = validateInteractionMatrix(NPC_POOP_INTERACTIONS, npcTypes, poopTypes);

    expect(validation.duplicatePairs).toEqual([]);
    expect(validation.missingPairs.length).toBeGreaterThan(0);
    const fallback = interactionFor(NPC_POOP_INTERACTIONS, 'office_worker', 'normal_poop', SAFE_DEFAULT_INTERACTION);
    expect(fallback).toMatchObject({ outcome: 'normal', alertDelta: 0, scoreDelta: 0 });
  });

  it('blocks normal poop with umbrella and allows jumbo or legal bouncy angle', () => {
    const umbrella = npcAt('umbrella_pedestrian');
    const normal = projectileAt('normal_poop', 0);
    const blocked = resolveProjectileNPCHits([normal], [umbrella], NPC_DEFINITIONS, new Set(), POOP_DEFINITIONS);
    expect(blocked.events).toEqual([expect.objectContaining({
      type: 'PROJECTILE_BLOCKED', feedbackLabel: '雨傘擋住！', npcType: 'umbrella_pedestrian'
    })]);
    expect(blocked.npcs[0]).toMatchObject({ state: 'Walking', validHitCount: 0 });
    expect(blocked.projectileIdsToRecycle).toEqual([1]);

    const jumbo = resolveProjectileNPCHits(
      [projectileAt('jumbo_poop', 0)],
      [umbrella],
      NPC_DEFINITIONS,
      new Set(),
      POOP_DEFINITIONS
    );
    expect(jumbo.events.map((event) => event.type)).toEqual(['PROJECTILE_HIT']);
    expect(jumbo.events[0]).toMatchObject({ interactionTags: ['umbrella_crack'] });
    expect(jumbo.npcs[0]).toMatchObject({ state: 'Hit', pendingRant: { poopType: 'jumbo_poop' } });

    const bouncy = resolveProjectileNPCHits(
      [projectileAt('bouncy_poop', 1)],
      [umbrella],
      NPC_DEFINITIONS,
      new Set(),
      POOP_DEFINITIONS
    );
    expect(bouncy.events.map((event) => event.type)).toEqual(['PROJECTILE_HIT']);
    expect(bouncy.npcs[0]).toMatchObject({ state: 'Hit', pendingRant: { poopType: 'bouncy_poop' } });
    expect(isBlockedByInteraction(interactionFor(NPC_POOP_INTERACTIONS, 'umbrella_pedestrian', 'normal_poop', SAFE_DEFAULT_INTERACTION), 1)).toBe(false);
  });

  it('camera, dog, angry, and security abilities use telegraph before active behavior', () => {
    const rng = new SeededRng('phase-11-danger');
    const camera = createNPC('camera_pedestrian', rng);
    const hitCamera = { ...camera, state: 'Hit' as const, validHitCount: 1 };
    const cameraTelegraph = updateNPCState(hitCamera, definition('camera_pedestrian'), 0.01, -100, rng);
    expect(cameraTelegraph.dangerPhase).toBe('telegraph');
    const cameraActive = updateNPCState(cameraTelegraph, definition('camera_pedestrian'), 1, -100, rng);
    expect(cameraActive.state).toBe('Recording');
    expect(cameraActive.alertPulse).toBeGreaterThan(0);

    const dog = updateNPCState(
      { ...createNPC('dog_walker', rng), state: 'Hit', validHitCount: 1 },
      definition('dog_walker'),
      1,
      -100,
      rng
    );
    expect(dog.dangerKind).toBe('dog_alert');

    const angry = updateNPCState(
      { ...createNPC('angry_pedestrian', rng), state: 'Hit', validHitCount: 2 },
      definition('angry_pedestrian'),
      1,
      -100,
      rng
    );
    expect(angry.dangerKind).toBe('retaliate');

    const securityTelegraph = updateNPCState(
      { ...createNPC('security_guard', rng), state: 'Walking', ageSeconds: 1.4 },
      definition('security_guard'),
      0.1,
      -100,
      rng
    );
    expect(securityTelegraph.state).toBe('Searching');
    expect(securityTelegraph.dangerPhase).toBe('telegraph');
  });

  it('cleaner clears stink environmental zones through shared cleanup interface', () => {
    const stink = POOP_DEFINITIONS.find((definition) => definition.id === 'stink_poop')!;
    const state = createStinkZone(createEnvironmentalEffectState(), stink, { x: 500, y: 320 });
    const cleared = clearEnvironmentalEffectsNearNPCs(state, [{ x: 510, y: 320, radius: 145 }]);

    expect(state.zones).toHaveLength(1);
    expect(cleared.zones).toHaveLength(0);
    expect(cleared.stats.recycledCount).toBe(1);
  });
});

function definition(id: NPCType): NPCDefinition {
  const npc = NPC_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!npc) {
    throw new Error(`Missing NPC definition: ${id}`);
  }
  return npc;
}

function createNPC(id: NPCType, rng: SeededRng): NPCInstanceState {
  return createNPCInstance(
    1,
    definition(id),
    { laneId: 'mid_sidewalk', x: 500, y: 320, scale: 1, depth: 1 },
    rng
  );
}

function npcAt(id: NPCType): NPCInstanceState {
  return {
    ...createNPC(id, new SeededRng('phase-11-fixture')),
    state: 'Walking',
    distanceTravelled: 100
  };
}

function projectileAt(poopType: Projectile['poopType'], bounceCount: number): Projectile {
  return {
    id: 1,
    poopType,
    config: NORMAL_POOP_PROJECTILE_CONFIG,
    rules: emptyProjectileRules(),
    generation: 0,
    bounceCount,
    hasSplit: false,
    trajectory: {
      origin: { x: 500, y: 320 },
      initialVelocity: { x: 0, y: 0 },
      gravity: 0,
      windAccelerationX: 0,
      startProjectionY: 320,
      targetProjectionY: 320,
      apexHeight: 100,
      travelDuration: 1,
      windAffectX: 0,
      windAffectY: 0
    },
    ageSeconds: 0,
    previousPosition: { x: 500, y: 320, time: 0 },
    position: { x: 500, y: 320, time: 0 },
    previousVisualPosition: { x: 500, y: 320, time: 0 },
    visualPosition: { x: 500, y: 320, time: 0 },
    status: 'landed',
    landedAt: { x: 500, y: 320, time: 1 }
  };
}
