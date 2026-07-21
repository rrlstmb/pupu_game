import { createDefaultSettings, validateSettings, type SettingsData } from '../domain/settings/SettingsData';
import { InMemorySettingsRepository, type SettingsRepository } from '../platform/settings/SettingsRepository';

export type SettingsAvailability = 'persistent' | 'memory_only' | 'recovered' | 'incompatible';
export class SettingsService {
  private dataValue: SettingsData;
  private availabilityValue: SettingsAvailability = 'persistent';
  private readonly memory = new InMemorySettingsRepository();
  private writeEnabled = true;
  private subscribers = new Set<(data: SettingsData) => void>();
  private readonly initialReducedMotion: boolean;

  constructor(private readonly repository: SettingsRepository, prefersReducedMotion = false) {
    this.initialReducedMotion = prefersReducedMotion;
    const defaults = createDefaultSettings(prefersReducedMotion);
    const loaded = repository.load();
    if (loaded.status === 'missing') this.dataValue = defaults;
    else if (loaded.status === 'unavailable') { this.dataValue = defaults; this.availabilityValue = 'memory_only'; this.writeEnabled = false; }
    else {
      const checked = validateSettings(loaded.raw, defaults);
      this.dataValue = checked.data;
      if (checked.future) { this.availabilityValue = 'incompatible'; this.writeEnabled = false; }
      else if (!checked.valid) this.availabilityValue = 'recovered';
    }
    this.memory.save(this.dataValue);
  }
  get data(): SettingsData { return this.dataValue; }
  get availability(): SettingsAvailability { return this.availabilityValue; }
  update(mutator: (data: SettingsData) => SettingsData): boolean {
    const checked = validateSettings(mutator(this.dataValue), this.dataValue);
    this.dataValue = checked.data; this.memory.save(this.dataValue); this.apply();
    if (this.writeEnabled && !this.repository.save(this.dataValue).ok) { this.writeEnabled = false; this.availabilityValue = 'memory_only'; return false; }
    return true;
  }
  reset(): boolean {
    if (!this.repository.clear().ok && this.writeEnabled) return false;
    this.dataValue = createDefaultSettings(this.initialReducedMotion);
    this.memory.save(this.dataValue); if (this.writeEnabled) this.repository.save(this.dataValue); this.apply(); return true;
  }
  subscribe(callback: (data: SettingsData) => void): () => void { this.subscribers.add(callback); callback(this.dataValue); return () => this.subscribers.delete(callback); }
  apply(): void { this.subscribers.forEach((callback) => callback(this.dataValue)); }
}
