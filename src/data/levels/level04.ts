import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_04 = loadLevelDefinition({
  id: 'level_04',
  name: '第 4 關：市場散場',
  durationSeconds: 120,
  countdownSeconds: 3,
  targetScore: 1400,
  seed: 'level-04-market-seed',
  availablePoopTypes: ['normal_poop', 'splash_poop'],
  aimAssist: 'disabled',
  visual: {
    profile: 'market_evening', skylineColor: 0x43384f, alleyColor: 0x4f4a5a, rooftopColor: 0x4a3d3a,
    weather: { kind: 'clear', streakColor: 0xfde68a, streakAlpha: 0, streakCount: 1 }
  },
  spawn: {
    intervalSeconds: 0.9,
    spawnXPadding: 72,
    exitXPadding: 80,
    maxActive: 11,
    definitions: [
      { npcType: 'office_worker', weight: 3 },
      { npcType: 'phone_user', weight: 2 },
      { npcType: 'tourist', weight: 5 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 },
      { laneId: 'mid_sidewalk', weight: 5 },
      { laneId: 'front_road', weight: 2 }
    ]
  },
  events: [{
    id: 'market_exit_crowd',
    triggerAtRemainingSeconds: 20,
    once: true,
    spawn: {
      intervalSeconds: 0.4,
      spawnXPadding: 72,
      exitXPadding: 80,
      maxActive: 15,
      definitions: [
        { npcType: 'tourist', weight: 7 },
        { npcType: 'office_worker', weight: 2 },
        { npcType: 'phone_user', weight: 1 }
      ],
      lanes: [
        { laneId: 'back_shop', weight: 2 },
        { laneId: 'mid_sidewalk', weight: 7 },
        { laneId: 'front_road', weight: 1 }
      ]
    }
  }],
  stars: [
    { id: 'score_target', label: '達成目標分數 1400', targetScore: 1400 },
    { id: 'splash_multi_hit_target', label: '單次飛濺命中 3 人', targetCount: 3 },
    { id: 'accuracy_target', label: '命中率高於 50%', minimumExclusive: 0.5 }
  ]
} as const);
