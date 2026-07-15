export type DeterministicTieBreakStrategy = 'distance_lane_id';

export type LandingHitConfig = {
  readonly hitWindowEnemyWidthMultiplier: number;
  readonly hitWindowEnemyHeightMultiplier: number;
  readonly hitWindowMinHorizontalPadding: number;
  readonly hitWindowMaxHorizontalPadding: number;
  readonly hitWindowMinVerticalPadding: number;
  readonly hitWindowMaxVerticalPadding: number;
  readonly laneHitToleranceY: number;
  readonly useNpcBoundsForLandingHit: boolean;
  readonly ordinaryPoopMaxTargets: number;
  readonly deterministicTieBreakStrategy: DeterministicTieBreakStrategy;
};

export const LANDING_HIT_CONFIG: LandingHitConfig = {
  hitWindowEnemyWidthMultiplier: 1,
  hitWindowEnemyHeightMultiplier: 0.5,
  hitWindowMinHorizontalPadding: 24,
  hitWindowMaxHorizontalPadding: 96,
  hitWindowMinVerticalPadding: 18,
  hitWindowMaxVerticalPadding: 40,
  laneHitToleranceY: 52,
  useNpcBoundsForLandingHit: true,
  ordinaryPoopMaxTargets: 1,
  deterministicTieBreakStrategy: 'distance_lane_id'
};
