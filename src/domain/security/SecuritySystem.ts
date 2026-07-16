import type { BlockadeDefinition, SecurityCoverDefinition, SecurityDefinition } from '../level/LevelDefinition';

export type HorizontalInterval = { readonly start: number; readonly end: number };
export type SecuritySourceType = 'guard' | 'searchlight';
export type SecuritySource = { readonly id: number; readonly x: number };
export type ObservationInstance = {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: SecuritySourceType;
  readonly state: 'warning' | 'observing';
  readonly zone: { readonly centerX: number; readonly halfWidth: number };
  readonly detectionProgress: number;
  readonly remainingSeconds: number;
  readonly totalSeconds: number;
  readonly detected: boolean;
};
export type BlockadeState = {
  readonly phase: 'inactive' | 'warning' | 'active';
  readonly remainingSeconds: number;
  readonly blockedIntervals: readonly HorizontalInterval[];
};
export type SecurityStats = {
  readonly guardObservationsStarted: number;
  readonly guardObservationsAvoided: number;
  readonly searchlightWindowsSurvived: number;
  readonly securityDetections: number;
  readonly detectionsWhileExposed: number;
  readonly throwsWhileConcealed: number;
  readonly maximumDetectionProgress: number;
  readonly blockadeTriggered: number;
};
export type SecurityState = {
  readonly clockSeconds: number;
  readonly instances: readonly ObservationInstance[];
  readonly queuedGuardIds: readonly number[];
  readonly guardCooldowns: Readonly<Record<number, number>>;
  readonly nextId: number;
  readonly globalGapSeconds: number;
  readonly throwExposureSeconds: number;
  readonly throwExposureToken: number;
  readonly throwLockSeconds: number;
  readonly invulnerabilitySeconds: number;
  readonly blockade: BlockadeState;
  readonly stats: SecurityStats;
};
export type SecurityResult = {
  readonly instanceId: string;
  readonly sourceType: SecuritySourceType;
  readonly outcome: 'detected' | 'avoided' | 'cancelled';
  readonly whileExposed: boolean;
};
export type SecurityContext = {
  readonly deltaSeconds: number;
  readonly playerX: number;
  readonly isCharging: boolean;
  readonly movementBounds: { readonly minX: number; readonly maxX: number };
  readonly guards: readonly SecuritySource[];
  readonly activateBlockade: boolean;
  readonly detectionRateMultiplier: number;
};

const EMPTY_STATS: SecurityStats = {
  guardObservationsStarted: 0, guardObservationsAvoided: 0, searchlightWindowsSurvived: 0,
  securityDetections: 0, detectionsWhileExposed: 0, throwsWhileConcealed: 0,
  maximumDetectionProgress: 0, blockadeTriggered: 0
};

export function createSecurityState(): SecurityState {
  return {
    clockSeconds: 0, instances: [], queuedGuardIds: [], guardCooldowns: {}, nextId: 1,
    globalGapSeconds: 0, throwExposureSeconds: 0, throwExposureToken: 0,
    throwLockSeconds: 0, invulnerabilitySeconds: 0,
    blockade: { phase: 'inactive', remainingSeconds: 0, blockedIntervals: [] }, stats: EMPTY_STATS
  };
}

export function registerThrowExposure(state: SecurityState, playerX: number, rules: SecurityDefinition): SecurityState {
  const concealed = isPlayerOccludedFromSource(playerX, 'guard', rules.covers, false, state.blockade.phase === 'active');
  return {
    ...state,
    throwExposureSeconds: rules.exposeOnThrow ? rules.throwExposureSeconds : state.throwExposureSeconds,
    throwExposureToken: state.throwExposureToken + 1,
    stats: { ...state.stats, throwsWhileConcealed: state.stats.throwsWhileConcealed + (concealed ? 1 : 0) }
  };
}

export function cancelSecurityForGuard(state: SecurityState, guardId: number): SecurityState {
  return {
    ...state,
    instances: state.instances.filter((instance) => instance.sourceId !== `guard:${guardId}`),
    queuedGuardIds: state.queuedGuardIds.filter((id) => id !== guardId)
  };
}

export function updateSecurity(
  state: SecurityState,
  context: SecurityContext,
  rules: SecurityDefinition,
  blockadeRules?: BlockadeDefinition
): { readonly state: SecurityState; readonly results: readonly SecurityResult[] } {
  const delta = Math.max(0, context.deltaSeconds);
  if (delta === 0) return { state, results: [] };
  const clockSeconds = state.clockSeconds + delta;
  const blockade = updateBlockade(state.blockade, context.activateBlockade, delta, blockadeRules);
  const throwExposureSeconds = Math.max(0, state.throwExposureSeconds - delta);
  let captureAvailable = state.invulnerabilitySeconds <= 0;
  let stats = state.stats;
  if (blockade.phase === 'active' && state.blockade.phase !== 'active') stats = { ...stats, blockadeTriggered: stats.blockadeTriggered + 1 };
  const results: SecurityResult[] = [];
  const guardsById = new Map(context.guards.map((source) => [source.id, source]));
  const cooldowns: Record<number, number> = {};
  for (const [id, value] of Object.entries(state.guardCooldowns)) {
    if (guardsById.has(Number(id))) cooldowns[Number(id)] = Math.max(0, value - delta);
  }

  const instances: ObservationInstance[] = [];
  for (const instance of state.instances) {
    if (instance.sourceType === 'guard' && !guardsById.has(Number(instance.sourceId.split(':')[1]))) {
      results.push({ instanceId: instance.id, sourceType: 'guard', outcome: 'cancelled', whileExposed: throwExposureSeconds > 0 });
      continue;
    }
    const remaining = instance.remainingSeconds - delta;
    if (instance.state === 'warning') {
      if (remaining > 0) {
        instances.push({ ...instance, remainingSeconds: remaining });
      } else {
        const duration = instance.sourceType === 'guard'
          ? rules.guardObservationSeconds
          : rules.searchlights.find((light) => `searchlight:${light.id}` === instance.sourceId)!.sweepDurationSeconds;
        instances.push({ ...instance, state: 'observing', remainingSeconds: duration, totalSeconds: duration, detectionProgress: 0 });
      }
      continue;
    }

    const sourceMultiplier = instance.sourceType === 'guard'
      ? 1
      : rules.searchlights.find((light) => `searchlight:${light.id}` === instance.sourceId)!.detectionMultiplier;
    const movingZone = instance.sourceType === 'searchlight'
      ? searchlightZone(instance.sourceId, clockSeconds, rules)
      : instance.zone;
    const exposed = throwExposureSeconds > 0 || (context.isCharging && rules.exposeOnCharge);
    const covered = isPlayerOccludedFromSource(context.playerX, instance.sourceType, rules.covers, exposed, blockade.phase === 'active');
    const visible = inside(context.playerX, movingZone) && !covered;
    const multiplier = sourceMultiplier * context.detectionRateMultiplier *
      (context.isCharging ? rules.chargeExposureMultiplier : 1) * (exposed ? rules.exposedDetectionMultiplier : 1);
    const detectionProgress = clamp(instance.detectionProgress + (visible
      ? rules.detectionRatePerSecond * multiplier * delta
      : -rules.detectionDecayPerSecond * delta), 0, rules.detectionThreshold);
    stats = { ...stats, maximumDetectionProgress: Math.max(stats.maximumDetectionProgress, detectionProgress) };
    if (detectionProgress >= rules.detectionThreshold && captureAvailable && !instance.detected) {
      captureAvailable = false;
      results.push({ instanceId: instance.id, sourceType: instance.sourceType, outcome: 'detected', whileExposed: exposed });
      stats = {
        ...stats,
        securityDetections: stats.securityDetections + 1,
        detectionsWhileExposed: stats.detectionsWhileExposed + (exposed ? 1 : 0)
      };
      if (instance.sourceType === 'guard') cooldowns[Number(instance.sourceId.split(':')[1])] = rules.guardCooldownSeconds;
      continue;
    }
    if (remaining <= 0) {
      results.push({ instanceId: instance.id, sourceType: instance.sourceType, outcome: 'avoided', whileExposed: exposed });
      stats = instance.sourceType === 'guard'
        ? { ...stats, guardObservationsAvoided: stats.guardObservationsAvoided + 1 }
        : { ...stats, searchlightWindowsSurvived: stats.searchlightWindowsSurvived + 1 };
      if (instance.sourceType === 'guard') cooldowns[Number(instance.sourceId.split(':')[1])] = rules.guardCooldownSeconds;
      else instances.push(createSearchlightInstance(instance.sourceId.replace('searchlight:', ''), rules));
      continue;
    }
    instances.push({ ...instance, zone: movingZone, detectionProgress, remainingSeconds: remaining });
  }

  for (const light of rules.searchlights.slice(0, rules.maxConcurrentSearchlights)) {
    if (!instances.some((instance) => instance.sourceId === `searchlight:${light.id}`)) {
      instances.push(createSearchlightInstance(light.id, rules));
    }
  }

  const ownedGuardIds = new Set(instances.filter((instance) => instance.sourceType === 'guard').map((instance) => Number(instance.sourceId.split(':')[1])));
  const queue = state.queuedGuardIds.filter((id) => guardsById.has(id) && !ownedGuardIds.has(id));
  for (const guard of [...context.guards].sort((a, b) => a.id - b.id)) {
    if (queue.length >= rules.queueLimit) break;
    if (!ownedGuardIds.has(guard.id) && !queue.includes(guard.id) && (cooldowns[guard.id] ?? 0) <= 0) queue.push(guard.id);
  }
  let nextId = state.nextId;
  let gap = Math.max(0, state.globalGapSeconds - delta);
  if (gap <= 0 && instances.filter((instance) => instance.sourceType === 'guard').length < rules.maxConcurrentGuardViews && queue.length > 0) {
    const guardId = queue.shift()!;
    const centerX = rules.guardPatrolPoints[(guardId + nextId) % rules.guardPatrolPoints.length];
    const candidate = { centerX, halfWidth: rules.guardViewHalfWidth };
    if (hasValidSecurityRoute(context.movementBounds, blockade.blockedIntervals, [...instances.map((item) => item.zone), candidate], rules.covers, rules.minimumSafeWidth)) {
      instances.push({
        id: `guard-view-${nextId}`, sourceId: `guard:${guardId}`, sourceType: 'guard', state: 'warning', zone: candidate,
        detectionProgress: 0, remainingSeconds: rules.guardWarningSeconds, totalSeconds: rules.guardWarningSeconds, detected: false
      });
      nextId += 1;
      gap = rules.globalSecurityGapSeconds;
      stats = { ...stats, guardObservationsStarted: stats.guardObservationsStarted + 1 };
    }
  }

  const detected = results.some((result) => result.outcome === 'detected');
  return {
    state: {
      clockSeconds, instances, queuedGuardIds: queue, guardCooldowns: cooldowns, nextId,
      globalGapSeconds: gap, throwExposureSeconds, throwExposureToken: state.throwExposureToken,
      throwLockSeconds: detected ? rules.spottedThrowLockSeconds : Math.max(0, state.throwLockSeconds - delta),
      invulnerabilitySeconds: detected ? rules.spottedInvulnerabilitySeconds : Math.max(0, state.invulnerabilitySeconds - delta),
      blockade, stats
    },
    results
  };
}

export function isPlayerOccludedFromSource(
  playerX: number,
  sourceType: SecuritySourceType,
  covers: readonly SecurityCoverDefinition[],
  exposed: boolean,
  blockadeActive: boolean
): boolean {
  if (exposed) return false;
  return covers.some((cover) => (!blockadeActive || !cover.disabledDuringBlockade) &&
    cover.blocksSources.includes(sourceType) && playerX >= cover.x - cover.concealmentPadding &&
    playerX <= cover.x + cover.width + cover.concealmentPadding);
}

export function getReachableHorizontalIntervals(
  bounds: { readonly minX: number; readonly maxX: number },
  blocked: readonly HorizontalInterval[]
): readonly HorizontalInterval[] {
  let intervals: HorizontalInterval[] = [{ start: bounds.minX, end: bounds.maxX }];
  for (const block of [...blocked].sort((a, b) => a.start - b.start)) {
    intervals = intervals.flatMap((interval) => {
      if (block.end <= interval.start || block.start >= interval.end) return [interval];
      return [
        { start: interval.start, end: Math.max(interval.start, block.start - 1) },
        { start: Math.min(interval.end, block.end + 1), end: interval.end }
      ].filter((candidate) => candidate.end > candidate.start);
    });
  }
  return intervals;
}

export function relocatePlayerFromBlockade(playerX: number, reachable: readonly HorizontalInterval[]): number {
  if (reachable.some((interval) => playerX >= interval.start && playerX <= interval.end)) return playerX;
  return reachable.flatMap((interval) => [interval.start, interval.end])
    .sort((left, right) => Math.abs(left - playerX) - Math.abs(right - playerX) || left - right)[0];
}

export function hasValidSecurityRoute(
  bounds: { readonly minX: number; readonly maxX: number },
  blocked: readonly HorizontalInterval[],
  observationZones: readonly { readonly centerX: number; readonly halfWidth: number }[],
  covers: readonly SecurityCoverDefinition[],
  minimumSafeWidth: number
): boolean {
  const reachable = getReachableHorizontalIntervals(bounds, blocked);
  if (!reachable.some((interval) => interval.end - interval.start >= minimumSafeWidth)) return false;
  const safe = getReachableHorizontalIntervals(bounds, [
    ...blocked,
    ...observationZones.map((zone) => ({ start: zone.centerX - zone.halfWidth, end: zone.centerX + zone.halfWidth }))
  ]);
  return safe.some((interval) => interval.end - interval.start >= minimumSafeWidth) ||
    covers.some((cover) => reachable.some((interval) => cover.x >= interval.start && cover.x + cover.width <= interval.end));
}

function updateBlockade(state: BlockadeState, activate: boolean, delta: number, rules?: BlockadeDefinition): BlockadeState {
  if (!rules || !activate) return state;
  if (state.phase === 'inactive') return { phase: 'warning', remainingSeconds: rules.warningDurationSeconds, blockedIntervals: [] };
  if (state.phase === 'warning') {
    const remainingSeconds = Math.max(0, state.remainingSeconds - delta);
    return remainingSeconds > 0 ? { ...state, remainingSeconds } : { phase: 'active', remainingSeconds: 0, blockedIntervals: rules.blockedIntervals };
  }
  return state;
}

function createSearchlightInstance(id: string, rules: SecurityDefinition): ObservationInstance {
  const light = rules.searchlights.find((candidate) => candidate.id === id)!;
  return {
    id: `searchlight-view:${id}`, sourceId: `searchlight:${id}`, sourceType: 'searchlight', state: 'warning',
    zone: { centerX: light.minX, halfWidth: light.beamHalfWidth }, detectionProgress: 0,
    remainingSeconds: light.warningDurationSeconds + light.phaseOffset * 0.35,
    totalSeconds: light.warningDurationSeconds + light.phaseOffset * 0.35, detected: false
  };
}

function searchlightZone(sourceId: string, clock: number, rules: SecurityDefinition) {
  const light = rules.searchlights.find((candidate) => `searchlight:${candidate.id}` === sourceId)!;
  const cycle = ((clock / light.sweepDurationSeconds) + light.phaseOffset) % 2;
  const progress = cycle <= 1 ? cycle : 2 - cycle;
  return { centerX: light.minX + (light.maxX - light.minX) * progress, halfWidth: light.beamHalfWidth };
}

function inside(x: number, zone: ObservationInstance['zone']): boolean {
  return x >= zone.centerX - zone.halfWidth && x <= zone.centerX + zone.halfWidth;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
