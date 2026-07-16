import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, campaignLevelById, isFinalCampaignLevel, nextCampaignLevel } from '../../src/data/campaign';
import { NPC_DEFINITIONS } from '../../src/data/npcDefinitions';
import { POOP_DEFINITIONS } from '../../src/data/poopDefinitions';
import { createLevelSession, updateLevelSession } from '../../src/domain/level/LevelDirector';
import { validateLevelDefinition } from '../../src/domain/level/LevelDefinition';

describe('Gate D campaign registry', () => {
  it('defines one valid, reproducible entry for each of the ten authored levels', () => {
    const ids = CAMPAIGN_LEVELS.map((level) => level.definition.id);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, index) => `level_${String(index + 1).padStart(2, '0')}`));
    expect(new Set(ids).size).toBe(10);
    expect(new Set(CAMPAIGN_LEVELS.map((level) => level.menuRole)).size).toBe(10);

    for (const level of CAMPAIGN_LEVELS) {
      expect(validateLevelDefinition(level.definition)).toEqual({ valid: true, definition: level.definition });
      expect(level.definition.seed.trim()).not.toBe('');
      expect(level.definition.stars).toHaveLength(3);
    }
  });

  it('has a complete level 1 to 10 route and terminates after level 10', () => {
    for (let index = 0; index < CAMPAIGN_LEVELS.length - 1; index += 1) {
      expect(nextCampaignLevel(CAMPAIGN_LEVELS[index].definition.id)).toBe(CAMPAIGN_LEVELS[index + 1]);
    }
    expect(nextCampaignLevel('level_10')).toBeUndefined();
    expect(isFinalCampaignLevel('level_10')).toBe(true);
    expect(isFinalCampaignLevel('level_09')).toBe(false);
    expect(campaignLevelById('level_11')).toBeUndefined();
  });

  it('references only registered poop and NPC definitions', () => {
    const poopTypes = new Set(POOP_DEFINITIONS.map((definition) => definition.id));
    const npcTypes = new Set(NPC_DEFINITIONS.map((definition) => definition.id));

    for (const { definition } of CAMPAIGN_LEVELS) {
      expect(definition.availablePoopTypes.every((poopType) => poopTypes.has(poopType))).toBe(true);
      const spawnProfiles = [definition.spawn, ...definition.events.flatMap((event) => event.spawn ? [event.spawn] : []),
        ...(definition.bossEncounter?.phases.map((phase) => phase.spawn) ?? [])];
      expect(spawnProfiles.flatMap((profile) => profile.definitions).every((entry) => npcTypes.has(entry.npcType))).toBe(true);
    }
  });

  it('triggers every authored timed event once and resets event channels per session', () => {
    for (const { definition } of CAMPAIGN_LEVELS) {
      let session = createLevelSession({ ...definition, countdownSeconds: 0 });
      session = updateLevelSession(session, definition.durationSeconds);
      expect(session.triggeredEventIds).toEqual(definition.events.map((event) => event.id));
      expect(new Set(session.triggeredEventIds).size).toBe(session.triggeredEventIds.length);

      const retry = createLevelSession(definition, 2);
      expect(retry.triggeredEventIds).toEqual([]);
      expect(retry.id).not.toBe(session.id);
    }
  });
});
