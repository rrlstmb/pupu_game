import Phaser from 'phaser';
import type { GameConfig } from './GameConfig';

export function createPhaserConfig(
  config: GameConfig,
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: config.parent,
    title: config.title,
    version: config.version,
    backgroundColor: config.backgroundColor,
    width: config.width,
    height: config.height,
    scene: scenes,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: config.width,
      height: config.height
    },
    render: {
      antialias: true,
      pixelArt: false
    },
    callbacks: {
      postBoot: (game) => {
        game.canvas.dataset.gameReady = 'true';
      }
    }
  };
}

