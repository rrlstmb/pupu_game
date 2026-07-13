import type { NPCType } from '../npc/NPCModel';
import type { PoopType } from '../poop/PoopModel';

export type PrecisionGrade = 'perfect' | 'clean' | 'graze';

export type PrecisionRule = {
  readonly grade: PrecisionGrade;
  readonly maxDistance: number;
  readonly multiplier: number;
  readonly comboExtensionSeconds: number;
};

export type ComboThreshold = {
  readonly comboCount: number;
  readonly multiplier: number;
};

export type ScoreRules = {
  readonly baseScores: Readonly<Record<NPCType, number>>;
  readonly poopAdaptationMultipliers: Readonly<Record<PoopType, number>>;
  readonly riskMultiplier: number;
  readonly specialEventScore: number;
  readonly repeatHitMultipliers: readonly { readonly hitCount: number; readonly multiplier: number }[];
  readonly precisionGrades: readonly PrecisionRule[];
  readonly combo: {
    readonly baseWindowSeconds: number;
    readonly missPenaltySeconds: number;
    readonly thresholds: readonly ComboThreshold[];
  };
};

export type ScoreState = {
  readonly totalScore: number;
  readonly comboCount: number;
  readonly comboMultiplier: number;
  readonly comboRemainingSeconds: number;
  readonly breakdowns: readonly ScoreBreakdown[];
};

export type ScoreEventInput = {
  readonly eventId: string;
  readonly npcId: number;
  readonly npcType: NPCType;
  readonly ammoType: PoopType;
  readonly validHitCount: number;
  readonly impactDistance: number;
  readonly specialEventScore?: number;
};

export type ScoreBreakdown = {
  readonly eventId: string;
  readonly npcId: number;
  readonly npcType: NPCType;
  readonly ammoType: PoopType;
  readonly baseScore: number;
  readonly poopAdaptationMultiplier: number;
  readonly comboCount: number;
  readonly comboMultiplier: number;
  readonly precisionGrade: PrecisionGrade;
  readonly precisionMultiplier: number;
  readonly riskMultiplier: number;
  readonly repeatHitMultiplier: number;
  readonly specialEventScore: number;
  readonly finalScore: number;
};

export function createScoreState(): ScoreState {
  return {
    totalScore: 0,
    comboCount: 0,
    comboMultiplier: 1,
    comboRemainingSeconds: 0,
    breakdowns: []
  };
}

export function updateComboTimer(state: ScoreState, deltaSeconds: number): ScoreState {
  const remaining = Math.max(0, state.comboRemainingSeconds - Math.max(0, deltaSeconds));
  if (remaining > 0 || state.comboCount === 0) {
    return {
      ...state,
      comboRemainingSeconds: remaining
    };
  }

  return {
    ...state,
    comboCount: 0,
    comboMultiplier: 1,
    comboRemainingSeconds: 0
  };
}

export function applyMissPenalty(state: ScoreState, rules: ScoreRules): ScoreState {
  if (state.comboCount === 0) {
    return state;
  }

  const remaining = Math.max(0, state.comboRemainingSeconds - rules.combo.missPenaltySeconds);
  if (remaining > 0) {
    return {
      ...state,
      comboRemainingSeconds: remaining
    };
  }

  return {
    ...state,
    comboCount: 0,
    comboMultiplier: 1,
    comboRemainingSeconds: 0
  };
}

export function scoreRantEvent(state: ScoreState, event: ScoreEventInput, rules: ScoreRules): ScoreState {
  if (state.breakdowns.some((breakdown) => breakdown.eventId === event.eventId)) {
    return state;
  }

  const precision = precisionForDistance(Math.abs(event.impactDistance), rules);
  const comboCount = state.comboCount + 1;
  const comboMultiplier = comboMultiplierForCount(comboCount, rules);
  const repeatHitMultiplier = repeatMultiplierForHitCount(event.validHitCount, rules);
  const baseScore = rules.baseScores[event.npcType];
  const poopAdaptationMultiplier = rules.poopAdaptationMultipliers[event.ammoType];
  const finalScore = Math.round(
    baseScore *
      poopAdaptationMultiplier *
      comboMultiplier *
      precision.multiplier *
      rules.riskMultiplier *
      repeatHitMultiplier +
      (event.specialEventScore ?? rules.specialEventScore)
  );
  const breakdown: ScoreBreakdown = {
    eventId: event.eventId,
    npcId: event.npcId,
    npcType: event.npcType,
    ammoType: event.ammoType,
    baseScore,
    poopAdaptationMultiplier,
    comboCount,
    comboMultiplier,
    precisionGrade: precision.grade,
    precisionMultiplier: precision.multiplier,
    riskMultiplier: rules.riskMultiplier,
    repeatHitMultiplier,
    specialEventScore: event.specialEventScore ?? rules.specialEventScore,
    finalScore
  };

  return {
    totalScore: state.totalScore + finalScore,
    comboCount,
    comboMultiplier,
    comboRemainingSeconds: rules.combo.baseWindowSeconds + precision.comboExtensionSeconds,
    breakdowns: [...state.breakdowns, breakdown]
  };
}

export function precisionForDistance(distance: number, rules: ScoreRules): PrecisionRule {
  const sorted = [...rules.precisionGrades].sort((left, right) => left.maxDistance - right.maxDistance);
  const precision = sorted.find((candidate) => distance <= candidate.maxDistance);
  return precision ?? sorted[sorted.length - 1];
}

export function comboMultiplierForCount(comboCount: number, rules: ScoreRules): number {
  return [...rules.combo.thresholds]
    .sort((left, right) => left.comboCount - right.comboCount)
    .reduce((multiplier, threshold) => (comboCount >= threshold.comboCount ? threshold.multiplier : multiplier), 1);
}

export function repeatMultiplierForHitCount(hitCount: number, rules: ScoreRules): number {
  return [...rules.repeatHitMultipliers]
    .sort((left, right) => left.hitCount - right.hitCount)
    .reduce((multiplier, rule) => (hitCount >= rule.hitCount ? rule.multiplier : multiplier), 1);
}
