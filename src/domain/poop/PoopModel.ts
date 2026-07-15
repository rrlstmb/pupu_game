import type { ProjectileConfig } from '../../data/projectileConfig';

export type PoopType =
  | 'normal_poop'
  | 'sticky_poop'
  | 'splash_poop'
  | 'jumbo_poop'
  | 'bouncy_poop'
  | 'stink_poop'
  | 'split_poop'
  | 'golden_poop';

export type PoopCapability = {
  readonly kind: 'normal' | 'sticky' | 'splash' | 'jumbo' | 'bouncy' | 'stink' | 'split' | 'golden';
  readonly slowMultiplier?: number;
  readonly effectDurationSeconds?: number;
  readonly splashRadius?: number;
  readonly splashMaxTargets?: number;
  readonly breaksDefense?: boolean;
  readonly maxBounces?: number;
  readonly bounceRestitution?: number;
  readonly bounceSurfaceTags?: readonly SurfaceTag[];
  readonly stinkRadius?: number;
  readonly stinkDurationSeconds?: number;
  readonly stinkSlowMultiplier?: number;
  readonly stinkAlertPerSecond?: number;
  readonly splitAtSeconds?: number;
  readonly splitProjectileCount?: number;
  readonly splitSpreadVelocityX?: number;
  readonly maxSplitGeneration?: number;
  readonly goldenComboExtensionSeconds?: number;
  readonly goldenSpecialEventScore?: number;
};

export type SurfaceTag = 'rooftop_floor' | 'cover' | 'wall' | 'sign';

export type PoopDefinition = {
  readonly id: PoopType;
  readonly label: string;
  readonly icon: string;
  readonly projectile: ProjectileConfig;
  readonly initialStock: number | 'infinite';
  readonly scoreMultiplier: number;
  readonly alertCost: number;
  readonly skillFloor: 'low' | 'medium' | 'high';
  readonly bestAgainst: readonly string[];
  readonly weakAgainst: readonly string[];
  readonly capability: PoopCapability;
};

export type PoopEffectInstance = {
  readonly id: string;
  readonly poopType: PoopType;
  readonly targetNpcId: number;
  readonly remainingSeconds: number;
  readonly slowMultiplier?: number;
};

export type ProjectilePoopRules = {
  readonly maxBounces: number;
  readonly bounceRestitution: number;
  readonly bounceSurfaceTags: readonly SurfaceTag[];
  readonly splitAtSeconds?: number;
  readonly splitProjectileCount: number;
  readonly splitSpreadVelocityX: number;
  readonly maxSplitGeneration: number;
};

export type EnvironmentalEffectZone = {
  readonly id: string;
  readonly sourceProjectileId?: number;
  readonly poopType: PoopType;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly remainingSeconds: number;
  readonly slowMultiplier: number;
  readonly alertPerSecond: number;
  readonly createdOrder: number;
  readonly affectedNpcIds: readonly number[];
  readonly state: 'active' | 'being_cleaned';
};

export type EnvironmentalEffectStats = {
  readonly createdCount: number;
  readonly recycledCount: number;
  readonly activeCount: number;
  readonly affectedNpcCount?: number;
  readonly maxAffectedBySingleZone?: number;
  readonly naturallyExpiredCount?: number;
  readonly clearedCount?: number;
};

export type AreaEffectZoneRules = {
  readonly radius: number;
  readonly durationSeconds: number;
  readonly maxActiveZones: number;
  readonly stackingRule: 'refresh' | 'replace' | 'reject';
  readonly npcEffect: 'slow';
  readonly effectStrength: number;
  readonly alertCostOnCreate: number;
  readonly alertCostPerAffectedNpc: number;
  readonly reenterCounts: false;
};

export type NpcAreaEffectResistance = {
  readonly npcType: string;
  readonly stinkResistance: number;
  readonly minimumSlowMultiplier: number;
  readonly canReroute: boolean;
};

export type EffectStackingPolicy = {
  readonly sticky: 'refresh_same_type';
  readonly stink: 'strongest_slow_refresh_zone_tick';
  readonly splash: 'dedupe_per_effect_instance';
  readonly golden: 'legal_rant_bonus_only';
};
