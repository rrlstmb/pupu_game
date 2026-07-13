export type NPCHitReactionRule = {
  readonly hitCount: number;
  readonly rantDurationSeconds: number;
  readonly immunitySeconds: number;
  readonly reactionLevel: number;
};

export const NPC_HIT_REACTION_RULES: readonly NPCHitReactionRule[] = [
  { hitCount: 1, rantDurationSeconds: 1.1, immunitySeconds: 0.45, reactionLevel: 1 },
  { hitCount: 2, rantDurationSeconds: 1.35, immunitySeconds: 0.55, reactionLevel: 2 },
  { hitCount: 3, rantDurationSeconds: 1.65, immunitySeconds: 0.65, reactionLevel: 3 },
  { hitCount: 4, rantDurationSeconds: 1.9, immunitySeconds: 0.75, reactionLevel: 4 }
];

export function hitReactionForCount(hitCount: number): NPCHitReactionRule {
  return (
    NPC_HIT_REACTION_RULES.find((rule) => rule.hitCount === hitCount) ??
    NPC_HIT_REACTION_RULES[NPC_HIT_REACTION_RULES.length - 1]
  );
}

