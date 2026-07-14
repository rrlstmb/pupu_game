import type { LevelDefinition } from './LevelDefinition';
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
};

export function createLevelSession(definition: LevelDefinition, attempt = 1): LevelSession {
  return {
    id: `${definition.id}:${definition.seed}:attempt-${attempt}`,
    attempt,
    definition,
    phase: definition.countdownSeconds > 0 ? 'countdown' : 'running',
    countdownRemainingSeconds: definition.countdownSeconds,
    elapsedSeconds: 0,
    remainingSeconds: definition.durationSeconds,
    metrics: { totalScore: 0, highestCombo: 0, hitCount: 0, throwCount: 0 },
    completionCount: 0
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
  const updated = { ...session, elapsedSeconds, remainingSeconds };
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
      throwCount: metrics.throwCount ?? session.metrics.throwCount
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
