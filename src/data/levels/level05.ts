import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_05 = loadLevelDefinition({
  id: 'level_05',
  name: '第 5 關：逆風投遞',
  durationSeconds: 125,
  countdownSeconds: 3,
  targetScore: 1650,
  seed: 'level-05-headwind-seed',
  availablePoopTypes: ['normal_poop', 'bouncy_poop'],
  aimAssist: 'disabled',
  visual: {
    profile: 'windy_afternoon', skylineColor: 0x526b7a, alleyColor: 0x4b5563, rooftopColor: 0x374151,
    weather: { kind: 'clear', streakColor: 0xe0f2fe, streakAlpha: 0.38, streakCount: 18 }
  },
  spawn: {
    intervalSeconds: 0.82, spawnXPadding: 72, exitXPadding: 80, maxActive: 12,
    definitions: [
      { npcType: 'office_worker', weight: 4 },
      { npcType: 'phone_user', weight: 2 },
      { npcType: 'jogger', weight: 4 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }
    ]
  },
  wind: {
    influenceCoefficient: 240,
    maxHorizontalOffset: 170,
    transitionSmoothing: 0.2,
    resistanceByPoopType: {
      normal_poop: 1, sticky_poop: 0.9, splash_poop: 0.9, jumbo_poop: 0.55,
      bouncy_poop: 0.82, stink_poop: 0.85, split_poop: 1, golden_poop: 0.7
    },
    segments: [
      { id: 'opening_calm', startAtRemainingSeconds: 122, durationSeconds: 12, direction: 'calm', strength: 0, warningSeconds: 0 },
      { id: 'right_breeze', startAtRemainingSeconds: 108, durationSeconds: 24, direction: 'right', strength: 0.42, warningSeconds: 4 },
      { id: 'left_wind', startAtRemainingSeconds: 78, durationSeconds: 24, direction: 'left', strength: 0.58, warningSeconds: 5 },
      { id: 'climax_gale', startAtRemainingSeconds: 28, durationSeconds: 28, direction: 'right', strength: 1, warningSeconds: 6 }
    ]
  },
  bounceSurfaces: [{
    id: 'alley_sign', bounds: { x: 370, y: 218, width: 540, height: 26 },
    normal: { x: 0, y: 1 }, enabled: true, allowedPoopTags: ['sign'], bounceCoefficient: 0.58
  }],
  events: [
    {
      id: 'climax_fast_rush', triggerAtRemainingSeconds: 28, once: true,
      channel: 'spawnChannel', priority: 20, mergeStrategy: 'replace', presentationCue: '高速人潮來襲',
      spawn: {
        intervalSeconds: 0.38, spawnXPadding: 72, exitXPadding: 80, maxActive: 16,
        definitions: [{ npcType: 'jogger', weight: 8 }, { npcType: 'office_worker', weight: 2 }],
        lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
      }
    },
    {
      id: 'climax_strong_wind', triggerAtRemainingSeconds: 28, once: true,
      channel: 'windChannel', priority: 20, mergeStrategy: 'replace', windSegmentId: 'climax_gale',
      presentationCue: '強風即將來襲'
    }
  ],
  stars: [
    { id: 'score_target', label: '達成目標分數 1650', targetScore: 1650 },
    { id: 'interaction_target', label: '完成 2 次反彈命中', interactionTag: 'bounced_hit', targetCount: 2 },
    { id: 'npc_hit_target', label: '強風挑戰：命中 4 名高速目標', npcTypes: ['jogger'], targetHits: 4 }
  ]
} as const);
