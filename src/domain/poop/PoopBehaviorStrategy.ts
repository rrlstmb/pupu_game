import type { NPCDefinition, NPCInstanceState } from '../npc/NPCModel';
import type { Projectile } from '../projectile/ProjectileSystem';
import type { GameplayEvent } from '../gameplay/GameplayEvents';
import type { PoopDefinition, PoopEffectInstance, ProjectilePoopRules } from './PoopModel';

export type PoopHitCandidate = {
  readonly projectile: Projectile;
  readonly npc: NPCInstanceState;
  readonly npcDefinition: NPCDefinition;
};

export type PoopBehaviorContext = {
  readonly projectile: Projectile;
  readonly primaryNpc: NPCInstanceState;
  readonly npcs: readonly NPCInstanceState[];
  readonly npcDefinitions: readonly NPCDefinition[];
  readonly poopDefinition: PoopDefinition;
  readonly existingTokens: ReadonlySet<string>;
};

export type PoopBehaviorResult = {
  readonly npcIds: readonly number[];
  readonly tokens: readonly string[];
};

export interface PoopBehaviorStrategy {
  resolve(context: PoopBehaviorContext): PoopBehaviorResult;
}

export const singleTargetStrategy: PoopBehaviorStrategy = {
  resolve(context) {
    return {
      npcIds: [context.primaryNpc.id],
      tokens: [hitToken(context.projectile.id, context.primaryNpc.id, context.primaryNpc.hitWindowId, context.poopDefinition.id)]
    };
  }
};

export const splashStrategy: PoopBehaviorStrategy = {
  resolve(context) {
    const radius = context.poopDefinition.capability.splashRadius ?? 0;
    const effectId = `splash:${context.projectile.id}`;
    const npcIds: number[] = [];
    const tokens: string[] = [];

    for (const npc of context.npcs) {
      const token = `${effectId}:${npc.id}:${npc.hitWindowId}`;
      if (context.existingTokens.has(token)) {
        continue;
      }
      const distance = Math.hypot(npc.x - context.primaryNpc.x, npc.y - context.primaryNpc.y);
      if (distance <= radius) {
        npcIds.push(npc.id);
        tokens.push(token);
      }
    }

    return { npcIds, tokens };
  }
};

export function strategyFor(definition: PoopDefinition): PoopBehaviorStrategy {
  return definition.capability.kind === 'splash' ? splashStrategy : singleTargetStrategy;
}

export function hitToken(projectileId: number, npcId: number, hitWindowId: number, poopType: string): string {
  return `${projectileId}:${npcId}:${hitWindowId}:${poopType}`;
}

export function stickyEffectForHit(effectId: string, npcId: number, definition: PoopDefinition): PoopEffectInstance | undefined {
  if (definition.capability.kind !== 'sticky' && definition.capability.kind !== 'stink') {
    return undefined;
  }

  return {
    id: effectId,
    poopType: definition.id,
    targetNpcId: npcId,
    remainingSeconds: definition.capability.effectDurationSeconds ?? 0,
    slowMultiplier: definition.capability.slowMultiplier
  };
}

export function projectileRulesFor(definition: PoopDefinition): ProjectilePoopRules {
  return {
    maxBounces: definition.capability.maxBounces ?? 0,
    bounceRestitution: definition.capability.bounceRestitution ?? 0,
    bounceSurfaceTags: definition.capability.bounceSurfaceTags ?? [],
    splitAtSeconds: definition.capability.splitAtSeconds,
    splitProjectileCount: definition.capability.splitProjectileCount ?? 0,
    splitSpreadVelocityX: definition.capability.splitSpreadVelocityX ?? 0,
    maxSplitGeneration: definition.capability.maxSplitGeneration ?? 0
  };
}

export type PoopDebugEvent = Extract<GameplayEvent, { readonly type: 'PROJECTILE_HIT' }>;
