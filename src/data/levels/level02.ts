import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_02 = loadLevelDefinition({
  id: 'level_02',
  name: '第 2 關：下班尖峰',
  durationSeconds: 100,
  countdownSeconds: 3,
  targetScore: 850,
  seed: 'level-02-rush-seed',
  availablePoopTypes: ['normal_poop', 'sticky_poop'],
  aimAssist: 'disabled',
  visual: {
    profile: 'evening', skylineColor: 0x392f48, alleyColor: 0x4b4657, rooftopColor: 0x493a38,
    weather: { kind: 'clear', streakColor: 0xbde0fe, streakAlpha: 0, streakCount: 1 }
  },
  spawn: {
    intervalSeconds: 1.05,
    spawnXPadding: 72,
    exitXPadding: 80,
    maxActive: 9,
    definitions: [
      { npcType: 'office_worker', weight: 5 },
      { npcType: 'phone_user', weight: 3 },
      { npcType: 'jogger', weight: 2 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 2 },
      { laneId: 'mid_sidewalk', weight: 4 },
      { laneId: 'front_road', weight: 4 }
    ]
  },
  events: [{
    id: 'final_20_second_rush',
    triggerAtRemainingSeconds: 20,
    once: true,
    spawn: {
      intervalSeconds: 0.45,
      spawnXPadding: 72,
      exitXPadding: 80,
      maxActive: 14,
      definitions: [
        { npcType: 'office_worker', weight: 4 },
        { npcType: 'phone_user', weight: 2 },
        { npcType: 'jogger', weight: 4 }
      ],
      lanes: [
        { laneId: 'back_shop', weight: 2 },
        { laneId: 'mid_sidewalk', weight: 4 },
        { laneId: 'front_road', weight: 5 }
      ]
    }
  }],
  stars: [
    { id: 'score_target', label: '達成目標分數 850', targetScore: 850 },
    { id: 'npc_hit_target', label: '命中高速慢跑者 2 次', npcTypes: ['jogger'], targetHits: 2 },
    { id: 'accuracy_target', label: '命中率高於 55%', minimumExclusive: 0.55 }
  ]
} as const);
