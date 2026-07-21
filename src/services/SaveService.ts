import { createDefaultSave, type SaveAvailability, type SaveClock, type SaveData, systemSaveClock } from '../domain/persistence/SaveData';
import { migrateSave } from '../domain/persistence/SaveMigration';
import { validateAndRepairSave } from '../domain/persistence/SaveValidation';
import type { LevelCompletionResult, ResultCommit } from '../domain/progression/ProgressionService';
import { applyLevelResult } from '../domain/progression/ProgressionService';
import type { RunContext } from '../domain/modes/ModeRegistry';
import { InMemorySaveRepository, type SaveRepository } from '../platform/persistence/SaveRepository';

export type SaveServiceState = {
  readonly data: SaveData;
  readonly availability: SaveAvailability;
  readonly notice?: string;
  readonly writeCount: number;
};

export class SaveService {
  private memory = new InMemorySaveRepository();
  private stateValue: SaveServiceState;
  private writeEnabled = true;

  constructor(private readonly repository: SaveRepository, private readonly clock: SaveClock = systemSaveClock) {
    this.stateValue = { data: createDefaultSave(clock), availability: 'persistent', writeCount: 0 };
    this.load();
  }

  get state(): SaveServiceState { return this.stateValue; }

  private load(): void {
    const loaded = this.repository.load();
    if (loaded.status === 'missing') {
      const written = this.repository.save(this.stateValue.data);
      if (!written.ok) {
        this.writeEnabled = false;
        this.stateValue = { ...this.stateValue, availability: 'memory_only', notice: '本次進度僅保留於目前遊戲工作階段' };
      }
      return;
    }
    if (loaded.status === 'unavailable') {
      this.writeEnabled = false;
      this.stateValue = { ...this.stateValue, availability: 'memory_only', notice: '本次進度僅保留於目前遊戲工作階段' };
      return;
    }
    if (loaded.raw === undefined) {
      this.stateValue = { ...this.stateValue, availability: 'recovered', notice: '已建立安全的新進度' };
      return;
    }
    const migrated = migrateSave(loaded.raw, this.clock);
    if (!migrated.valid) {
      const future = migrated.reason.startsWith('future schema');
      this.writeEnabled = !future;
      this.stateValue = {
        ...this.stateValue,
        availability: future ? 'incompatible' : 'recovered',
        notice: future ? '此進度來自較新版本，本次將使用暫時進度' : '存檔損壞，已載入安全進度'
      };
      return;
    }
    this.stateValue = {
      data: migrated.data,
      availability: loaded.status === 'recovered' || migrated.repaired ? 'recovered' : 'persistent',
      ...(loaded.status === 'recovered' || migrated.repaired ? { notice: '已修復本機進度' } : {}),
      writeCount: 0
    };
    this.memory.save(migrated.data);
  }

  transact(mutator: (data: SaveData) => SaveData): boolean {
    const now = this.clock.nowIso();
    const candidate = mutator(this.stateValue.data);
    if (candidate === this.stateValue.data) return true;
    const next = { ...candidate, revision: this.stateValue.data.revision + 1, metadata: { ...candidate.metadata, updatedAt: now } };
    const checked = validateAndRepairSave(next, this.clock);
    if (!checked.valid) return false;
    this.memory.save(checked.data);
    if (this.writeEnabled) {
      const written = this.repository.save(checked.data);
      if (!written.ok) {
        this.writeEnabled = false;
        this.stateValue = {
          data: checked.data, availability: 'memory_only', notice: '本次進度未能保存', writeCount: this.stateValue.writeCount
        };
        return false;
      }
    }
    this.stateValue = { ...this.stateValue, data: checked.data, writeCount: this.stateValue.writeCount + 1 };
    return true;
  }

  commitResult(result: LevelCompletionResult, context: RunContext): ResultCommit & { readonly persisted: boolean } {
    let commit: ResultCommit = { data: this.stateValue.data, changed: false, newRecord: false, unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: [] };
    const persisted = this.transact((data) => {
      commit = applyLevelResult(data, result, context, this.clock.nowIso());
      return commit.data;
    });
    return { ...commit, data: this.stateValue.data, persisted };
  }

  markOpeningSeen(): boolean {
    if (this.stateValue.data.campaign.openingSeen) return true;
    return this.transact((data) => ({ ...data, campaign: { ...data.campaign, openingSeen: true } }));
  }

  markTutorialSeen(tutorialId: string): boolean {
    if (this.stateValue.data.unlocks.tutorialIds.includes(tutorialId)) return true;
    return this.transact((data) => ({ ...data, unlocks: { ...data.unlocks, tutorialIds: [...data.unlocks.tutorialIds, tutorialId].sort() } }));
  }

  resetProgress(): boolean {
    const cleared = this.repository.clear();
    if (!cleared.ok && this.writeEnabled) {
      this.stateValue = { ...this.stateValue, notice: '進度未能清除' };
      return false;
    }
    const fresh = createDefaultSave(this.clock);
    const saved = this.writeEnabled ? this.repository.save(fresh) : { ok: true as const };
    if (!saved.ok) return false;
    this.memory.clear(); this.memory.save(fresh);
    this.stateValue = { data: fresh, availability: this.writeEnabled ? 'persistent' : 'memory_only', writeCount: this.stateValue.writeCount + 1 };
    return true;
  }
}
