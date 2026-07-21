export const SAVE_SCHEMA_VERSION = 1 as const;
export const SAVE_STORAGE_KEY = 'shiming-bida.save.v1';
export const SAVE_BACKUP_KEY = `${SAVE_STORAGE_KEY}.backup`;

export type SaveAvailability = 'persistent' | 'memory_only' | 'recovered' | 'incompatible';

export type LevelPersistentRecord = {
  readonly levelId: string;
  readonly completed: boolean;
  readonly completionCount: number;
  readonly bestScore: number;
  readonly bestStars: number;
  readonly bestAccuracy: number;
  readonly bestCombo: number;
  readonly bestCompletionTimeMs?: number;
  readonly firstCompletedAt?: string;
  readonly lastCompletedAt?: string;
};

export type ChallengePersistentRecord = {
  readonly challengeId: string;
  readonly attempts: number;
  readonly completions: number;
  readonly bestScore: number;
  readonly bestRank?: string;
  readonly bestCompletionTimeMs?: number;
};

export type SaveData = {
  readonly schemaVersion: typeof SAVE_SCHEMA_VERSION;
  readonly revision: number;
  readonly metadata: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly gameVersion?: string;
  };
  readonly campaign: {
    readonly started: boolean;
    readonly completed: boolean;
    readonly highestUnlockedLevelId: string;
    readonly completedLevelIds: readonly string[];
    readonly openingSeen: boolean;
    readonly levelRecords: Readonly<Record<string, LevelPersistentRecord>>;
  };
  readonly unlocks: {
    readonly levelIds: readonly string[];
    readonly poopTypeIds: readonly string[];
    readonly modeIds: readonly string[];
    readonly tutorialIds: readonly string[];
    readonly titleIds: readonly string[];
  };
  readonly modes: {
    readonly challengeRecords: Readonly<Record<string, ChallengePersistentRecord>>;
  };
  readonly processedResultTokens: readonly string[];
};

export type SaveClock = { nowIso(): string };

export const systemSaveClock: SaveClock = { nowIso: () => new Date().toISOString() };

export function createDefaultSave(clock: SaveClock = systemSaveClock): SaveData {
  const now = clock.nowIso();
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    revision: 0,
    metadata: { createdAt: now, updatedAt: now },
    campaign: {
      started: false,
      completed: false,
      highestUnlockedLevelId: 'level_01',
      completedLevelIds: [],
      openingSeen: false,
      levelRecords: {}
    },
    unlocks: {
      levelIds: ['level_01'],
      poopTypeIds: ['normal_poop'],
      modeIds: [],
      tutorialIds: [],
      titleIds: []
    },
    modes: { challengeRecords: {} },
    processedResultTokens: []
  };
}
