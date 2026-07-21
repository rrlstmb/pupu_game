import { SAVE_BACKUP_KEY, SAVE_STORAGE_KEY, type SaveData } from '../../domain/persistence/SaveData';

export type SaveLoadResult =
  | { readonly status: 'ok'; readonly raw: unknown }
  | { readonly status: 'missing' }
  | { readonly status: 'recovered'; readonly raw: unknown; readonly reason: string }
  | { readonly status: 'unavailable'; readonly reason: string };
export type SaveWriteResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export interface SaveRepository {
  load(): SaveLoadResult;
  save(data: SaveData): SaveWriteResult;
  clear(): SaveWriteResult;
}

export class InMemorySaveRepository implements SaveRepository {
  private value?: unknown;
  load(): SaveLoadResult { return this.value === undefined ? { status: 'missing' } : { status: 'ok', raw: structuredClone(this.value) }; }
  save(data: SaveData): SaveWriteResult { this.value = structuredClone(data); return { ok: true }; }
  clear(): SaveWriteResult { this.value = undefined; return { ok: true }; }
}

export class UnavailableSaveRepository implements SaveRepository {
  load(): SaveLoadResult { return { status: 'unavailable', reason: 'local storage unavailable' }; }
  save(): SaveWriteResult { return { ok: false, reason: 'local storage unavailable' }; }
  clear(): SaveWriteResult { return { ok: false, reason: 'local storage unavailable' }; }
}

export class LocalStorageSaveRepository implements SaveRepository {
  constructor(private readonly storage: Storage, private readonly key = SAVE_STORAGE_KEY, private readonly backupKey = SAVE_BACKUP_KEY) {}

  load(): SaveLoadResult {
    try {
      const primary = this.storage.getItem(this.key);
      if (primary === null) return { status: 'missing' };
      try { return { status: 'ok', raw: JSON.parse(primary) as unknown }; }
      catch {
        const backup = this.storage.getItem(this.backupKey);
        if (backup === null) return { status: 'recovered', raw: undefined, reason: 'corrupt save; no backup' };
        try { return { status: 'recovered', raw: JSON.parse(backup) as unknown, reason: 'primary corrupt; backup loaded' }; }
        catch { return { status: 'recovered', raw: undefined, reason: 'primary and backup corrupt' }; }
      }
    } catch { return { status: 'unavailable', reason: 'local storage unavailable' }; }
  }

  save(data: SaveData): SaveWriteResult {
    try {
      const previous = this.storage.getItem(this.key);
      if (previous !== null) this.storage.setItem(this.backupKey, previous);
      this.storage.setItem(this.key, JSON.stringify(data));
      return { ok: true };
    } catch { return { ok: false, reason: 'local progress could not be saved' }; }
  }

  clear(): SaveWriteResult {
    try { this.storage.removeItem(this.key); this.storage.removeItem(this.backupKey); return { ok: true }; }
    catch { return { ok: false, reason: 'local progress could not be cleared' }; }
  }
}
