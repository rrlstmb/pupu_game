import type { Rng } from '../random/SeededRng';
import type { NPCDefinition, NPCInstanceState } from './NPCModel';

export function createNPCInstance(
  id: number,
  definition: NPCDefinition,
  context: {
    readonly laneId: NPCInstanceState['laneId'];
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    readonly depth: number;
  },
  rng: Rng
): NPCInstanceState {
  const baseSpeed = definition.baseSpeed;
  return {
    id,
    definitionId: definition.id,
    laneId: context.laneId,
    x: context.x,
    y: context.y,
    scale: context.scale,
    depth: context.depth,
    baseSpeed,
    currentSpeed: baseSpeed,
    state: 'Entering',
    ageSeconds: 0,
    distanceTravelled: 0,
    validHitCount: 0,
    hitWindowId: 1,
    rantRemainingSeconds: 0,
    immunityRemainingSeconds: 0,
    reactionLevel: 0,
    activeEffects: [],
    dangerPhase: 'none',
    dangerRemainingSeconds: 0,
    cleanerCooldownSeconds: cleanerCooldown(definition),
    alertPulse: 0,
    retaliationCount: 0,
    nextDistractedAt: nextDistractedAt(definition, rng)
  };
}

export function updateNPCState(
  npc: NPCInstanceState,
  definition: NPCDefinition,
  deltaSeconds: number,
  exitX: number,
  rng: Rng
): NPCInstanceState {
  const safeDelta = Math.max(0, deltaSeconds);
  const ageSeconds = npc.ageSeconds + safeDelta;
  const startingState = npc.state;
  let state = npc.state;
  let currentSpeed = npc.baseSpeed;
  let nextDistractedAt = npc.nextDistractedAt;
  let distractedUntil = npc.distractedUntil;
  let rantRemainingSeconds = npc.rantRemainingSeconds;
  let immunityRemainingSeconds = npc.immunityRemainingSeconds;
  let hitWindowId = npc.hitWindowId;
  let dangerPhase = npc.dangerPhase;
  let dangerKind = npc.dangerKind;
  let dangerRemainingSeconds = Math.max(0, npc.dangerRemainingSeconds - safeDelta);
  let cleanerCooldownSeconds = Math.max(0, npc.cleanerCooldownSeconds - safeDelta);
  let alertPulse = 0;
  let retaliationCount = npc.retaliationCount;
  let pendingRant = npc.pendingRant;
  let movementSeconds = safeDelta;
  const activeEffects = npc.activeEffects
    .map((effect) => ({ ...effect, remainingSeconds: Math.max(0, effect.remainingSeconds - safeDelta) }))
    .filter((effect) => effect.remainingSeconds > 0);
  const effectSpeedMultiplier = activeEffects.reduce(
    (multiplier, effect) => Math.min(multiplier, effect.slowMultiplier ?? 1),
    1
  );

  if (state === 'Hit') {
    const recording = ability(definition, 'recording');
    const dogAlert = ability(definition, 'dog_alert');
    const retaliate = ability(definition, 'retaliate');
    if (recording) {
      dangerPhase = 'telegraph';
      dangerKind = 'recording';
      dangerRemainingSeconds = recording.telegraphSeconds;
    }
    if (dogAlert) {
      dangerPhase = 'telegraph';
      dangerKind = 'dog_alert';
      dangerRemainingSeconds = dogAlert.telegraphSeconds;
    }
    if (retaliate && npc.validHitCount >= retaliate.hitThreshold && npc.retaliationCount === 0) {
      dangerPhase = 'telegraph';
      dangerKind = 'retaliate';
      dangerRemainingSeconds = retaliate.telegraphSeconds;
    }
    state = 'Ranting';
  }

  if (state === 'Ranting') {
    if (startingState === 'Ranting') {
      pendingRant = undefined;
    }
    rantRemainingSeconds = Math.max(0, rantRemainingSeconds - safeDelta);
    currentSpeed = 0;
    if (rantRemainingSeconds <= 0) {
      state = 'Recovering';
    }
  }

  if (state === 'Recovering' && startingState === 'Recovering') {
    movementSeconds = 0;
    immunityRemainingSeconds = Math.max(0, immunityRemainingSeconds - safeDelta);
    currentSpeed = 0;
    if (immunityRemainingSeconds <= 0) {
      state = 'Walking';
      hitWindowId += 1;
      currentSpeed = npc.baseSpeed;
      movementSeconds = Math.max(0, safeDelta - npc.immunityRemainingSeconds);
    }
  }

  const security = ability(definition, 'security');
  if (security && state === 'Walking' && dangerPhase === 'none' && ageSeconds >= security.observeSeconds) {
    state = 'Searching';
    dangerPhase = 'telegraph';
    dangerKind = 'security';
    dangerRemainingSeconds = security.observeSeconds;
  }

  if (dangerPhase !== 'none' && dangerRemainingSeconds <= 0) {
    if (dangerPhase === 'telegraph') {
      dangerPhase = 'active';
      const activeSeconds = activeSecondsFor(definition, dangerKind);
      dangerRemainingSeconds = activeSeconds;
      if (dangerKind === 'recording') {
        state = 'Recording';
      }
      if (dangerKind === 'security') {
        state = 'Searching';
      }
      if (dangerKind === 'dog_alert') {
        state = 'DogAlert';
      }
      if (dangerKind === 'retaliate') {
        state = 'Retaliating';
        retaliationCount += 1;
      }
    } else if (dangerPhase === 'active') {
      dangerPhase = 'recovery';
      dangerRemainingSeconds = recoverySecondsFor(definition, dangerKind);
    } else {
      dangerPhase = 'none';
      dangerKind = undefined;
      if (state === 'Recording' || state === 'Searching' || state === 'DogAlert' || state === 'Retaliating') {
        state = 'Walking';
      }
    }
  }

  if (dangerPhase === 'active') {
    if (dangerKind === 'recording') {
      alertPulse = (ability(definition, 'recording')?.alertPerSecond ?? 0) * safeDelta;
    }
    if (dangerKind === 'security') {
      alertPulse = (ability(definition, 'security')?.alertPerSecond ?? 0) * safeDelta;
    }
    if (dangerKind === 'dog_alert') {
      alertPulse = ability(definition, 'dog_alert')?.alertIncrease ?? 0;
      dangerPhase = 'recovery';
      dangerRemainingSeconds = 0.8;
    }
  }

  if (ability(definition, 'cleaner') && cleanerCooldownSeconds <= 0 && state === 'Walking') {
    state = 'Cleaning';
    cleanerCooldownSeconds = ability(definition, 'cleaner')?.intervalSeconds ?? 1;
  } else if (state === 'Cleaning') {
    state = 'Walking';
  }

  if (definition.behavior.kind === 'distracted' && state !== 'Ranting' && state !== 'Recovering') {
    if (state !== 'Distracted' && nextDistractedAt !== undefined && ageSeconds >= nextDistractedAt) {
      state = 'Distracted';
      distractedUntil =
        ageSeconds + range(definition.behavior.minDistractedDuration, definition.behavior.maxDistractedDuration, rng);
    }

  if (state === 'Distracted') {
      currentSpeed = npc.baseSpeed * definition.behavior.distractedSpeedMultiplier * effectSpeedMultiplier;
      if (distractedUntil !== undefined && ageSeconds >= distractedUntil) {
        state = 'Walking';
        currentSpeed = npc.baseSpeed * effectSpeedMultiplier;
        nextDistractedAt = ageSeconds + range(definition.behavior.minTimeUntilDistracted, definition.behavior.maxTimeUntilDistracted, rng);
        distractedUntil = undefined;
      }
    }
  }

  if (state !== 'Ranting' && state !== 'Recovering' && state !== 'Distracted') {
    currentSpeed = currentSpeed * effectSpeedMultiplier;
  }

  const x = npc.x - currentSpeed * movementSeconds;
  const distanceTravelled = npc.distanceTravelled + currentSpeed * movementSeconds;
  if (state === 'Entering' && distanceTravelled > 18) {
    state = 'Walking';
  }
  if (x <= exitX) {
    state = 'Exiting';
  }

  return {
    ...npc,
    x,
    state,
    currentSpeed,
    ageSeconds,
    distanceTravelled,
    hitWindowId,
    rantRemainingSeconds,
    immunityRemainingSeconds,
    pendingRant,
    activeEffects,
    dangerPhase,
    dangerKind,
    dangerRemainingSeconds,
    cleanerCooldownSeconds,
    alertPulse,
    retaliationCount,
    nextDistractedAt,
    distractedUntil
  };
}

function ability<K extends NPCDefinition['abilities'][number]['kind']>(
  definition: NPCDefinition,
  kind: K
): Extract<NPCDefinition['abilities'][number], { readonly kind: K }> | undefined {
  return definition.abilities.find((candidate) => candidate.kind === kind) as
    | Extract<NPCDefinition['abilities'][number], { readonly kind: K }>
    | undefined;
}

function activeSecondsFor(definition: NPCDefinition, kind: NPCInstanceState['dangerKind']): number {
  if (kind === 'recording') {
    return ability(definition, 'recording')?.activeSeconds ?? 0;
  }
  if (kind === 'dog_alert') {
    return ability(definition, 'dog_alert')?.activeSeconds ?? 0;
  }
  if (kind === 'retaliate') {
    return ability(definition, 'retaliate')?.activeSeconds ?? 0;
  }
  if (kind === 'security') {
    return ability(definition, 'security')?.searchSeconds ?? 0;
  }
  return 0;
}

function recoverySecondsFor(definition: NPCDefinition, kind: NPCInstanceState['dangerKind']): number {
  if (kind === 'retaliate') {
    return ability(definition, 'retaliate')?.recoverySeconds ?? 0;
  }
  return kind ? 0.8 : 0;
}

function cleanerCooldown(definition: NPCDefinition): number {
  return ability(definition, 'cleaner')?.intervalSeconds ?? 0;
}

function nextDistractedAt(definition: NPCDefinition, rng: Rng): number | undefined {
  if (definition.behavior.kind !== 'distracted') {
    return undefined;
  }

  return range(definition.behavior.minTimeUntilDistracted, definition.behavior.maxTimeUntilDistracted, rng);
}

function range(min: number, max: number, rng: Rng): number {
  return min + (max - min) * rng.next();
}
