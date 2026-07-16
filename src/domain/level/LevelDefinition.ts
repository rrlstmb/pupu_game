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
  readonly profile: 'day' | 'evening' | 'rainy' | 'market_evening' | 'windy_afternoon' | 'cleanup_day' | 'residential_alley' | 'live_event' | 'night_patrol' | 'clean_city';
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

export type EventChannel = 'spawnChannel' | 'windChannel' | 'presentationChannel' | 'hazardChannel' | 'cleanupChannel' | 'surveillanceChannel' | 'securityChannel' | 'blockadeChannel' | 'bossChannel';

export type BossProtectionType = 'media_entourage' | 'large_umbrella' | 'movement_barrier';
export type BossProtectionDefinition = {
  readonly id: string;
  readonly type: BossProtectionType;
  readonly dependsOn?: string;
  readonly requiredInteraction: 'camera_interrupt' | 'jumbo_or_bounce' | 'sticky_slow';
  readonly requiredCount: number;
  readonly feedbackLocked: string;
  readonly feedbackBroken: string;
};
export type BossPhaseDefinition = {
  readonly id: 'phase_1_parade' | 'phase_2_protected_boss' | 'phase_3_rooftop_lockdown';
  readonly title: string;
  readonly tutorialMessage: string;
  readonly phaseScoreTarget?: number;
  readonly uniqueInteractionTarget?: number;
  readonly transitionSeconds: number;
  readonly timeoutSeconds: number;
  readonly spawn: LevelSpawnDefinition;
};
export type BossMovementProfile = {
  readonly id: string;
  readonly speed: number;
  readonly minX: number;
  readonly maxX: number;
  readonly pauseSeconds: number;
  readonly dashWarningSeconds: number;
  readonly dashDurationSeconds: number;
  readonly recoverySeconds: number;
  readonly hitWindowSeconds: number;
};
export type FinalGoldenPoopDefinition = {
  readonly grantedOnPhaseEnter: number;
  readonly maxAttempts: number;
  readonly reservedForFinalPhase: true;
  readonly resetOnRetry: true;
  readonly successInteractionTag: string;
};
export type FinalVulnerableWindowDefinition = {
  readonly warningSeconds: number;
  readonly activeSeconds: number;
  readonly recoverySeconds: number;
  readonly repeatLimit: number;
  readonly minimumAvailableHitWidth: number;
};
export type FinalEncounterSafetyDefinition = {
  readonly playerBounds: { readonly start: number; readonly end: number };
  readonly blockedStages: readonly { readonly id: string; readonly warningSeconds: number; readonly intervals: readonly { readonly start: number; readonly end: number }[] }[];
  readonly coverIntervals: readonly { readonly start: number; readonly end: number }[];
  readonly bossHitIntervals: readonly { readonly start: number; readonly end: number }[];
  readonly minimumReachableWidth: number;
  readonly minimumSafeWidth: number;
  readonly minimumThrowPositionWidth: number;
  readonly minimumBossHitPositionWidth: number;
};
export type BossEncounterDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly phases: readonly [BossPhaseDefinition, BossPhaseDefinition, BossPhaseDefinition];
  readonly protections: readonly BossProtectionDefinition[];
  readonly movementProfiles: readonly BossMovementProfile[];
  readonly bossY: number;
  readonly bossWidth: number;
  readonly bossHeight: number;
  readonly finalGolden: FinalGoldenPoopDefinition;
  readonly finalWindow: FinalVulnerableWindowDefinition;
  readonly safety: FinalEncounterSafetyDefinition;
  readonly hazardConcurrencyBudget: number;
};

export type SecurityCoverDefinition = {
  readonly id: string;
  readonly x: number;
  readonly width: number;
  readonly blocksSources: readonly ('guard' | 'searchlight')[];
  readonly concealmentPadding: number;
  readonly disabledDuringBlockade: boolean;
};

export type SearchlightDefinition = {
  readonly id: string;
  readonly minX: number;
  readonly maxX: number;
  readonly beamHalfWidth: number;
  readonly sweepDurationSeconds: number;
  readonly warningDurationSeconds: number;
  readonly phaseOffset: number;
  readonly detectionMultiplier: number;
};

export type SecurityDefinition = {
  readonly detectionRatePerSecond: number;
  readonly detectionDecayPerSecond: number;
  readonly detectionThreshold: number;
  readonly guardPatrolPoints: readonly number[];
  readonly guardWarningSeconds: number;
  readonly guardObservationSeconds: number;
  readonly guardCooldownSeconds: number;
  readonly guardViewHalfWidth: number;
  readonly guardHitAlertPenalty: number;
  readonly searchlights: readonly SearchlightDefinition[];
  readonly covers: readonly SecurityCoverDefinition[];
  readonly exposeOnCharge: boolean;
  readonly exposeOnThrow: boolean;
  readonly chargeExposureMultiplier: number;
  readonly throwExposureSeconds: number;
  readonly coverEffectivenessWhileExposed: number;
  readonly exposedDetectionMultiplier: number;
  readonly spottedAlertPenalty: number;
  readonly spottedThrowLockSeconds: number;
  readonly spottedInvulnerabilitySeconds: number;
  readonly maxConcurrentGuardViews: number;
  readonly maxConcurrentSearchlights: number;
  readonly globalSecurityGapSeconds: number;
  readonly minimumSafeWidth: number;
  readonly queueLimit: number;
  readonly viewPoolSize: number;
};

export type BlockadeDefinition = {
  readonly id: string;
  readonly warningDurationSeconds: number;
  readonly blockedIntervals: readonly { readonly start: number; readonly end: number }[];
  readonly minimumReachableWidth: number;
  readonly minimumThrowPositionWidth: number;
  readonly requireCoverInRemainingArea: boolean;
  readonly playerRelocationPolicy: 'nearest_safe_point';
};

export type SurveillanceModeDefinition = {
  readonly telegraphDurationSeconds: number;
  readonly activeDurationSeconds: number;
  readonly cooldownSeconds: number;
  readonly targetMode: 'authored_sweep' | 'fixed_zone';
  readonly authoredCenters: readonly number[];
  readonly targetHalfWidth: number;
  readonly exposureRatePerSecond: number;
  readonly exposureDecayPerSecond: number;
  readonly captureThreshold: number;
  readonly alertPenalty: number;
  readonly throwLockSeconds: number;
  readonly invulnerabilitySeconds: number;
  readonly throwingExposureMultiplier: number;
};

export type ConcealmentZoneDefinition = {
  readonly id: string;
  readonly x: number;
  readonly width: number;
  readonly blocksModes: readonly ('snapshot' | 'recording')[];
};

export type SurveillanceDefinition = {
  readonly snapshot: SurveillanceModeDefinition;
  readonly recording: SurveillanceModeDefinition;
  readonly concealmentZones: readonly ConcealmentZoneDefinition[];
  readonly maxConcurrentTelegraphs: number;
  readonly maxConcurrentSnapshotWindows: number;
  readonly maxConcurrentRecordingWindows: number;
  readonly globalMinimumGapSeconds: number;
  readonly queueLimit: number;
  readonly minimumSafeWidth: number;
  readonly schedulingPolicy: 'source_id_alternating';
  readonly interruptionAlertPenalty: number;
  readonly alertMultiplier: number;
  readonly viewPoolSize: number;
};

export type SurveillanceEventDefinition = {
  readonly globalGapMultiplier: number;
  readonly maxConcurrentTelegraphsBonus: number;
};

export type SecurityEventDefinition = { readonly detectionRateMultiplier: number };
export type BlockadeEventDefinition = { readonly activate: true };
export type BossEventDefinition = { readonly command: 'parade_wave' | 'boss_arrival' | 'rooftop_lockdown' };

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
  readonly surveillance?: SurveillanceEventDefinition;
  readonly security?: SecurityEventDefinition;
  readonly blockade?: BlockadeEventDefinition;
  readonly boss?: BossEventDefinition;
};

export type LevelStarCondition =
  | { readonly id: 'score_target'; readonly label: string; readonly targetScore: number }
  | { readonly id: 'combo_target'; readonly label: string; readonly targetCombo: number }
  | { readonly id: 'accuracy_target'; readonly label: string; readonly minimumExclusive: number }
  | { readonly id: 'npc_hit_target'; readonly label: string; readonly npcTypes: readonly NPCType[]; readonly targetHits: number }
  | { readonly id: 'interaction_target'; readonly label: string; readonly interactionTag: string; readonly targetCount: number }
  | { readonly id: 'splash_multi_hit_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'area_zone_target'; readonly label: string; readonly mode: 'cumulative' | 'single_zone'; readonly targetCount: number }
  | { readonly id: 'counter_dodge_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'snapshot_avoid_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'recording_survive_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'security_avoid_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'golden_hit_target'; readonly label: string; readonly targetCount: number }
  | { readonly id: 'boss_final_hit'; readonly label: string; readonly targetCount: 1 }
  | { readonly id: 'boss_detection_limit'; readonly label: string; readonly maximum: number };

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
  readonly surveillance?: SurveillanceDefinition;
  readonly security?: SecurityDefinition;
  readonly blockade?: BlockadeDefinition;
  readonly poopStockOverrides?: Readonly<Partial<Record<PoopType, number | 'infinite'>>>;
  readonly completionMode?: 'score' | 'boss_final_hit';
  readonly bossEncounter?: BossEncounterDefinition;
  readonly stars: readonly LevelStarCondition[];
};

export type LevelValidationResult =
  | { readonly valid: true; readonly definition: LevelDefinition }
  | { readonly valid: false; readonly errors: readonly string[] };

const NPC_TYPES: readonly NPCType[] = [
  'office_worker', 'phone_user', 'jogger', 'umbrella_pedestrian', 'delivery_rider', 'dog_walker',
  'cleaner', 'angry_pedestrian', 'camera_pedestrian', 'streamer', 'tourist', 'security_guard'
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
  validateSurveillance(input.surveillance, errors);
  validateSecurity(input.security, errors);
  validateBlockade(input.blockade, errors);
  validatePoopStockOverrides(input.poopStockOverrides, input.availablePoopTypes, errors);
  validateBossEncounter(input.bossEncounter, input.completionMode, errors);
  validateStars(input.stars, errors);
  validateScoreTargetConsistency(input, errors);
  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, definition: input as LevelDefinition };
}

function validatePoopStockOverrides(input: unknown, availablePoopTypes: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || !Array.isArray(availablePoopTypes)) {
    errors.push('poopStockOverrides must be an object for available poop types');
    return;
  }
  for (const [poopType, stock] of Object.entries(input)) {
    if (!POOP_TYPES.includes(poopType as PoopType) || !availablePoopTypes.includes(poopType) ||
      (stock !== 'infinite' && (!Number.isInteger(stock) || Number(stock) < 0))) {
      errors.push(`poopStockOverrides.${poopType} must be a non-negative integer or infinite for an available poop type`);
    }
  }
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
    'score_target', 'combo_target', 'accuracy_target', 'npc_hit_target', 'interaction_target', 'splash_multi_hit_target', 'area_zone_target', 'counter_dodge_target', 'snapshot_avoid_target', 'recording_survive_target', 'security_avoid_target', 'golden_hit_target', 'boss_final_hit', 'boss_detection_limit'
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
    } else if ((condition.id === 'snapshot_avoid_target' || condition.id === 'recording_survive_target') && !isPositiveInteger(condition.targetCount)) {
      errors.push(`${condition.id}.targetCount must be a positive integer`);
    } else if ((condition.id === 'security_avoid_target' || condition.id === 'golden_hit_target') && !isPositiveInteger(condition.targetCount)) {
      errors.push(`${condition.id}.targetCount must be a positive integer`);
    } else if (condition.id === 'boss_final_hit' && condition.targetCount !== 1) {
      errors.push('boss_final_hit.targetCount must be 1');
    } else if (condition.id === 'boss_detection_limit' && (!Number.isInteger(condition.maximum) || Number(condition.maximum) < 0)) {
      errors.push('boss_detection_limit.maximum must be a non-negative integer');
    }
  }
}

function validateBossEncounter(input: unknown, completionMode: unknown, errors: string[]): void {
  if (input === undefined) {
    if (completionMode === 'boss_final_hit') errors.push('boss_final_hit completion requires bossEncounter');
    return;
  }
  if (!isRecord(input) || completionMode !== 'boss_final_hit') {
    errors.push('bossEncounter requires boss_final_hit completion mode');
    return;
  }
  if (!Array.isArray(input.phases) || input.phases.length !== 3) errors.push('bossEncounter.phases must contain exactly three phases');
  if (!Array.isArray(input.protections) || input.protections.length !== 3) errors.push('bossEncounter.protections must contain exactly three gates');
  if (!Array.isArray(input.movementProfiles) || input.movementProfiles.length < 2) errors.push('bossEncounter requires movement profiles');
  if (!isRecord(input.finalGolden) || !isPositiveInteger(input.finalGolden.grantedOnPhaseEnter) || input.finalGolden.reservedForFinalPhase !== true) {
    errors.push('bossEncounter.finalGolden must define finite reserved attempts');
  }
  if (!isRecord(input.finalWindow) || !isPositiveNumber(input.finalWindow.activeSeconds) || !isPositiveInteger(input.finalWindow.repeatLimit)) {
    errors.push('bossEncounter.finalWindow must define active duration and repeat limit');
  }
  if (!isRecord(input.safety) || !Array.isArray(input.safety.blockedStages) || input.safety.blockedStages.length === 0) {
    errors.push('bossEncounter.safety must define blocked stages');
  }
}

function validateVisual(input: unknown, errors: string[]): void {
  if (!isRecord(input) || !['day', 'evening', 'rainy', 'market_evening', 'windy_afternoon', 'cleanup_day', 'residential_alley', 'live_event', 'night_patrol', 'clean_city'].includes(String(input.profile))) {
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
    if (!['spawnChannel', 'windChannel', 'presentationChannel', 'hazardChannel', 'cleanupChannel', 'surveillanceChannel', 'securityChannel', 'blockadeChannel', 'bossChannel'].includes(String(event.channel)) ||
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
    if (event.surveillance !== undefined && (!isRecord(event.surveillance) ||
      !isPositiveNumber(event.surveillance.globalGapMultiplier) ||
      typeof event.surveillance.maxConcurrentTelegraphsBonus !== 'number' ||
      !Number.isInteger(event.surveillance.maxConcurrentTelegraphsBonus) || event.surveillance.maxConcurrentTelegraphsBonus < 0)) {
      errors.push(`${event.id} surveillance profile must define positive gap multiplier and non-negative telegraph bonus`);
    }
    if (event.security !== undefined && (!isRecord(event.security) || !isPositiveNumber(event.security.detectionRateMultiplier))) {
      errors.push(`${event.id} security profile must define a positive detection multiplier`);
    }
    if (event.blockade !== undefined && (!isRecord(event.blockade) || event.blockade.activate !== true)) {
      errors.push(`${event.id} blockade profile must activate the authored blockade`);
    }
  }
}

function validateSecurity(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || !Array.isArray(input.guardPatrolPoints) || input.guardPatrolPoints.length === 0 ||
    !Array.isArray(input.searchlights) || input.searchlights.length === 0 || !Array.isArray(input.covers) || input.covers.length === 0) {
    errors.push('security must define patrol points, searchlights, and covers');
    return;
  }
  const positive = ['detectionRatePerSecond', 'detectionDecayPerSecond', 'detectionThreshold', 'guardWarningSeconds',
    'guardObservationSeconds', 'guardCooldownSeconds', 'guardViewHalfWidth', 'searchlights', 'chargeExposureMultiplier',
    'throwExposureSeconds', 'exposedDetectionMultiplier', 'spottedAlertPenalty', 'spottedThrowLockSeconds',
    'spottedInvulnerabilitySeconds', 'maxConcurrentGuardViews', 'maxConcurrentSearchlights', 'globalSecurityGapSeconds',
    'minimumSafeWidth', 'queueLimit', 'viewPoolSize'];
  if (positive.filter((key) => key !== 'searchlights').some((key) => !isPositiveNumber(input[key])) ||
    typeof input.coverEffectivenessWhileExposed !== 'number' || input.coverEffectivenessWhileExposed < 0 || input.coverEffectivenessWhileExposed > 1 ||
    typeof input.guardHitAlertPenalty !== 'number' || input.guardHitAlertPenalty < 0 ||
    input.exposeOnCharge !== true || input.exposeOnThrow !== true ||
    input.searchlights.some((light) => !isRecord(light) || typeof light.id !== 'string' || !isPositiveNumber(light.beamHalfWidth) ||
      !isPositiveNumber(light.sweepDurationSeconds) || !isPositiveNumber(light.warningDurationSeconds) ||
      typeof light.minX !== 'number' || typeof light.maxX !== 'number' || light.maxX <= light.minX ||
      typeof light.phaseOffset !== 'number' || light.phaseOffset < 0 || light.phaseOffset >= 1) ||
    input.covers.some((cover) => !isRecord(cover) || typeof cover.id !== 'string' || typeof cover.x !== 'number' ||
      !isPositiveNumber(cover.width) || !Array.isArray(cover.blocksSources))) {
    errors.push('security timing, exposure, source bounds, covers, and limits must be valid');
  }
}

function validateBlockade(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || typeof input.id !== 'string' || !isPositiveNumber(input.warningDurationSeconds) ||
    !Array.isArray(input.blockedIntervals) || input.blockedIntervals.length === 0 ||
    input.blockedIntervals.some((interval) => !isRecord(interval) || typeof interval.start !== 'number' || typeof interval.end !== 'number' || interval.end <= interval.start) ||
    !isPositiveNumber(input.minimumReachableWidth) || !isPositiveNumber(input.minimumThrowPositionWidth) ||
    input.requireCoverInRemainingArea !== true || input.playerRelocationPolicy !== 'nearest_safe_point') {
    errors.push('blockade must define warning, valid intervals, reachability, cover, and relocation');
  }
}

function validateSurveillance(input: unknown, errors: string[]): void {
  if (input === undefined) return;
  if (!isRecord(input) || input.schedulingPolicy !== 'source_id_alternating' || !Array.isArray(input.concealmentZones)) {
    errors.push('surveillance must define source-id scheduling and concealment zones');
    return;
  }
  for (const mode of ['snapshot', 'recording'] as const) {
    const value = input[mode];
    if (!isRecord(value) || !['authored_sweep', 'fixed_zone'].includes(String(value.targetMode)) ||
      !Array.isArray(value.authoredCenters) || value.authoredCenters.length === 0 || value.authoredCenters.some((x) => typeof x !== 'number') ||
      ['telegraphDurationSeconds', 'activeDurationSeconds', 'cooldownSeconds', 'targetHalfWidth', 'captureThreshold', 'alertPenalty', 'throwLockSeconds', 'invulnerabilitySeconds', 'throwingExposureMultiplier'].some((key) => !isPositiveNumber(value[key])) ||
      typeof value.exposureRatePerSecond !== 'number' || value.exposureRatePerSecond < 0 ||
      typeof value.exposureDecayPerSecond !== 'number' || value.exposureDecayPerSecond < 0) {
      errors.push(`surveillance.${mode} must define bounded timing, authored zones, exposure, and penalties`);
    }
  }
  const positiveIntegers = ['maxConcurrentTelegraphs', 'maxConcurrentSnapshotWindows', 'maxConcurrentRecordingWindows', 'queueLimit', 'viewPoolSize'];
  if (positiveIntegers.some((key) => !isPositiveInteger(input[key])) ||
    ['globalMinimumGapSeconds', 'minimumSafeWidth', 'alertMultiplier'].some((key) => !isPositiveNumber(input[key])) ||
    typeof input.interruptionAlertPenalty !== 'number' || input.interruptionAlertPenalty < 0 ||
    input.concealmentZones.some((zone) => !isRecord(zone) || typeof zone.id !== 'string' || typeof zone.x !== 'number' ||
      !isPositiveNumber(zone.width) || !Array.isArray(zone.blocksModes))) {
    errors.push('surveillance limits, safe space, concealment, and penalties must be bounded');
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
