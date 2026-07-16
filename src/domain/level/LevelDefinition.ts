import type { LaneId } from '../layout/WorldLayout';
import type { NPCType } from '../npc/NPCModel';
import type { PoopType } from '../poop/PoopModel';
import type { AreaEffectZoneRules } from '../poop/PoopModel';

export type LevelSpawnDefinition = {
  readonly intervalSeconds: number;
  readonly spawnXPadding: number;
  readonly exitXPadding: number;
  readonly maxActive: number;
  readonly definitions: readonly { readonly npcType: NPCType; readonly weight: number }[];
  readonly lanes: readonly { readonly laneId: LaneId; readonly weight: number }[];
};

export type LevelVisualDefinition = {
  readonly profile: 'day' | 'evening' | 'rainy' | 'market_evening' | 'windy_afternoon' | 'cleanup_day' | 'residential_alley';
  readonly skylineColor: number;
  readonly alleyColor: number;
  readonly rooftopColor: number;
  readonly weather: {
    readonly kind: 'clear' | 'rain';
    readonly streakColor: number;
    readonly streakAlpha: number;
    readonly streakCount: number;
  };
};

export type WindDirection = 'left' | 'right' | 'calm';
export type WindSegment = {
  readonly id: string;
  readonly startAtRemainingSeconds: number;
  readonly durationSeconds: number;
  readonly direction: WindDirection;
  readonly strength: number;
  readonly warningSeconds: number;
  readonly transitionSeconds?: number;
};

export type LevelWindDefinition = {
  readonly influenceCoefficient: number;
  readonly maxHorizontalOffset: number;
  readonly transitionSmoothing: number;
  readonly resistanceByPoopType: Readonly<Record<PoopType, number>>;
  readonly segments: readonly WindSegment[];
};

export type BounceSurfaceDefinition = {
  readonly id: string;
  readonly bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly normal: { readonly x: number; readonly y: number };
  readonly enabled: boolean;
  readonly allowedPoopTags: readonly string[];
  readonly bounceCoefficient: number;
};

export type EventChannel = 'spawnChannel' | 'windChannel' | 'presentationChannel' | 'hazardChannel' | 'cleanupChannel';

export type CleanerRules = {
  readonly detectionRadius: number;
  readonly warningSeconds: number;
  readonly cleaningDurationSeconds: number;
  readonly maxConcurrentLocks: number;
};

export type CleanupEventDefinition = {
  readonly mode: 'all_active_zones';
  readonly warningSeconds: number;
  readonly clearDelaySeconds: number;
};

export type CounterattackDefinition = {
  readonly hitThreshold: number;
  readonly telegraphDurationSeconds: number;
  readonly projectileTravelDurationSeconds: number;
  readonly targetMode: 'snapshot_player_x';
  readonly targetHalfWidth: number;
  readonly minimumDodgeDistance: number;
  readonly projectileRadius: number;
  readonly playerHitboxPadding: number;
  readonly maxConcurrentTelegraphs: number;
  readonly maxConcurrentProjectiles: number;
  readonly globalMinimumGapSeconds: number;
  readonly perNpcCooldownSeconds: number;
  readonly minimumEscapeWidth: number;
  readonly queueLimit: number;
  readonly schedulingPolicy: 'fifo_source_id';
  readonly alertPenalty: number;
  readonly staggerDurationSeconds: number;
  readonly throwLockSeconds: number;
  readonly invulnerabilitySeconds: number;
  readonly staggerMovementMultiplier: number;
  readonly projectilePoolSize: number;
  readonly maxRetaliationsPerNpc: number;
  readonly angerResetRule: 'after_attack';
};

export type CounterattackEventDefinition = {
  readonly globalGapMultiplier: number;
  readonly maxConcurrentTelegraphsBonus: number;
};

export type LevelTimedEvent = {
  readonly id: string;
  readonly triggerAtRemainingSeconds: number;
  readonly once: true;
  readonly channel: EventChannel;
  readonly priority: number;
  readonly mergeStrategy: 'replace' | 'merge' | 'exclusive';
  readonly spawn?: LevelSpawnDefinition;
  readonly windSegmentId?: string;
  readonly presentationCue?: string;
  readonly cleanup?: CleanupEventDefinition;
  readonly counterattack?: CounterattackEventDefinition;
};

export type LevelStarCondition =
  | { readonly id: 'score_target'; readonly label: string; readonly targetScore: number }
  | { readonly id: 'combo_target'; readonly label: string; readonly targetCombo: number }
  | { readonly id: 'accuracy_target'; readonly label: string; readonly minimumExclusive: number }
  | { readonly id: 'npc_hit_target'; readonly label: string; readonly npcTypes: readonly NPCType[]; readonly targetHits: number }
  | { readonly id: 'interaction_target'; readonly label: string; readonly interactionTag: string; readonly targetCount: number }
  | { readonly id: 'splash_multi_hit_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'area_zone_target'; readonly label: string; readonly mode: 'cumulative' | 'single_zone'; readonly targetCount: number }
  | { readonly id: 'counter_dodge_target'; readonly label: string; readonly targetCount: number };

export type LevelDefinition = {
  readonly id: string;
  readonly name: string;
  readonly durationSeconds: number;
  readonly countdownSeconds: number;
  readonly targetScore: number;
  readonly seed: string;
  readonly availablePoopTypes: readonly PoopType[];
  readonly aimAssist: 'always' | 'hold' | 'disabled';
  readonly visual: LevelVisualDefinition;
  readonly spawn: LevelSpawnDefinition;
  readonly events: readonly LevelTimedEvent[];
  readonly wind?: LevelWindDefinition;
  readonly bounceSurfaces?: readonly BounceSurfaceDefinition[];
  readonly areaZone?: AreaEffectZoneRules;
  readonly cleaner?: CleanerRules;
  readonly counterattack?: CounterattackDefinition;
  readonly stars: readonly LevelStarCondition[];
};

export type LevelValidationResult =
  | { readonly valid: true; readonly definition: LevelDefinition }
  | { readonly valid: false; readonly errors: readonly string[] };

const NPC_TYPES: readonly NPCType[] = [
  'office_worker', 'phone_user', 'jogger', 'umbrella_pedestrian', 'delivery_rider', 'dog_walker',
  'cleaner', 'angry_pedestrian', 'camera_pedestrian', 'tourist', 'security_guard'
];
const POOP_TYPES: readonly PoopType[] = [
  'normal_poop', 'sticky_poop', 'splash_poop', 'jumbo_poop', 'bouncy_poop', 'stink_poop', 'split_poop', 'golden_poop'
];
const LANE_IDS: readonly LaneId[] = ['back_shop', 'mid_sidewalk', 'front_road'];

export function validateLevelDefinition(input: unknown): LevelValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['level must be an object'] };
  }

  requireText(input, 'id', errors);
  requireText(input, 'name', errors);
  requirePositiveNumber(input, 'durationSeconds', errors);
  requireNonNegativeNumber(input, 'countdownSeconds', errors);
  requirePositiveNumber(input, 'targetScore', errors);
  requireText(input, 'seed', errors);

  if (!Array.isArray(input.availablePoopTypes) || input.availablePoopTypes.length === 0) {
    errors.push('availablePoopTypes must contain at least one poop type');
  } else if (input.availablePoopTypes.some((type) => !POOP_TYPES.includes(type as PoopType))) {
    errors.push('availablePoopTypes contains an unknown poop type');
  }
  if (input.aimAssist !== 'always' && input.aimAssist !== 'hold' && input.aimAssist !== 'disabled') {
    errors.push('aimAssist must be always, hold, or disabled');
  }

  validateSpawn(input.spawn, errors);
  validateVisual(input.visual, errors);
  validateEvents(input.events, input.durationSeconds, errors);
  validateWind(input.wind, input.durationSeconds, errors);
  validateBounceSurfaces(input.bounceSurfaces, errors);
  validateAreaZone(input.areaZone, errors);
  validateCleaner(input.cleaner, errors);
  validateCounterattack(input.counterattack, errors);
  validateStars(input.stars, errors);
  validateScoreTargetConsistency(input, errors);
  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, definition: input as LevelDefinition };
}

function validateScoreTargetConsistency(input: Record<string, unknown>, errors: string[]): void {
  if (!Array.isArray(input.stars) || typeof input.targetScore !== 'number') return;
  const scoreCondition = input.stars.find(
    (condition) => isRecord(condition) && condition.id === 'score_target'
  );
  if (isRecord(scoreCondition) && scoreCondition.targetScore !== input.targetScore) {
    errors.push('score_target.targetScore must match targetScore');
  }
}

export function loadLevelDefinition(input: unknown): LevelDefinition {
  const result = validateLevelDefinition(input);
  if (!result.valid) {
    throw new Error(`Invalid LevelDefinition:\n${result.errors.join('\n')}`);
  }
  return result.definition;
}

function validateSpawn(input: unknown, errors: string[]): void {
  if (!isRecord(input)) {
    errors.push('spawn must be an object');
    return;
  }
  requirePositiveNumber(input, 'intervalSeconds', errors, 'spawn.');
  requireNonNegativeNumber(input, 'spawnXPadding', errors, 'spawn.');
  requireNonNegativeNumber(input, 'exitXPadding', errors, 'spawn.');
  requirePositiveInteger(input, 'maxActive', errors, 'spawn.');
  if (!isWeightedList(input.definitions, 'npcType', NPC_TYPES)) {
    errors.push('spawn.definitions must contain known NPC types with positive weights');
  }
  if (!isWeightedList(input.lanes, 'laneId', LANE_IDS)) {
    errors.push('spawn.lanes must contain known lanes with positive weights');
  }
}

function validateStars(input: unknown, errors: string[]): void {
  if (!Array.isArray(input) || input.length !== 3) {
    errors.push('stars must contain exactly three conditions');
    return;
  }
  const ids = input.filter(isRecord).map((condition) => condition.id);
  const allowedIds: readonly LevelStarCondition['id'][] = [
    'score_target', 'combo_target', 'accuracy_target', 'npc_hit_target', 'interaction_target', 'splash_multi_hit_target', 'area_zone_target', 'counter_dodge_target'
  ];
  if (new Set(ids).size !== 3 || !ids.includes('score_target') || ids.some((id) => !allowedIds.includes(id as LevelStarCondition['id']))) {
    errors.push('stars must define three unique conditions including score_target');
  }
  for (const condition of input) {
    if (!isRecord(condition) || typeof condition.label !== 'string' || condition.label.trim() === '') {
      errors.push('each star condition needs a label');
      continue;
    }
    if (condition.id === 'score_target' && !isPositiveNumber(condition.targetScore)) {
      errors.push('score_target.targetScore must be positive');
    } else if (condition.id === 'combo_target' && !isPositiveInteger(condition.targetCombo)) {
      errors.push('combo_target.targetCombo must be a positive integer');
    } else if (condition.id === 'accuracy_target' &&
      (typeof condition.minimumExclusive !== 'number' || condition.minimumExclusive < 0 || condition.minimumExclusive >= 1)) {
      errors.push('accuracy_target.minimumExclusive must be >= 0 and < 1');
    } else if (condition.id === 'npc_hit_target' &&
      (!Array.isArray(condition.npcTypes) || condition.npcTypes.length === 0 ||
        condition.npcTypes.some((type) => !NPC_TYPES.includes(type as NPCType)) ||
        !isPositiveInteger(condition.targetHits))) {
      errors.push('npc_hit_target requires known npcTypes and a positive targetHits');
    } else if (condition.id === 'interaction_target' &&
      (typeof condition.interactionTag !== 'string' || condition.interactionTag.trim() === '' || !isPositiveInteger(condition.targetCount))) {
      errors.push('interaction_target requires a tag and positive targetCount');
    } else if (condition.id === 'splash_multi_hit_target' && !isPositiveInteger(condition.targetCount)) {
      errors.push('splash_multi_hit_target.targetCount must be a positive integer');
    } else if (condition.id === 'area_zone_target' &&
      (!['cumulative', 'single_zone'].includes(String(condition.mode)) || !isPositiveInteger(condition.targetCount))) {
      errors.push('area_zone_target requires a mode and positive targetCount');
    } else if (condition.id === 'counter_dodge_target' && !isPositiveInteger(condition.targetCount)) {
      errors.push('counter_dodge_target.targetCount must be a positive integer');
    }
  }
}

function validateVisual(input: unknown, errors: string[]): void {
  if (!isRecord(input) || !['day', 'evening', 'rainy', 'market_evening', 'windy_afternoon', 'cleanup_day', 'residential_alley'].includes(String(input.profile))) {
    errors.push('visual must define a supported profile');
    return;
  }
  for (const key of ['skylineColor', 'alleyColor', 'rooftopColor']) {
    if (typeof input[key] !== 'number' || !Number.isInteger(input[key]) || input[key] < 0 || input[key] > 0xffffff) {
      errors.push(`visual.${key} must be a valid RGB color`);
    }
  }
  if (!isRecord(input.weather) || (input.weather.kind !== 'clear' && input.weather.kind !== 'rain') ||
    typeof input.weather.streakColor !== 'number' || typeof input.weather.streakAlpha !== 'number' ||
    input.weather.streakAlpha < 0 || input.weather.streakAlpha > 1 || !isPositiveInteger(input.weather.streakCount)) {
    errors.push('visual.weather must define kind, color, alpha, and positive streakCount');
  }
}

function validateEvents(input: unknown, duration: unknown, errors: string[]): void {
  if (!Array.isArray(input)) {
    errors.push('events must be an array');
    return;
  }
  const ids = new Set<string>();
  for (const event of input) {
    if (!isRecord(event) || typeof event.id !== 'string' || event.id.trim() === '' || ids.has(event.id)) {
      errors.push('events must have unique non-empty ids');
      continue;
    }
    ids.add(event.id);
    if (event.once !== true || typeof event.triggerAtRemainingSeconds !== 'number' ||
      event.triggerAtRemainingSeconds < 0 || typeof duration !== 'number' || event.triggerAtRemainingSeconds >= duration) {
      errors.push(`${event.id} must be once and trigger within the level duration`);
    }
    if (!['spawnChannel', 'windChannel', 'presentationChannel', 'hazardChannel', 'cleanupChannel'].includes(String(event.channel)) ||
      !['replace', 'merge', 'exclusive'].includes(String(event.mergeStrategy)) || !Number.isInteger(event.priority)) {
      errors.push(`${event.id} must define channel, integer priority, and mergeStrategy`);
    }
    if (event.channel === 'spawnChannel') validateSpawn(event.spawn, errors);
    if (event.channel === 'windChannel' && (typeof event.windSegmentId !== 'string' || event.windSegmentId === '')) {
      errors.push(`${event.id} windChannel requires windSegmentId`);
    }
    if (event.channel === 'cleanupChannel' && (!isRecord(event.cleanup) || event.cleanup.mode !== 'all_active_zones' ||
      !isPositiveNumber(event.cleanup.warningSeconds) || !isPositiveNumber(event.cleanup.clearDelaySeconds))) {
      errors.push(`${event.id} cleanupChannel requires a valid cleanup definition`);
    }
    if (event.counterattack !== undefined && (!isRecord(event.counterattack) ||
      !isPositiveNumber(event.counterattack.globalGapMultiplier) ||
      typeof event.counterattack.maxConcurrentTelegraphsBonus !== 'number' ||
      !Number.isInteger(event.counterattack.maxConcurrentTelegraphsBonus) || event.counterattack.maxConcurrentTelegraphsBonus < 0)) {
      errors.push(`${event.id} counterattack profile must define positive gap multiplier and non-negative telegraph bonus`);
    }
  }
}

function validateCounterattack(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || input.targetMode !== 'snapshot_player_x' || input.schedulingPolicy !== 'fifo_source_id' ||
    input.angerResetRule !== 'after_attack') {
    errors.push('counterattack must define snapshot targeting, FIFO scheduling, and anger reset');
    return;
  }
  const positive = [
    'hitThreshold', 'telegraphDurationSeconds', 'projectileTravelDurationSeconds', 'targetHalfWidth',
    'minimumDodgeDistance', 'projectileRadius', 'maxConcurrentTelegraphs', 'maxConcurrentProjectiles',
    'globalMinimumGapSeconds', 'perNpcCooldownSeconds', 'minimumEscapeWidth', 'queueLimit', 'alertPenalty',
    'staggerDurationSeconds', 'throwLockSeconds', 'invulnerabilitySeconds', 'projectilePoolSize', 'maxRetaliationsPerNpc'
  ];
  if (positive.some((key) => !isPositiveNumber(input[key])) ||
    typeof input.playerHitboxPadding !== 'number' || input.playerHitboxPadding < 0 ||
    typeof input.staggerMovementMultiplier !== 'number' || input.staggerMovementMultiplier <= 0 || input.staggerMovementMultiplier > 1) {
    errors.push('counterattack numeric rules must be positive and bounded');
  }
  for (const key of ['hitThreshold', 'maxConcurrentTelegraphs', 'maxConcurrentProjectiles', 'queueLimit', 'projectilePoolSize', 'maxRetaliationsPerNpc']) {
    if (!Number.isInteger(input[key])) errors.push(`counterattack.${key} must be an integer`);
  }
}

function validateAreaZone(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || !isPositiveNumber(input.radius) || !isPositiveNumber(input.durationSeconds) ||
    !isPositiveInteger(input.maxActiveZones) || !['refresh', 'replace', 'reject'].includes(String(input.stackingRule)) ||
    input.npcEffect !== 'slow' || typeof input.effectStrength !== 'number' || input.effectStrength <= 0 || input.effectStrength > 1 ||
    typeof input.alertCostOnCreate !== 'number' || input.alertCostOnCreate < 0 ||
    typeof input.alertCostPerAffectedNpc !== 'number' || input.alertCostPerAffectedNpc < 0 || input.reenterCounts !== false) {
    errors.push('areaZone must define bounded lifecycle, stacking, slow effect, alert costs, and dedupe');
  }
}

function validateCleaner(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || !isPositiveNumber(input.detectionRadius) || !isPositiveNumber(input.warningSeconds) ||
    !isPositiveNumber(input.cleaningDurationSeconds) || !isPositiveInteger(input.maxConcurrentLocks)) {
    errors.push('cleaner must define detection, warning, duration, and lock limit');
  }
}

function validateWind(input: unknown, duration: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || !isPositiveNumber(input.influenceCoefficient) || !isPositiveNumber(input.maxHorizontalOffset) ||
    typeof input.transitionSmoothing !== 'number' || input.transitionSmoothing < 0 || input.transitionSmoothing > 1 ||
    !isRecord(input.resistanceByPoopType) || !Array.isArray(input.segments)) {
    errors.push('wind must define influence, max offset, smoothing, resistances, and segments');
    return;
  }
  for (const type of POOP_TYPES) {
    const resistance = input.resistanceByPoopType[type];
    if (typeof resistance !== 'number' || resistance < 0 || resistance > 1) errors.push(`wind resistance missing for ${type}`);
  }
  const ids = new Set<string>();
  for (const segment of input.segments) {
    if (!isRecord(segment) || typeof segment.id !== 'string' || ids.has(segment.id) ||
      !['left', 'right', 'calm'].includes(String(segment.direction)) ||
      typeof segment.startAtRemainingSeconds !== 'number' || segment.startAtRemainingSeconds < 0 ||
      typeof duration !== 'number' || segment.startAtRemainingSeconds >= duration ||
      !isPositiveNumber(segment.durationSeconds) || typeof segment.strength !== 'number' || segment.strength < 0 || segment.strength > 1 ||
      typeof segment.warningSeconds !== 'number' || segment.warningSeconds < 0) {
      errors.push('wind segments must be unique, bounded, and valid');
      continue;
    }
    ids.add(segment.id);
  }
}

function validateBounceSurfaces(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!Array.isArray(input)) {
    errors.push('bounceSurfaces must be an array');
    return;
  }
  for (const surface of input) {
    if (!isRecord(surface) || typeof surface.id !== 'string' || !isRecord(surface.bounds) ||
      !isPositiveNumber(surface.bounds.width) || !isPositiveNumber(surface.bounds.height) ||
      !isRecord(surface.normal) || typeof surface.normal.x !== 'number' || typeof surface.normal.y !== 'number' ||
      surface.enabled !== true || !Array.isArray(surface.allowedPoopTags) || !isPositiveNumber(surface.bounceCoefficient)) {
      errors.push('bounceSurfaces entries must define id, bounds, normal, tags, and coefficient');
    }
  }
}

function isWeightedList<T extends string>(input: unknown, key: string, allowed: readonly T[]): boolean {
  return Array.isArray(input) && input.length > 0 && input.every((entry) =>
    isRecord(entry) && allowed.includes(entry[key] as T) && isPositiveNumber(entry.weight)
  );
}

function requireText(record: Record<string, unknown>, key: string, errors: string[]): void {
  if (typeof record[key] !== 'string' || record[key].trim() === '') errors.push(`${key} must be a non-empty string`);
}
function requirePositiveNumber(record: Record<string, unknown>, key: string, errors: string[], prefix = ''): void {
  if (!isPositiveNumber(record[key])) errors.push(`${prefix}${key} must be positive`);
}
function requireNonNegativeNumber(record: Record<string, unknown>, key: string, errors: string[], prefix = ''): void {
  if (typeof record[key] !== 'number' || !Number.isFinite(record[key]) || record[key] < 0) errors.push(`${prefix}${key} must be non-negative`);
}
function requirePositiveInteger(record: Record<string, unknown>, key: string, errors: string[], prefix = ''): void {
  if (!isPositiveInteger(record[key])) errors.push(`${prefix}${key} must be a positive integer`);
}
function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
function isPositiveInteger(value: unknown): value is number {
  return isPositiveNumber(value) && Number.isInteger(value);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
