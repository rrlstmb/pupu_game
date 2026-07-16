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
  readonly cameraTelegraphsStarted?: number;
  readonly snapshotsActivated?: number;
  readonly snapshotsAvoided?: number;
  readonly snapshotCaptures?: number;
  readonly recordingWindowsStarted?: number;
  readonly recordingWindowsSurvived?: number;
  readonly recordingCaptures?: number;
  readonly maximumExposureReached?: number;
  readonly capturesDuringThrow?: number;
  readonly capturesDuringClimax?: number;
  readonly guardObservationsStarted?: number;
  readonly guardObservationsAvoided?: number;
  readonly searchlightWindowsSurvived?: number;
  readonly securityDetections?: number;
  readonly detectionsWhileExposed?: number;
  readonly throwsWhileConcealed?: number;
  readonly goldenPoopUsed?: number;
  readonly goldenPoopHits?: number;
  readonly goldenPoopScore?: number;
  readonly goldenPoopRemaining?: number;
  readonly scoreAfterBlockade?: number;
  readonly blockadeTriggered?: number;
  readonly maximumSecurityDetectionProgress?: number;
  readonly phase1Score?: number;
  readonly phase1UniqueInteractionTypes?: number;
  readonly paradeWaveCompleted?: number;
  readonly cameraEscortInterruptions?: number;
  readonly largeUmbrellaBreaks?: number;
  readonly bossStickySlows?: number;
  readonly bossProtectionMistakes?: number;
  readonly phaseTransitionsCompleted?: number;
  readonly finalGoldenGranted?: number;
  readonly finalGoldenUsed?: number;
  readonly finalGoldenMisses?: number;
  readonly finalGoldenHits?: number;
  readonly finalGoldenRemaining?: number;
  readonly finalWindowAttempts?: number;
  readonly finalEncounterCompleted?: number;
  readonly maximumAlert?: number;
  readonly completionTime?: number;
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
