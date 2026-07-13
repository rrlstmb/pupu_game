import { describe, expect, it } from 'vitest';
import { NPC_DEFINITIONS, NPC_SPAWN_CONFIG } from '../../src/data/npcDefinitions';
import { createWorldLayout } from '../../src/domain/layout/WorldLayout';
import { Depths } from '../../src/domain/layout/Depth';
import type { NPCSpawnConfig } from '../../src/domain/npc/NPCModel';
import { createNPCSpawnerState, spawnSequence, updateNPCSpawner } from '../../src/domain/npc/NPCSpawner';
import { SeededRng } from '../../src/domain/random/SeededRng';

describe('NPCSpawner', () => {
  it('reproduces the same spawn sequence with the same seed', () => {
    const layout = createWorldLayout();
    const first = spawnSequence(NPC_SPAWN_CONFIG, NPC_DEFINITIONS, layout.lanes, layout.width, new SeededRng('same'), 12, 0.5);
    const second = spawnSequence(NPC_SPAWN_CONFIG, NPC_DEFINITIONS, layout.lanes, layout.width, new SeededRng('same'), 12, 0.5);

    expect(first.map((snapshot) => snapshot.npcs.map((npc) => `${npc.id}:${npc.definitionId}:${npc.laneId}`).join('|'))).toEqual(
      second.map((snapshot) => snapshot.npcs.map((npc) => `${npc.id}:${npc.definitionId}:${npc.laneId}`).join('|'))
    );
  });

  it('spawns from the right and moves only left', () => {
    const layout = createWorldLayout();
    let state = createNPCSpawnerState();
    const rng = new SeededRng('left');
    state = updateNPCSpawner(state, NPC_SPAWN_CONFIG, NPC_DEFINITIONS, layout.lanes, 1, layout.width, rng);
    const spawned = state.npcs[0];
    expect(spawned.x).toBeGreaterThan(layout.width);

    state = updateNPCSpawner(state, NPC_SPAWN_CONFIG, NPC_DEFINITIONS, layout.lanes, 0.5, layout.width, rng);
    expect(state.npcs[0].x).toBeLessThan(spawned.x);
  });

  it('uses lane scale and depth from layout data', () => {
    const layout = createWorldLayout();
    const config = {
      ...NPC_SPAWN_CONFIG,
      definitions: [{ npcType: 'office_worker', weight: 1 }],
      lanes: [{ laneId: 'front_road', weight: 1 }]
    } satisfies NPCSpawnConfig;
    let state = createNPCSpawnerState();

    state = updateNPCSpawner(state, config, NPC_DEFINITIONS, layout.lanes, 1, layout.width, new SeededRng('lane'));
    expect(state.npcs[0].laneId).toBe('front_road');
    expect(state.npcs[0].scale).toBe(layout.lanes[2].scale);
    expect(state.npcs[0].depth).toBe(layout.lanes[2].depth + Depths.npcLaneOffset);
  });

  it('recycles NPCs after they leave the left side', () => {
    const layout = createWorldLayout();
    const config = {
      ...NPC_SPAWN_CONFIG,
      definitions: [{ npcType: 'jogger', weight: 1 }],
      intervalSeconds: 0.2,
      maxActive: 3
    } satisfies NPCSpawnConfig;
    let state = createNPCSpawnerState();
    const rng = new SeededRng('recycle');

    for (let index = 0; index < 80; index += 1) {
      state = updateNPCSpawner(state, config, NPC_DEFINITIONS, layout.lanes, 0.5, layout.width, rng);
    }

    expect(state.recycledCount).toBeGreaterThan(0);
    expect(state.npcs.length).toBeLessThanOrEqual(config.maxActive);
  });

  it('skips spawns instead of exceeding max active NPCs', () => {
    const layout = createWorldLayout();
    const config = { ...NPC_SPAWN_CONFIG, intervalSeconds: 0.1, maxActive: 1 } satisfies NPCSpawnConfig;
    let state = createNPCSpawnerState();
    const rng = new SeededRng('skip');

    for (let index = 0; index < 10; index += 1) {
      state = updateNPCSpawner(state, config, NPC_DEFINITIONS, layout.lanes, 0.1, layout.width, rng);
    }

    expect(state.npcs).toHaveLength(1);
    expect(state.skippedSpawnCount).toBeGreaterThan(0);
  });
});
