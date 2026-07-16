import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_09 = loadLevelDefinition({
  id: 'level_09', name: '第 9 關：保全巡邏', durationSeconds: 140, countdownSeconds: 3,
  targetScore: 2400, seed: 'level-09-security-patrol-seed',
  availablePoopTypes: ['normal_poop', 'jumbo_poop', 'golden_poop'],
  poopStockOverrides: { golden_poop: 1, jumbo_poop: 2 }, aimAssist: 'disabled',
  visual: {
    profile: 'night_patrol', skylineColor: 0x111827, alleyColor: 0x1f2937, rooftopColor: 0x18181b,
    weather: { kind: 'clear', streakColor: 0xfef08a, streakAlpha: 0.18, streakCount: 10 }
  },
  spawn: {
    intervalSeconds: 0.82, spawnXPadding: 72, exitXPadding: 80, maxActive: 13,
    definitions: [{ npcType: 'security_guard', weight: 5 }, { npcType: 'office_worker', weight: 3 }, { npcType: 'tourist', weight: 2 }],
    lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
  },
  security: {
    detectionRatePerSecond: 0.46, detectionDecayPerSecond: 0.34, detectionThreshold: 1,
    guardPatrolPoints: [310, 650, 990], guardWarningSeconds: 1.25, guardObservationSeconds: 3.2,
    guardCooldownSeconds: 4.5, guardViewHalfWidth: 125, guardHitAlertPenalty: 7,
    searchlights: [
      { id: 'west_light', minX: 170, maxX: 1080, beamHalfWidth: 72, sweepDurationSeconds: 5.8, warningDurationSeconds: 1.2, phaseOffset: 0, detectionMultiplier: 0.82 },
      { id: 'east_light', minX: 210, maxX: 1080, beamHalfWidth: 64, sweepDurationSeconds: 6.4, warningDurationSeconds: 1.4, phaseOffset: 0.45, detectionMultiplier: 0.72 }
    ],
    covers: [
      { id: 'water_tank', x: 205, width: 128, blocksSources: ['guard', 'searchlight'], concealmentPadding: 8, disabledDuringBlockade: false },
      { id: 'vent_sign', x: 947, width: 128, blocksSources: ['guard', 'searchlight'], concealmentPadding: 8, disabledDuringBlockade: true }
    ],
    exposeOnCharge: true, exposeOnThrow: true, chargeExposureMultiplier: 1.35, throwExposureSeconds: 1.1,
    coverEffectivenessWhileExposed: 0, exposedDetectionMultiplier: 1.7,
    spottedAlertPenalty: 22, spottedThrowLockSeconds: 0.55, spottedInvulnerabilitySeconds: 1.2,
    maxConcurrentGuardViews: 1, maxConcurrentSearchlights: 2, globalSecurityGapSeconds: 1.2,
    minimumSafeWidth: 165, queueLimit: 4, viewPoolSize: 5
  },
  blockade: {
    id: 'east_rooftop_lockdown', warningDurationSeconds: 2.4,
    blockedIntervals: [{ start: 900, end: 1178 }], minimumReachableWidth: 700,
    minimumThrowPositionWidth: 160, requireCoverInRemainingArea: true, playerRelocationPolicy: 'nearest_safe_point'
  },
  events: [
    {
      id: 'rooftop_lockdown_security', triggerAtRemainingSeconds: 35, once: true, channel: 'securityChannel', priority: 50,
      mergeStrategy: 'replace', presentationCue: '保全加強巡邏', security: { detectionRateMultiplier: 1.2 }
    },
    {
      id: 'rooftop_lockdown', triggerAtRemainingSeconds: 35, once: true, channel: 'blockadeChannel', priority: 50,
      mergeStrategy: 'exclusive', presentationCue: '頂樓封鎖預告', blockade: { activate: true }
    },
    {
      id: 'rooftop_lockdown_spawn', triggerAtRemainingSeconds: 35, once: true, channel: 'spawnChannel', priority: 50,
      mergeStrategy: 'replace', presentationCue: '保全增援',
      spawn: {
        intervalSeconds: 0.55, spawnXPadding: 72, exitXPadding: 80, maxActive: 15,
        definitions: [{ npcType: 'security_guard', weight: 8 }, { npcType: 'office_worker', weight: 2 }],
        lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
      }
    },
    {
      id: 'rooftop_lockdown_presentation', triggerAtRemainingSeconds: 35, once: true, channel: 'presentationChannel', priority: 50,
      mergeStrategy: 'replace', presentationCue: '東側封鎖，搜索燈持續掃描'
    }
  ],
  stars: [
    { id: 'score_target', label: '達成目標分數 2400', targetScore: 2400 },
    { id: 'security_avoid_target', label: '避開 3 次保全觀察', targetCount: 3 },
    { id: 'golden_hit_target', label: '黃金便合法命中 1 次', targetCount: 1 }
  ]
} as const);
