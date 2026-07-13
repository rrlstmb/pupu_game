import type { Lane } from '../layout/WorldLayout';
import { Depths } from '../layout/Depth';
import { pickWeighted, type Rng } from '../random/SeededRng';
import { createNPCInstance, updateNPCState } from './NPCStateMachine';
import type { NPCDefinition, NPCSpawnerState, NPCSpawnConfig, NPCType } from './NPCModel';

export function createNPCSpawnerState(): NPCSpawnerState {
  return {
    npcs: [],
    nextId: 1,
    timeUntilNextSpawn: 0,
    recycledCount: 0,
    skippedSpawnCount: 0
  };
}

export function spawnNPCOfType(
  state: NPCSpawnerState,
  npcType: NPCType,
  definitions: readonly NPCDefinition[],
  lanes: readonly Lane[],
  worldWidth: number,
  spawnXPadding: number,
  rng: Rng,
  spawnX = worldWidth + spawnXPadding
): NPCSpawnerState {
  const lane = lanes[Math.min(1, lanes.length - 1)];
  const definition = definitionById(definitions, npcType);
  return {
    ...state,
    npcs: [
      ...state.npcs,
      createNPCInstance(
        state.nextId,
        definition,
        {
          laneId: lane.id,
          x: spawnX,
          y: lane.y,
          scale: lane.scale,
          depth: lane.depth + Depths.npcLaneOffset
        },
        rng
      )
    ],
    nextId: state.nextId + 1
  };
}

export function updateNPCSpawner(
  state: NPCSpawnerState,
  config: NPCSpawnConfig,
  definitions: readonly NPCDefinition[],
  lanes: readonly Lane[],
  deltaSeconds: number,
  worldWidth: number,
  rng: Rng
): NPCSpawnerState {
  const safeDelta = Math.max(0, deltaSeconds);
  const exitX = -config.exitXPadding;
  const updated = state.npcs
    .map((npc) => updateNPCState(npc, definitionById(definitions, npc.definitionId), safeDelta, exitX, rng))
    .filter((npc) => npc.state !== 'Exiting');
  const recycledCount = state.recycledCount + (state.npcs.length - updated.length);
  let nextId = state.nextId;
  let timeUntilNextSpawn = state.timeUntilNextSpawn - safeDelta;
  let skippedSpawnCount = state.skippedSpawnCount;
  let npcs = updated;

  while (timeUntilNextSpawn <= 0) {
    if (npcs.length >= config.maxActive) {
      skippedSpawnCount += 1;
    } else {
      const definitionChoice = pickWeighted(config.definitions, rng);
      const laneChoice = pickWeighted(config.lanes, rng);
      const lane = laneById(lanes, laneChoice.laneId);
      const definition = definitionById(definitions, definitionChoice.npcType);
      npcs = [
        ...npcs,
        createNPCInstance(
          nextId,
          definition,
          {
            laneId: lane.id,
            x: worldWidth + config.spawnXPadding,
            y: lane.y,
            scale: lane.scale,
            depth: lane.depth + Depths.npcLaneOffset
          },
          rng
        )
      ];
      nextId += 1;
    }

    timeUntilNextSpawn += config.intervalSeconds;
  }

  return {
    npcs,
    nextId,
    timeUntilNextSpawn,
    recycledCount,
    skippedSpawnCount
  };
}

export function spawnSequence(
  config: NPCSpawnConfig,
  definitions: readonly NPCDefinition[],
  lanes: readonly Lane[],
  worldWidth: number,
  rng: Rng,
  steps: number,
  deltaSeconds: number
): readonly Pick<NPCSpawnerState, 'npcs' | 'nextId' | 'recycledCount' | 'skippedSpawnCount'>[] {
  const snapshots: Array<Pick<NPCSpawnerState, 'npcs' | 'nextId' | 'recycledCount' | 'skippedSpawnCount'>> = [];
  let state = createNPCSpawnerState();
  for (let index = 0; index < steps; index += 1) {
    state = updateNPCSpawner(state, config, definitions, lanes, deltaSeconds, worldWidth, rng);
    snapshots.push({
      npcs: state.npcs,
      nextId: state.nextId,
      recycledCount: state.recycledCount,
      skippedSpawnCount: state.skippedSpawnCount
    });
  }
  return snapshots;
}

function definitionById(definitions: readonly NPCDefinition[], id: NPCType): NPCDefinition {
  const definition = definitions.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown NPC definition: ${id}`);
  }
  return definition;
}

function laneById(lanes: readonly Lane[], id: Lane['id']): Lane {
  const lane = lanes.find((candidate) => candidate.id === id);
  if (!lane) {
    throw new Error(`Unknown lane: ${id}`);
  }
  return lane;
}
