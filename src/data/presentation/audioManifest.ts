export type AudioBus = 'music' | 'ambience' | 'sfx' | 'ui';
export type AudioSemanticEvent =
  | 'ui_hover' | 'ui_confirm' | 'ui_back' | 'opening_start' | 'level_intro'
  | 'throw_charge_start' | 'throw_charge_full' | 'throw_release' | 'projectile_land' | 'projectile_hit' | 'projectile_miss'
  | 'umbrella_block' | 'umbrella_break' | 'splash_hit' | 'sticky_apply' | 'bounce' | 'stink_zone_create' | 'stink_zone_clean'
  | 'counterattack_warning' | 'counterattack_hit' | 'counterattack_dodge' | 'camera_warning' | 'camera_capture' | 'camera_avoided'
  | 'security_warning' | 'security_detected' | 'boss_enter' | 'boss_gate_break' | 'boss_phase_transition'
  | 'boss_final_window' | 'boss_final_hit' | 'level_success' | 'level_failure' | 'campaign_complete';

export type AudioEventDefinition = {
  readonly event: AudioSemanticEvent;
  readonly bus: AudioBus;
  readonly waveform: OscillatorType | 'noise';
  readonly frequency: number;
  readonly durationMs: number;
  readonly gain: number;
  readonly concurrency: number;
};

const cue = (event: AudioSemanticEvent, bus: AudioBus, frequency: number, durationMs: number, gain = 0.035, concurrency = 3): AudioEventDefinition => ({
  event, bus, waveform: event.includes('hit') || event.includes('break') ? 'square' : 'sine', frequency, durationMs, gain, concurrency
});

export const AUDIO_MANIFEST: readonly AudioEventDefinition[] = [
  cue('ui_hover', 'ui', 520, 40, 0.012, 1), cue('ui_confirm', 'ui', 660, 70, 0.025, 1), cue('ui_back', 'ui', 330, 70, 0.02, 1),
  cue('opening_start', 'music', 220, 300, 0.02, 1), cue('level_intro', 'ui', 440, 120, 0.02, 1),
  cue('throw_charge_start', 'sfx', 180, 80), cue('throw_charge_full', 'sfx', 720, 120), cue('throw_release', 'sfx', 260, 100),
  cue('projectile_land', 'sfx', 120, 90), cue('projectile_hit', 'sfx', 150, 100), cue('projectile_miss', 'sfx', 90, 80),
  cue('umbrella_block', 'sfx', 460, 120), cue('umbrella_break', 'sfx', 110, 180), cue('splash_hit', 'sfx', 200, 140),
  cue('sticky_apply', 'sfx', 240, 140), cue('bounce', 'sfx', 540, 90), cue('stink_zone_create', 'sfx', 130, 160), cue('stink_zone_clean', 'sfx', 640, 120),
  cue('counterattack_warning', 'sfx', 740, 100, 0.025, 1), cue('counterattack_hit', 'sfx', 100, 150), cue('counterattack_dodge', 'sfx', 620, 100),
  cue('camera_warning', 'sfx', 800, 70, 0.02, 1), cue('camera_capture', 'sfx', 980, 80), cue('camera_avoided', 'sfx', 590, 80),
  cue('security_warning', 'sfx', 420, 120, 0.025, 1), cue('security_detected', 'sfx', 160, 220),
  cue('boss_enter', 'music', 110, 300, 0.03, 1), cue('boss_gate_break', 'sfx', 130, 220), cue('boss_phase_transition', 'music', 180, 260, 0.03, 1),
  cue('boss_final_window', 'sfx', 760, 180, 0.03, 1), cue('boss_final_hit', 'sfx', 95, 420, 0.04, 1),
  cue('level_success', 'music', 660, 260, 0.03, 1), cue('level_failure', 'music', 160, 300, 0.03, 1), cue('campaign_complete', 'music', 880, 500, 0.035, 1)
] as const;
