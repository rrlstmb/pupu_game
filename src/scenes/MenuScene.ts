import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../data/campaign';
import type { LevelDefinition } from '../domain/level/LevelDefinition';
import { eventBus } from '../runtime/EventBus';
import { GameEvents } from '../runtime/GameEvents';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';
import { audioSystem } from '../systems/audio/SemanticAudioSystem';

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

    const levelButtons = CAMPAIGN_LEVELS.map((level) => this.createLevelButton(
      level.menuPosition.x,
      level.menuPosition.y,
      level.definition.name,
      level.definition,
      level.menuRole
    ));

    this.add
      .text(GAME_CONFIG.width / 2, 320, '選擇關卡', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9ca3af'
      })
      .setOrigin(0.5);

    const openingButton = this.add.text(GAME_CONFIG.width - 28, 270, '觀看開場', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#f8fafc', backgroundColor: '#334155', padding: { x: 16, y: 8 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setData('role', 'watch-opening');
    openingButton.on(Phaser.Input.Events.POINTER_UP, () => {
      audioSystem.play('ui_confirm', 'menu-opening');
      this.scene.start(SceneKeys.Opening);
    });

    registerSceneDisposer(this, () => {
      levelButtons.forEach((button) => button.removeAllListeners());
      openingButton.removeAllListeners();
      title.destroy();
      subtitle.destroy();
      levelButtons.forEach((button) => button.destroy());
      openingButton.destroy();
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
