import type { LandingHitConfig } from '../../data/hitDetectionConfig';
import type { NPCDefinition, NPCInstanceState } from '../npc/NPCModel';
import type { PoopType } from '../poop/PoopModel';
import type { Projectile } from '../projectile/ProjectileSystem';

export type ProjectileLandingPoint = {
  readonly x: number;
  readonly y: number;
  readonly poopType: PoopType;
  readonly radius?: number;
  readonly chargePower?: number;
};

export type NPCDynamicHitRange = {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly horizontalBonusRange: number;
  readonly verticalBonusRange: number;
};

export type LandingHitWindow = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

export type LandingHitCandidate = {
  readonly npc: NPCInstanceState;
  readonly definition: NPCDefinition;
  readonly distance: number;
  readonly laneDistance: number;
};

export function landingPointForProjectile(projectile: Projectile): ProjectileLandingPoint | undefined {
  if (projectile.status !== 'landed' || !projectile.landedAt) return undefined;
  return {
    x: projectile.landedAt.x,
    y: projectile.landedAt.y,
    poopType: projectile.poopType,
    radius: projectile.config.collisionRadius
  };
}

export function npcDynamicHitRange(
  npc: NPCInstanceState,
  definition: NPCDefinition,
  config: LandingHitConfig
): NPCDynamicHitRange {
  const worldWidth = definition.width * npc.scale;
  const worldHeight = definition.height * npc.scale;
  return {
    worldWidth,
    worldHeight,
    horizontalBonusRange: clamp(
      worldWidth * config.hitWindowEnemyWidthMultiplier,
      config.hitWindowMinHorizontalPadding,
      config.hitWindowMaxHorizontalPadding
    ),
    verticalBonusRange: Math.min(
      config.laneHitToleranceY,
      clamp(
        worldHeight * config.hitWindowEnemyHeightMultiplier,
        config.hitWindowMinVerticalPadding,
        config.hitWindowMaxVerticalPadding
      )
    )
  };
}

export function landingHitWindow(
  landing: ProjectileLandingPoint,
  npc: NPCInstanceState,
  definition: NPCDefinition,
  config: LandingHitConfig
): LandingHitWindow {
  const range = npcDynamicHitRange(npc, definition, config);
  return {
    left: landing.x - range.horizontalBonusRange,
    right: landing.x + range.horizontalBonusRange,
    top: landing.y - range.verticalBonusRange,
    bottom: landing.y + range.verticalBonusRange
  };
}

export function isNPCInLandingHitWindow(
  landing: ProjectileLandingPoint,
  npc: NPCInstanceState,
  definition: NPCDefinition,
  config: LandingHitConfig
): boolean {
  const window = landingHitWindow(landing, npc, definition, config);
  if (Math.abs(npc.y - landing.y) > config.laneHitToleranceY) return false;
  if (npc.x < window.left || npc.x > window.right) return false;
  if (!config.useNpcBoundsForLandingHit) {
    return npc.y >= window.top && npc.y <= window.bottom;
  }

  const range = npcDynamicHitRange(npc, definition, config);
  const npcTop = npc.y - range.worldHeight;
  const npcBottom = npc.y;
  return npcBottom >= window.top && npcTop <= window.bottom;
}

export function selectLandingHitCandidates(
  landing: ProjectileLandingPoint,
  npcs: readonly NPCInstanceState[],
  definitions: readonly NPCDefinition[],
  config: LandingHitConfig,
  canHit: (npc: NPCInstanceState) => boolean
): readonly LandingHitCandidate[] {
  return npcs
    .flatMap((npc): LandingHitCandidate[] => {
      const definition = definitions.find((candidate) => candidate.id === npc.definitionId);
      if (!definition || !canHit(npc) || !isNPCInLandingHitWindow(landing, npc, definition, config)) return [];
      return [{
        npc,
        definition,
        distance: Math.hypot(npc.x - landing.x, npc.y - landing.y),
        laneDistance: Math.abs(npc.y - landing.y)
      }];
    })
    .sort((left, right) =>
      left.distance - right.distance ||
      left.laneDistance - right.laneDistance ||
      left.npc.id - right.npc.id
    );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
