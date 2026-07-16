import type { LevelDefinition } from './LevelDefinition';
import type { NPCSpawnConfig } from '../npc/NPCModel';
import { evaluateObjective, hitAccuracy, type LevelMetrics } from './ObjectiveSystem';
import { evaluateStars, type StarEvaluation } from './StarEvaluation';

export type LevelPhase = 'countdown' | 'running' | 'paused' | 'settled';
export type LevelOutcome = 'success' | 'timeout' | 'caught';

export type LevelResult = LevelMetrics & {
  readonly sessionId: string;
  readonly levelId: string;
  readonly seed: string;
  readonly outcome: LevelOutcome;
  readonly accuracy: number;
  readonly stars: StarEvaluation;
};

export type LevelSession = {
  readonly id: string;
  readonly attempt: number;
  readonly definition: LevelDefinition;
  readonly phase: LevelPhase;
  readonly phaseBeforePause?: Exclude<LevelPhase, 'paused' | 'settled'>;
  readonly countdownRemainingSeconds: number;
  readonly elapsedSeconds: number;
  readonly remainingSeconds: number;
  readonly metrics: LevelMetrics;
  readonly result?: LevelResult;
  readonly completionCount: number;
  readonly triggeredEventIds: readonly string[];
};

export function spawnConfigForLevel(definition: LevelDefinition, session?: LevelSession): NPCSpawnConfig {
  const activeEvent = session ? activeEventForChannel(definition, session, 'spawnChannel') : undefined;
  return {
    seed: definition.seed,
    ...(activeEvent?.spawn ?? definition.spawn)
  };
}

export function activeEventForChannel(
  definition: LevelDefinition,
  session: LevelSession,
  channel: LevelDefinition['events'][number]['channel']
) {
  return definition.events
    .map((event, authoredIndex) => ({ event, authoredIndex }))
    .filter(({ event }) => event.channel === channel && session.triggeredEventIds.includes(event.id))
    .sort((left, right) => right.event.priority - left.event.priority || right.authoredIndex - left.authoredIndex)[0]?.event;
}

export function createLevelSession(definition: LevelDefinition, attempt = 1): LevelSession {
  return {
    id: `${definition.id}:${definition.seed}:attempt-${attempt}`,
    attempt,
    definition,
    phase: definition.countdownSeconds > 0 ? 'countdown' : 'running',
    countdownRemainingSeconds: definition.countdownSeconds,
    elapsedSeconds: 0,
    remainingSeconds: definition.durationSeconds,
    metrics: {
      totalScore: 0, highestCombo: 0, hitCount: 0, throwCount: 0,
      npcHitCounts: {}, interactionCounts: {}, maxSplashTargetsHit: 0,
      zoneAffectedNpcCount: 0, maxNpcAffectedBySingleZone: 0,
      counterattacksTelegraphed: 0, counterattacksFired: 0, counterattacksDodged: 0,
      counterattacksHitPlayer: 0, maxConcurrentCounterattacksObserved: 0
    },
    completionCount: 0,
    triggeredEventIds: []
  };
}

export function resetLevelSession(session: LevelSession): LevelSession {
  return createLevelSession(session.definition, session.attempt + 1);
}

export function updateLevelSession(session: LevelSession, deltaSeconds: number): LevelSession {
  if (session.phase === 'paused' || session.phase === 'settled') return session;
  const delta = Math.max(0, deltaSeconds);
  if (session.phase === 'countdown') {
    const countdownRemainingSeconds = Math.max(0, session.countdownRemainingSeconds - delta);
    if (countdownRemainingSeconds > 0) return { ...session, countdownRemainingSeconds };
    return { ...session, phase: 'running', countdownRemainingSeconds: 0 };
  }
  const elapsedSeconds = Math.min(session.definition.durationSeconds, session.elapsedSeconds + delta);
  const remainingSeconds = Math.max(0, session.definition.durationSeconds - elapsedSeconds);
  const newlyTriggered = session.definition.events
    .filter((event) => remainingSeconds <= event.triggerAtRemainingSeconds && !session.triggeredEventIds.includes(event.id))
    .map((event) => event.id);
  const updated = {
    ...session,
    elapsedSeconds,
    remainingSeconds,
    triggeredEventIds: [...session.triggeredEventIds, ...newlyTriggered]
  };
  return remainingSeconds <= 0 ? settleLevel(updated, 'timeout') : updated;
}

export function updateLevelMetrics(session: LevelSession, metrics: Partial<LevelMetrics>): LevelSession {
  if (session.phase === 'settled') return session;
  const updated: LevelSession = {
    ...session,
    metrics: {
      totalScore: metrics.totalScore ?? session.metrics.totalScore,
      highestCombo: Math.max(session.metrics.highestCombo, metrics.highestCombo ?? 0),
      hitCount: metrics.hitCount ?? session.metrics.hitCount,
      throwCount: metrics.throwCount ?? session.metrics.throwCount,
      npcHitCounts: metrics.npcHitCounts ?? session.metrics.npcHitCounts,
      interactionCounts: metrics.interactionCounts ?? session.metrics.interactionCounts,
      maxSplashTargetsHit: Math.max(session.metrics.maxSplashTargetsHit ?? 0, metrics.maxSplashTargetsHit ?? 0),
      zoneAffectedNpcCount: metrics.zoneAffectedNpcCount ?? session.metrics.zoneAffectedNpcCount,
      maxNpcAffectedBySingleZone: Math.max(session.metrics.maxNpcAffectedBySingleZone ?? 0, metrics.maxNpcAffectedBySingleZone ?? 0),
      counterattacksTelegraphed: metrics.counterattacksTelegraphed ?? session.metrics.counterattacksTelegraphed,
      counterattacksFired: metrics.counterattacksFired ?? session.metrics.counterattacksFired,
      counterattacksDodged: metrics.counterattacksDodged ?? session.metrics.counterattacksDodged,
      counterattacksHitPlayer: metrics.counterattacksHitPlayer ?? session.metrics.counterattacksHitPlayer,
      maxConcurrentCounterattacksObserved: Math.max(session.metrics.maxConcurrentCounterattacksObserved ?? 0, metrics.maxConcurrentCounterattacksObserved ?? 0)
    }
  };
  return evaluateObjective(updated.definition, updated.metrics).complete ? settleLevel(updated, 'success') : updated;
}

export function failLevelCaught(session: LevelSession): LevelSession {
  return settleLevel(session, 'caught');
}

export function toggleLevelPause(session: LevelSession): LevelSession {
  if (session.phase === 'settled') return session;
  if (session.phase === 'paused') {
    return { ...session, phase: session.phaseBeforePause ?? 'running', phaseBeforePause: undefined };
  }
  return { ...session, phase: 'paused', phaseBeforePause: session.phase };
}

function settleLevel(session: LevelSession, requestedOutcome: LevelOutcome): LevelSession {
  if (session.phase === 'settled') return session;
  const objective = evaluateObjective(session.definition, session.metrics);
  const outcome = requestedOutcome === 'timeout' && objective.complete ? 'success' : requestedOutcome;
  return {
    ...session,
    phase: 'settled',
    completionCount: 1,
    result: {
      ...session.metrics,
      sessionId: session.id,
      levelId: session.definition.id,
      seed: session.definition.seed,
      outcome,
      accuracy: hitAccuracy(session.metrics.hitCount, session.metrics.throwCount),
      stars: evaluateStars(session.definition, session.metrics)
    }
  };
}
