import { loadLevelDefinition, type LevelSpawnDefinition } from '../../domain/level/LevelDefinition';

const PARADE_SPAWN: LevelSpawnDefinition = {
  intervalSeconds: 0.58, spawnXPadding: 72, exitXPadding: 80, maxActive: 17,
  definitions: [
    { npcType: 'office_worker', weight: 2 }, { npcType: 'phone_user', weight: 2 },
    { npcType: 'jogger', weight: 1 }, { npcType: 'umbrella_pedestrian', weight: 2 },
    { npcType: 'tourist', weight: 3 }, { npcType: 'cleaner', weight: 2 },
    { npcType: 'camera_pedestrian', weight: 1 }, { npcType: 'streamer', weight: 1 },
    { npcType: 'security_guard', weight: 1 }
  ],
  lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
};
const BOSS_SPAWN: LevelSpawnDefinition = {
  ...PARADE_SPAWN, intervalSeconds: 0.9, maxActive: 12,
  definitions: [{ npcType: 'camera_pedestrian', weight: 4 }, { npcType: 'streamer', weight: 3 },
    { npcType: 'security_guard', weight: 3 }, { npcType: 'office_worker', weight: 2 }]
};
const FINAL_SPAWN: LevelSpawnDefinition = {
  ...PARADE_SPAWN, intervalSeconds: 0.72, maxActive: 13,
  definitions: [{ npcType: 'security_guard', weight: 5 }, { npcType: 'jogger', weight: 2 }, { npcType: 'tourist', weight: 2 }]
};

export const LEVEL_10 = loadLevelDefinition({
  id: 'level_10', name: '第 10 關：城市潔淨日', durationSeconds: 240, countdownSeconds: 3,
  targetScore: 3200, seed: 'level-10-clean-city-boss-seed', completionMode: 'boss_final_hit',
  availablePoopTypes: ['normal_poop', 'sticky_poop', 'splash_poop', 'jumbo_poop', 'bouncy_poop', 'stink_poop', 'split_poop', 'golden_poop'],
  poopStockOverrides: { sticky_poop: 4, splash_poop: 3, jumbo_poop: 3, bouncy_poop: 3, stink_poop: 3, split_poop: 2, golden_poop: 0 },
  aimAssist: 'disabled', spawn: PARADE_SPAWN,
  visual: { profile: 'clean_city', skylineColor: 0x93c5fd, alleyColor: 0x64748b, rooftopColor: 0x334155,
    weather: { kind: 'clear', streakColor: 0xf8fafc, streakAlpha: 0.2, streakCount: 12 } },
  cleaner: { detectionRadius: 145, warningSeconds: 1.1, cleaningDurationSeconds: 1.5, maxConcurrentLocks: 2 },
  surveillance: {
    snapshot: { telegraphDurationSeconds: 1.3, activeDurationSeconds: 0.25, cooldownSeconds: 3.8, targetMode: 'authored_sweep', authoredCenters: [330, 760, 1030], targetHalfWidth: 105, exposureRatePerSecond: 1, exposureDecayPerSecond: 0.8, captureThreshold: 1, alertPenalty: 10, throwLockSeconds: 0.35, invulnerabilitySeconds: 0.8, throwingExposureMultiplier: 1.3 },
    recording: { telegraphDurationSeconds: 1.1, activeDurationSeconds: 3.5, cooldownSeconds: 4.2, targetMode: 'fixed_zone', authoredCenters: [470, 900], targetHalfWidth: 120, exposureRatePerSecond: 0.42, exposureDecayPerSecond: 0.35, captureThreshold: 1, alertPenalty: 12, throwLockSeconds: 0.4, invulnerabilitySeconds: 0.9, throwingExposureMultiplier: 1.35 },
    concealmentZones: [{ id: 'festival_sign', x: 160, width: 115, blocksModes: ['snapshot', 'recording'] }],
    maxConcurrentTelegraphs: 1, maxConcurrentSnapshotWindows: 1, maxConcurrentRecordingWindows: 1,
    globalMinimumGapSeconds: 1.1, queueLimit: 4, minimumSafeWidth: 175, schedulingPolicy: 'source_id_alternating',
    interruptionAlertPenalty: 3, alertMultiplier: 1, viewPoolSize: 4
  },
  security: {
    detectionRatePerSecond: 0.4, detectionDecayPerSecond: 0.34, detectionThreshold: 1,
    guardPatrolPoints: [300, 680, 1010], guardWarningSeconds: 1.3, guardObservationSeconds: 3,
    guardCooldownSeconds: 4.4, guardViewHalfWidth: 105, guardHitAlertPenalty: 6,
    searchlights: [{ id: 'final_light', minX: 180, maxX: 1090, beamHalfWidth: 62, sweepDurationSeconds: 6.2, warningDurationSeconds: 1.4, phaseOffset: 0.2, detectionMultiplier: 0.75 }],
    covers: [{ id: 'final_tank', x: 185, width: 125, blocksSources: ['guard', 'searchlight'], concealmentPadding: 8, disabledDuringBlockade: false }],
    exposeOnCharge: true, exposeOnThrow: true, chargeExposureMultiplier: 1.25, throwExposureSeconds: 0.9,
    coverEffectivenessWhileExposed: 0, exposedDetectionMultiplier: 1.5,
    spottedAlertPenalty: 16, spottedThrowLockSeconds: 0.4, spottedInvulnerabilitySeconds: 1,
    maxConcurrentGuardViews: 1, maxConcurrentSearchlights: 1, globalSecurityGapSeconds: 1.3,
    minimumSafeWidth: 150, queueLimit: 3, viewPoolSize: 4
  },
  areaZone: { radius: 88, durationSeconds: 8, maxActiveZones: 3, stackingRule: 'replace', npcEffect: 'slow', effectStrength: 0.55,
    alertCostOnCreate: 7, alertCostPerAffectedNpc: 1, reenterCounts: false },
  bossEncounter: {
    id: 'cleanliness-influencer-encounter', displayName: '潔癖網紅', bossY: 300, bossWidth: 104, bossHeight: 118,
    phases: [
      { id: 'phase_1_parade', title: '城市潔淨日遊行', tutorialMessage: '混合戰術取得 600 分', phaseScoreTarget: 600, uniqueInteractionTarget: 2, transitionSeconds: 1, timeoutSeconds: 85, spawn: PARADE_SPAWN },
      { id: 'phase_2_protected_boss', title: '潔癖網紅登場', tutorialMessage: '攝影、巨傘、快速移動依序破解', transitionSeconds: 1, timeoutSeconds: 90, spawn: BOSS_SPAWN },
      { id: 'phase_3_rooftop_lockdown', title: '頂樓追捕', tutorialMessage: '保留安全站位完成黃金命中', transitionSeconds: 0.8, timeoutSeconds: 65, spawn: FINAL_SPAWN }
    ],
    protections: [
      { id: 'media_gate', type: 'media_entourage', requiredInteraction: 'camera_interrupt', requiredCount: 1, feedbackLocked: '相機護航中', feedbackBroken: '鏡頭護航解除' },
      { id: 'umbrella_gate', type: 'large_umbrella', dependsOn: 'media_gate', requiredInteraction: 'jumbo_or_bounce', requiredCount: 1, feedbackLocked: '巨傘擋住', feedbackBroken: '大型雨傘已破' },
      { id: 'movement_gate', type: 'movement_barrier', dependsOn: 'umbrella_gate', requiredInteraction: 'sticky_slow', requiredCount: 1, feedbackLocked: '移動太快', feedbackBroken: '移動受限' }
    ],
    movementProfiles: [
      { id: 'protected', speed: 115, minX: 240, maxX: 1040, pauseSeconds: 0.6, dashWarningSeconds: 0.8, dashDurationSeconds: 0.8, recoverySeconds: 0.7, hitWindowSeconds: 1.5 },
      { id: 'final', speed: 82, minX: 300, maxX: 880, pauseSeconds: 0.8, dashWarningSeconds: 0.9, dashDurationSeconds: 0.9, recoverySeconds: 0.8, hitWindowSeconds: 2 }
    ],
    finalGolden: { grantedOnPhaseEnter: 2, maxAttempts: 2, reservedForFinalPhase: true, resetOnRetry: true, successInteractionTag: 'boss_final_golden_hit' },
    finalWindow: { warningSeconds: 1.2, activeSeconds: 4.5, recoverySeconds: 1.4, repeatLimit: 2, minimumAvailableHitWidth: 150 },
    safety: {
      playerBounds: { start: 102, end: 1178 },
      blockedStages: [
        { id: 'east_lock', warningSeconds: 1.2, intervals: [{ start: 930, end: 1178 }] },
        { id: 'west_lock', warningSeconds: 1.2, intervals: [{ start: 102, end: 245 }, { start: 930, end: 1178 }] }
      ],
      coverIntervals: [{ start: 185, end: 310 }], bossHitIntervals: [{ start: 300, end: 880 }],
      minimumReachableWidth: 560, minimumSafeWidth: 145, minimumThrowPositionWidth: 150, minimumBossHitPositionWidth: 150
    }, hazardConcurrencyBudget: 3
  },
  events: [
    { id: 'clean_city_parade', triggerAtRemainingSeconds: 210, once: true, channel: 'bossChannel', priority: 100, mergeStrategy: 'exclusive', presentationCue: '城市潔淨日遊行開始', boss: { command: 'parade_wave' } },
    { id: 'boss_arrival', triggerAtRemainingSeconds: 150, once: true, channel: 'presentationChannel', priority: 100, mergeStrategy: 'replace', presentationCue: '潔癖網紅即將登場', boss: { command: 'boss_arrival' } },
    { id: 'final_lockdown', triggerAtRemainingSeconds: 65, once: true, channel: 'presentationChannel', priority: 100, mergeStrategy: 'replace', presentationCue: '頂樓追捕', boss: { command: 'rooftop_lockdown' } }
  ],
  stars: [
    { id: 'score_target', label: '總分達到 3200', targetScore: 3200 },
    { id: 'boss_final_hit', label: '完成合法黃金便最終命中', targetCount: 1 },
    { id: 'boss_detection_limit', label: '攝影與保全發現不超過 2 次', maximum: 2 }
  ]
} as const);
