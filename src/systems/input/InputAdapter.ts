import Phaser from 'phaser';
import { MOUSE_INPUT_CONFIG } from '../../data/mouseInput';
import { GameplayInputController, type GameplayInputIntent } from '../../domain/input/GameplayInputController';
import { KeyboardInputAdapter } from './KeyboardInputAdapter';
import { MouseInputAdapter } from './MouseInputAdapter';

type InputAdapterOptions = {
  readonly worldSize: { readonly width: number; readonly height: number };
  readonly getPlayerX: () => number;
  readonly isOverUi: (worldX: number, worldY: number) => boolean;
  readonly canStartGameplayPointer: () => boolean;
};

export class InputAdapter {
  private readonly keyboard: KeyboardInputAdapter;
  private readonly mouse: MouseInputAdapter;
  private readonly controller = new GameplayInputController();
  private readonly blurHandler = () => this.clearAll();
  private readonly visibilityHandler = () => { if (document.hidden) this.clearAll(); };
  private readonly pauseHandler = () => this.clearAll();
  private readonly resumeHandler = () => this.clearAll();
  private disposed = false;

  constructor(private readonly scene: Phaser.Scene, options: InputAdapterOptions) {
    this.keyboard = new KeyboardInputAdapter(scene);
    this.mouse = new MouseInputAdapter({
      canvas: scene.game.canvas,
      config: MOUSE_INPUT_CONFIG,
      ...options
    });
    window.addEventListener('blur', this.blurHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    scene.events.on(Phaser.Scenes.Events.RESUME, this.resumeHandler);
  }

  snapshot(): GameplayInputIntent {
    return this.controller.resolve(this.keyboard.snapshot(), this.mouse.snapshot());
  }

  endFrame(): void {
    this.keyboard.endFrame();
    this.mouse.endFrame();
  }

  clearAll(): void {
    this.keyboard.clearAll();
    this.mouse.clearAll();
    this.controller.reset();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.keyboard.dispose();
    this.mouse.dispose();
    window.removeEventListener('blur', this.blurHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.resumeHandler);
    this.controller.reset();
  }

  getBoundListenerCount(): number {
    return this.keyboard.listenerCount() + this.mouse.listenerCount() + 4;
  }

  getPointerListenerCount(): number { return this.mouse.listenerCount(); }
  hasPointerCapture(): boolean { return this.mouse.hasPointerCapture(); }
  getChargeOwner() { return this.controller.owner(); }
}
