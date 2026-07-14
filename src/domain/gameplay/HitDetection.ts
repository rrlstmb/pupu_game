import { hitReactionForCount } from '../../data/npcHitRules';
import { NPC_POOP_INTERACTIONS, SAFE_DEFAULT_INTERACTION } from '../../data/npcPoopInteractions';
import type { PoopDefinition } from '../poop/PoopModel';
import { stickyEffectForHit, strategyFor } from '../poop/PoopBehaviorStrategy';
import type { Projectile } from '../projectile/ProjectileSystem';
import type { NPCDefinition, NPCInstanceState } from '../npc/NPCModel';
import { interactionFor, isBlockedByInteraction } from '../npc/NPCInteractionMatrix';
import { GameplayEventTypes, type GameplayEvent } from './GameplayEvents';

export type HitDetectionResult = {
  readonly npcs: readonly NPCInstanceState[];
  readonly projectileIdsToRecycle: readonly number[];
  readonly hitTokens: ReadonlySet<string>;
  readonly events: readonly GameplayEvent[];
};

export function resolveProjectileNPCHits(
  projectiles: readonly Projectile[],
  npcs: readonly NPCInstanceState[],
  definitions: readonly NPCDefinition[],
  existingHitTokens: ReadonlySet<string>,
  poopDefinitions: readonly PoopDefinition[] = [],
  sessionId = 'legacy-session'
): HitDetectionResult {
  const nextTokens = new Set(existingHitTokens);
  const projectileIdsToRecycle = new Set<number>();
  const events: GameplayEvent[] = [];
  let nextNpcs = [...npcs];

  for (const projectile of projectiles) {
    if (projectile.status !== 'active') {
      continue;
    }

    for (const npc of nextNpcs) {
      const definition = definitions.find((candidate) => candidate.id === npc.definitionId);
      if (!definition || !canNPCBeHit(npc)) {
        continue;
      }
      const poopDefinition = poopDefinitions.find((candidate) => candidate.id === projectile.poopType);
      if (!poopDefinition) {
        continue;
      }

      if (!overlaps(projectile, npc, definition)) {
        continue;
      }
      const interaction = interactionFor(NPC_POOP_INTERACTIONS, npc.definitionId, projectile.poopType, SAFE_DEFAULT_INTERACTION);
      if (isBlockedByInteraction(interaction, projectile.bounceCount)) {
        projectileIdsToRecycle.add(projectile.id);
        break;
      }

      const strategyResult = strategyFor(poopDefinition).resolve({
        projectile,
        primaryNpc: npc,
        npcs: nextNpcs,
        npcDefinitions: definitions,
        poopDefinition,
        existingTokens: nextTokens
      });
      if (strategyResult.npcIds.length === 0) {
        continue;
      }
      for (const token of strategyResult.tokens) {
        nextTokens.add(token);
      }
      projectileIdsToRecycle.add(projectile.id);

      for (const npcId of strategyResult.npcIds) {
        const target = nextNpcs.find((candidate) => candidate.id === npcId);
        if (!target || !canNPCBeHit(target)) {
          continue;
        }
        const token = strategyResult.tokens[strategyResult.npcIds.indexOf(npcId)];
        const validHitCount = target.validHitCount + 1;
        const reaction = hitReactionForCount(validHitCount);
        const impactDistance = Math.abs(projectile.position.x - target.x);
        const stickyEffect = stickyEffectForHit(`${token}:effect`, target.id, poopDefinition);
        nextNpcs = nextNpcs.map((candidate) =>
          candidate.id === target.id
            ? {
                ...candidate,
                state: 'Hit',
                currentSpeed: 0,
                validHitCount,
                rantRemainingSeconds: reaction.rantDurationSeconds,
                immunityRemainingSeconds: reaction.immunitySeconds,
                reactionLevel: reaction.reactionLevel,
                pendingRant: {
                  eventId: token,
                  poopType: projectile.poopType,
                  impactDistance,
                  interactionScoreDelta: interaction.scoreDelta
                },
                activeEffects: stickyEffect
                  ? [...candidate.activeEffects.filter((effect) => effect.poopType !== stickyEffect.poopType), stickyEffect]
                  : candidate.activeEffects
              }
            : candidate
        );
        events.push({
          sessionId,
          type: GameplayEventTypes.ProjectileHit,
          token,
          projectileId: projectile.id,
          poopType: projectile.poopType,
          breaksDefense: poopDefinition.capability.breaksDefense ?? false,
          npcId: target.id,
          npcType: target.definitionId,
          validHitCount,
          impactDistance,
          interactionAlertDelta: interaction.alertDelta,
          interactionScoreDelta: interaction.scoreDelta
        });
      }
      break;
    }
  }

  return {
    npcs: nextNpcs,
    projectileIdsToRecycle: [...projectileIdsToRecycle],
    hitTokens: nextTokens,
    events
  };
}

export function removeHitTokensForProjectiles(
  tokens: ReadonlySet<string>,
  projectileIds: readonly number[]
): ReadonlySet<string> {
  if (projectileIds.length === 0 || tokens.size === 0) {
    return tokens;
  }

  const recycledIds = new Set(projectileIds);
  return new Set(
    [...tokens].filter((token) => {
      const parts = token.split(':');
      const projectileId = Number(parts[0] === 'splash' ? parts[1] : parts[0]);
      return !recycledIds.has(projectileId);
    })
  );
}

export function canNPCBeHit(npc: NPCInstanceState): boolean {
  return npc.state === 'Walking' || npc.state === 'Distracted';
}

function overlaps(projectile: Projectile, npc: NPCInstanceState, definition: NPCDefinition): boolean {
  const halfWidth = (definition.width * npc.scale) / 2;
  const height = definition.height * npc.scale;
  const radius = projectile.config.collisionRadius;
  const minProjectileX = Math.min(projectile.previousPosition.x, projectile.position.x);
  const maxProjectileX = Math.max(projectile.previousPosition.x, projectile.position.x);
  const minProjectileY = Math.min(projectile.previousPosition.y, projectile.position.y);
  const maxProjectileY = Math.max(projectile.previousPosition.y, projectile.position.y);
  const left = npc.x - halfWidth - radius;
  const right = npc.x + halfWidth + radius;
  const top = npc.y - height - radius;
  const bottom = npc.y + radius;

  return maxProjectileX >= left && minProjectileX <= right && maxProjectileY >= top && minProjectileY <= bottom;
}
