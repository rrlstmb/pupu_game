import { describe, expect, it } from 'vitest';
import { LEVEL_06 } from '../../src/data/levels/level06';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { NPC_AREA_EFFECT_RESISTANCE } from '../../src/data/npcAreaEffectResistance';
import { poopDefinitionById } from '../../src/data/poopDefinitions';
import { createNPCInstance } from '../../src/domain/npc/NPCStateMachine';
import { applyAreaEffectsToNPCs, clearEnvironmentalEffectsByIds, createEnvironmentalEffectState, createStinkZone, updateEnvironmentalEffects } from '../../src/domain/poop/EnvironmentalEffectZone';
import { SeededRng } from '../../src/domain/random/SeededRng';

const stink = poopDefinitionById('stink_poop');
const rules = LEVEL_06.areaZone!;

describe('AreaEffectZone lifecycle', () => {
  it('creates from authoritative projection, expires, pauses with zero delta, and enforces replace cap', () => {
    let state = createEnvironmentalEffectState();
    for (let index = 0; index < 4; index += 1) state = createStinkZone(state, stink, { x: 100 + index, y: 320 }, rules, index);
    expect(state.zones).toHaveLength(3);
    expect(state.zones.map((zone) => zone.x)).toEqual([101, 102, 103]);
    expect(state.zones[2]).toMatchObject({ x: 103, y: 320, radius: rules.radius, sourceProjectileId: 3 });
    expect(updateEnvironmentalEffects(state, 0)).toEqual(state);
    state = updateEnvironmentalEffects(state, rules.durationSeconds);
    expect(state.zones).toHaveLength(0);
    expect(state.stats.naturallyExpiredCount).toBe(3);
  });

  it('applies resistance without mutating definitions, dedupes entry, and removes effects outside or on clear', () => {
    const originalSpeed = definition('office_worker').baseSpeed;
    let state = createStinkZone(createEnvironmentalEffectState(), stink, { x: 500, y: 320 }, rules, 8);
    const office = npc('office_worker', 1, 510);
    const jogger = npc('jogger', 2, 515);
    let applied = applyAreaEffectsToNPCs(state, [office, jogger], NPC_AREA_EFFECT_RESISTANCE);
    state = applied.state;
    expect(applied.newlyAffected).toHaveLength(2);
    expect(applied.npcs[0].activeEffects[0].slowMultiplier).toBeLessThan(applied.npcs[1].activeEffects[0].slowMultiplier!);
    applied = applyAreaEffectsToNPCs(state, applied.npcs, NPC_AREA_EFFECT_RESISTANCE);
    expect(applied.newlyAffected).toHaveLength(0);
    const moved = applied.npcs.map((entry) => ({ ...entry, x: 900 }));
    expect(applyAreaEffectsToNPCs(applied.state, moved, NPC_AREA_EFFECT_RESISTANCE).npcs.every((entry) => entry.activeEffects.length === 0)).toBe(true);
    expect(definition('office_worker').baseSpeed).toBe(originalSpeed);
    expect(clearEnvironmentalEffectsByIds(state, [state.zones[0].id]).zones).toHaveLength(0);
  });

  it('does not apply a new zone effect while recovering or exiting', () => {
    const state = createStinkZone(createEnvironmentalEffectState(), stink, { x: 500, y: 320 }, rules);
    const candidates = [
      { ...npc('office_worker', 1, 500), state: 'Recovering' as const },
      { ...npc('office_worker', 2, 500), state: 'Exiting' as const }
    ];
    const applied = applyAreaEffectsToNPCs(state, candidates, NPC_AREA_EFFECT_RESISTANCE);
    expect(applied.newlyAffected).toHaveLength(0);
    expect(applied.npcs.every((entry) => entry.activeEffects.length === 0)).toBe(true);
  });
});

function definition(id: 'office_worker' | 'jogger') {
  return NPC_DEFINITIONS.find((entry) => entry.id === id)!;
}

function npc(id: 'office_worker' | 'jogger', instanceId: number, x: number) {
  return { ...createNPCInstance(instanceId, definition(id), { laneId: 'mid_sidewalk', x, y: 320, scale: 1, depth: 1 }, new SeededRng('zone-test')), state: 'Walking' as const };
}
