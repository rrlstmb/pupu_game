import { describe, expect, it } from 'vitest';
import { animationForBoss, animationForNpc, animationForPlayer } from '../../src/domain/presentation/CharacterPresentation';
import { createInitialPlayerState } from '../../src/domain/player/PlayerMovement';
import { createBossEncounterState } from '../../src/domain/boss/BossPhaseStateMachine';
import { LEVEL_10 } from '../../src/data/levels/level10';
import type { GameplayInputIntent } from '../../src/domain/input/GameplayInputController';
import type { NPCInstanceState } from '../../src/domain/npc/NPCModel';

const input = (overrides: Partial<GameplayInputIntent> = {}): GameplayInputIntent => ({
  horizontalAxis: 0, chargePressed: false, chargeHeld: false, chargeReleased: false,
  aimHeld: false, switchPrevPressed: false, switchNextPressed: false, activeDevice: 'keyboard', ...overrides
});

const npc = (overrides: Partial<NPCInstanceState> = {}): NPCInstanceState => ({
  id: 1, definitionId: 'office_worker', laneId: 'front_road', x: 500, y: 460, scale: 1, depth: 1,
  baseSpeed: 118, currentSpeed: 118, state: 'Walking', ageSeconds: 0, distanceTravelled: 0,
  validHitCount: 0, hitWindowId: 0, rantRemainingSeconds: 0, immunityRemainingSeconds: 0,
  reactionLevel: 0, activeEffects: [], dangerPhase: 'none', dangerRemainingSeconds: 0,
  cleanerCooldownSeconds: 0, retaliationCount: 0, ...overrides
});

describe('character presentation mapping', () => {
  it('maps NPC domain states without mutating gameplay state', () => {
    expect(animationForNpc(npc())).toBe('walk');
    expect(animationForNpc(npc({ currentSpeed: 220 }))).toBe('run');
    expect(animationForNpc(npc({ state: 'Hit' }))).toBe('hit');
    expect(animationForNpc(npc({ state: 'Ranting' }))).toBe('rant');
    expect(animationForNpc(npc({ state: 'Cleaning' }))).toBe('clean');
    expect(animationForNpc(npc({ dangerPhase: 'telegraph', dangerKind: 'retaliate' }))).toBe('counterattack_prepare');
  });

  it('maps keyboard and mouse intents to the same player animation', () => {
    const player = { ...createInitialPlayerState({ minX: 0, maxX: 100 }), velocityX: 50 };
    expect(animationForPlayer(player, input({ activeDevice: 'keyboard', horizontalAxis: 1 }), 0, false, false, false))
      .toBe(animationForPlayer(player, input({ activeDevice: 'mouse', horizontalAxis: 1 }), 0, false, false, false));
    expect(animationForPlayer(player, input({ chargeHeld: true }), 0.5, true, false, false)).toBe('charge');
    expect(animationForPlayer(player, input({ chargeHeld: true }), 1, true, false, false)).toBe('charge_full');
    expect(animationForPlayer(player, input({ chargeReleased: true }), 0.5, false, false, false)).toBe('throw');
  });

  it('maps Boss protection and terminal presentation independently of hit logic', () => {
    const rules = LEVEL_10.bossEncounter!;
    const state = createBossEncounterState('session', rules);
    expect(animationForBoss(state)).toBe('boss_protected');
    expect(animationForBoss({ ...state, phase: 'completed' })).toBe('boss_complete');
  });
});
