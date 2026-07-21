import { CAMPAIGN_LEVELS } from '../../data/campaign';
import { POOP_DEFINITIONS } from '../../data/poopDefinitions';
import { CHALLENGE_DEFINITIONS, REGISTERED_MODE_IDS } from '../modes/ModeRegistry';
import { PLAYER_TITLES } from '../progression/PlayerTitles';
import { createDefaultSave, SAVE_SCHEMA_VERSION, type ChallengePersistentRecord, type LevelPersistentRecord, type SaveClock, type SaveData } from './SaveData';

export type SaveValidationResult = { readonly valid: true; readonly data: SaveData; readonly repaired: boolean } |
  { readonly valid: false; readonly reason: string };

const levelIds = CAMPAIGN_LEVELS.map((entry) => entry.definition.id);
const levelSet = new Set(levelIds);
const poopSet = new Set(POOP_DEFINITIONS.map((definition) => definition.id));
const modeSet = new Set<string>(REGISTERED_MODE_IDS);
const challengeSet = new Set(CHALLENGE_DEFINITIONS.map((definition) => definition.id));
const titleSet = new Set<string>(PLAYER_TITLES);

function record(input: unknown): Record<string, unknown> | undefined {
  return typeof input === 'object' && input !== null && !Array.isArray(input) ? input as Record<string, unknown> : undefined;
}

function finiteNonNegative(input: unknown, fallback = 0): number {
  return typeof input === 'number' && Number.isFinite(input) && input >= 0 ? input : fallback;
}

function integer(input: unknown, fallback = 0): number { return Math.floor(finiteNonNegative(input, fallback)); }
function iso(input: unknown): string | undefined {
  return typeof input === 'string' && !Number.isNaN(Date.parse(input)) ? input : undefined;
}
function ids(input: unknown, allowed: ReadonlySet<string>): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((id): id is string => typeof id === 'string' && allowed.has(id)))].sort();
}

function levelRecord(levelId: string, input: unknown): LevelPersistentRecord | undefined {
  const value = record(input);
  if (!value) return undefined;
  const completionCount = integer(value.completionCount);
  const completed = value.completed === true || completionCount > 0;
  const result: LevelPersistentRecord = {
    levelId,
    completed,
    completionCount: completed ? Math.max(1, completionCount) : 0,
    bestScore: integer(value.bestScore),
    bestStars: Math.min(3, integer(value.bestStars)),
    bestAccuracy: Math.min(1, finiteNonNegative(value.bestAccuracy)),
    bestCombo: integer(value.bestCombo)
  };
  const bestTime = finiteNonNegative(value.bestCompletionTimeMs, -1);
  const first = iso(value.firstCompletedAt);
  const last = iso(value.lastCompletedAt);
  return {
    ...result,
    ...(bestTime >= 0 ? { bestCompletionTimeMs: bestTime } : {}),
    ...(first ? { firstCompletedAt: first } : {}),
    ...(last ? { lastCompletedAt: last } : {})
  };
}

function challengeRecord(challengeId: string, input: unknown): ChallengePersistentRecord | undefined {
  const value = record(input);
  if (!value) return undefined;
  const attempts = integer(value.attempts);
  const completions = Math.min(attempts, integer(value.completions));
  const rank = typeof value.bestRank === 'string' && ['S', 'A', 'B', 'C'].includes(value.bestRank) ? value.bestRank : undefined;
  const time = finiteNonNegative(value.bestCompletionTimeMs, -1);
  return {
    challengeId, attempts, completions, bestScore: integer(value.bestScore),
    ...(rank ? { bestRank: rank } : {}), ...(time >= 0 ? { bestCompletionTimeMs: time } : {})
  };
}

export function validateAndRepairSave(input: unknown, clock: SaveClock): SaveValidationResult {
  const root = record(input);
  if (!root) return { valid: false, reason: 'save is not an object' };
  if (root.schemaVersion !== SAVE_SCHEMA_VERSION) return { valid: false, reason: 'schema version mismatch' };
  const defaults = createDefaultSave(clock);
  const campaign = record(root.campaign) ?? {};
  const unlocks = record(root.unlocks) ?? {};
  const modes = record(root.modes) ?? {};
  const rawLevelRecords = record(campaign.levelRecords) ?? {};
  const levelRecords: Record<string, LevelPersistentRecord> = {};
  for (const levelId of levelIds) {
    const parsed = levelRecord(levelId, rawLevelRecords[levelId]);
    if (parsed) levelRecords[levelId] = parsed;
  }
  const completedFromRecords = Object.values(levelRecords).filter((item) => item.completed).map((item) => item.levelId);
  const completedLevelIds = ids([...(Array.isArray(campaign.completedLevelIds) ? campaign.completedLevelIds : []), ...completedFromRecords], levelSet);
  const unlocked = ids(unlocks.levelIds, levelSet);
  unlocked.push('level_01');
  for (const completedId of completedLevelIds) {
    const index = levelIds.indexOf(completedId);
    if (index >= 0) unlocked.push(completedId);
    if (index >= 0 && index + 1 < levelIds.length) unlocked.push(levelIds[index + 1]);
  }
  const unlockedLevelIds = [...new Set(unlocked)].sort((a, b) => levelIds.indexOf(a) - levelIds.indexOf(b));
  const rawChallengeRecords = record(modes.challengeRecords) ?? {};
  const challengeRecords: Record<string, ChallengePersistentRecord> = {};
  for (const challengeId of challengeSet) {
    const parsed = challengeRecord(challengeId, rawChallengeRecords[challengeId]);
    if (parsed) challengeRecords[challengeId] = parsed;
  }
  const metadata = record(root.metadata) ?? {};
  const createdAt = iso(metadata.createdAt) ?? defaults.metadata.createdAt;
  const updatedAt = iso(metadata.updatedAt) ?? createdAt;
  const highestUnlockedLevelId = unlockedLevelIds.at(-1) ?? 'level_01';
  const data: SaveData = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    revision: integer(root.revision),
    metadata: { createdAt, updatedAt, ...(typeof metadata.gameVersion === 'string' ? { gameVersion: metadata.gameVersion.slice(0, 32) } : {}) },
    campaign: {
      started: campaign.started === true || completedLevelIds.length > 0,
      completed: campaign.completed === true || completedLevelIds.includes(levelIds.at(-1)!),
      highestUnlockedLevelId,
      completedLevelIds,
      openingSeen: campaign.openingSeen === true,
      levelRecords
    },
    unlocks: {
      levelIds: unlockedLevelIds,
      poopTypeIds: ids(unlocks.poopTypeIds, poopSet).length > 0 ? ids(unlocks.poopTypeIds, poopSet) : ['normal_poop'],
      modeIds: ids(unlocks.modeIds, modeSet),
      tutorialIds: Array.isArray(unlocks.tutorialIds) ? [...new Set(unlocks.tutorialIds.filter((id): id is string => typeof id === 'string'))].sort() : [],
      titleIds: ids(unlocks.titleIds, titleSet)
    },
    modes: { challengeRecords },
    processedResultTokens: Array.isArray(root.processedResultTokens)
      ? [...new Set(root.processedResultTokens.filter((token): token is string => typeof token === 'string' && token.length <= 160))].slice(-256)
      : []
  };
  return { valid: true, data, repaired: JSON.stringify(input) !== JSON.stringify(data) };
}
