import { describe, expect, it } from 'vitest';
import { LEVEL_10 } from '../../src/data/levels/level10';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';

describe('Level 10', () => {
  it('validates the three-phase clean-city boss encounter', () => {
    expect(validateLevelDefinition(LEVEL_10).valid).toBe(true);
    expect(LEVEL_10.name).toContain('城市潔淨日');
    expect(LEVEL_10.seed).toBe('level-10-clean-city-boss-seed');
    expect(LEVEL_10.completionMode).toBe('boss_final_hit');
    expect(LEVEL_10.bossEncounter?.phases.map((phase) => phase.id)).toEqual([
      'phase_1_parade', 'phase_2_protected_boss', 'phase_3_rooftop_lockdown'
    ]);
    expect(LEVEL_10.bossEncounter?.protections.map((gate) => gate.requiredInteraction)).toEqual([
      'camera_interrupt', 'jumbo_or_bounce', 'sticky_slow'
    ]);
  });

  it('reserves two final golden attempts and authors safe blockade stages', () => {
    expect(LEVEL_10.poopStockOverrides?.golden_poop).toBe(0);
    expect(LEVEL_10.bossEncounter?.finalGolden).toMatchObject({ grantedOnPhaseEnter: 2, maxAttempts: 2, reservedForFinalPhase: true });
    expect(LEVEL_10.bossEncounter?.safety.blockedStages).toHaveLength(2);
    expect(LEVEL_10.events.some((event) => event.channel === 'bossChannel')).toBe(true);
  });
});
