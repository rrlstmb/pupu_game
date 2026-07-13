import type { NPCInstanceState } from '../npc/NPCModel';
import type { EnvironmentalEffectStats, EnvironmentalEffectZone, PoopDefinition, PoopEffectInstance } from './PoopModel';

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
    stats: { createdCount: 0, recycledCount: 0, activeCount: 0 },
    nextId: 1
  };
}

export function createStinkZone(
  state: EnvironmentalEffectState,
  definition: PoopDefinition,
  position: { readonly x: number; readonly y: number }
): EnvironmentalEffectState {
  if (definition.capability.kind !== 'stink' || state.zones.length >= ENVIRONMENTAL_EFFECT_LIMITS.maxActiveZones) {
    return state;
  }

  const zone: EnvironmentalEffectZone = {
    id: `zone:${state.nextId}`,
    poopType: definition.id,
    x: position.x,
    y: position.y,
    radius: definition.capability.stinkRadius ?? 0,
    remainingSeconds: definition.capability.stinkDurationSeconds ?? 0,
    slowMultiplier: definition.capability.stinkSlowMultiplier ?? 1,
    alertPerSecond: definition.capability.stinkAlertPerSecond ?? 0
  };

  return {
    zones: [...state.zones, zone],
    nextId: state.nextId + 1,
    stats: {
      createdCount: state.stats.createdCount + 1,
      recycledCount: state.stats.recycledCount,
      activeCount: state.zones.length + 1
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
      activeCount: zones.length
    }
  };
}

export function applyEnvironmentalEffectsToNPCs(
  npcs: readonly NPCInstanceState[],
  zones: readonly EnvironmentalEffectZone[]
): readonly NPCInstanceState[] {
  let appliedCount = 0;

  return npcs.map((npc) => {
    const applicable = zones
      .filter((zone) => distance(npc.x, npc.y, zone.x, zone.y) <= zone.radius)
      .sort((left, right) => left.slowMultiplier - right.slowMultiplier)[0];

    if (!applicable || appliedCount >= ENVIRONMENTAL_EFFECT_LIMITS.maxZoneEffectsPerTick) {
      return {
        ...npc,
        activeEffects: npc.activeEffects.filter((effect) => !effect.id.startsWith('stink-zone:'))
      };
    }

    appliedCount += 1;
    const effect: PoopEffectInstance = {
      id: `stink-zone:${applicable.id}:${npc.id}`,
      poopType: applicable.poopType,
      targetNpcId: npc.id,
      remainingSeconds: Math.min(0.25, applicable.remainingSeconds),
      slowMultiplier: applicable.slowMultiplier
    };

    return {
      ...npc,
      activeEffects: [...npc.activeEffects.filter((candidate) => candidate.id !== effect.id), effect]
    };
  });
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
      activeCount: zones.length
    }
  };
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}
