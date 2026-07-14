import type { NPCInstanceState, NPCType } from '../npc/NPCModel';
import type { PoopType } from '../poop/PoopModel';

export const GameplayEventTypes = {
  ProjectileHit: 'PROJECTILE_HIT',
  NPCRantStarted: 'NPC_RANT_STARTED',
  NPCRecovered: 'NPC_RECOVERED'
} as const;

export type GameplayEvent =
  | {
      readonly sessionId: string;
      readonly type: typeof GameplayEventTypes.ProjectileHit;
      readonly token: string;
      readonly projectileId: number;
      readonly poopType: PoopType;
      readonly breaksDefense: boolean;
      readonly npcId: number;
      readonly npcType: NPCType;
      readonly validHitCount: number;
      readonly impactDistance: number;
      readonly interactionAlertDelta: number;
      readonly interactionScoreDelta: number;
    }
  | {
      readonly sessionId: string;
      readonly type: typeof GameplayEventTypes.NPCRantStarted;
      readonly eventId: string;
      readonly poopType: PoopType;
      readonly npcId: number;
      readonly npcType: NPCType;
      readonly validHitCount: number;
      readonly reactionLevel: number;
      readonly impactDistance: number;
      readonly interactionScoreDelta: number;
    }
  | {
      readonly sessionId: string;
      readonly type: typeof GameplayEventTypes.NPCRecovered;
      readonly npcId: number;
      readonly npcType: NPCType;
      readonly validHitCount: number;
    };

export function collectNPCStateTransitionEvents(
  previousNpcs: readonly NPCInstanceState[],
  nextNpcs: readonly NPCInstanceState[],
  sessionId = 'legacy-session'
): readonly GameplayEvent[] {
  const events: GameplayEvent[] = [];

  for (const next of nextNpcs) {
    const previous = previousNpcs.find((candidate) => candidate.id === next.id);
    if (!previous) {
      continue;
    }

    if (previous.state === 'Hit' && next.state === 'Ranting' && previous.pendingRant) {
      events.push({
        sessionId,
        type: GameplayEventTypes.NPCRantStarted,
        eventId: previous.pendingRant.eventId,
        poopType: previous.pendingRant.poopType,
        npcId: next.id,
        npcType: next.definitionId,
        validHitCount: next.validHitCount,
        reactionLevel: next.reactionLevel,
        impactDistance: previous.pendingRant.impactDistance,
        interactionScoreDelta: previous.pendingRant.interactionScoreDelta
      });
    }

    if (
      previous.state === 'Recovering' &&
      next.hitWindowId > previous.hitWindowId &&
      (next.state === 'Walking' || next.state === 'Distracted')
    ) {
      events.push({
        sessionId,
        type: GameplayEventTypes.NPCRecovered,
        npcId: next.id,
        npcType: next.definitionId,
        validHitCount: next.validHitCount
      });
    }
  }

  return events;
}
