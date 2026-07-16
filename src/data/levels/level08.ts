import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_08 = loadLevelDefinition({
  id: 'level_08', name: '第 8 關：全城直播', durationSeconds: 135, countdownSeconds: 3,
  targetScore: 2100, seed: 'level-08-camera-seed',
  availablePoopTypes: ['normal_poop', 'sticky_poop', 'splash_poop'], aimAssist: 'disabled',
  visual: {
    profile: 'live_event', skylineColor: 0x7c3aed, alleyColor: 0x334155, rooftopColor: 0x27272a,
    weather: { kind: 'clear', streakColor: 0x67e8f9, streakAlpha: 0.2, streakCount: 12 }
  },
  spawn: {
    intervalSeconds: 0.78, spawnXPadding: 72, exitXPadding: 80, maxActive: 13,
    definitions: [
      { npcType: 'camera_pedestrian', weight: 4 }, { npcType: 'streamer', weight: 3 },
      { npcType: 'tourist', weight: 3 }, { npcType: 'office_worker', weight: 2 }
    ],
    lanes: [
      { laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }
    ]
  },
  surveillance: {
    snapshot: {
      telegraphDurationSeconds: 1.5, activeDurationSeconds: 0.12, cooldownSeconds: 5,
      targetMode: 'authored_sweep', authoredCenters: [300, 640, 980], targetHalfWidth: 115,
      exposureRatePerSecond: 0, exposureDecayPerSecond: 0, captureThreshold: 1,
      alertPenalty: 18, throwLockSeconds: 0.45, invulnerabilitySeconds: 1.1, throwingExposureMultiplier: 1.35
    },
    recording: {
      telegraphDurationSeconds: 1.2, activeDurationSeconds: 3.8, cooldownSeconds: 6,
      targetMode: 'fixed_zone', authoredCenters: [420, 860], targetHalfWidth: 150,
      exposureRatePerSecond: 0.42, exposureDecayPerSecond: 0.32, captureThreshold: 1,
      alertPenalty: 24, throwLockSeconds: 0.65, invulnerabilitySeconds: 1.2, throwingExposureMultiplier: 1.6
    },
    concealmentZones: [
      { id: 'water_tank', x: 112, width: 130, blocksModes: ['snapshot', 'recording'] },
      { id: 'roof_sign', x: 1038, width: 130, blocksModes: ['snapshot', 'recording'] }
    ],
    maxConcurrentTelegraphs: 2, maxConcurrentSnapshotWindows: 1, maxConcurrentRecordingWindows: 1,
    globalMinimumGapSeconds: 1.25, queueLimit: 5, minimumSafeWidth: 180,
    schedulingPolicy: 'source_id_alternating', interruptionAlertPenalty: 4, alertMultiplier: 1.25, viewPoolSize: 4
  },
  events: [
    {
      id: 'live_wave_surveillance', triggerAtRemainingSeconds: 34, once: true, channel: 'surveillanceChannel', priority: 40,
      mergeStrategy: 'replace', presentationCue: '打卡直播潮',
      surveillance: { globalGapMultiplier: 0.72, maxConcurrentTelegraphsBonus: 1 }
    },
    {
      id: 'live_wave_spawn', triggerAtRemainingSeconds: 34, once: true, channel: 'spawnChannel', priority: 40,
      mergeStrategy: 'replace', presentationCue: '攝影與直播主同時進場',
      spawn: {
        intervalSeconds: 0.5, spawnXPadding: 72, exitXPadding: 80, maxActive: 16,
        definitions: [{ npcType: 'camera_pedestrian', weight: 6 }, { npcType: 'streamer', weight: 6 }, { npcType: 'tourist', weight: 2 }],
        lanes: [{ laneId: 'back_shop', weight: 3 }, { laneId: 'mid_sidewalk', weight: 4 }, { laneId: 'front_road', weight: 3 }]
      }
    },
    {
      id: 'live_wave_presentation', triggerAtRemainingSeconds: 34, once: true, channel: 'presentationChannel', priority: 40,
      mergeStrategy: 'replace', presentationCue: 'SNAP 與 REC 將交錯啟動'
    }
  ],
  stars: [
    { id: 'score_target', label: '達成目標分數 2100', targetScore: 2100 },
    { id: 'snapshot_avoid_target', label: '避開 3 次快照', targetCount: 3 },
    { id: 'recording_survive_target', label: '完整躲過 2 次直播', targetCount: 2 }
  ]
} as const);
