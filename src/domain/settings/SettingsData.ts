export const SETTINGS_SCHEMA_VERSION = 1 as const;
export const SETTINGS_STORAGE_KEY = 'shiming-bida.settings.v1';

export type SettingsData = {
  readonly schemaVersion: 1;
  readonly audio: { readonly masterVolume: number; readonly musicVolume: number; readonly ambienceVolume: number; readonly sfxVolume: number; readonly uiVolume: number; readonly muted: boolean };
  readonly motion: { readonly reducedMotion: boolean; readonly screenShake: 'full' | 'reduced' | 'off'; readonly cameraZoomEffects: boolean; readonly flashIntensity: 'full' | 'reduced' | 'off' };
  readonly visual: { readonly highContrast: boolean; readonly textScale: 1 | 1.15 | 1.3; readonly hazardPatternCues: boolean; readonly showControlHints: boolean };
  readonly controls: { readonly touchLayout: 'right_handed' | 'left_handed'; readonly touchMovementSensitivity: number; readonly mouseMovementSensitivity: number };
  readonly accessibility: { readonly importantEventAnnouncements: boolean; readonly visualAudioCues: boolean };
};

export function createDefaultSettings(prefersReducedMotion = false): SettingsData {
  return {
    schemaVersion: 1,
    audio: { masterVolume: 0.8, musicVolume: 0.65, ambienceVolume: 0.65, sfxVolume: 0.8, uiVolume: 0.75, muted: false },
    motion: { reducedMotion: prefersReducedMotion, screenShake: prefersReducedMotion ? 'reduced' : 'full', cameraZoomEffects: !prefersReducedMotion, flashIntensity: prefersReducedMotion ? 'reduced' : 'full' },
    visual: { highContrast: false, textScale: 1, hazardPatternCues: true, showControlHints: true },
    controls: { touchLayout: 'right_handed', touchMovementSensitivity: 1, mouseMovementSensitivity: 1 },
    accessibility: { importantEventAnnouncements: true, visualAudioCues: true }
  };
}

export function validateSettings(input: unknown, defaults = createDefaultSettings()): { readonly valid: boolean; readonly data: SettingsData; readonly future: boolean } {
  if (!isRecord(input)) return { valid: false, data: defaults, future: false };
  const version = finite(input.schemaVersion, 0);
  if (version > SETTINGS_SCHEMA_VERSION) return { valid: false, data: defaults, future: true };
  const audio = isRecord(input.audio) ? input.audio : {};
  const motion = isRecord(input.motion) ? input.motion : {};
  const visual = isRecord(input.visual) ? input.visual : {};
  const controls = isRecord(input.controls) ? input.controls : {};
  const accessibility = isRecord(input.accessibility) ? input.accessibility : {};
  return { valid: version === 1, future: false, data: {
    schemaVersion: 1,
    audio: {
      masterVolume: volume(audio.masterVolume, defaults.audio.masterVolume), musicVolume: volume(audio.musicVolume, defaults.audio.musicVolume),
      ambienceVolume: volume(audio.ambienceVolume, defaults.audio.ambienceVolume), sfxVolume: volume(audio.sfxVolume, defaults.audio.sfxVolume),
      uiVolume: volume(audio.uiVolume, defaults.audio.uiVolume), muted: bool(audio.muted, defaults.audio.muted)
    },
    motion: {
      reducedMotion: bool(motion.reducedMotion, defaults.motion.reducedMotion),
      screenShake: enumValue(motion.screenShake, ['full', 'reduced', 'off'] as const, defaults.motion.screenShake),
      cameraZoomEffects: bool(motion.cameraZoomEffects, defaults.motion.cameraZoomEffects),
      flashIntensity: enumValue(motion.flashIntensity, ['full', 'reduced', 'off'] as const, defaults.motion.flashIntensity)
    },
    visual: {
      highContrast: bool(visual.highContrast, defaults.visual.highContrast),
      textScale: enumValue(visual.textScale, [1, 1.15, 1.3] as const, defaults.visual.textScale),
      hazardPatternCues: bool(visual.hazardPatternCues, defaults.visual.hazardPatternCues), showControlHints: bool(visual.showControlHints, defaults.visual.showControlHints)
    },
    controls: {
      touchLayout: enumValue(controls.touchLayout, ['right_handed', 'left_handed'] as const, defaults.controls.touchLayout),
      touchMovementSensitivity: clamp(finite(controls.touchMovementSensitivity, defaults.controls.touchMovementSensitivity), 0.5, 1.5),
      mouseMovementSensitivity: clamp(finite(controls.mouseMovementSensitivity, defaults.controls.mouseMovementSensitivity), 0.5, 1.5)
    },
    accessibility: {
      importantEventAnnouncements: bool(accessibility.importantEventAnnouncements, defaults.accessibility.importantEventAnnouncements),
      visualAudioCues: bool(accessibility.visualAudioCues, defaults.accessibility.visualAudioCues)
    }
  } };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finite(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function volume(value: unknown, fallback: number): number { return clamp(finite(value, fallback), 0, 1); }
function bool(value: unknown, fallback: boolean): boolean { return typeof value === 'boolean' ? value : fallback; }
function enumValue<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T { return allowed.includes(value as T) ? value as T : fallback; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
