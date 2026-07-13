import Phaser from 'phaser';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady } from '../runtime/sceneLifecycle';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    emitSceneReady(this);
    this.scene.start(SceneKeys.Preload);
  }
}

