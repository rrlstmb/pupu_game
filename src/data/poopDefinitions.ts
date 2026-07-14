import { NORMAL_POOP_PROJECTILE_CONFIG } from './projectileConfig';
import type { PoopDefinition } from '../domain/poop/PoopModel';

export const POOP_DEFINITIONS: readonly PoopDefinition[] = [
  {
    id: 'normal_poop',
    label: '普通便',
    icon: 'N',
    projectile: NORMAL_POOP_PROJECTILE_CONFIG,
    initialStock: 'infinite',
    scoreMultiplier: 1,
    alertCost: 0,
    skillFloor: 'low',
    bestAgainst: ['stable targets', 'combo upkeep'],
    weakAgainst: ['crowds', 'armored defense'],
    capability: { kind: 'normal' }
  },
  {
    id: 'sticky_poop',
    label: '黏黏便',
    icon: 'S',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 330, y: -590 },
      cooldownSeconds: 0.7,
      radius: 12,
      collisionRadius: 12
    },
    initialStock: 4,
    scoreMultiplier: 0.95,
    alertCost: 4,
    skillFloor: 'medium',
    bestAgainst: ['jogger', 'repeat hit setup'],
    weakAgainst: ['wide crowds', 'urgent low-alert play'],
    capability: { kind: 'sticky', slowMultiplier: 0.48, effectDurationSeconds: 3.2 }
  },
  {
    id: 'splash_poop',
    label: '飛濺便',
    icon: 'P',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 350, y: -610 },
      cooldownSeconds: 0.9,
      radius: 10,
      collisionRadius: 10
    },
    initialStock: 3,
    scoreMultiplier: 0.8,
    alertCost: 7,
    skillFloor: 'high',
    bestAgainst: ['dense lanes', 'multi target timing'],
    weakAgainst: ['isolated target', 'precision score chasing'],
    capability: { kind: 'splash', splashRadius: 96 }
  },
  {
    id: 'jumbo_poop',
    label: '巨無霸便',
    icon: 'J',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 250, y: -520 },
      gravity: 1120,
      cooldownSeconds: 1.4,
      radius: 18,
      collisionRadius: 18
    },
    initialStock: 2,
    scoreMultiplier: 1.2,
    alertCost: 12,
    skillFloor: 'high',
    bestAgainst: ['future defense', 'slow predictable targets'],
    weakAgainst: ['fast targets', 'low-alert play'],
    capability: { kind: 'jumbo', breaksDefense: true }
  },
  {
    id: 'bouncy_poop',
    label: '彈跳便',
    icon: 'B',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 390, y: -560 },
      cooldownSeconds: 1.0,
      radius: 10,
      collisionRadius: 10
    },
    initialStock: 3,
    scoreMultiplier: 0.9,
    alertCost: 8,
    skillFloor: 'high',
    bestAgainst: ['covered lane timing', 'late bounce correction'],
    weakAgainst: ['close fast targets', 'low ceiling timing'],
    capability: {
      kind: 'bouncy',
      maxBounces: 1,
      bounceRestitution: 0.58,
      bounceSurfaceTags: ['rooftop_floor']
    }
  },
  {
    id: 'stink_poop',
    label: '臭氣便',
    icon: 'K',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 300, y: -540 },
      cooldownSeconds: 1.2,
      radius: 11,
      collisionRadius: 11
    },
    initialStock: 2,
    scoreMultiplier: 0.7,
    alertCost: 10,
    skillFloor: 'medium',
    bestAgainst: ['lane control', 'slowing clusters'],
    weakAgainst: ['single precision score', 'caught-risk play'],
    capability: {
      kind: 'stink',
      stinkRadius: 118,
      stinkDurationSeconds: 4.5,
      stinkSlowMultiplier: 0.62,
      stinkAlertPerSecond: 1.2
    }
  },
  {
    id: 'split_poop',
    label: '分裂便',
    icon: 'T',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 340, y: -650 },
      cooldownSeconds: 1.3,
      radius: 8,
      collisionRadius: 8,
      maxActiveProjectiles: 12
    },
    initialStock: 2,
    scoreMultiplier: 0.65,
    alertCost: 11,
    skillFloor: 'high',
    bestAgainst: ['uncertain lane timing', 'spread coverage'],
    weakAgainst: ['precision bonus', 'object-count pressure'],
    capability: {
      kind: 'split',
      splitAtSeconds: 0.62,
      splitProjectileCount: 3,
      splitSpreadVelocityX: 105,
      maxSplitGeneration: 1
    }
  },
  {
    id: 'golden_poop',
    label: '黃金便',
    icon: 'G',
    projectile: {
      ...NORMAL_POOP_PROJECTILE_CONFIG,
      initialVelocity: { x: 360, y: -610 },
      cooldownSeconds: 1.6,
      radius: 10,
      collisionRadius: 10
    },
    initialStock: 1,
    scoreMultiplier: 2.1,
    alertCost: 15,
    skillFloor: 'high',
    bestAgainst: ['confirmed high-value hit', 'combo extension'],
    weakAgainst: ['miss risk', 'alert spike'],
    capability: {
      kind: 'golden',
      goldenComboExtensionSeconds: 1.5,
      goldenSpecialEventScore: 250
    }
  }
];

export function poopDefinitionById(id: PoopDefinition['id']): PoopDefinition {
  const definition = POOP_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown poop definition: ${id}`);
  }
  return definition;
}
