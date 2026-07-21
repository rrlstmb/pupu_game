import { SETTINGS_STORAGE_KEY, type SettingsData } from '../../domain/settings/SettingsData';

export type SettingsLoadResult = { readonly status: 'ok'; readonly raw: unknown } | { readonly status: 'missing' } | { readonly status: 'unavailable' };
export type SettingsWriteResult = { readonly ok: boolean };
export interface SettingsRepository { load(): SettingsLoadResult; save(data: SettingsData): SettingsWriteResult; clear(): SettingsWriteResult }

export class InMemorySettingsRepository implements SettingsRepository {
  private value?: unknown;
  load(): SettingsLoadResult { return this.value === undefined ? { status: 'missing' } : { status: 'ok', raw: structuredClone(this.value) }; }
  save(data: SettingsData): SettingsWriteResult { this.value = structuredClone(data); return { ok: true }; }
  clear(): SettingsWriteResult { this.value = undefined; return { ok: true }; }
}

export class LocalStorageSettingsRepository implements SettingsRepository {
  constructor(private readonly storage: Storage, private readonly key = SETTINGS_STORAGE_KEY) {}
  load(): SettingsLoadResult {
    try { const value = this.storage.getItem(this.key); return value === null ? { status: 'missing' } : { status: 'ok', raw: JSON.parse(value) as unknown }; }
    catch { return { status: 'unavailable' }; }
  }
  save(data: SettingsData): SettingsWriteResult { try { this.storage.setItem(this.key, JSON.stringify(data)); return { ok: true }; } catch { return { ok: false }; } }
  clear(): SettingsWriteResult { try { this.storage.removeItem(this.key); return { ok: true }; } catch { return { ok: false }; } }
}
