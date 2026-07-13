import type { LaneId } from '../domain/layout/WorldLayout';
import type { NPCDefinition, NPCSpawnConfig } from '../domain/npc/NPCModel';

export const NPC_DEFINITIONS: readonly NPCDefinition[] = [
  {
    id: 'office_worker',
    label: '上班族',
    baseSpeed: 118,
    scoreValue: 100,
    color: 0x60a5fa,
    width: 34,
    height: 58,
    tags: ['civilian'],
    abilities: [],
    behavior: { kind: 'steady' }
  },
  {
    id: 'phone_user',
    label: '手機低頭族',
    baseSpeed: 92,
    scoreValue: 120,
    color: 0xa78bfa,
    width: 34,
    height: 56,
    tags: ['civilian'],
    abilities: [],
    behavior: {
      kind: 'distracted',
      minTimeUntilDistracted: 0.7,
      maxTimeUntilDistracted: 1.7,
      minDistractedDuration: 0.45,
      maxDistractedDuration: 1.1,
      distractedSpeedMultiplier: 0.12
    }
  },
  {
    id: 'jogger',
    label: '慢跑者',
    baseSpeed: 210,
    scoreValue: 160,
    color: 0x34d399,
    width: 30,
    height: 62,
    tags: ['civilian', 'fast'],
    abilities: [],
    behavior: { kind: 'steady' }
  },
  {
    id: 'umbrella_pedestrian',
    label: '撐傘路人',
    baseSpeed: 105,
    scoreValue: 130,
    color: 0x38bdf8,
    width: 40,
    height: 58,
    tags: ['civilian', 'umbrella_shield'],
    abilities: [{ kind: 'umbrella', blocksPoopTags: ['normal'], crackedByPoopTags: ['jumbo', 'bouncy'] }],
    behavior: { kind: 'steady' }
  },
  {
    id: 'delivery_rider',
    label: '外送員',
    baseSpeed: 260,
    scoreValue: 260,
    color: 0xf97316,
    width: 46,
    height: 54,
    tags: ['civilian', 'fast'],
    abilities: [],
    behavior: { kind: 'steady' }
  },
  {
    id: 'dog_walker',
    label: '遛狗路人',
    baseSpeed: 96,
    scoreValue: 150,
    color: 0xfacc15,
    width: 42,
    height: 56,
    tags: ['civilian', 'dog_alert'],
    abilities: [{ kind: 'dog_alert', telegraphSeconds: 0.8, activeSeconds: 1.2, alertIncrease: 12 }],
    behavior: { kind: 'steady' }
  },
  {
    id: 'cleaner',
    label: '清潔人員',
    baseSpeed: 82,
    scoreValue: 90,
    color: 0x22c55e,
    width: 38,
    height: 58,
    tags: ['civilian', 'cleaner'],
    abilities: [{ kind: 'cleaner', clearRadius: 145, intervalSeconds: 1.1 }],
    behavior: { kind: 'steady' }
  },
  {
    id: 'angry_pedestrian',
    label: '暴躁路人',
    baseSpeed: 120,
    scoreValue: 170,
    color: 0xef4444,
    width: 38,
    height: 60,
    tags: ['civilian', 'retaliates'],
    abilities: [{ kind: 'retaliate', hitThreshold: 2, telegraphSeconds: 0.75, activeSeconds: 0.7, recoverySeconds: 1 }],
    behavior: { kind: 'steady' }
  },
  {
    id: 'camera_pedestrian',
    label: '攝影路人',
    baseSpeed: 88,
    scoreValue: 190,
    color: 0x818cf8,
    width: 36,
    height: 58,
    tags: ['civilian', 'recording'],
    abilities: [{ kind: 'recording', telegraphSeconds: 0.65, activeSeconds: 3.8, alertPerSecond: 5 }],
    behavior: { kind: 'steady' }
  },
  {
    id: 'tourist',
    label: '觀光客',
    baseSpeed: 72,
    scoreValue: 110,
    color: 0xf9a8d4,
    width: 42,
    height: 56,
    tags: ['civilian', 'tourist_group'],
    abilities: [],
    behavior: {
      kind: 'distracted',
      minTimeUntilDistracted: 0.4,
      maxTimeUntilDistracted: 1.2,
      minDistractedDuration: 1.5,
      maxDistractedDuration: 2.4,
      distractedSpeedMultiplier: 0.03
    }
  },
  {
    id: 'security_guard',
    label: '保全',
    baseSpeed: 100,
    scoreValue: 80,
    color: 0x1f2937,
    width: 42,
    height: 64,
    tags: ['security'],
    abilities: [{ kind: 'security', observeSeconds: 1.4, searchSeconds: 2.4, alertPerSecond: 4 }],
    behavior: { kind: 'steady' }
  }
] as const;

export const NPC_SPAWN_CONFIG: NPCSpawnConfig = {
  seed: 'phase-05-seed',
  intervalSeconds: 0.85,
  spawnXPadding: 72,
  exitXPadding: 80,
  maxActive: 10,
  definitions: [
    { npcType: 'office_worker', weight: 5 },
    { npcType: 'phone_user', weight: 3 },
    { npcType: 'jogger', weight: 2 },
    { npcType: 'umbrella_pedestrian', weight: 2 },
    { npcType: 'delivery_rider', weight: 1 },
    { npcType: 'dog_walker', weight: 1 },
    { npcType: 'cleaner', weight: 1 },
    { npcType: 'angry_pedestrian', weight: 1 },
    { npcType: 'camera_pedestrian', weight: 1 },
    { npcType: 'tourist', weight: 2 },
    { npcType: 'security_guard', weight: 1 }
  ],
  lanes: [
    { laneId: 'back_shop' as LaneId, weight: 2 },
    { laneId: 'mid_sidewalk' as LaneId, weight: 4 },
    { laneId: 'front_road' as LaneId, weight: 3 }
  ]
};
