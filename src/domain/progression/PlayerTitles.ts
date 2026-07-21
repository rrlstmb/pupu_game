import type { SaveData } from '../persistence/SaveData';

export const PLAYER_TITLES = [
  'plain_delivery', 'physics_kid', 'grudge_master', 'alley_disaster', 'silent_prankster',
  'edge_delivery', 'deadline_infamy', 'movement_predictor', 'poetic_justice', 'chosen_deliverer'
] as const;

export const PLAYER_TITLE_LABELS: Readonly<Record<(typeof PLAYER_TITLES)[number], string>> = {
  plain_delivery: '樸實無華', physics_kid: '物理學屁孩', grudge_master: '記仇大師', alley_disaster: '巷弄災難',
  silent_prankster: '無聲惡作劇', edge_delivery: '刀口投遞', deadline_infamy: '壓線臭名',
  movement_predictor: '移動預判王', poetic_justice: '惡有惡報', chosen_deliverer: '天選投遞員'
};

export function evaluatePlayerTitles(save: SaveData): readonly string[] {
  const completed = save.campaign.completedLevelIds.length;
  const records = Object.values(save.campaign.levelRecords);
  const mastered = records.filter((record) => record.bestStars === 3).length;
  const result: string[] = [];
  if (completed >= 1) result.push('plain_delivery');
  if (completed >= 3) result.push('physics_kid');
  if ((save.campaign.levelRecords.level_07?.completionCount ?? 0) > 0) result.push('grudge_master');
  if (completed >= 5) result.push('alley_disaster');
  if ((save.campaign.levelRecords.level_09?.bestAccuracy ?? 0) >= 0.75) result.push('silent_prankster');
  if (records.some((record) => record.bestCombo >= 10)) result.push('edge_delivery');
  if (records.some((record) => record.bestCompletionTimeMs !== undefined && record.bestCompletionTimeMs > 0)) result.push('deadline_infamy');
  if ((save.campaign.levelRecords.level_05?.completed ?? false) && (save.campaign.levelRecords.level_07?.completed ?? false)) result.push('movement_predictor');
  if ((save.campaign.levelRecords.level_10?.completed ?? false)) result.push('poetic_justice');
  if (save.campaign.completed && mastered >= 5) result.push('chosen_deliverer');
  return result;
}
