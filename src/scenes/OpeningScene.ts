import Phaser from 'phaser';
import { LEVEL_01 } from '../data/levels/level01';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';
import { audioSystem } from '../systems/audio/SemanticAudioSystem';

export class OpeningScene extends Phaser.Scene {
  private completed = false;
  constructor() { super(SceneKeys.Opening); }

  create(): void {
    emitSceneReady(this);
    audioSystem.play('opening_start', 'opening-session');
    this.cameras.main.setBackgroundColor('#172033');
    const skyline = this.add.container(0, 0);
    for (let i = 0; i < 12; i += 1) {
      const h = 100 + (i * 47) % 190;
      skyline.add(this.add.rectangle(i * 110, 500 - h, 86, h, i % 2 ? 0x334155 : 0x475569).setOrigin(0, 0));
    }
    const street = this.add.rectangle(0, 500, GAME_CONFIG.width, 220, 0x374151).setOrigin(0, 0);
    const roof = this.add.rectangle(0, 620, GAME_CONFIG.width, 100, 0x713f12).setOrigin(0, 0);
    const player = this.add.image(210, 608, 'character-player').setOrigin(0.5, 1).setScale(1.2);
    const title = this.add.text(GAME_CONFIG.width / 2, 118, '屎命必達', {
      fontFamily: 'sans-serif', fontSize: '72px', color: '#fef3c7', stroke: '#7c2d12', strokeThickness: 8
    }).setOrigin(0.5);
    const mission = this.add.text(GAME_CONFIG.width / 2, 212, '屋頂已就位。街道人潮正經過。', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#e2e8f0'
    }).setOrigin(0.5);
    const controls = this.add.text(GAME_CONFIG.width / 2, 555,
      'A / D 或移動滑鼠：左右移動\nSpace 或按住滑鼠左鍵：蓄力　放開：投擲', {
        fontFamily: 'sans-serif', fontSize: '22px', color: '#f8fafc', backgroundColor: '#111827cc',
        padding: { x: 20, y: 14 }, align: 'center', lineSpacing: 8
      }).setOrigin(0.5).setData('role', 'opening-controls');
    const skip = this.add.text(GAME_CONFIG.width - 32, 28, '跳過並進入第 1 關', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#111827', backgroundColor: '#f6bd60', padding: { x: 18, y: 10 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setData('role', 'opening-skip');
    const complete = () => this.completeOpening();
    skip.on(Phaser.Input.Events.POINTER_UP, complete);
    this.input.keyboard?.on('keydown-ENTER', complete);
    this.tweens.add({ targets: player, x: 330, duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    registerSceneDisposer(this, () => {
      skip.removeAllListeners(); this.input.keyboard?.off('keydown-ENTER', complete); this.tweens.killAll();
      skyline.destroy(true); street.destroy(); roof.destroy(); player.destroy(); title.destroy(); mission.destroy(); controls.destroy(); skip.destroy();
      emitSceneShutdown(this);
    });
  }

  private completeOpening(): void {
    if (this.completed) return;
    this.completed = true;
    audioSystem.play('ui_confirm', 'opening-skip');
    this.input.enabled = false;
    this.scene.start(SceneKeys.Game, { levelDefinition: LEVEL_01 });
  }
}
