import type { PoopDefinition, PoopType } from './PoopModel';

export type PoopInventorySlot = {
  readonly poopType: PoopType;
  readonly stock: number | 'infinite';
  readonly cooldownRemainingSeconds: number;
};

export type PoopInventoryState = {
  readonly slots: readonly PoopInventorySlot[];
  readonly selectedIndex: number;
};

export function createPoopInventory(definitions: readonly PoopDefinition[]): PoopInventoryState {
  return {
    selectedIndex: 0,
    slots: definitions.map((definition) => ({
      poopType: definition.id,
      stock: definition.initialStock,
      cooldownRemainingSeconds: 0
    }))
  };
}

export function selectedPoopType(state: PoopInventoryState): PoopType {
  return state.slots[state.selectedIndex].poopType;
}

export function selectedSlot(state: PoopInventoryState): PoopInventorySlot {
  return state.slots[state.selectedIndex];
}

export function switchPoop(state: PoopInventoryState, direction: -1 | 1): PoopInventoryState {
  const next = (state.selectedIndex + direction + state.slots.length) % state.slots.length;
  return { ...state, selectedIndex: next };
}

export function selectPoopByIndex(state: PoopInventoryState, selectedIndex: number): PoopInventoryState {
  const clampedIndex = Math.min(state.slots.length - 1, Math.max(0, selectedIndex));
  return { ...state, selectedIndex: clampedIndex };
}

export function updatePoopCooldowns(state: PoopInventoryState, deltaSeconds: number): PoopInventoryState {
  const delta = Math.max(0, deltaSeconds);
  return {
    ...state,
    slots: state.slots.map((slot) => ({
      ...slot,
      cooldownRemainingSeconds: Math.max(0, slot.cooldownRemainingSeconds - delta)
    }))
  };
}

export function canUseSelectedPoop(state: PoopInventoryState): boolean {
  const slot = selectedSlot(state);
  return slot.cooldownRemainingSeconds <= 0 && (slot.stock === 'infinite' || slot.stock > 0);
}

export function consumeSelectedPoop(
  state: PoopInventoryState,
  definitions: readonly PoopDefinition[]
): PoopInventoryState {
  if (!canUseSelectedPoop(state)) {
    return state;
  }

  const selected = selectedSlot(state);
  const definition = definitions.find((candidate) => candidate.id === selected.poopType);
  if (!definition) {
    throw new Error(`Unknown selected poop: ${selected.poopType}`);
  }

  return {
    ...state,
    slots: state.slots.map((slot, index) =>
      index === state.selectedIndex
        ? {
            ...slot,
            stock: slot.stock === 'infinite' ? 'infinite' : slot.stock - 1,
            cooldownRemainingSeconds: definition.projectile.cooldownSeconds
          }
        : slot
    )
  };
}
