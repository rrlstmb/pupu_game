import { describe, expect, it } from 'vitest';
import { createDefaultSettings, SETTINGS_STORAGE_KEY, validateSettings } from '../../src/domain/settings/SettingsData';
import { InMemorySettingsRepository, LocalStorageSettingsRepository } from '../../src/platform/settings/SettingsRepository';
import { SettingsService } from '../../src/services/SettingsService';

describe('settings data', () => {
  it('has independent deterministic defaults and clamps invalid values', () => {
    const defaults = createDefaultSettings(false);
    const checked = validateSettings({ ...defaults, audio: { ...defaults.audio, masterVolume: 9 }, controls: { ...defaults.controls, touchMovementSensitivity: -3 } });
    expect(SETTINGS_STORAGE_KEY).not.toContain('.save.');
    expect(checked.data.audio.masterVolume).toBe(1);
    expect(checked.data.controls.touchMovementSensitivity).toBe(0.5);
  });

  it('does not overwrite a future version', () => {
    expect(validateSettings({ schemaVersion: 99 }).future).toBe(true);
  });

  it('persists and resets independently through its repository', () => {
    const repository = new InMemorySettingsRepository();
    const service = new SettingsService(repository);
    service.update((data) => ({ ...data, visual: { ...data.visual, highContrast: true, textScale: 1.3 } }));
    expect(new SettingsService(repository).data.visual).toMatchObject({ highContrast: true, textScale: 1.3 });
    service.reset();
    expect(service.data.visual.highContrast).toBe(false);
  });

  it('clear removes only the settings key', () => {
    const values = new Map<string, string>([['shiming-bida.save.v1', 'progress']]);
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } } as Storage;
    const repository = new LocalStorageSettingsRepository(storage);
    repository.save(createDefaultSettings()); repository.clear();
    expect(values.get('shiming-bida.save.v1')).toBe('progress');
  });
});
