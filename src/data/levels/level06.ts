import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_06 = loadLevelDefinition({
  id: 'level_06', name: '第 6 關：清潔大作戰', durationSeconds: 130, countdownSeconds: 3,
  targetScore: 1750, seed: 'level-06-cleanup-seed', availablePoopTypes: ['normal_poop', 'stink_poop'], aimAssist: 'disabled',
  visual: {
    profile: 'cleanup_day', skylineColor: 0x6b9aaa, alleyColor: 0x59636b, rooftopColor: 0x3f4b45,
    weather: { kind: 'clear', streakColor: 0xd9f99d, streakAlpha: 0.25, streakCount: 12 }
  },
  spawn: {
    intervalSeconds: 0.86, spawnXPadding: 72, exitXPadding: 80, maxActive: 13,
    definitions: [
      { npcType: 'office_worker', weight: 4 }, { npcType: 'tourist', weight: 3 },
      { npcType: 'jogger', weight: 2 }, { npcType: 'cleaner', weight: 2 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }
    ]
  },
  areaZone: {
    radius: 118, durationSeconds: 9, maxActiveZones: 3, stackingRule: 'replace', npcEffect: 'slow', effectStrength: 0.56,
    alertCostOnCreate: 8, alertCostPerAffectedNpc: 1, reenterCounts: false
  },
  cleaner: { detectionRadius: 170, warningSeconds: 1.25, cleaningDurationSeconds: 1.75, maxConcurrentLocks: 2 },
  events: [
    {
      id: 'cleanup_truck', triggerAtRemainingSeconds: 34, once: true, channel: 'cleanupChannel', priority: 30,
      mergeStrategy: 'exclusive', presentationCue: '清潔車即將大清場',
      cleanup: { mode: 'all_active_zones', warningSeconds: 5, clearDelaySeconds: 2 }
    },
    {
      id: 'cleanup_spawn_rush', triggerAtRemainingSeconds: 34, once: true, channel: 'spawnChannel', priority: 20,
      mergeStrategy: 'replace', presentationCue: '清潔人潮進場',
      spawn: {
        intervalSeconds: 0.52, spawnXPadding: 72, exitXPadding: 80, maxActive: 15,
        definitions: [{ npcType: 'cleaner', weight: 4 }, { npcType: 'office_worker', weight: 4 }, { npcType: 'tourist', weight: 3 }],
        lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
      }
    },
    {
      id: 'cleanup_presentation', triggerAtRemainingSeconds: 34, once: true, channel: 'presentationChannel', priority: 20,
      mergeStrategy: 'replace', presentationCue: '清潔車進場'
    }
  ],
  stars: [
    { id: 'score_target', label: '達成目標分數 1750', targetScore: 1750 },
    { id: 'area_zone_target', label: '單一臭氣區影響 3 名 NPC', mode: 'single_zone', targetCount: 3 },
    { id: 'npc_hit_target', label: '命中 4 名清潔人員', npcTypes: ['cleaner'], targetHits: 4 }
  ]
} as const);
