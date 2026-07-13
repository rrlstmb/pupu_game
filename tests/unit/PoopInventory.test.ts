import { describe, expect, it } from 'vitest';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import {
  canUseSelectedPoop,
  consumeSelectedPoop,
  createPoopInventory,
  selectedSlot,
  selectedPoopType,
  switchPoop,
  updatePoopCooldowns
} from '../../src/domain/poop/PoopInventory';

describe('PoopInventory', () => {
  it('switches with wraparound using Q/E semantics', () => {
    let state = createPoopInventory(POOP_DEFINITIONS);

    expect(selectedPoopType(state)).toBe('normal_poop');
    state = switchPoop(state, 1);
    expect(selectedPoopType(state)).toBe('sticky_poop');
    state = switchPoop(state, -1);
    expect(selectedPoopType(state)).toBe('normal_poop');
    state = switchPoop(state, -1);
    expect(selectedPoopType(state)).toBe('golden_poop');
  });

  it('consumes finite stock and applies selected cooldown', () => {
    let state = switchPoop(createPoopInventory(POOP_DEFINITIONS), 1);
    state = consumeSelectedPoop(state, POOP_DEFINITIONS);

    expect(selectedSlot(state).stock).toBe(3);
    expect(selectedSlot(state).cooldownRemainingSeconds).toBeGreaterThan(0);
    expect(canUseSelectedPoop(state)).toBe(false);
    state = updatePoopCooldowns(state, 10);
    expect(canUseSelectedPoop(state)).toBe(true);
  });

  it('keeps normal poop infinite', () => {
    let state = createPoopInventory(POOP_DEFINITIONS);
    state = consumeSelectedPoop(state, POOP_DEFINITIONS);

    expect(selectedSlot(state).stock).toBe('infinite');
  });
});
