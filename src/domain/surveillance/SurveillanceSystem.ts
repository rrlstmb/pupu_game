import type { ConcealmentZoneDefinition, SurveillanceDefinition, SurveillanceModeDefinition } from '../level/LevelDefinition';

export type SurveillanceMode = 'snapshot' | 'recording';
export type SurveillanceSource = { readonly id: number; readonly x: number; readonly mode: SurveillanceMode };
export type SurveillanceInstance = {
  readonly id: string;
  readonly sourceNpcId: number;
  readonly mode: SurveillanceMode;
  readonly state: 'telegraph' | 'active';
  readonly targetZone: { readonly centerX: number; readonly halfWidth: number };
  readonly exposure: number;
  readonly remainingSeconds: number;
  readonly totalSeconds: number;
};
export type SurveillanceStats = {
  readonly telegraphsStarted: number;
  readonly snapshotsActivated: number;
  readonly snapshotsAvoided: number;
  readonly snapshotCaptures: number;
  readonly recordingWindowsStarted: number;
  readonly recordingWindowsSurvived: number;
  readonly recordingCaptures: number;
  readonly maximumExposureReached: number;
  readonly capturesDuringThrow: number;
  readonly capturesDuringClimax: number;
};
export type SurveillanceState = {
  readonly instances: readonly SurveillanceInstance[];
  readonly queuedSourceIds: readonly number[];
  readonly sourceCooldowns: Readonly<Record<number, number>>;
  readonly nextId: number;
  readonly globalGapSeconds: number;
  readonly throwLockSeconds: number;
  readonly invulnerabilitySeconds: number;
  readonly stats: SurveillanceStats;
};
export type SurveillanceResult = {
  readonly instanceId: string;
  readonly sourceNpcId: number;
  readonly mode: SurveillanceMode;
  readonly outcome: 'captured' | 'avoided' | 'cancelled';
  readonly duringThrow: boolean;
};
export type SurveillanceContext = {
  readonly deltaSeconds: number;
  readonly playerX: number;
  readonly isThrowing: boolean;
  readonly isClimax: boolean;
  readonly movementBounds: { readonly minX: number; readonly maxX: number };
  readonly sources: readonly SurveillanceSource[];
};

const EMPTY_STATS: SurveillanceStats = {
  telegraphsStarted: 0, snapshotsActivated: 0, snapshotsAvoided: 0, snapshotCaptures: 0,
  recordingWindowsStarted: 0, recordingWindowsSurvived: 0, recordingCaptures: 0,
  maximumExposureReached: 0, capturesDuringThrow: 0, capturesDuringClimax: 0
};

export function createSurveillanceState(): SurveillanceState {
  return {
    instances: [], queuedSourceIds: [], sourceCooldowns: {}, nextId: 1, globalGapSeconds: 0,
    throwLockSeconds: 0, invulnerabilitySeconds: 0, stats: EMPTY_STATS
  };
}

export function updateSurveillance(
  state: SurveillanceState,
  context: SurveillanceContext,
  rules: SurveillanceDefinition
): { readonly state: SurveillanceState; readonly results: readonly SurveillanceResult[] } {
  const delta = Math.max(0, context.deltaSeconds);
  if (delta === 0) return { state, results: [] };
  const sourceById = new Map(context.sources.map((source) => [source.id, source]));
  const results: SurveillanceResult[] = [];
  const cooldowns: Record<number, number> = {};
  for (const [id, remaining] of Object.entries(state.sourceCooldowns)) {
    if (sourceById.has(Number(id))) cooldowns[Number(id)] = Math.max(0, remaining - delta);
  }

  let stats = state.stats;
  let captureAvailable = state.invulnerabilitySeconds <= 0;
  const instances: SurveillanceInstance[] = [];
  for (const instance of state.instances) {
    if (!sourceById.has(instance.sourceNpcId)) {
      results.push(resultFor(instance, 'cancelled', context.isThrowing));
      continue;
    }
    const definition = definitionFor(rules, instance.mode);
    if (instance.state === 'telegraph') {
      const remaining = instance.remainingSeconds - delta;
      if (remaining > 0) {
        instances.push({ ...instance, remainingSeconds: remaining });
        continue;
      }
      const active = { ...instance, state: 'active' as const, remainingSeconds: definition.activeDurationSeconds, totalSeconds: definition.activeDurationSeconds };
      instances.push(active);
      stats = instance.mode === 'snapshot'
        ? { ...stats, snapshotsActivated: stats.snapshotsActivated + 1 }
        : { ...stats, recordingWindowsStarted: stats.recordingWindowsStarted + 1 };
      continue;
    }

    const concealed = isPlayerConcealed(context.playerX, instance.mode, rules.concealmentZones);
    const exposed = isInsideZone(context.playerX, instance.targetZone) && !concealed;
    const exposure = instance.mode === 'recording'
      ? clamp(instance.exposure + (exposed
        ? definition.exposureRatePerSecond * delta * (context.isThrowing ? definition.throwingExposureMultiplier : 1)
        : -definition.exposureDecayPerSecond * delta), 0, definition.captureThreshold)
      : instance.exposure;
    stats = { ...stats, maximumExposureReached: Math.max(stats.maximumExposureReached, exposure) };
    const remaining = instance.remainingSeconds - delta;
    const shouldCapture = instance.mode === 'snapshot'
      ? remaining <= 0 && exposed
      : exposure >= definition.captureThreshold;
    if (shouldCapture && captureAvailable) {
      results.push(resultFor(instance, 'captured', context.isThrowing));
      captureAvailable = false;
      stats = capturedStats(stats, instance.mode, context.isThrowing, context.isClimax);
      cooldowns[instance.sourceNpcId] = definition.cooldownSeconds;
      continue;
    }
    if (remaining <= 0) {
      results.push(resultFor(instance, 'avoided', context.isThrowing));
      stats = instance.mode === 'snapshot'
        ? { ...stats, snapshotsAvoided: stats.snapshotsAvoided + 1 }
        : { ...stats, recordingWindowsSurvived: stats.recordingWindowsSurvived + 1 };
      cooldowns[instance.sourceNpcId] = definition.cooldownSeconds;
      continue;
    }
    instances.push({ ...instance, exposure, remainingSeconds: remaining });
  }

  const owned = new Set([...instances.map((item) => item.sourceNpcId), ...state.queuedSourceIds]);
  const queue = state.queuedSourceIds.filter((id) => sourceById.has(id) && !instances.some((item) => item.sourceNpcId === id));
  for (const source of [...context.sources].sort((a, b) => a.id - b.id)) {
    if (queue.length >= rules.queueLimit) break;
    if (!owned.has(source.id) && (cooldowns[source.id] ?? 0) <= 0) queue.push(source.id);
  }

  let nextId = state.nextId;
  let globalGap = Math.max(0, state.globalGapSeconds - delta);
  const telegraphLimit = rules.maxConcurrentTelegraphs;
  if (globalGap <= 0 && instances.filter((item) => item.state === 'telegraph').length < telegraphLimit) {
    const index = queue.findIndex((id) => {
      const source = sourceById.get(id);
      if (!source || exceedsModeLimit(instances, source.mode, rules)) return false;
      const definition = definitionFor(rules, source.mode);
      const targetZone = targetZoneFor(source, nextId, definition);
      return hasMinimumSurveillanceSafeSpace(context.movementBounds, [...instances.map((item) => item.targetZone), targetZone], rules.minimumSafeWidth);
    });
    if (index >= 0) {
      const source = sourceById.get(queue[index])!;
      queue.splice(index, 1);
      const definition = definitionFor(rules, source.mode);
      instances.push({
        id: `camera-${nextId}`, sourceNpcId: source.id, mode: source.mode, state: 'telegraph',
        targetZone: targetZoneFor(source, nextId, definition), exposure: 0,
        remainingSeconds: definition.telegraphDurationSeconds, totalSeconds: definition.telegraphDurationSeconds
      });
      nextId += 1;
      globalGap = rules.globalMinimumGapSeconds;
      stats = { ...stats, telegraphsStarted: stats.telegraphsStarted + 1 };
    }
  }

  const captured = results.find((result) => result.outcome === 'captured');
  const capturedDefinition = captured ? definitionFor(rules, captured.mode) : undefined;
  return {
    state: {
      instances, queuedSourceIds: queue, sourceCooldowns: cooldowns, nextId,
      globalGapSeconds: globalGap,
      throwLockSeconds: capturedDefinition?.throwLockSeconds ?? Math.max(0, state.throwLockSeconds - delta),
      invulnerabilitySeconds: capturedDefinition?.invulnerabilitySeconds ?? Math.max(0, state.invulnerabilitySeconds - delta),
      stats
    },
    results
  };
}

export function cancelSurveillanceForSource(state: SurveillanceState, sourceNpcId: number): SurveillanceState {
  return {
    ...state,
    instances: state.instances.filter((instance) => instance.sourceNpcId !== sourceNpcId),
    queuedSourceIds: state.queuedSourceIds.filter((id) => id !== sourceNpcId)
  };
}

export function isPlayerConcealed(x: number, mode: SurveillanceMode, zones: readonly ConcealmentZoneDefinition[]): boolean {
  return zones.some((zone) => zone.blocksModes.includes(mode) && x >= zone.x && x <= zone.x + zone.width);
}

export function hasMinimumSurveillanceSafeSpace(
  bounds: { readonly minX: number; readonly maxX: number },
  zones: readonly { readonly centerX: number; readonly halfWidth: number }[],
  minimumSafeWidth: number
): boolean {
  const intervals = zones
    .map((zone) => ({ start: Math.max(bounds.minX, zone.centerX - zone.halfWidth), end: Math.min(bounds.maxX, zone.centerX + zone.halfWidth) }))
    .filter((zone) => zone.end > zone.start)
    .sort((a, b) => a.start - b.start);
  let cursor = bounds.minX;
  for (const interval of intervals) {
    if (interval.start - cursor >= minimumSafeWidth) return true;
    cursor = Math.max(cursor, interval.end);
  }
  return bounds.maxX - cursor >= minimumSafeWidth;
}

function targetZoneFor(source: SurveillanceSource, sequence: number, definition: SurveillanceModeDefinition) {
  const index = definition.targetMode === 'fixed_zone' ? source.id % definition.authoredCenters.length : sequence % definition.authoredCenters.length;
  return { centerX: definition.authoredCenters[index], halfWidth: definition.targetHalfWidth };
}

function definitionFor(rules: SurveillanceDefinition, mode: SurveillanceMode): SurveillanceModeDefinition {
  return mode === 'snapshot' ? rules.snapshot : rules.recording;
}

function exceedsModeLimit(instances: readonly SurveillanceInstance[], mode: SurveillanceMode, rules: SurveillanceDefinition): boolean {
  const active = instances.filter((item) => item.mode === mode && item.state === 'active').length;
  return active >= (mode === 'snapshot' ? rules.maxConcurrentSnapshotWindows : rules.maxConcurrentRecordingWindows);
}

function isInsideZone(x: number, zone: SurveillanceInstance['targetZone']): boolean {
  return x >= zone.centerX - zone.halfWidth && x <= zone.centerX + zone.halfWidth;
}

function resultFor(instance: SurveillanceInstance, outcome: SurveillanceResult['outcome'], duringThrow: boolean): SurveillanceResult {
  return { instanceId: instance.id, sourceNpcId: instance.sourceNpcId, mode: instance.mode, outcome, duringThrow };
}

function capturedStats(stats: SurveillanceStats, mode: SurveillanceMode, duringThrow: boolean, climax: boolean): SurveillanceStats {
  return {
    ...stats,
    snapshotCaptures: stats.snapshotCaptures + (mode === 'snapshot' ? 1 : 0),
    recordingCaptures: stats.recordingCaptures + (mode === 'recording' ? 1 : 0),
    capturesDuringThrow: stats.capturesDuringThrow + (duringThrow ? 1 : 0),
    capturesDuringClimax: stats.capturesDuringClimax + (climax ? 1 : 0)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
