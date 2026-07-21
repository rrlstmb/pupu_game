import { LocalStorageSettingsRepository, InMemorySettingsRepository } from '../platform/settings/SettingsRepository';
import { SettingsService } from '../services/SettingsService';

let singleton: SettingsService | undefined;
export function settingsService(): SettingsService {
  if (!singleton) {
    let repository;
    try { repository = new LocalStorageSettingsRepository(window.localStorage); }
    catch { repository = new InMemorySettingsRepository(); }
    singleton = new SettingsService(repository, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  return singleton;
}
