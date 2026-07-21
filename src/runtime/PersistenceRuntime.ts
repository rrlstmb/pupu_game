import { LocalStorageSaveRepository, UnavailableSaveRepository } from '../platform/persistence/SaveRepository';
import { SaveService } from '../services/SaveService';

let singleton: SaveService | undefined;

export function saveService(): SaveService {
  if (!singleton) {
    try { singleton = new SaveService(new LocalStorageSaveRepository(window.localStorage)); }
    catch { singleton = new SaveService(new UnavailableSaveRepository()); }
  }
  return singleton;
}

export function replaceSaveServiceForTests(service: SaveService | undefined): void { singleton = service; }
