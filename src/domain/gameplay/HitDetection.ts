import { hitReactionForCount } from '../../data/npcHitRules';
import { LANDING_HIT_CONFIG } from '../../data/hitDetectionConfig';
import { NPC_POOP_INTERACTIONS, SAFE_DEFAULT_INTERACTION } from '../../data/npcPoopInteractions';
import type { PoopDefinition } from '../poop/PoopModel';
import { stickyEffectForHit, strategyFor } from '../poop/PoopBehaviorStrategy';
import type { Projectile } from '../projectile/ProjectileSystem';
import type { NPCDefinition, NPCInstanceState } from '../npc/NPCModel';
import { interactionFor, isBlockedByInteraction } from '../npc/NPCInteractionMatrix';
import { GameplayEventTypes, type GameplayEvent } from './GameplayEvents';
import { landingPointForProjectile, selectLandingHitCandidates } from './LandingHitWindow';

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
    const landing = landingPointForProjectile(projectile);
    if (!landing) continue;
    const candidates = selectLandingHitCandidates(
      landing,
      nextNpcs,
      definitions,
      LANDING_HIT_CONFIG,
      canNPCBeHit
    );
    const maxPrimaryTargets = Math.max(0, LANDING_HIT_CONFIG.ordinaryPoopMaxTargets);
    const primaryCandidates = candidates.slice(0, maxPrimaryTargets);

    for (const { npc } of primaryCandidates) {
      const poopDefinition = poopDefinitions.find((candidate) => candidate.id === projectile.poopType);
      if (!poopDefinition) continue;
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
