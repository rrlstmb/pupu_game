import { describe, expect, it } from 'vitest';
import { LEVEL_06 } from '../../src/data/levels/level06';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { poopDefinitionById } from '../../src/data/poopDefinitions';
import { createNPCInstance } from '../../src/domain/npc/NPCStateMachine';
import { createCleanerSystemState, startCleanupTruck, updateCleanerSystem } from '../../src/domain/poop/CleanerSystem';
import { createEnvironmentalEffectState, createStinkZone } from '../../src/domain/poop/EnvironmentalEffectZone';
import { SeededRng } from '../../src/domain/random/SeededRng';

const rules = LEVEL_06.cleaner!;
const cleanup = LEVEL_06.events.find((event) => event.channel === 'cleanupChannel')!.cleanup!;

describe('Cleaner coordination', () => {
  it('selects nearest zone deterministically, warns, cleans, and never double-locks', () => {
    const zones = zoneState().zones;
    const cleaners = [cleaner(1, 500), cleaner(2, 500)];
    let update = updateCleanerSystem(createCleanerSystemState(), cleaners, zones, rules, 0);
    expect(update.state.locks.map((lock) => lock.zoneId)).toEqual(['zone:1', 'zone:2']);
    expect(new Set(update.state.locks.map((lock) => lock.zoneId)).size).toBe(2);
    expect(update.state.locks.every((lock) => lock.phase === 'warning')).toBe(true);
    update = updateCleanerSystem(update.state, cleaners, zones, rules, rules.warningSeconds);
    expect(update.state.locks.every((lock) => lock.phase === 'cleaning')).toBe(true);
    update = updateCleanerSystem(update.state, cleaners, zones, rules, rules.cleaningDurationSeconds);
    expect(update.zoneIdsToClear).toEqual(['zone:1', 'zone:2']);
  });

  it('cancels a missing target and resets without locks', () => {
    const first = updateCleanerSystem(createCleanerSystemState(), [cleaner(1, 500)], zoneState().zones, rules, 0);
    expect(first.state.locks).toHaveLength(1);
    expect(updateCleanerSystem(first.state, [cleaner(1, 500)], [], rules, 0).state.locks).toHaveLength(0);
    expect(createCleanerSystemState()).toEqual({ locks: [], clearedZoneIds: [] });
  });

  it('warns before deterministic truck clear and is frozen by zero delta', () => {
    const zones = zoneState().zones;
    const state = startCleanupTruck(createCleanerSystemState(), 'cleanup_truck', cleanup);
    const paused = updateCleanerSystem(state, [], zones, rules, 0, cleanup);
    expect(paused.state).toEqual(state);
    let update = updateCleanerSystem(state, [], zones, rules, cleanup.warningSeconds, cleanup);
    expect(update.state.truck?.phase).toBe('delay');
    update = updateCleanerSystem(update.state, [], zones, rules, cleanup.clearDelaySeconds, cleanup);
    expect(update.zoneIdsToClear).toEqual(['zone:1', 'zone:2']);
    expect(update.state.truck?.phase).toBe('complete');
    expect(startCleanupTruck(update.state, 'cleanup_truck', cleanup)).toEqual(update.state);
  });
});

function zoneState() {
  const stink = poopDefinitionById('stink_poop');
  let state = createEnvironmentalEffectState();
  state = createStinkZone(state, stink, { x: 510, y: 320 }, LEVEL_06.areaZone);
  state = createStinkZone(state, stink, { x: 530, y: 320 }, LEVEL_06.areaZone);
  return state;
}

function cleaner(id: number, x: number) {
  const definition = NPC_DEFINITIONS.find((entry) => entry.id === 'cleaner')!;
  return { ...createNPCInstance(id, definition, { laneId: 'mid_sidewalk', x, y: 320, scale: 1, depth: 1 }, new SeededRng('cleaner-test')), state: 'Walking' as const };
}
