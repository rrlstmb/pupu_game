import type { NPCInstanceState } from '../npc/NPCModel';
import type { AreaEffectZoneRules, EnvironmentalEffectStats, EnvironmentalEffectZone, NpcAreaEffectResistance, PoopDefinition, PoopEffectInstance } from './PoopModel';

export const ENVIRONMENTAL_EFFECT_LIMITS = {
  maxActiveZones: 6,
  maxZoneEffectsPerTick: 16
} as const;

export type EnvironmentalEffectState = {
  readonly zones: readonly EnvironmentalEffectZone[];
  readonly stats: EnvironmentalEffectStats;
  readonly nextId: number;
};

export function createEnvironmentalEffectState(): EnvironmentalEffectState {
  return {
    zones: [],
    stats: { createdCount: 0, recycledCount: 0, activeCount: 0, affectedNpcCount: 0, maxAffectedBySingleZone: 0, naturallyExpiredCount: 0, clearedCount: 0 },
    nextId: 1
  };
}

export function createStinkZone(
  state: EnvironmentalEffectState,
  definition: PoopDefinition,
  position: { readonly x: number; readonly y: number },
  rules?: AreaEffectZoneRules,
  sourceProjectileId?: number
): EnvironmentalEffectState {
  if (definition.capability.kind !== 'stink') {
    return state;
  }

  const maxActiveZones = rules?.maxActiveZones ?? ENVIRONMENTAL_EFFECT_LIMITS.maxActiveZones;
  if (state.zones.length >= maxActiveZones && (rules?.stackingRule ?? 'reject') === 'reject') return state;
  const retainedZones = state.zones.length >= maxActiveZones
    ? state.zones.slice(Math.max(1, state.zones.length - maxActiveZones + 1))
    : state.zones;
  const replaced = state.zones.length - retainedZones.length;

  const zone: EnvironmentalEffectZone = {
    id: `zone:${state.nextId}`,
    sourceProjectileId,
    poopType: definition.id,
    x: position.x,
    y: position.y,
    radius: rules?.radius ?? definition.capability.stinkRadius ?? 0,
    remainingSeconds: rules?.durationSeconds ?? definition.capability.stinkDurationSeconds ?? 0,
    slowMultiplier: rules?.effectStrength ?? definition.capability.stinkSlowMultiplier ?? 1,
    alertPerSecond: definition.capability.stinkAlertPerSecond ?? 0,
    createdOrder: state.nextId,
    affectedNpcIds: [],
    state: 'active'
  };

  return {
    zones: [...retainedZones, zone],
    nextId: state.nextId + 1,
    stats: {
      createdCount: state.stats.createdCount + 1,
      recycledCount: state.stats.recycledCount + replaced,
      activeCount: retainedZones.length + 1,
      affectedNpcCount: state.stats.affectedNpcCount ?? 0,
      maxAffectedBySingleZone: state.stats.maxAffectedBySingleZone ?? 0,
      naturallyExpiredCount: state.stats.naturallyExpiredCount ?? 0,
      clearedCount: (state.stats.clearedCount ?? 0) + replaced
    }
  };
}

export function updateEnvironmentalEffects(
  state: EnvironmentalEffectState,
  deltaSeconds: number
): EnvironmentalEffectState {
  const safeDelta = Math.max(0, deltaSeconds);
  const zones = state.zones
    .map((zone) => ({ ...zone, remainingSeconds: Math.max(0, zone.remainingSeconds - safeDelta) }))
    .filter((zone) => zone.remainingSeconds > 0);
  const recycled = state.zones.length - zones.length;

  return {
    ...state,
    zones,
    stats: {
      createdCount: state.stats.createdCount,
      recycledCount: state.stats.recycledCount + recycled,
      activeCount: zones.length,
      affectedNpcCount: state.stats.affectedNpcCount ?? 0,
      maxAffectedBySingleZone: state.stats.maxAffectedBySingleZone ?? 0,
      naturallyExpiredCount: (state.stats.naturallyExpiredCount ?? 0) + recycled,
      clearedCount: state.stats.clearedCount ?? 0
    }
  };
}

export function applyAreaEffectsToNPCs(
  state: EnvironmentalEffectState,
  npcs: readonly NPCInstanceState[],
  resistances: readonly NpcAreaEffectResistance[] = []
): { readonly state: EnvironmentalEffectState; readonly npcs: readonly NPCInstanceState[]; readonly newlyAffected: readonly { zoneId: string; npcId: number }[] } {
  const newlyAffected: { zoneId: string; npcId: number }[] = [];
  const zones = state.zones.map((zone) => ({ ...zone, affectedNpcIds: [...zone.affectedNpcIds] }));
  let appliedCount = 0;
  const affectedNpcs = npcs.map((npc) => {
    if (npc.state === 'Recovering' || npc.state === 'Exiting') return removeZoneEffects(npc);
    const applicable = zones
      .filter((zone) => distance(npc.x, npc.y, zone.x, zone.y) <= zone.radius)
      .sort((left, right) => left.slowMultiplier - right.slowMultiplier || left.createdOrder - right.createdOrder)[0];
    if (!applicable || appliedCount >= ENVIRONMENTAL_EFFECT_LIMITS.maxZoneEffectsPerTick) return removeZoneEffects(npc);
    appliedCount += 1;
    if (!applicable.affectedNpcIds.includes(npc.id)) {
      applicable.affectedNpcIds.push(npc.id);
      newlyAffected.push({ zoneId: applicable.id, npcId: npc.id });
    }
    const resistance = resistances.find((entry) => entry.npcType === npc.definitionId);
    const resistedMultiplier = Math.min(1, Math.max(
      resistance?.minimumSlowMultiplier ?? 0,
      applicable.slowMultiplier + (1 - applicable.slowMultiplier) * (resistance?.stinkResistance ?? 0)
    ));
    const effect: PoopEffectInstance = {
      id: `stink-zone:${applicable.id}:${npc.id}`, poopType: applicable.poopType, targetNpcId: npc.id,
      remainingSeconds: Math.min(0.25, applicable.remainingSeconds), slowMultiplier: resistedMultiplier
    };
    return { ...npc, activeEffects: [...npc.activeEffects.filter((candidate) => !candidate.id.startsWith('stink-zone:')), effect] };
  });
  const affectedNpcCount = (state.stats.affectedNpcCount ?? 0) + newlyAffected.length;
  const maxAffectedBySingleZone = Math.max(state.stats.maxAffectedBySingleZone ?? 0, ...zones.map((zone) => zone.affectedNpcIds.length));
  return { state: { ...state, zones, stats: { ...state.stats, affectedNpcCount, maxAffectedBySingleZone } }, npcs: affectedNpcs, newlyAffected };
}

export function applyEnvironmentalEffectsToNPCs(
  npcs: readonly NPCInstanceState[],
  zones: readonly EnvironmentalEffectZone[]
): readonly NPCInstanceState[] {
  return applyAreaEffectsToNPCs({ zones, stats: { createdCount: zones.length, recycledCount: 0, activeCount: zones.length }, nextId: zones.length + 1 }, npcs).npcs;
}

export function alertIncreaseFromZones(zones: readonly EnvironmentalEffectZone[], deltaSeconds: number): number {
  return zones.reduce((total, zone) => total + zone.alertPerSecond * Math.max(0, deltaSeconds), 0);
}

export function clearEnvironmentalEffectsNearNPCs(
  state: EnvironmentalEffectState,
  cleaners: readonly { readonly x: number; readonly y: number; readonly radius: number }[]
): EnvironmentalEffectState {
  const zones = state.zones.filter(
    (zone) => !cleaners.some((cleaner) => distance(cleaner.x, cleaner.y, zone.x, zone.y) <= cleaner.radius)
  );
  const recycled = state.zones.length - zones.length;

  return {
    ...state,
    zones,
    stats: {
      createdCount: state.stats.createdCount,
      recycledCount: state.stats.recycledCount + recycled,
      activeCount: zones.length,
      affectedNpcCount: state.stats.affectedNpcCount ?? 0,
      maxAffectedBySingleZone: state.stats.maxAffectedBySingleZone ?? 0,
      naturallyExpiredCount: state.stats.naturallyExpiredCount ?? 0,
      clearedCount: (state.stats.clearedCount ?? 0) + recycled
    }
  };
}

export function clearEnvironmentalEffectsByIds(state: EnvironmentalEffectState, zoneIds: readonly string[]): EnvironmentalEffectState {
  const ids = new Set(zoneIds);
  const zones = state.zones.filter((zone) => !ids.has(zone.id));
  const cleared = state.zones.length - zones.length;
  return { ...state, zones, stats: { ...state.stats, activeCount: zones.length, recycledCount: state.stats.recycledCount + cleared, clearedCount: (state.stats.clearedCount ?? 0) + cleared } };
}

export function markZonesBeingCleaned(state: EnvironmentalEffectState, zoneIds: readonly string[]): EnvironmentalEffectState {
  const ids = new Set(zoneIds);
  return { ...state, zones: state.zones.map((zone) => ids.has(zone.id) ? { ...zone, state: 'being_cleaned' as const } : zone) };
}

function removeZoneEffects(npc: NPCInstanceState): NPCInstanceState {
  return { ...npc, activeEffects: npc.activeEffects.filter((effect) => !effect.id.startsWith('stink-zone:')) };
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}
