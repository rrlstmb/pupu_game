import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { poopDefinitionById } from '../../src/data/poopDefinitions';
import { NORMAL_POOP_PROJECTILE_CONFIG } from '../../src/data/projectileConfig';
import { SCORE_RULES } from '../../src/data/scoreRules';
import { createAlertState } from '../../src/domain/alert/AlertSystem';
import {
  alertIncreaseFromZones,
  applyEnvironmentalEffectsToNPCs,
  createEnvironmentalEffectState,
  createStinkZone,
  updateEnvironmentalEffects
} from '../../src/domain/poop/EnvironmentalEffectZone';
import { projectileRulesFor } from '../../src/domain/poop/PoopBehaviorStrategy';
import { fireProjectile, updateProjectileSystem } from '../../src/domain/projectile/ProjectileSystem';
import { createScoreState, scoreRantEvent } from '../../src/domain/score/ScoreCalculator';
import type { NPCInstanceState } from '../../src/domain/npc/NPCModel';

const office = NPC_DEFINITIONS.find((definition) => definition.id === 'office_worker')!;

describe('Phase 10 advanced poop systems', () => {
  it('bouncy poop bounces only the configured number of times on tagged surfaces', () => {
    const definition = poopDefinitionById('bouncy_poop');
    let state = fireProjectile(
      { projectiles: [], cooldownRemainingSeconds: 0, nextId: 1, recycledCount: 0, bouncedCount: 0, splitSpawnedCount: 0 },
      { x: 100, y: 100 },
      definition.projectile,
      definition.id,
      projectileRulesFor(definition)
    );

    for (let index = 0; index < 240; index += 1) {
      state = updateProjectileSystem(state, 1 / 60, 300, NORMAL_POOP_PROJECTILE_CONFIG, [
        { y: 300, tag: 'rooftop_floor' }
      ]).state;
    }

    expect(state.recycledCount).toBeGreaterThan(0);
    expect(state.projectiles).toHaveLength(0);
  });

  it('split poop creates exactly three child projectiles and does not split exponentially', () => {
    const definition = poopDefinitionById('split_poop');
    let state = fireProjectile(
      { projectiles: [], cooldownRemainingSeconds: 0, nextId: 1, recycledCount: 0, bouncedCount: 0, splitSpawnedCount: 0 },
      { x: 200, y: 200 },
      definition.projectile,
      definition.id,
      projectileRulesFor(definition)
    );

    const update = updateProjectileSystem(state, 0.7, 900, definition.projectile);
    state = update.state;

    expect(update.spawned).toHaveLength(3);
    expect(state.projectiles).toHaveLength(3);
    expect(state.projectiles.every((projectile) => projectile.generation === 1 && projectile.parentId === 1)).toBe(true);

    const secondUpdate = updateProjectileSystem(state, 0.7, 900, definition.projectile);
    expect(secondUpdate.spawned).toHaveLength(0);
    expect(secondUpdate.state.projectiles.length).toBeLessThanOrEqual(3);
  });

  it('stink zones expire, clear their NPC slow effect, and report alert pressure', () => {
    const definition = poopDefinitionById('stink_poop');
    let state = createEnvironmentalEffectState();
    state = createStinkZone(state, definition, { x: 500, y: 320 });
    expect(state.zones).toHaveLength(1);
    expect(alertIncreaseFromZones(state.zones, 1)).toBe(definition.capability.stinkAlertPerSecond);

    const [slowed] = applyEnvironmentalEffectsToNPCs([npcAt(1, 520)], state.zones);
    expect(slowed.activeEffects).toHaveLength(1);

    state = updateEnvironmentalEffects(state, definition.capability.stinkDurationSeconds ?? 0);
    expect(state.zones).toHaveLength(0);
    expect(state.stats.recycledCount).toBe(1);
    const [cleared] = applyEnvironmentalEffectsToNPCs([slowed], state.zones);
    expect(cleared.activeEffects).toHaveLength(0);
  });

  it('golden poop extends combo through legal score rules without bypassing event scoring', () => {
    const golden = poopDefinitionById('golden_poop');
    const state = scoreRantEvent(
      createScoreState(),
      {
        eventId: 'golden-legal-rant',
        npcId: 1,
        npcType: 'office_worker',
        ammoType: 'golden_poop',
        validHitCount: 1,
        impactDistance: 0
      },
      {
        ...SCORE_RULES,
        specialEventScore: golden.capability.goldenSpecialEventScore ?? 0,
        combo: {
          ...SCORE_RULES.combo,
          baseWindowSeconds: SCORE_RULES.combo.baseWindowSeconds + (golden.capability.goldenComboExtensionSeconds ?? 0)
        }
      }
    );

    expect(state.breakdowns).toHaveLength(1);
    expect(state.breakdowns[0].ammoType).toBe('golden_poop');
    expect(state.breakdowns[0].specialEventScore).toBe(250);
    expect(state.comboRemainingSeconds).toBe(5);
    expect(createAlertState().value).toBe(0);
  });
});

function npcAt(id: number, x: number): NPCInstanceState {
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
    state: 'Walking',
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
