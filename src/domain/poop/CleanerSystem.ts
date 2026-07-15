import type { CleanerRules, CleanupEventDefinition } from '../level/LevelDefinition';
import type { NPCInstanceState } from '../npc/NPCModel';
import type { EnvironmentalEffectZone } from './PoopModel';

export type CleanerLock = {
  readonly cleanerId: number;
  readonly zoneId: string;
  readonly phase: 'warning' | 'cleaning';
  readonly remainingSeconds: number;
};

export type CleanupTruckState = {
  readonly eventId: string;
  readonly phase: 'warning' | 'delay' | 'complete';
  readonly remainingSeconds: number;
};

export type CleanerSystemState = {
  readonly locks: readonly CleanerLock[];
  readonly truck?: CleanupTruckState;
  readonly clearedZoneIds: readonly string[];
};

export type CleanerSystemUpdate = {
  readonly state: CleanerSystemState;
  readonly zoneIdsBeingCleaned: readonly string[];
  readonly zoneIdsToClear: readonly string[];
  readonly cleaningNpcIds: readonly number[];
};

export function createCleanerSystemState(): CleanerSystemState {
  return { locks: [], clearedZoneIds: [] };
}

export function startCleanupTruck(
  state: CleanerSystemState,
  eventId: string,
  definition: CleanupEventDefinition
): CleanerSystemState {
  if (state.truck || state.clearedZoneIds.includes(`truck:${eventId}`)) return state;
  return { ...state, truck: { eventId, phase: 'warning', remainingSeconds: definition.warningSeconds } };
}

export function updateCleanerSystem(
  state: CleanerSystemState,
  cleaners: readonly NPCInstanceState[],
  zones: readonly EnvironmentalEffectZone[],
  rules: CleanerRules,
  deltaSeconds: number,
  truckDefinition?: CleanupEventDefinition
): CleanerSystemUpdate {
  const delta = Math.max(0, deltaSeconds);
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  const clearIds: string[] = [];
  let locks = state.locks
    .filter((lock) => zoneById.has(lock.zoneId) && cleaners.some((cleaner) => cleaner.id === lock.cleanerId))
    .map((lock): CleanerLock => {
      const remainingSeconds = Math.max(0, lock.remainingSeconds - delta);
      if (remainingSeconds > 0) return { ...lock, remainingSeconds };
      if (lock.phase === 'warning') {
        return { ...lock, phase: 'cleaning', remainingSeconds: rules.cleaningDurationSeconds };
      }
      clearIds.push(lock.zoneId);
      return { ...lock, remainingSeconds: 0 };
    })
    .filter((lock) => lock.remainingSeconds > 0);

  const lockedZones = new Set(locks.map((lock) => lock.zoneId));
  const lockedCleaners = new Set(locks.map((lock) => lock.cleanerId));
  for (const cleaner of [...cleaners].sort((left, right) => left.id - right.id)) {
    if (locks.length >= rules.maxConcurrentLocks || lockedCleaners.has(cleaner.id)) continue;
    const target = zones
      .filter((zone) => zone.state === 'active' && !lockedZones.has(zone.id) && distance(cleaner, zone) <= rules.detectionRadius)
      .sort((left, right) => distance(cleaner, left) - distance(cleaner, right) || left.createdOrder - right.createdOrder || left.id.localeCompare(right.id))[0];
    if (!target) continue;
    locks = [...locks, { cleanerId: cleaner.id, zoneId: target.id, phase: 'warning', remainingSeconds: rules.warningSeconds }];
    lockedZones.add(target.id);
    lockedCleaners.add(cleaner.id);
  }

  let truck = state.truck;
  if (truck && truck.phase !== 'complete' && truckDefinition) {
    const remainingSeconds = Math.max(0, truck.remainingSeconds - delta);
    if (remainingSeconds > 0) truck = { ...truck, remainingSeconds };
    else if (truck.phase === 'warning') truck = { ...truck, phase: 'delay', remainingSeconds: truckDefinition.clearDelaySeconds };
    else {
      clearIds.push(...[...zones].sort((left, right) => left.createdOrder - right.createdOrder || left.id.localeCompare(right.id)).map((zone) => zone.id));
      truck = { ...truck, phase: 'complete', remainingSeconds: 0 };
    }
  }

  const uniqueClearIds = [...new Set(clearIds)];
  locks = locks.filter((lock) => !uniqueClearIds.includes(lock.zoneId));
  const completedTruckToken = truck?.phase === 'complete' ? `truck:${truck.eventId}` : undefined;
  const clearedZoneIds = [...new Set([...state.clearedZoneIds, ...uniqueClearIds, ...(completedTruckToken ? [completedTruckToken] : [])])];
  return {
    state: { locks, truck, clearedZoneIds },
    zoneIdsBeingCleaned: locks.map((lock) => lock.zoneId),
    zoneIdsToClear: uniqueClearIds,
    cleaningNpcIds: locks.map((lock) => lock.cleanerId)
  };
}

function distance(cleaner: NPCInstanceState, zone: EnvironmentalEffectZone): number {
  return Math.hypot(cleaner.x - zone.x, cleaner.y - zone.y);
}
