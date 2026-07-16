import type { LevelDefinition, LevelStarCondition } from './LevelDefinition';
import { hitAccuracy, type LevelMetrics } from './ObjectiveSystem';

export type StarResult = {
  readonly id: LevelStarCondition['id'];
  readonly label: string;
  readonly passed: boolean;
  readonly actual: number;
  readonly target: number;
};

export type StarEvaluation = {
  readonly starsEarned: number;
  readonly conditions: readonly StarResult[];
};

export function evaluateStars(definition: LevelDefinition, metrics: LevelMetrics): StarEvaluation {
  const accuracy = hitAccuracy(metrics.hitCount, metrics.throwCount);
  const conditions = definition.stars.map((condition): StarResult => {
    if (condition.id === 'score_target') {
      return { id: condition.id, label: condition.label, passed: metrics.totalScore >= condition.targetScore, actual: metrics.totalScore, target: condition.targetScore };
    }
    if (condition.id === 'combo_target') {
      return { id: condition.id, label: condition.label, passed: metrics.highestCombo >= condition.targetCombo, actual: metrics.highestCombo, target: condition.targetCombo };
    }
    if (condition.id === 'npc_hit_target') {
      const actual = condition.npcTypes.reduce((total, npcType) => total + (metrics.npcHitCounts?.[npcType] ?? 0), 0);
      return { id: condition.id, label: condition.label, passed: actual >= condition.targetHits, actual, target: condition.targetHits };
    }
    if (condition.id === 'interaction_target') {
      const actual = metrics.interactionCounts?.[condition.interactionTag] ?? 0;
      return { id: condition.id, label: condition.label, passed: actual >= condition.targetCount, actual, target: condition.targetCount };
    }
    if (condition.id === 'splash_multi_hit_target') {
      const actual = metrics.maxSplashTargetsHit ?? 0;
      return { id: condition.id, label: condition.label, passed: actual >= condition.targetCount, actual, target: condition.targetCount };
    }
    if (condition.id === 'area_zone_target') {
      const actual = condition.mode === 'single_zone'
        ? metrics.maxNpcAffectedBySingleZone ?? 0
        : metrics.zoneAffectedNpcCount ?? 0;
      return { id: condition.id, label: condition.label, passed: actual >= condition.targetCount, actual, target: condition.targetCount };
    }
    if (condition.id === 'counter_dodge_target') {
      const actual = metrics.counterattacksDodged ?? 0;
      return { id: condition.id, label: condition.label, passed: actual >= condition.targetCount, actual, target: condition.targetCount };
    }
    return { id: condition.id, label: condition.label, passed: accuracy > condition.minimumExclusive, actual: accuracy, target: condition.minimumExclusive };
  });
  return { starsEarned: conditions.filter((condition) => condition.passed).length, conditions };
}
