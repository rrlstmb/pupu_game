import type { LevelDefinition } from './LevelDefinition';
import type { NPCType } from '../npc/NPCModel';

export type LevelMetrics = {
  readonly totalScore: number;
  readonly highestCombo: number;
  readonly hitCount: number;
  readonly throwCount: number;
  readonly npcHitCounts?: Readonly<Partial<Record<NPCType, number>>>;
  readonly interactionCounts?: Readonly<Record<string, number>>;
  readonly maxSplashTargetsHit?: number;
  readonly zoneAffectedNpcCount?: number;
  readonly maxNpcAffectedBySingleZone?: number;
  readonly counterattacksTelegraphed?: number;
  readonly counterattacksFired?: number;
  readonly counterattacksDodged?: number;
  readonly counterattacksHitPlayer?: number;
  readonly maxConcurrentCounterattacksObserved?: number;
};

export type ObjectiveState = {
  readonly targetScore: number;
  readonly currentScore: number;
  readonly complete: boolean;
};

export function evaluateObjective(definition: LevelDefinition, metrics: LevelMetrics): ObjectiveState {
  return {
    targetScore: definition.targetScore,
    currentScore: metrics.totalScore,
    complete: metrics.totalScore >= definition.targetScore
  };
}

export function hitAccuracy(hitCount: number, throwCount: number): number {
  return throwCount <= 0 ? 0 : Math.min(1, Math.max(0, hitCount) / throwCount);
}
