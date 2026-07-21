import { CAMPAIGN_LEVELS, campaignLevelById } from '../../data/campaign';
import type { LevelDefinition } from '../level/LevelDefinition';

export type GameModeId = 'campaign' | 'free_play' | 'challenge' | 'endless' | 'precision' | 'frenzy' | 'daily';
export type ProgressionEligibility = 'campaign' | 'mode_record_only' | 'none';

export type RunContext = {
  readonly modeId: GameModeId;
  readonly levelId: string;
  readonly seed: string;
  readonly progressionEligibility: ProgressionEligibility;
  readonly challengeId?: string;
  readonly runId?: string;
};

export type ChallengeRank = 'S' | 'A' | 'B' | 'C';
export type ChallengeDefinition = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly modeId: Exclude<GameModeId, 'campaign' | 'free_play'>;
  readonly levelId: string;
  readonly seed: string;
  readonly overrides: {
    readonly durationSeconds?: number;
    readonly targetScore?: number;
    readonly availablePoopTypes?: readonly LevelDefinition['availablePoopTypes'][number][];
    readonly poopStockOverrides?: LevelDefinition['poopStockOverrides'];
    readonly spawnIntervalMultiplier?: number;
  };
  readonly rankingThresholds: Readonly<Record<ChallengeRank, number>>;
  readonly unlock: 'level_01_complete' | 'campaign_complete';
};

export const REGISTERED_MODE_IDS: readonly GameModeId[] = [
  'campaign', 'free_play', 'challenge', 'endless', 'precision', 'frenzy', 'daily'
];

export const CHALLENGE_DEFINITIONS: readonly ChallengeDefinition[] = [
  {
    id: 'precision_delivery', title: '精準投遞', description: '有限普通便，準度決勝。', modeId: 'precision',
    levelId: 'level_01', seed: 'precision-delivery-seed',
    overrides: { durationSeconds: 75, targetScore: 420, availablePoopTypes: ['normal_poop'], poopStockOverrides: { normal_poop: 12 } },
    rankingThresholds: { S: 850, A: 650, B: 500, C: 420 }, unlock: 'level_01_complete'
  },
  {
    id: 'crowd_blast', title: '群聚爆擊', description: '用飛濺便處理市場人群。', modeId: 'frenzy',
    levelId: 'level_04', seed: 'crowd-blast-seed',
    overrides: { durationSeconds: 90, targetScore: 1350, availablePoopTypes: ['normal_poop', 'splash_poop'], spawnIntervalMultiplier: 0.72 },
    rankingThresholds: { S: 2400, A: 1950, B: 1600, C: 1350 }, unlock: 'campaign_complete'
  },
  {
    id: 'stealth_crisis', title: '危機潛行', description: '避開保全與搜索燈。', modeId: 'challenge',
    levelId: 'level_09', seed: 'stealth-crisis-seed', overrides: { durationSeconds: 105, targetScore: 1500 },
    rankingThresholds: { S: 2600, A: 2150, B: 1750, C: 1500 }, unlock: 'campaign_complete'
  },
  {
    id: 'endless_patrol', title: '無盡街潮', description: '難度隨事件波次提高，抓包即結束。', modeId: 'endless',
    levelId: 'level_07', seed: 'endless-local-seed', overrides: { durationSeconds: 240, targetScore: 3200, spawnIntervalMultiplier: 0.82 },
    rankingThresholds: { S: 6000, A: 4800, B: 3900, C: 3200 }, unlock: 'campaign_complete'
  },
  {
    id: 'daily_mission', title: '每日屎命', description: '依本地日期固定 seed 的本機挑戰。', modeId: 'daily',
    levelId: 'level_05', seed: 'daily-placeholder', overrides: { durationSeconds: 100, targetScore: 1450 },
    rankingThresholds: { S: 2500, A: 2050, B: 1700, C: 1450 }, unlock: 'campaign_complete'
  }
];

const OVERRIDE_KEYS = new Set(['durationSeconds', 'targetScore', 'availablePoopTypes', 'poopStockOverrides', 'spawnIntervalMultiplier']);

export function validateChallengeDefinition(input: ChallengeDefinition): readonly string[] {
  const errors: string[] = [];
  if (!campaignLevelById(input.levelId)) errors.push(`unknown level ${input.levelId}`);
  for (const key of Object.keys(input.overrides)) if (!OVERRIDE_KEYS.has(key)) errors.push(`override ${key} is not allowed`);
  if (!input.seed || input.seed.length > 64) errors.push('seed must be 1..64 chars');
  if (input.overrides.durationSeconds !== undefined && input.overrides.durationSeconds <= 0) errors.push('duration must be positive');
  if (input.overrides.spawnIntervalMultiplier !== undefined && (input.overrides.spawnIntervalMultiplier <= 0.5 || input.overrides.spawnIntervalMultiplier > 1)) {
    errors.push('spawn interval multiplier must be > 0.5 and <= 1');
  }
  return errors;
}

export function applyChallengeOverride(base: LevelDefinition, challenge: ChallengeDefinition, localDate = ''): LevelDefinition {
  const errors = validateChallengeDefinition(challenge);
  if (errors.length > 0 || base.id !== challenge.levelId) throw new Error(errors.join(', ') || 'challenge level mismatch');
  const seed = challenge.modeId === 'daily' ? dailyChallengeSeed(localDate || new Date().toLocaleDateString('en-CA')) : challenge.seed;
  const { spawnIntervalMultiplier, ...scalarOverrides } = challenge.overrides;
  const scaleSpawn = (spawn: LevelDefinition['spawn']): LevelDefinition['spawn'] => spawnIntervalMultiplier
    ? { ...spawn, intervalSeconds: spawn.intervalSeconds * spawnIntervalMultiplier }
    : spawn;
  return {
    ...base,
    ...scalarOverrides,
    seed,
    spawn: scaleSpawn(base.spawn),
    events: base.events.map((event) => event.spawn ? { ...event, spawn: scaleSpawn(event.spawn) } : event)
  };
}

export function dailyChallengeSeed(localDate: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? localDate : '1970-01-01';
  return `daily-local-${normalized}`;
}

export function normalizeCustomSeed(input: string): string {
  return input.normalize('NFKC').replace(/[^\p{L}\p{N}_-]/gu, '-').replace(/-+/g, '-').slice(0, 40) || 'free-play';
}

export function campaignRunContext(levelId: string): RunContext {
  const level = campaignLevelById(levelId)?.definition ?? CAMPAIGN_LEVELS[0].definition;
  return { modeId: 'campaign', levelId: level.id, seed: level.seed, progressionEligibility: 'campaign' };
}

export function modeRunContext(challenge: ChallengeDefinition, seed: string): RunContext {
  return { modeId: challenge.modeId, levelId: challenge.levelId, seed, progressionEligibility: 'mode_record_only', challengeId: challenge.id };
}

export function rankChallenge(score: number, thresholds: Readonly<Record<ChallengeRank, number>>): ChallengeRank | undefined {
  if (score >= thresholds.S) return 'S';
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return undefined;
}

export function registeredLevelIds(): readonly string[] { return CAMPAIGN_LEVELS.map((entry) => entry.definition.id); }
