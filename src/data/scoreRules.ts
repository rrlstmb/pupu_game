import type { NPCType } from '../domain/npc/NPCModel';
import type { PoopType } from '../domain/poop/PoopModel';
import type { ScoreRules } from '../domain/score/ScoreCalculator';

export const SCORE_RULES: ScoreRules = {
  baseScores: {
    office_worker: 100,
    phone_user: 120,
    jogger: 160,
    umbrella_pedestrian: 130,
    delivery_rider: 260,
    dog_walker: 150,
    cleaner: 90,
    angry_pedestrian: 170,
    camera_pedestrian: 190,
    tourist: 110,
    security_guard: 80
  } satisfies Record<NPCType, number>,
  poopAdaptationMultipliers: {
    normal_poop: 1,
    sticky_poop: 0.95,
    splash_poop: 0.8,
    jumbo_poop: 1.2,
    bouncy_poop: 0.9,
    stink_poop: 0.7,
    split_poop: 0.65,
    golden_poop: 2.1
  } satisfies Record<PoopType, number>,
  riskMultiplier: 1,
  specialEventScore: 0,
  repeatHitMultipliers: [
    { hitCount: 1, multiplier: 1 },
    { hitCount: 2, multiplier: 0.85 },
    { hitCount: 3, multiplier: 0.7 },
    { hitCount: 4, multiplier: 0.55 }
  ],
  precisionGrades: [
    { grade: 'perfect', maxDistance: 10, multiplier: 1.5, comboExtensionSeconds: 0.5 },
    { grade: 'clean', maxDistance: 24, multiplier: 1.25, comboExtensionSeconds: 0.5 },
    { grade: 'graze', maxDistance: 48, multiplier: 1, comboExtensionSeconds: 0 }
  ],
  combo: {
    baseWindowSeconds: 3,
    missPenaltySeconds: 0.75,
    thresholds: [
      { comboCount: 3, multiplier: 1.25 },
      { comboCount: 6, multiplier: 1.5 },
      { comboCount: 10, multiplier: 1.8 },
      { comboCount: 15, multiplier: 2.1 },
      { comboCount: 20, multiplier: 2.5 },
      { comboCount: 30, multiplier: 3 }
    ]
  }
};
