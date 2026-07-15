import { loadLevelDefinition } from '../../domain/level/LevelDefinition';

export const LEVEL_01 = loadLevelDefinition({
  id: 'level_01',
  name: '第一關：準時上班',
  durationSeconds: 90,
  countdownSeconds: 3,
  targetScore: 500,
  seed: 'level-01-seed',
  availablePoopTypes: ['normal_poop'],
  aimAssist: 'disabled',
  visual: {
    profile: 'day', skylineColor: 0x172033, alleyColor: 0x293241, rooftopColor: 0x3d2f27,
    weather: { kind: 'clear', streakColor: 0xbde0fe, streakAlpha: 0, streakCount: 1 }
  },
  spawn: {
    intervalSeconds: 1.15,
    spawnXPadding: 72,
    exitXPadding: 80,
    maxActive: 8,
    definitions: [{ npcType: 'office_worker', weight: 1 }],
    lanes: [
      { laneId: 'back_shop', weight: 2 },
      { laneId: 'mid_sidewalk', weight: 4 },
      { laneId: 'front_road', weight: 3 }
    ]
  },
  events: [],
  stars: [
    { id: 'score_target', label: '達成目標分數 500', targetScore: 500 },
    { id: 'combo_target', label: '完成 5 連擊', targetCombo: 5 },
    { id: 'accuracy_target', label: '命中率高於 60%', minimumExclusive: 0.6 }
  ]
} as const);
