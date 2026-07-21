import { describe, expect, it } from 'vitest';
import { createDefaultSave, SAVE_BACKUP_KEY, SAVE_STORAGE_KEY, type SaveClock } from '../../src/domain/persistence/SaveData';
import { InMemorySaveRepository, LocalStorageSaveRepository, UnavailableSaveRepository } from '../../src/platform/persistence/SaveRepository';
import { SaveService } from '../../src/services/SaveService';

const clock: SaveClock = { nowIso: () => '2026-07-21T00:00:00.000Z' };

class FakeStorage implements Storage {
  readonly values = new Map<string, string>();
  failWrites = false;
  get length() { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { if (this.failWrites) throw new DOMException('quota'); this.values.set(key, value); }
}

describe('Save repositories and service', () => {
  it('loads, saves, backs up, and clears only owned keys', () => {
    const storage = new FakeStorage();
    storage.setItem('other-app', 'keep');
    const repository = new LocalStorageSaveRepository(storage);
    expect(repository.load().status).toBe('missing');
    repository.save(createDefaultSave(clock));
    repository.save({ ...createDefaultSave(clock), revision: 1 });
    expect(storage.getItem(SAVE_BACKUP_KEY)).not.toBeNull();
    repository.clear();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem('other-app')).toBe('keep');
  });

  it('recovers a corrupt primary from backup', () => {
    const storage = new FakeStorage();
    storage.setItem(SAVE_STORAGE_KEY, '{broken');
    storage.setItem(SAVE_BACKUP_KEY, JSON.stringify(createDefaultSave(clock)));
    expect(new LocalStorageSaveRepository(storage).load().status).toBe('recovered');
  });

  it('falls back to memory after a write failure without losing session progress', () => {
    const storage = new FakeStorage();
    const service = new SaveService(new LocalStorageSaveRepository(storage), clock);
    storage.failWrites = true;
    const ok = service.markOpeningSeen();
    expect(ok).toBe(false);
    expect(service.state.availability).toBe('memory_only');
    expect(service.state.data.campaign.openingSeen).toBe(true);
  });

  it('supports deterministic in-memory transactions and revisions', () => {
    const service = new SaveService(new InMemorySaveRepository(), clock);
    expect(service.markOpeningSeen()).toBe(true);
    expect(service.state.data.revision).toBe(1);
    expect(service.markOpeningSeen()).toBe(true);
    expect(service.state.data.revision).toBe(1);
  });

  it('starts in memory-only mode when storage is unavailable', () => {
    const service = new SaveService(new UnavailableSaveRepository(), clock);
    expect(service.state.availability).toBe('memory_only');
    expect(service.markOpeningSeen()).toBe(true);
    expect(service.state.data.campaign.openingSeen).toBe(true);
  });
});
