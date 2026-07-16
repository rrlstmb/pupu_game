import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_07 = loadLevelDefinition({
  id: 'level_07', name: '第 7 關：巷口反擊', durationSeconds: 130, countdownSeconds: 3,
  targetScore: 1850, seed: 'level-07-counterattack-seed',
  availablePoopTypes: ['normal_poop', 'splash_poop'], aimAssist: 'disabled',
  visual: {
    profile: 'residential_alley', skylineColor: 0x64748b, alleyColor: 0x4b5563, rooftopColor: 0x3f3f46,
    weather: { kind: 'clear', streakColor: 0xfca5a5, streakAlpha: 0.2, streakCount: 10 }
  },
  spawn: {
    intervalSeconds: 0.84, spawnXPadding: 72, exitXPadding: 80, maxActive: 12,
    definitions: [
      { npcType: 'angry_pedestrian', weight: 6 }, { npcType: 'office_worker', weight: 3 }, { npcType: 'phone_user', weight: 2 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }
    ]
  },
  counterattack: {
    hitThreshold: 2, telegraphDurationSeconds: 1.35, projectileTravelDurationSeconds: 0.8,
    targetMode: 'snapshot_player_x', targetHalfWidth: 62, minimumDodgeDistance: 90,
    projectileRadius: 13, playerHitboxPadding: 14,
    maxConcurrentTelegraphs: 1, maxConcurrentProjectiles: 1, globalMinimumGapSeconds: 1.1,
    perNpcCooldownSeconds: 4, minimumEscapeWidth: 170, queueLimit: 4, schedulingPolicy: 'fifo_source_id',
    alertPenalty: 18, staggerDurationSeconds: 0.8, throwLockSeconds: 0.65, invulnerabilitySeconds: 1.1,
    staggerMovementMultiplier: 0.55, projectilePoolSize: 3, maxRetaliationsPerNpc: 2, angerResetRule: 'after_attack'
  },
  events: [
    {
      id: 'anger_chain_hazard', triggerAtRemainingSeconds: 32, once: true, channel: 'hazardChannel', priority: 30,
      mergeStrategy: 'replace', presentationCue: '巷口怒氣連鎖',
      counterattack: { globalGapMultiplier: 0.72, maxConcurrentTelegraphsBonus: 1 }
    },
    {
      id: 'anger_chain_spawn', triggerAtRemainingSeconds: 32, once: true, channel: 'spawnChannel', priority: 30,
      mergeStrategy: 'replace', presentationCue: '暴躁人潮進場',
      spawn: {
        intervalSeconds: 0.5, spawnXPadding: 72, exitXPadding: 80, maxActive: 15,
        definitions: [{ npcType: 'angry_pedestrian', weight: 9 }, { npcType: 'office_worker', weight: 2 }],
        lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
      }
    },
    {
      id: 'anger_chain_presentation', triggerAtRemainingSeconds: 32, once: true, channel: 'presentationChannel', priority: 30,
      mergeStrategy: 'replace', presentationCue: '反擊將交錯來襲'
    }
  ],
  stars: [
    { id: 'score_target', label: '達成目標分數 1850', targetScore: 1850 },
    { id: 'counter_dodge_target', label: '成功躲避 3 次反擊', targetCount: 3 },
    { id: 'npc_hit_target', label: '命中 5 名暴躁路人', npcTypes: ['angry_pedestrian'], targetHits: 5 }
  ]
} as const);
