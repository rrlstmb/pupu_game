import type { CounterattackDefinition } from '../level/LevelDefinition';

export type CounterattackSource = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
};

export type CounterattackInstance = {
  readonly id: string;
  readonly sourceNpcId: number;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly state: 'telegraph' | 'flying';
  readonly lockedTargetX: number;
  readonly targetY: number;
  readonly remainingSeconds: number;
  readonly totalSeconds: number;
};

export type CounterattackResult = {
  readonly id: string;
  readonly sourceNpcId: number;
  readonly outcome: 'hit' | 'missed' | 'cancelled';
};

type SourceProgress = {
  readonly anger: number;
  readonly retaliationCount: number;
  readonly cooldownSeconds: number;
};

export type CounterattackStats = {
  readonly telegraphed: number;
  readonly fired: number;
  readonly dodged: number;
  readonly hitPlayer: number;
  readonly cancelled: number;
  readonly maxConcurrentObserved: number;
  readonly recycled: number;
};

export type CounterattackState = {
  readonly instances: readonly CounterattackInstance[];
  readonly queue: readonly number[];
  readonly sourceProgress: Readonly<Record<number, SourceProgress>>;
  readonly processedHitEventIds: readonly string[];
  readonly nextId: number;
  readonly globalGapSeconds: number;
  readonly staggerSeconds: number;
  readonly throwLockSeconds: number;
  readonly invulnerabilitySeconds: number;
  readonly stats: CounterattackStats;
};

export type CounterattackUpdate = {
  readonly state: CounterattackState;
  readonly results: readonly CounterattackResult[];
};

export function createCounterattackState(): CounterattackState {
  return {
    instances: [], queue: [], sourceProgress: {}, processedHitEventIds: [], nextId: 1,
    globalGapSeconds: 0, staggerSeconds: 0, throwLockSeconds: 0, invulnerabilitySeconds: 0,
    stats: { telegraphed: 0, fired: 0, dodged: 0, hitPlayer: 0, cancelled: 0, maxConcurrentObserved: 0, recycled: 0 }
  };
}

export function registerAngryHit(
  state: CounterattackState,
  eventId: string,
  sourceNpcId: number,
  rules: CounterattackDefinition
): CounterattackState {
  if (state.processedHitEventIds.includes(eventId)) return state;
  const current = state.sourceProgress[sourceNpcId] ?? { anger: 0, retaliationCount: 0, cooldownSeconds: 0 };
  const anger = current.anger + 1;
  const alreadyPending = state.queue.includes(sourceNpcId) || state.instances.some((instance) => instance.sourceNpcId === sourceNpcId);
  const canQueue = anger >= rules.hitThreshold && current.cooldownSeconds <= 0 &&
    current.retaliationCount < rules.maxRetaliationsPerNpc && !alreadyPending && state.queue.length < rules.queueLimit;
  return {
    ...state,
    processedHitEventIds: [...state.processedHitEventIds, eventId],
    queue: canQueue ? [...state.queue, sourceNpcId] : state.queue,
    sourceProgress: {
      ...state.sourceProgress,
      [sourceNpcId]: { ...current, anger: canQueue ? 0 : anger }
    }
  };
}

export function updateCounterattacks(
  state: CounterattackState,
  context: {
    readonly deltaSeconds: number;
    readonly playerX: number;
    readonly targetY: number;
    readonly movementBounds: { readonly minX: number; readonly maxX: number };
    readonly sources: readonly CounterattackSource[];
  },
  rules: CounterattackDefinition
): CounterattackUpdate {
  const delta = Math.max(0, context.deltaSeconds);
  const sourceIds = new Set(context.sources.map((source) => source.id));
  const results: CounterattackResult[] = [];
  let stats = state.stats;
  let invulnerabilitySeconds = Math.max(0, state.invulnerabilitySeconds - delta);
  let staggerSeconds = Math.max(0, state.staggerSeconds - delta);
  let throwLockSeconds = Math.max(0, state.throwLockSeconds - delta);
  let sourceProgress = Object.fromEntries(Object.entries(state.sourceProgress).map(([id, progress]) => [id, {
    ...progress, cooldownSeconds: Math.max(0, progress.cooldownSeconds - delta)
  }])) as Readonly<Record<number, SourceProgress>>;

  const instances: CounterattackInstance[] = [];
  for (const instance of state.instances) {
    if (instance.state === 'telegraph' && !sourceIds.has(instance.sourceNpcId)) {
      results.push({ id: instance.id, sourceNpcId: instance.sourceNpcId, outcome: 'cancelled' });
      stats = { ...stats, cancelled: stats.cancelled + 1, recycled: stats.recycled + 1 };
      continue;
    }
    const remainingSeconds = Math.max(0, instance.remainingSeconds - delta);
    if (remainingSeconds > 0) {
      instances.push({ ...instance, remainingSeconds });
      continue;
    }
    if (instance.state === 'telegraph') {
      const flyingCount = instances.filter((candidate) => candidate.state === 'flying').length;
      if (flyingCount >= rules.maxConcurrentProjectiles) {
        instances.push({ ...instance, remainingSeconds: 0 });
      } else {
        instances.push({ ...instance, state: 'flying', remainingSeconds: rules.projectileTravelDurationSeconds, totalSeconds: rules.projectileTravelDurationSeconds });
        stats = { ...stats, fired: stats.fired + 1 };
      }
      continue;
    }
    const hit = invulnerabilitySeconds <= 0 && Math.abs(context.playerX - instance.lockedTargetX) <= rules.targetHalfWidth + rules.playerHitboxPadding;
    results.push({ id: instance.id, sourceNpcId: instance.sourceNpcId, outcome: hit ? 'hit' : 'missed' });
    stats = {
      ...stats,
      hitPlayer: stats.hitPlayer + (hit ? 1 : 0),
      dodged: stats.dodged + (hit ? 0 : 1),
      recycled: stats.recycled + 1
    };
    if (hit) {
      invulnerabilitySeconds = rules.invulnerabilitySeconds;
      staggerSeconds = rules.staggerDurationSeconds;
      throwLockSeconds = rules.throwLockSeconds;
    }
    const progress = sourceProgress[instance.sourceNpcId];
    if (progress) sourceProgress = { ...sourceProgress, [instance.sourceNpcId]: { ...progress, retaliationCount: progress.retaliationCount + 1, cooldownSeconds: rules.perNpcCooldownSeconds } };
  }

  let queue = state.queue.filter((id) => sourceIds.has(id));
  let nextId = state.nextId;
  let globalGapSeconds = Math.max(0, state.globalGapSeconds - delta);
  const telegraphCount = instances.filter((instance) => instance.state === 'telegraph').length;
  if (queue.length > 0 && globalGapSeconds <= 0 && telegraphCount < rules.maxConcurrentTelegraphs) {
    const sourceId = [...queue].sort((left, right) => left - right)[0];
    const source = context.sources.find((candidate) => candidate.id === sourceId);
    const dangerZones = instances.filter((instance) => instance.state === 'telegraph').map((instance) => ({
      left: instance.lockedTargetX - rules.targetHalfWidth,
      right: instance.lockedTargetX + rules.targetHalfWidth
    }));
    const candidate = { left: context.playerX - rules.targetHalfWidth, right: context.playerX + rules.targetHalfWidth };
    if (source && hasMinimumEscapeSpace(context.movementBounds, [...dangerZones, candidate], rules.minimumEscapeWidth)) {
      instances.push({
        id: `counter:${nextId}`, sourceNpcId: source.id, sourceX: source.x, sourceY: source.y,
        state: 'telegraph', lockedTargetX: context.playerX, targetY: context.targetY,
        remainingSeconds: rules.telegraphDurationSeconds, totalSeconds: rules.telegraphDurationSeconds
      });
      queue = queue.filter((id) => id !== sourceId);
      nextId += 1;
      globalGapSeconds = rules.globalMinimumGapSeconds;
      stats = { ...stats, telegraphed: stats.telegraphed + 1 };
    }
  }

  stats = { ...stats, maxConcurrentObserved: Math.max(stats.maxConcurrentObserved, instances.length) };
  return {
    state: { ...state, instances, queue, sourceProgress, nextId, globalGapSeconds, staggerSeconds, throwLockSeconds, invulnerabilitySeconds, stats },
    results
  };
}

export function hasMinimumEscapeSpace(
  bounds: { readonly minX: number; readonly maxX: number },
  dangerZones: readonly { readonly left: number; readonly right: number }[],
  minimumEscapeWidth: number
): boolean {
  const clipped = dangerZones
    .map((zone) => ({ left: Math.max(bounds.minX, zone.left), right: Math.min(bounds.maxX, zone.right) }))
    .filter((zone) => zone.right > zone.left)
    .sort((left, right) => left.left - right.left || left.right - right.right);
  let cursor = bounds.minX;
  for (const zone of clipped) {
    if (zone.left - cursor >= minimumEscapeWidth) return true;
    cursor = Math.max(cursor, zone.right);
  }
  return bounds.maxX - cursor >= minimumEscapeWidth;
}
