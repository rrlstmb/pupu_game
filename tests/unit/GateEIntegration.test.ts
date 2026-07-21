import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LEVELS, nextCampaignLevel } from '../../src/data/campaign';
import { ASSET_MANIFEST } from '../../src/data/presentation/assetManifest';
import { BOSS_SKIN, NPC_CHARACTER_SKINS, PLAYER_SKIN } from '../../src/data/presentation/characterSkins';
import { createDefaultSave, SAVE_STORAGE_KEY } from '../../src/domain/persistence/SaveData';
import { auditAssets } from '../../src/domain/presentation/AssetAudit';
import { applyLevelResult } from '../../src/domain/progression/ProgressionService';
import { createResponsiveLayout } from '../../src/domain/layout/ResponsiveLayout';
import { CHALLENGE_DEFINITIONS, REGISTERED_MODE_IDS, validateChallengeDefinition } from '../../src/domain/modes/ModeRegistry';
import { createDefaultSettings, SETTINGS_STORAGE_KEY } from '../../src/domain/settings/SettingsData';

describe('Gate E product integration audit', () => {
  it('locks the authored campaign to one valid level 1 through 10 route', () => {
    const ids = CAMPAIGN_LEVELS.map(({ definition }) => definition.id);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, index) => `level_${String(index + 1).padStart(2, '0')}`));
    expect(new Set(ids).size).toBe(10);
    expect(CAMPAIGN_LEVELS.slice(0, -1).map(({ definition }) => nextCampaignLevel(definition.id)?.definition.id))
      .toEqual(ids.slice(1));
    expect(nextCampaignLevel('level_10')).toBeUndefined();
  });

  it('keeps modes registered, referenced, and override-safe', () => {
    expect(new Set(REGISTERED_MODE_IDS).size).toBe(REGISTERED_MODE_IDS.length);
    const levels = new Set(CAMPAIGN_LEVELS.map(({ definition }) => definition.id));
    expect(CHALLENGE_DEFINITIONS.every((definition) => levels.has(definition.levelId))).toBe(true);
    expect(CHALLENGE_DEFINITIONS.flatMap(validateChallengeDefinition)).toEqual([]);
  });

  it('keeps progress, settings, and transient encounter state separated', () => {
    const save = createDefaultSave({ nowIso: () => '2026-07-21T00:00:00.000Z' });
    const settings = createDefaultSettings();
    expect(SAVE_STORAGE_KEY).not.toBe(SETTINGS_STORAGE_KEY);
    expect(save.unlocks.levelIds).toEqual(['level_01']);
    expect(save).not.toHaveProperty('settings');
    expect(settings).not.toHaveProperty('campaign');
    for (const transient of ['inventory', 'finalGoldenRemaining', 'bossPhase', 'hazard', 'chargeOwner', 'pointerCapture']) {
      expect(save).not.toHaveProperty(transient);
    }
  });

  it('deduplicates results and bounds persistent receipts to 256', () => {
    let save = createDefaultSave({ nowIso: () => '2026-07-21T00:00:00.000Z' });
    for (let index = 0; index < 300; index += 1) {
      save = applyLevelResult(save, {
        resultToken: `gate-e-${index}`, levelSessionId: `session-${index}`, levelId: 'level_01',
        outcome: 'success', score: index, stars: 1, accuracy: 0.5, maxCombo: 1
      }, {
        modeId: 'campaign', levelId: 'level_01', seed: 'gate-e', progressionEligibility: 'campaign'
      }, '2026-07-21T00:00:00.000Z').data;
    }
    expect(save.processedResultTokens).toHaveLength(256);
    const duplicate = applyLevelResult(save, {
      resultToken: 'gate-e-299', levelSessionId: 'duplicate', levelId: 'level_01',
      outcome: 'success', score: 9999, stars: 3, accuracy: 1, maxCombo: 99
    }, {
      modeId: 'campaign', levelId: 'level_01', seed: 'gate-e', progressionEligibility: 'campaign'
    }, '2026-07-21T00:00:00.000Z');
    expect(duplicate.changed).toBe(false);
  });

  it('supports the release viewport matrix without changing canonical asset ownership', () => {
    const viewports = [[1366, 768], [1920, 1080], [1024, 768], [768, 1024], [844, 390], [740, 360], [390, 844], [360, 740]] as const;
    for (const [cssWidth, cssHeight] of viewports) {
      const layout = createResponsiveLayout({ cssWidth, cssHeight, devicePixelRatio: 2, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } }, 1.3);
      expect(layout.gameViewport.width).toBe(cssWidth);
      expect(layout.gameViewport.height).toBe(cssHeight);
      expect(layout.fontScale).toBe(1.3);
      expect(layout.touchRegions.movement.width + layout.touchRegions.throw.width).toBe(cssWidth);
    }
    expect(auditAssets(ASSET_MANIFEST, [PLAYER_SKIN, BOSS_SKIN, ...Object.values(NPC_CHARACTER_SKINS)]))
      .toEqual({ valid: true, errors: [] });
    expect(ASSET_MANIFEST.some((asset) => asset.sourceType === 'unknown')).toBe(false);
  });
});
