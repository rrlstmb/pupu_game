import { CAMPAIGN_LEVELS } from '../../data/campaign';
import type { SaveClock } from './SaveData';
import { createDefaultSave, SAVE_SCHEMA_VERSION } from './SaveData';
import { validateAndRepairSave, type SaveValidationResult } from './SaveValidation';

export type SaveMigration = { readonly fromVersion: number; readonly toVersion: number; migrate(input: unknown, clock: SaveClock): unknown };

function asRecord(input: unknown): Record<string, unknown> { return typeof input === 'object' && input !== null ? input as Record<string, unknown> : {}; }

const v0ToV1: SaveMigration = {
  fromVersion: 0, toVersion: 1,
  migrate(input, clock) {
    const source = asRecord(input);
    const defaultSave = createDefaultSave(clock);
    const completed = Array.isArray(source.completedLevelIds) ? source.completedLevelIds : [];
    const unlocked = Array.isArray(source.unlockedLevelIds) ? source.unlockedLevelIds : ['level_01'];
    const records = asRecord(source.levelRecords);
    return {
      ...defaultSave,
      campaign: {
        ...defaultSave.campaign,
        started: source.started === true || completed.length > 0,
        completed: source.completed === true,
        completedLevelIds: completed,
        openingSeen: source.openingSeen === true,
        levelRecords: records
      },
      unlocks: {
        ...defaultSave.unlocks,
        levelIds: unlocked,
        poopTypeIds: Array.isArray(source.unlockedPoopTypeIds) ? source.unlockedPoopTypeIds : ['normal_poop']
      }
    };
  }
};

export const SAVE_MIGRATIONS: readonly SaveMigration[] = [v0ToV1];

export type MigrationResult = SaveValidationResult & { readonly migrated?: boolean };

export function migrateSave(input: unknown, clock: SaveClock): MigrationResult {
  const root = asRecord(input);
  const rawVersion = root.schemaVersion;
  if (typeof rawVersion === 'number' && rawVersion > SAVE_SCHEMA_VERSION) return { valid: false, reason: `future schema ${rawVersion}` };
  let version = typeof rawVersion === 'number' ? rawVersion : 0;
  let current = input;
  while (version < SAVE_SCHEMA_VERSION) {
    const migration = SAVE_MIGRATIONS.find((candidate) => candidate.fromVersion === version);
    if (!migration) return { valid: false, reason: `missing migration from ${version}` };
    current = migration.migrate(current, clock);
    version = migration.toVersion;
  }
  const validated = validateAndRepairSave(current, clock);
  if (!validated.valid) return validated;
  const data = rawVersion !== SAVE_SCHEMA_VERSION
    ? { ...validated.data, unlocks: { ...validated.data.unlocks, poopTypeIds: inferredPoopUnlocks(validated.data.campaign.completedLevelIds) } }
    : validated.data;
  return { ...validated, data, migrated: rawVersion !== SAVE_SCHEMA_VERSION };
}

export function inferredPoopUnlocks(completedLevelIds: readonly string[]): readonly string[] {
  const result = new Set<string>(['normal_poop']);
  for (const { definition } of CAMPAIGN_LEVELS) {
    if (completedLevelIds.includes(definition.id)) definition.availablePoopTypes.forEach((type) => { if (type !== 'golden_poop') result.add(type); });
  }
  return [...result].sort();
}
