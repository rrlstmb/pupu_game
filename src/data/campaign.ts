import type { LevelDefinition } from '../domain/level/LevelDefinition';
import { LEVEL_01 } from './levels/level01';
import { LEVEL_02 } from './levels/level02';
import { LEVEL_03 } from './levels/level03';
import { LEVEL_04 } from './levels/level04';
import { LEVEL_05 } from './levels/level05';
import { LEVEL_06 } from './levels/level06';
import { LEVEL_07 } from './levels/level07';
import { LEVEL_08 } from './levels/level08';
import { LEVEL_09 } from './levels/level09';
import { LEVEL_10 } from './levels/level10';

export type CampaignLevel = {
  readonly definition: LevelDefinition;
  readonly menuPosition: { readonly x: number; readonly y: number };
  readonly menuRole: string;
};

export const CAMPAIGN_LEVELS: readonly CampaignLevel[] = [
  { definition: LEVEL_01, menuPosition: { x: 640, y: 390 }, menuRole: 'start-game' },
  { definition: LEVEL_02, menuPosition: { x: 640, y: 475 }, menuRole: 'start-level-02' },
  { definition: LEVEL_03, menuPosition: { x: 640, y: 560 }, menuRole: 'start-level-03' },
  { definition: LEVEL_04, menuPosition: { x: 640, y: 645 }, menuRole: 'start-level-04' },
  { definition: LEVEL_05, menuPosition: { x: 1040, y: 645 }, menuRole: 'start-level-05' },
  { definition: LEVEL_06, menuPosition: { x: 240, y: 645 }, menuRole: 'start-level-06' },
  { definition: LEVEL_07, menuPosition: { x: 1040, y: 560 }, menuRole: 'start-level-07' },
  { definition: LEVEL_08, menuPosition: { x: 240, y: 560 }, menuRole: 'start-level-08' },
  { definition: LEVEL_09, menuPosition: { x: 240, y: 475 }, menuRole: 'start-level-09' },
  { definition: LEVEL_10, menuPosition: { x: 1040, y: 475 }, menuRole: 'start-level-10' }
];

export function campaignLevelById(levelId: string): CampaignLevel | undefined {
  return CAMPAIGN_LEVELS.find((level) => level.definition.id === levelId);
}

export function nextCampaignLevel(levelId: string): CampaignLevel | undefined {
  const index = CAMPAIGN_LEVELS.findIndex((level) => level.definition.id === levelId);
  return index >= 0 ? CAMPAIGN_LEVELS[index + 1] : undefined;
}

export function isFinalCampaignLevel(levelId: string): boolean {
  return CAMPAIGN_LEVELS.at(-1)?.definition.id === levelId;
}
