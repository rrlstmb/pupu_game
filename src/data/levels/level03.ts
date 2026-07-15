import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_03 = loadLevelDefinition({
  id: 'level_03',
  name: '第 3 關：雨傘防線',
  durationSeconds: 110,
  countdownSeconds: 3,
  targetScore: 1100,
  seed: 'level-03-umbrella-seed',
  availablePoopTypes: ['normal_poop', 'jumbo_poop'],
  aimAssist: 'disabled',
  visual: {
    profile: 'rainy', skylineColor: 0x1f2937, alleyColor: 0x354052, rooftopColor: 0x3f3f46,
    weather: { kind: 'rain', streakColor: 0xbde0fe, streakAlpha: 0.42, streakCount: 38 }
  },
  spawn: {
    intervalSeconds: 1.1,
    spawnXPadding: 72,
    exitXPadding: 80,
    maxActive: 10,
    definitions: [
      { npcType: 'umbrella_pedestrian', weight: 6 },
      { npcType: 'office_worker', weight: 3 },
      { npcType: 'phone_user', weight: 1 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 },
      { laneId: 'mid_sidewalk', weight: 4 },
      { laneId: 'front_road', weight: 3 }
    ]
  },
  events: [{
    id: 'matching_company_umbrella_group',
    triggerAtRemainingSeconds: 25,
    once: true,
    channel: 'spawnChannel', priority: 10, mergeStrategy: 'replace',
    spawn: {
      intervalSeconds: 0.5,
      spawnXPadding: 72,
      exitXPadding: 80,
      maxActive: 14,
      definitions: [{ npcType: 'umbrella_pedestrian', weight: 1 }],
      lanes: [
        { laneId: 'back_shop', weight: 3 },
        { laneId: 'mid_sidewalk', weight: 4 },
        { laneId: 'front_road', weight: 3 }
      ]
    }
  }],
  stars: [
    { id: 'score_target', label: '達成目標分數 1100', targetScore: 1100 },
    { id: 'interaction_target', label: '用巨無霸破解 3 把雨傘', interactionTag: 'umbrella_crack', targetCount: 3 },
    { id: 'accuracy_target', label: '命中率高於 50%', minimumExclusive: 0.5 }
  ]
} as const);
