import type { NPCType } from '../../domain/npc/NPCModel';
import type { CharacterAnimationState } from '../../domain/presentation/CharacterPresentation';

export type CharacterSkinDefinition = {
  readonly id: string;
  readonly assetKey: string;
  readonly fallbackAssetKey: string;
  readonly visualScale: number;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly depthOffset: number;
  readonly shadowOffsetX: number;
  readonly shadowOffsetY: number;
  readonly animationSpeed: number;
  readonly animationMap: Readonly<Record<CharacterAnimationState, string>>;
};

const ANIMATION_MAP: Readonly<Record<CharacterAnimationState, string>> = {
  idle: 'idle', walk: 'walk', run: 'run', charge_start: 'charge_start', charge: 'charge', charge_full: 'charge_full',
  throw: 'throw', hit: 'hit', rant: 'rant', recover: 'recover', blocked: 'blocked', slow: 'slow', clean: 'clean',
  counterattack_prepare: 'counterattack_prepare', counterattack_throw: 'counterattack_throw',
  snapshot_prepare: 'snapshot_prepare', snapshot_flash: 'snapshot_flash', recording: 'recording',
  security_patrol: 'security_patrol', security_observe: 'security_observe', security_alert: 'security_alert',
  boss_protected: 'boss_protected', boss_vulnerable: 'boss_vulnerable', boss_complete: 'boss_complete',
  success: 'success', failure: 'failure'
};

const skin = (id: string, scale = 1, speed = 1): CharacterSkinDefinition => ({
  id,
  assetKey: `character-${id}`,
  fallbackAssetKey: 'character-fallback',
  visualScale: scale,
  pivotX: 0.5,
  pivotY: 1,
  depthOffset: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 3,
  animationSpeed: speed,
  animationMap: ANIMATION_MAP
});

export const PLAYER_SKIN = skin('player', 1, 1);

export const NPC_CHARACTER_SKINS: Readonly<Record<NPCType, CharacterSkinDefinition>> = {
  office_worker: skin('office_worker'),
  phone_user: skin('phone_user', 1, 0.88),
  jogger: skin('jogger', 1, 1.45),
  umbrella_pedestrian: skin('umbrella_pedestrian', 1.08, 0.92),
  delivery_rider: skin('delivery_rider', 1.08, 1.6),
  dog_walker: skin('dog_walker', 1.06, 0.9),
  cleaner: skin('cleaner', 1.04, 0.78),
  angry_pedestrian: skin('angry_pedestrian', 1.05, 1.05),
  camera_pedestrian: skin('camera_pedestrian', 1.03, 0.82),
  streamer: skin('streamer', 1.06, 0.82),
  tourist: skin('tourist', 1.08, 0.7),
  security_guard: skin('security_guard', 1.1, 0.9)
};

export const BOSS_SKIN = skin('boss_influencer', 1.25, 1.05);
