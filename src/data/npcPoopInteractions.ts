import type { NPCType } from '../domain/npc/NPCModel';
import type { PoopType } from '../domain/poop/PoopModel';
import type { NPCPoopInteraction } from '../domain/npc/NPCInteractionMatrix';

export const NPC_POOP_INTERACTIONS: readonly NPCPoopInteraction[] = [
  { npcType: 'umbrella_pedestrian', poopType: 'normal_poop', outcome: 'blocked', alertDelta: 4, scoreDelta: 0, tags: ['umbrella_blocks'] },
  { npcType: 'umbrella_pedestrian', poopType: 'jumbo_poop', outcome: 'effective', alertDelta: 3, scoreDelta: 40, tags: ['umbrella_crack'] },
  { npcType: 'umbrella_pedestrian', poopType: 'bouncy_poop', outcome: 'effective', alertDelta: 2, scoreDelta: 30, tags: ['umbrella_angle_crack'] },
  { npcType: 'delivery_rider', poopType: 'sticky_poop', outcome: 'effective', alertDelta: 1, scoreDelta: 40, tags: ['speed_control'] },
  { npcType: 'dog_walker', poopType: 'stink_poop', outcome: 'risky', alertDelta: 8, scoreDelta: 10, tags: ['dog_sniffs_source'] },
  { npcType: 'cleaner', poopType: 'stink_poop', outcome: 'weak', alertDelta: -2, scoreDelta: -20, tags: ['cleaner_counters_zone'] },
  { npcType: 'angry_pedestrian', poopType: 'normal_poop', outcome: 'risky', alertDelta: 4, scoreDelta: 20, tags: ['retaliation_risk'] },
  { npcType: 'camera_pedestrian', poopType: 'sticky_poop', outcome: 'effective', alertDelta: -3, scoreDelta: 25, tags: ['interrupt_recording'] },
  { npcType: 'camera_pedestrian', poopType: 'golden_poop', outcome: 'effective', alertDelta: 6, scoreDelta: 120, tags: ['viral_gold'] },
  { npcType: 'tourist', poopType: 'splash_poop', outcome: 'effective', alertDelta: 2, scoreDelta: 45, tags: ['group_cluster'] },
  { npcType: 'tourist', poopType: 'split_poop', outcome: 'effective', alertDelta: 3, scoreDelta: 35, tags: ['spread_cluster'] },
  { npcType: 'security_guard', poopType: 'stink_poop', outcome: 'risky', alertDelta: 12, scoreDelta: -10, tags: ['security_pressure'] },
  { npcType: 'security_guard', poopType: 'golden_poop', outcome: 'risky', alertDelta: 15, scoreDelta: 80, tags: ['security_spotlight'] }
];

export const SAFE_DEFAULT_INTERACTION: NPCPoopInteraction = {
  npcType: 'office_worker',
  poopType: 'normal_poop',
  outcome: 'normal',
  alertDelta: 0,
  scoreDelta: 0,
  tags: ['safe_default']
};

export function allNPCPoopPairs(npcTypes: readonly NPCType[], poopTypes: readonly PoopType[]): readonly string[] {
  return npcTypes.flatMap((npcType) => poopTypes.map((poopType) => `${npcType}:${poopType}`));
}
