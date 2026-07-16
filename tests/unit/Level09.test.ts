import { describe, expect, it } from 'vitest';
import { LEVEL_09 } from '../../src/data/levels/level09';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';
import { activeEventForChannel, createLevelSession, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { evaluateStars } from '../../src/domain/level/StarEvaluation';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { createPoopInventory } from '../../src/domain/poop/PoopInventory';

describe('Level 09', () => {
  it('validates night patrol, guards, searchlights, rare golden stock, and safe blockade', () => {
    expect(validateLevelDefinition(LEVEL_09).valid).toBe(true);
    expect(LEVEL_09.name).toContain('保全巡邏');
    expect(LEVEL_09.seed).toBe('level-09-security-patrol-seed');
    expect(LEVEL_09.spawn.definitions).toContainEqual(expect.objectContaining({ npcType: 'security_guard' }));
    expect(LEVEL_09.availablePoopTypes).toContain('golden_poop');
    expect(LEVEL_09.poopStockOverrides?.golden_poop).toBe(1);
    expect(LEVEL_09.security?.searchlights).toHaveLength(2);
  });

  it('creates a retry-safe rare golden inventory from the authored override', () => {
    const definitions = POOP_DEFINITIONS
      .filter((definition) => LEVEL_09.availablePoopTypes.includes(definition.id))
      .map((definition) => ({
        ...definition,
        initialStock: LEVEL_09.poopStockOverrides?.[definition.id] ?? definition.initialStock
      }));
    const firstAttempt = createPoopInventory(definitions);
    const retry = createPoopInventory(definitions);
    expect(firstAttempt.slots.find((slot) => slot.poopType === 'golden_poop')?.stock).toBe(1);
    expect(retry).toEqual(firstAttempt);
  });

  it('activates security, blockade, spawn, and presentation channels independently once', () => {
    let session = createLevelSession(LEVEL_09);
    session = updateLevelSession(session, 3);
    session = updateLevelSession(session, LEVEL_09.durationSeconds - 35);
    expect(activeEventForChannel(LEVEL_09, session, 'securityChannel')?.security).toBeDefined();
    expect(activeEventForChannel(LEVEL_09, session, 'blockadeChannel')?.blockade).toEqual({ activate: true });
    expect(activeEventForChannel(LEVEL_09, session, 'spawnChannel')?.spawn).toBeDefined();
    const ids = session.triggeredEventIds;
    expect(updateLevelSession(session, 1).triggeredEventIds).toEqual(ids);
  });

  it('evaluates security avoidance and legal golden-hit stars separately', () => {
    const base = { totalScore: 2400, highestCombo: 0, hitCount: 1, throwCount: 1 };
    expect(evaluateStars(LEVEL_09, { ...base, guardObservationsAvoided: 2, goldenPoopHits: 1 }).starsEarned).toBe(2);
    expect(evaluateStars(LEVEL_09, { ...base, guardObservationsAvoided: 3, goldenPoopHits: 1 }).starsEarned).toBe(3);
  });
});
