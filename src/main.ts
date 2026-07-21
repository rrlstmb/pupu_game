import Phaser from 'phaser';
import { GAME_CONFIG } from './runtime/GameConfig';
import { createPhaserConfig } from './runtime/createPhaserConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { OpeningScene } from './scenes/OpeningScene';
import './styles.css';

const game = new Phaser.Game(
  createPhaserConfig(GAME_CONFIG, [BootScene, PreloadScene, MenuScene, OpeningScene, GameScene, HUDScene])
);

if (GAME_CONFIG.debug) {
  window.__SHIMING_BIDA_DEBUG__ = {
    game,
    config: GAME_CONFIG
  };
}
