import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, getAspectRatio, isSupportedAspectRatio } from '../../src/runtime/GameConfig';
import { SceneKeys } from '../../src/runtime/SceneKeys';

describe('GameConfig', () => {
  it('uses a 16:9 baseline canvas', () => {
    expect(GAME_CONFIG.width).toBe(1280);
    expect(GAME_CONFIG.height).toBe(720);
    expect(getAspectRatio(GAME_CONFIG)).toBeCloseTo(16 / 9, 3);
    expect(isSupportedAspectRatio(GAME_CONFIG)).toBe(true);
  });

  it('defines stable scene keys for the lifecycle scaffold', () => {
    expect(SceneKeys.Boot).toBe('BootScene');
    expect(SceneKeys.Preload).toBe('PreloadScene');
    expect(SceneKeys.Menu).toBe('MenuScene');
    expect(SceneKeys.Game).toBe('GameScene');
    expect(SceneKeys.HUD).toBe('HUDScene');
  });
});

