import Phaser from 'phaser';
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

    const startButton = this.add
      .text(GAME_CONFIG.width / 2, 400, '開始', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#171923',
        backgroundColor: '#f6bd60',
        padding: { x: 32, y: 16 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.setData('role', 'start-game');
    startButton.on(Phaser.Input.Events.POINTER_UP, this.startGame, this);

    this.add
      .text(GAME_CONFIG.width / 2, 650, 'Phase 01 scaffold only', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9ca3af'
      })
      .setOrigin(0.5);

    registerSceneDisposer(this, () => {
      startButton.off(Phaser.Input.Events.POINTER_UP, this.startGame, this);
      title.destroy();
      subtitle.destroy();
      startButton.destroy();
      emitSceneShutdown(this);
    });
  }

  private startGame(): void {
    eventBus.emit(GameEvents.StartGame, undefined);
    this.scene.start(SceneKeys.Game);
  }
}

