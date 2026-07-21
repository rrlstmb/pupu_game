import type { BossEncounterState } from '../boss/BossPhaseStateMachine';
import type { GameplayInputIntent } from '../input/GameplayInputController';
import type { NPCInstanceState } from '../npc/NPCModel';
import type { PlayerState } from '../player/PlayerMovement';

export type CharacterAnimationState =
  | 'idle' | 'walk' | 'run' | 'charge_start' | 'charge' | 'charge_full' | 'throw'
  | 'hit' | 'rant' | 'recover' | 'blocked' | 'slow' | 'clean'
  | 'counterattack_prepare' | 'counterattack_throw' | 'snapshot_prepare' | 'snapshot_flash' | 'recording'
  | 'security_patrol' | 'security_observe' | 'security_alert'
  | 'boss_protected' | 'boss_vulnerable' | 'boss_complete' | 'success' | 'failure';

export function animationForNpc(npc: NPCInstanceState): CharacterAnimationState {
  if (npc.state === 'Hit') return 'hit';
  if (npc.state === 'Ranting') return 'rant';
  if (npc.state === 'Recovering') return 'recover';
  if (npc.state === 'Cleaning') return 'clean';
  if (npc.state === 'Retaliating') return 'counterattack_throw';
  if (npc.state === 'Recording') return 'recording';
  if (npc.state === 'Searching') return 'security_observe';
  if (npc.dangerPhase === 'telegraph' && npc.dangerKind === 'retaliate') return 'counterattack_prepare';
  if (npc.dangerPhase === 'telegraph' && npc.dangerKind === 'recording') return 'snapshot_prepare';
  if (npc.dangerPhase === 'telegraph' && npc.dangerKind === 'security') return 'security_observe';
  if (npc.activeEffects.length > 0) return 'slow';
  if (npc.state === 'Walking' || npc.state === 'Entering' || npc.state === 'Distracted') {
    return npc.currentSpeed >= 180 ? 'run' : 'walk';
  }
  return 'idle';
}

export function animationForPlayer(
  player: PlayerState,
  input: GameplayInputIntent,
  chargePower: number,
  isCharging: boolean,
  isGameOver: boolean,
  succeeded: boolean
): CharacterAnimationState {
  if (isGameOver) return succeeded ? 'success' : 'failure';
  if (input.chargeReleased) return 'throw';
  if (isCharging) return chargePower >= 1 ? 'charge_full' : chargePower <= 0.02 ? 'charge_start' : 'charge';
  if (Math.abs(player.velocityX) > 1) return 'walk';
  return 'idle';
}

export function animationForBoss(state: BossEncounterState): CharacterAnimationState {
  if (state.phase === 'completed') return 'boss_complete';
  if (state.finalWindowState === 'active') return 'boss_vulnerable';
  return 'boss_protected';
}
