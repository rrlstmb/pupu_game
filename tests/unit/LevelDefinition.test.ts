import { describe, expect, it } from 'vitest';
import { LEVEL_01 } from '../../src/data/levels/level01';
import { loadLevelDefinition, validateLevelDefinition } from '../../src/domain/level/LevelDefinition';

describe('LevelDefinition runtime schema', () => {
  it('accepts the authored Level 1 definition', () => {
    const result = validateLevelDefinition(LEVEL_01);
    expect(result.valid).toBe(true);
    expect(LEVEL_01).toMatchObject({
      durationSeconds: 90,
      targetScore: 500,
      availablePoopTypes: ['normal_poop'],
      aimAssist: 'always'
    });
    expect(LEVEL_01.spawn.definitions).toEqual([{ npcType: 'office_worker', weight: 1 }]);
  });

  it('returns diagnostic errors instead of accepting undefined fields', () => {
    const result = validateLevelDefinition({ id: 'broken', durationSeconds: -1, availablePoopTypes: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('name must be a non-empty string');
      expect(result.errors).toContain('durationSeconds must be positive');
      expect(result.errors).toContain('spawn must be an object');
    }
  });

  it('throws a single diagnosable load error for invalid data', () => {
    expect(() => loadLevelDefinition({})).toThrowError(/Invalid LevelDefinition/);
  });
});
