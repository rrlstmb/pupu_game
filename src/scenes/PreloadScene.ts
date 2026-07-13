import Phaser from 'phaser';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady } from '../runtime/sceneLifecycle';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    this.createPlaceholderTexture('placeholder-tile', 32, 32, 0x4f8fba, 0xf7f0dc);
  }

  create(): void {
    emitSceneReady(this);
    this.scene.start(SceneKeys.Menu);
  }

  private createPlaceholderTexture(
    key: string,
    width: number,
    height: number,
    fillColor: number,
    lineColor: number
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(fillColor, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(2, lineColor, 1);
    graphics.strokeRect(1, 1, width - 2, height - 2);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}

