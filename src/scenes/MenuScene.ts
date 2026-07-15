import Phaser from 'phaser';
import { LEVEL_01 } from '../data/levels/level01';
import { LEVEL_02 } from '../data/levels/level02';
import { LEVEL_03 } from '../data/levels/level03';
import type { LevelDefinition } from '../domain/level/LevelDefinition';
import { eventBus } from '../runtime/EventBus';
import { GameEvents } from '../runtime/GameEvents';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Menu);
  }

  create(): void {
    emitSceneReady(this);

    const title = this.add
      .text(GAME_CONFIG.width / 2, 210, GAME_CONFIG.title, {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#f7f0dc'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(GAME_CONFIG.width / 2, 286, '每一坨，都有它的使命。', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#f6bd60'
      })
      .setOrigin(0.5);

    const startButton = this.createLevelButton(GAME_CONFIG.width / 2, 390, '第 1 關：準時上班', LEVEL_01, 'start-game');
    const levelTwoButton = this.createLevelButton(GAME_CONFIG.width / 2, 475, '第 2 關：下班尖峰', LEVEL_02, 'start-level-02');
    const levelThreeButton = this.createLevelButton(GAME_CONFIG.width / 2, 560, '第 3 關：雨傘防線', LEVEL_03, 'start-level-03');

    this.add
      .text(GAME_CONFIG.width / 2, 650, '選擇關卡', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9ca3af'
      })
      .setOrigin(0.5);

    registerSceneDisposer(this, () => {
      startButton.removeAllListeners();
      levelTwoButton.removeAllListeners();
      levelThreeButton.removeAllListeners();
      title.destroy();
      subtitle.destroy();
      startButton.destroy();
      levelTwoButton.destroy();
      levelThreeButton.destroy();
      emitSceneShutdown(this);
    });
  }

  private createLevelButton(x: number, y: number, label: string, definition: LevelDefinition, role: string): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#171923',
        backgroundColor: '#f6bd60',
        padding: { x: 28, y: 13 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.setData('role', role);
    button.on(Phaser.Input.Events.POINTER_UP, () => {
      eventBus.emit(GameEvents.StartGame, undefined);
      this.scene.start(SceneKeys.Game, { levelDefinition: definition });
    });
    return button;
  }
}
