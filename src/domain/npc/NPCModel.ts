import type { Lane, LaneId } from '../layout/WorldLayout';
import type { PoopEffectInstance, PoopType } from '../poop/PoopModel';

export type NPCType =
  | 'office_worker'
  | 'phone_user'
  | 'jogger'
  | 'umbrella_pedestrian'
  | 'delivery_rider'
  | 'dog_walker'
  | 'cleaner'
  | 'angry_pedestrian'
  | 'camera_pedestrian'
  | 'tourist'
  | 'security_guard';

export type NPCTag =
  | 'civilian'
  | 'fast'
  | 'umbrella_shield'
  | 'dog_alert'
  | 'cleaner'
  | 'retaliates'
  | 'recording'
  | 'tourist_group'
  | 'security';

export type NPCDangerPhase = 'none' | 'telegraph' | 'active' | 'recovery';

export type NPCAbility =
  | { readonly kind: 'umbrella'; readonly blocksPoopTags: readonly string[]; readonly crackedByPoopTags: readonly string[] }
  | { readonly kind: 'dog_alert'; readonly telegraphSeconds: number; readonly activeSeconds: number; readonly alertIncrease: number }
  | { readonly kind: 'cleaner'; readonly clearRadius: number; readonly intervalSeconds: number }
  | { readonly kind: 'retaliate'; readonly hitThreshold: number; readonly telegraphSeconds: number; readonly activeSeconds: number; readonly recoverySeconds: number }
  | { readonly kind: 'recording'; readonly telegraphSeconds: number; readonly activeSeconds: number; readonly alertPerSecond: number }
  | { readonly kind: 'security'; readonly observeSeconds: number; readonly searchSeconds: number; readonly alertPerSecond: number };

export type NPCBehavior =
  | { readonly kind: 'steady' }
  | {
      readonly kind: 'distracted';
      readonly minTimeUntilDistracted: number;
      readonly maxTimeUntilDistracted: number;
      readonly minDistractedDuration: number;
      readonly maxDistractedDuration: number;
      readonly distractedSpeedMultiplier: number;
    };

export type NPCPendingRant = {
  readonly eventId: string;
  readonly poopType: PoopType;
  readonly impactDistance: number;
  readonly interactionScoreDelta: number;
  readonly interactionTags: readonly string[];
};

export type NPCDefinition = {
  readonly id: NPCType;
  readonly label: string;
  readonly baseSpeed: number;
  readonly scoreValue: number;
  readonly color: number;
  readonly width: number;
  readonly height: number;
  readonly tags: readonly NPCTag[];
  readonly abilities: readonly NPCAbility[];
  readonly behavior: NPCBehavior;
};

export type NPCStateKind =
  | 'Entering'
  | 'Walking'
  | 'Distracted'
  | 'Hit'
  | 'Ranting'
  | 'Recovering'
  | 'Recording'
  | 'Searching'
  | 'Retaliating'
  | 'Cleaning'
  | 'DogAlert'
  | 'Exiting';

export type NPCInstanceState = {
  readonly id: number;
  readonly definitionId: NPCType;
  readonly laneId: LaneId;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly depth: number;
  readonly baseSpeed: number;
  readonly currentSpeed: number;
  readonly state: NPCStateKind;
  readonly ageSeconds: number;
  readonly distanceTravelled: number;
  readonly validHitCount: number;
  readonly hitWindowId: number;
  readonly rantRemainingSeconds: number;
  readonly immunityRemainingSeconds: number;
  readonly reactionLevel: number;
  readonly pendingRant?: NPCPendingRant;
  readonly activeEffects: readonly PoopEffectInstance[];
  readonly dangerPhase: NPCDangerPhase;
  readonly dangerKind?: NPCAbility['kind'];
  readonly dangerRemainingSeconds: number;
  readonly cleanerCooldownSeconds: number;
  readonly alertPulse?: number;
  readonly retaliationCount: number;
  readonly nextDistractedAt?: number;
  readonly distractedUntil?: number;
};

export type NPCSpawnConfig = {
  readonly seed: string;
  readonly intervalSeconds: number;
  readonly spawnXPadding: number;
  readonly exitXPadding: number;
  readonly maxActive: number;
  readonly definitions: readonly { readonly npcType: NPCType; readonly weight: number }[];
  readonly lanes: readonly { readonly laneId: LaneId; readonly weight: number }[];
};

export type NPCSpawnerState = {
  readonly npcs: readonly NPCInstanceState[];
  readonly nextId: number;
  readonly timeUntilNextSpawn: number;
  readonly recycledCount: number;
  readonly skippedSpawnCount: number;
};

export type NPCSpawnContext = {
  readonly lane: Lane;
  readonly definition: NPCDefinition;
  readonly spawnX: number;
};
