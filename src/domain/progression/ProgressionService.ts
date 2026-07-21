import { CAMPAIGN_LEVELS, campaignLevelById, nextCampaignLevel } from '../../data/campaign';
import { CHALLENGE_DEFINITIONS, rankChallenge, type RunContext } from '../modes/ModeRegistry';
import type { SaveData, LevelPersistentRecord, ChallengePersistentRecord } from '../persistence/SaveData';
import { evaluatePlayerTitles } from './PlayerTitles';

export type LevelCompletionResult = {
  readonly resultToken: string;
  readonly levelSessionId: string;
  readonly levelId: string;
  readonly outcome: 'success' | 'failure';
  readonly score: number;
  readonly stars: number;
  readonly accuracy: number;
  readonly maxCombo: number;
  readonly completionTimeMs?: number;
};

export type ResultCommit = {
  readonly data: SaveData;
  readonly changed: boolean;
  readonly newRecord: boolean;
  readonly unlockedLevelIds: readonly string[];
  readonly unlockedPoopTypeIds: readonly string[];
  readonly unlockedModeIds: readonly string[];
};

const campaignOrder = CAMPAIGN_LEVELS.map((entry) => entry.definition.id);

function uniqueOrdered(values: readonly string[], order?: readonly string[]): string[] {
  const result = [...new Set(values)];
  return order ? result.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : result.sort();
}

function betterRank(next: string | undefined, previous: string | undefined): string | undefined {
  const order = ['S', 'A', 'B', 'C'];
  if (!next) return previous;
  if (!previous || order.indexOf(next) < order.indexOf(previous)) return next;
  return previous;
}

export function levelProgressState(save: SaveData, levelId: string): 'locked' | 'unlocked' | 'completed' | 'mastered' {
  if (!save.unlocks.levelIds.includes(levelId)) return 'locked';
  const record = save.campaign.levelRecords[levelId];
  if (record?.bestStars === 3) return 'mastered';
  if (record?.completed) return 'completed';
  return 'unlocked';
}

export function continueLevelId(save: SaveData): string | undefined {
  if (save.campaign.completed) return undefined;
  const unlocked = campaignOrder.filter((id) => save.unlocks.levelIds.includes(id));
  return [...unlocked].reverse().find((id) => !save.campaign.completedLevelIds.includes(id)) ?? campaignOrder.at(-1);
}

function emptyRecord(levelId: string): LevelPersistentRecord {
  return { levelId, completed: false, completionCount: 0, bestScore: 0, bestStars: 0, bestAccuracy: 0, bestCombo: 0 };
}

function updateCampaign(save: SaveData, result: LevelCompletionResult, now: string): ResultCommit {
  if (result.outcome !== 'success' || !campaignLevelById(result.levelId)) {
    return { data: save, changed: false, newRecord: false, unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: [] };
  }
  const previous = save.campaign.levelRecords[result.levelId] ?? emptyRecord(result.levelId);
  const time = result.completionTimeMs;
  const bestTime = time === undefined ? previous.bestCompletionTimeMs
    : previous.bestCompletionTimeMs === undefined ? time : Math.min(previous.bestCompletionTimeMs, time);
  const updated: LevelPersistentRecord = {
    ...previous,
    completed: true,
    completionCount: previous.completionCount + 1,
    bestScore: Math.max(previous.bestScore, result.score),
    bestStars: Math.max(previous.bestStars, Math.min(3, result.stars)),
    bestAccuracy: Math.max(previous.bestAccuracy, Math.min(1, result.accuracy)),
    bestCombo: Math.max(previous.bestCombo, result.maxCombo),
    ...(bestTime !== undefined ? { bestCompletionTimeMs: bestTime } : {}),
    firstCompletedAt: previous.firstCompletedAt ?? now,
    lastCompletedAt: now
  };
  const next = nextCampaignLevel(result.levelId)?.definition;
  const unlockedLevelIds = next && !save.unlocks.levelIds.includes(next.id) ? [next.id] : [];
  const discovered = campaignLevelById(result.levelId)!.definition.availablePoopTypes;
  const unlockedPoopTypeIds = discovered.filter((id) => !save.unlocks.poopTypeIds.includes(id));
  const completesCampaign = result.levelId === campaignOrder.at(-1);
  const candidateModeIds = [
    ...(result.levelId === 'level_01' ? ['free_play', 'precision'] : []),
    ...(completesCampaign ? ['challenge', 'endless', 'frenzy', 'daily'] : [])
  ];
  const unlockedModeIds = candidateModeIds.filter((id) => !save.unlocks.modeIds.includes(id));
  const completedLevelIds = uniqueOrdered([...save.campaign.completedLevelIds, result.levelId], campaignOrder);
  let data: SaveData = {
    ...save,
    campaign: {
      ...save.campaign,
      started: true,
      completed: save.campaign.completed || completesCampaign,
      highestUnlockedLevelId: next?.id ?? save.campaign.highestUnlockedLevelId,
      completedLevelIds,
      levelRecords: { ...save.campaign.levelRecords, [result.levelId]: updated }
    },
    unlocks: {
      ...save.unlocks,
      levelIds: uniqueOrdered([...save.unlocks.levelIds, ...unlockedLevelIds], campaignOrder),
      poopTypeIds: uniqueOrdered([...save.unlocks.poopTypeIds, ...unlockedPoopTypeIds]),
      modeIds: uniqueOrdered([...save.unlocks.modeIds, ...unlockedModeIds])
    }
  };
  data = { ...data, unlocks: { ...data.unlocks, titleIds: evaluatePlayerTitles(data) } };
  const newRecord = updated.bestScore > previous.bestScore || updated.bestStars > previous.bestStars ||
    updated.bestAccuracy > previous.bestAccuracy || updated.bestCombo > previous.bestCombo || bestTime !== previous.bestCompletionTimeMs;
  return { data, changed: true, newRecord, unlockedLevelIds, unlockedPoopTypeIds, unlockedModeIds };
}

function updateChallenge(save: SaveData, result: LevelCompletionResult, context: RunContext): ResultCommit {
  const definition = CHALLENGE_DEFINITIONS.find((item) => item.id === context.challengeId);
  if (!definition) return { data: save, changed: false, newRecord: false, unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: [] };
  const previous: ChallengePersistentRecord = save.modes.challengeRecords[definition.id] ?? {
    challengeId: definition.id, attempts: 0, completions: 0, bestScore: 0
  };
  const rank = result.outcome === 'success' ? rankChallenge(result.score, definition.rankingThresholds) : undefined;
  const time = result.completionTimeMs;
  const updated: ChallengePersistentRecord = {
    ...previous,
    attempts: previous.attempts + 1,
    completions: previous.completions + (result.outcome === 'success' ? 1 : 0),
    bestScore: Math.max(previous.bestScore, result.score),
    ...(betterRank(rank, previous.bestRank) ? { bestRank: betterRank(rank, previous.bestRank) } : {}),
    ...(time !== undefined && result.outcome === 'success'
      ? { bestCompletionTimeMs: previous.bestCompletionTimeMs === undefined ? time : Math.min(previous.bestCompletionTimeMs, time) }
      : previous.bestCompletionTimeMs !== undefined ? { bestCompletionTimeMs: previous.bestCompletionTimeMs } : {})
  };
  return {
    data: { ...save, modes: { challengeRecords: { ...save.modes.challengeRecords, [definition.id]: updated } } },
    changed: true,
    newRecord: updated.bestScore > previous.bestScore || updated.bestRank !== previous.bestRank,
    unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: []
  };
}

export function applyLevelResult(save: SaveData, result: LevelCompletionResult, context: RunContext, now: string): ResultCommit {
  if (save.processedResultTokens.includes(result.resultToken)) {
    return { data: save, changed: false, newRecord: false, unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: [] };
  }
  const base = context.progressionEligibility === 'campaign' ? updateCampaign(save, result, now)
    : context.progressionEligibility === 'mode_record_only' ? updateChallenge(save, result, context)
      : { data: save, changed: false, newRecord: false, unlockedLevelIds: [], unlockedPoopTypeIds: [], unlockedModeIds: [] };
  if (context.progressionEligibility === 'none' || !base.changed) return base;
  return {
    ...base,
    data: { ...base.data, processedResultTokens: [...base.data.processedResultTokens, result.resultToken].slice(-256) },
    changed: true
  };
}
