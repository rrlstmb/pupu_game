import Phaser from 'phaser';
import { eventBus } from './EventBus';
import { GameEvents } from './GameEvents';

export type SceneDisposer = () => void;

export function registerSceneDisposer(scene: Phaser.Scene, disposer: SceneDisposer): void {
  let disposed = false;
  const disposeOnce = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeOnce);
    scene.events.off(Phaser.Scenes.Events.DESTROY, disposeOnce);
    disposer();
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeOnce);
  scene.events.once(Phaser.Scenes.Events.DESTROY, disposeOnce);
}

export function emitSceneReady(scene: Phaser.Scene): void {
  eventBus.emit(GameEvents.SceneReady, { scene: scene.scene.key });
}

export function emitSceneShutdown(scene: Phaser.Scene): void {
  eventBus.emit(GameEvents.SceneShutdown, { scene: scene.scene.key });
}
