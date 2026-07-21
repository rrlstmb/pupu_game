import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../../src/data/presentation/assetManifest';
import { AUDIO_MANIFEST } from '../../src/data/presentation/audioManifest';
import { BOSS_SKIN, NPC_CHARACTER_SKINS, PLAYER_SKIN } from '../../src/data/presentation/characterSkins';
import { ENVIRONMENT_SKINS } from '../../src/data/presentation/environmentSkins';
import { PROJECTILE_SKINS } from '../../src/data/presentation/projectileSkins';
import { auditAssets } from '../../src/domain/presentation/AssetAudit';

describe('Prompt 22 asset manifest', () => {
  it('contains only attributable runtime assets with valid fallbacks and skins', () => {
    const skins = [PLAYER_SKIN, BOSS_SKIN, ...Object.values(NPC_CHARACTER_SKINS)];
    expect(auditAssets(ASSET_MANIFEST, skins)).toEqual({ valid: true, errors: [] });
    expect(ASSET_MANIFEST.some((entry) => entry.sourceType === 'unknown')).toBe(false);
    expect(ASSET_MANIFEST.every((entry) => entry.status !== 'final')).toBe(true);
  });

  it('registers every existing projectile, environment profile, and semantic audio event', () => {
    expect(Object.keys(PROJECTILE_SKINS)).toHaveLength(8);
    expect(ENVIRONMENT_SKINS).toHaveLength(10);
    expect(new Set(AUDIO_MANIFEST.map((cue) => cue.event)).size).toBe(AUDIO_MANIFEST.length);
    expect(AUDIO_MANIFEST.every((cue) => cue.concurrency > 0 && cue.durationMs > 0)).toBe(true);
  });

  it('reports unknown sources and missing fallbacks without throwing', () => {
    const result = auditAssets([
      { id: 'bad', type: 'ui', status: 'placeholder', sourceType: 'unknown', sourceNote: 'test', assetKey: 'bad', fallbackKey: 'missing' }
    ], []);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('unknown-source:bad');
    expect(result.errors).toContain('missing-fallback:bad:missing');
  });
});
