import type { LaneId } from '../layout/WorldLayout';
import type { NPCType } from '../npc/NPCModel';
import type { PoopType } from '../poop/PoopModel';

export type LevelSpawnDefinition = {
  readonly intervalSeconds: number;
  readonly spawnXPadding: number;
  readonly exitXPadding: number;
  readonly maxActive: number;
  readonly definitions: readonly { readonly npcType: NPCType; readonly weight: number }[];
  readonly lanes: readonly { readonly laneId: LaneId; readonly weight: number }[];
};

export type LevelStarCondition =
  | { readonly id: 'score_target'; readonly label: string; readonly targetScore: number }
  | { readonly id: 'combo_target'; readonly label: string; readonly targetCombo: number }
  | { readonly id: 'accuracy_target'; readonly label: string; readonly minimumExclusive: number };

export type LevelDefinition = {
  readonly id: string;
  readonly name: string;
  readonly durationSeconds: number;
  readonly countdownSeconds: number;
  readonly targetScore: number;
  readonly seed: string;
  readonly availablePoopTypes: readonly PoopType[];
  readonly aimAssist: 'always' | 'hold' | 'disabled';
  readonly spawn: LevelSpawnDefinition;
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
  validateStars(input.stars, errors);
  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, definition: input as LevelDefinition };
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
  if (new Set(ids).size !== 3 || !ids.includes('score_target') || !ids.includes('combo_target') || !ids.includes('accuracy_target')) {
    errors.push('stars must define score_target, combo_target, and accuracy_target once each');
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
