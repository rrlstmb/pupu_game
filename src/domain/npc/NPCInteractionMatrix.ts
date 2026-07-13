import type { PoopType } from '../poop/PoopModel';
import type { NPCType } from './NPCModel';

export type NPCPoopOutcome = 'normal' | 'blocked' | 'weak' | 'effective' | 'risky';

export type NPCPoopInteraction = {
  readonly npcType: NPCType;
  readonly poopType: PoopType;
  readonly outcome: NPCPoopOutcome;
  readonly alertDelta: number;
  readonly scoreDelta: number;
  readonly tags: readonly string[];
};

export type InteractionMatrixValidation = {
  readonly missingPairs: readonly string[];
  readonly duplicatePairs: readonly string[];
};

export function interactionFor(
  matrix: readonly NPCPoopInteraction[],
  npcType: NPCType,
  poopType: PoopType,
  safeDefault: NPCPoopInteraction
): NPCPoopInteraction {
  return matrix.find((entry) => entry.npcType === npcType && entry.poopType === poopType) ?? {
    ...safeDefault,
    npcType,
    poopType
  };
}

export function validateInteractionMatrix(
  matrix: readonly NPCPoopInteraction[],
  npcTypes: readonly NPCType[],
  poopTypes: readonly PoopType[]
): InteractionMatrixValidation {
  const seen = new Set<string>();
  const duplicatePairs: string[] = [];
  for (const entry of matrix) {
    const key = `${entry.npcType}:${entry.poopType}`;
    if (seen.has(key)) {
      duplicatePairs.push(key);
    }
    seen.add(key);
  }

  const missingPairs: string[] = [];
  for (const npcType of npcTypes) {
    for (const poopType of poopTypes) {
      if (!seen.has(`${npcType}:${poopType}`)) {
        missingPairs.push(`${npcType}:${poopType}`);
      }
    }
  }

  return { missingPairs, duplicatePairs };
}

export function isBlockedByInteraction(interaction: NPCPoopInteraction, projectileBounceCount: number): boolean {
  if (interaction.outcome !== 'blocked') {
    return false;
  }

  return !(interaction.tags.includes('umbrella_blocks') && projectileBounceCount > 0);
}
