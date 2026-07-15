import type { NpcAreaEffectResistance } from '../domain/poop/PoopModel';

export const NPC_AREA_EFFECT_RESISTANCE: readonly NpcAreaEffectResistance[] = [
  { npcType: 'office_worker', stinkResistance: 0, minimumSlowMultiplier: 0.4, canReroute: false },
  { npcType: 'phone_user', stinkResistance: 0.1, minimumSlowMultiplier: 0.45, canReroute: false },
  { npcType: 'jogger', stinkResistance: 0.5, minimumSlowMultiplier: 0.72, canReroute: false },
  { npcType: 'tourist', stinkResistance: 0.2, minimumSlowMultiplier: 0.5, canReroute: false },
  { npcType: 'cleaner', stinkResistance: 1, minimumSlowMultiplier: 1, canReroute: false }
] as const;
