# Phase 05: Basic NPCs, Spawner, and State Machine

## Section

Core Loop

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 04 acceptance was declared passed by the user prompt. Codex did not mark Phase 04 as `PASS`.

## Scope

- Add readonly NPC definitions.
- Add seeded RNG.
- Add pure NPC state machine.
- Add pure NPC spawner.
- Add object-pool style Phaser NPC view mapping.
- Spawn NPCs from the right, move them left, and recycle them after exiting.
- Support three lane definitions from `WorldLayout`.
- Add debug labels for NPC id, type, state, speed, and lane.

## NPC Types

- `office_worker`: fixed speed.
- `phone_user`: seeded schedule slows/stops through `Distracted`.
- `jogger`: high speed.

## States

- `Entering`
- `Walking`
- `Distracted`
- `Exiting`

## Data

Definitions and spawn config live in `src/data/npcDefinitions.ts`.

Spawn config includes:

- seed
- interval
- type weights
- lane weights
- max active NPC count
- spawn padding
- exit padding

## Spawn Overflow

If the spawner reaches max active NPC count, it skips the spawn and increments `skippedSpawnCount`. It does not queue missed spawns.

## Interfaces

- `NPCDefinition`
- `NPCInstanceState`
- `NPCSpawnerState`
- `createNPCSpawnerState`
- `updateNPCSpawner`
- `createNPCInstance`
- `updateNPCState`
- `SeededRng`

## Non-Goals

- No hit detection.
- No ranting.
- No score.
- No advanced NPC types.
- No collision response.

