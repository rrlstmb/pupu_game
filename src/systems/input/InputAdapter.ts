import Phaser from 'phaser';
import { MOUSE_INPUT_CONFIG } from '../../data/mouseInput';
import { GameplayInputController, type GameplayInputIntent } from '../../domain/input/GameplayInputController';
import { KeyboardInputAdapter } from './KeyboardInputAdapter';
import { MouseInputAdapter } from './MouseInputAdapter';
import { TouchInputAdapter } from './TouchInputAdapter';
import { TOUCH_INPUT_CONFIG } from '../../data/touchInput';
import { settingsService } from '../../runtime/SettingsRuntime';

type InputAdapterOptions = {
  readonly worldSize: { readonly width: number; readonly height: number };
  readonly getPlayerX: () => number;
  readonly isOverUi: (worldX: number, worldY: number) => boolean;
  readonly canStartGameplayPointer: () => boolean;
};

export class InputAdapter {
  private readonly keyboard: KeyboardInputAdapter;
  private readonly mouse: MouseInputAdapter;
  private readonly touch: TouchInputAdapter;
  private readonly controller = new GameplayInputController();
  private readonly blurHandler = () => this.clearAll();
  private readonly visibilityHandler = () => { if (document.hidden) this.clearAll(); };
  private readonly pauseHandler = () => this.clearAll();
  private readonly resumeHandler = () => this.clearAll();
  private readonly orientationHandler = () => this.clearAll();
  private disposed = false;

  constructor(private readonly scene: Phaser.Scene, options: InputAdapterOptions) {
    this.keyboard = new KeyboardInputAdapter(scene);
    const root = document.getElementById('app') ?? document.body;
    this.touch = new TouchInputAdapter({
      root,
      config: TOUCH_INPUT_CONFIG,
      getSensitivity: () => settingsService().data.controls.touchMovementSensitivity,
      getHandedness: () => settingsService().data.controls.touchLayout,
      canStartGameplayPointer: options.canStartGameplayPointer
    });
    this.mouse = new MouseInputAdapter({
      canvas: scene.game.canvas,
      config: MOUSE_INPUT_CONFIG,
      ...options,
      shouldIgnoreMouse: () => this.touch.shouldSuppressMouse()
    });
    window.addEventListener('blur', this.blurHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('orientationchange', this.orientationHandler);
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    scene.events.on(Phaser.Scenes.Events.RESUME, this.resumeHandler);
  }

  snapshot(): GameplayInputIntent {
    return this.controller.resolve(this.keyboard.snapshot(), this.mouse.snapshot(), this.touch.snapshot());
  }

  endFrame(): void {
    this.keyboard.endFrame();
    this.mouse.endFrame();
    this.touch.endFrame();
  }

  clearAll(): void {
    this.keyboard.clearAll();
    this.mouse.clearAll();
    this.touch.clearAll();
    this.controller.reset();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.keyboard.dispose();
    this.mouse.dispose();
    this.touch.dispose();
    window.removeEventListener('blur', this.blurHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('orientationchange', this.orientationHandler);
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.resumeHandler);
    this.controller.reset();
  }

  getBoundListenerCount(): number {
    return this.keyboard.listenerCount() + this.mouse.listenerCount() + this.touch.listenerCount() + 5;
  }

  getPointerListenerCount(): number { return this.mouse.listenerCount(); }
  getTouchListenerCount(): number { return this.touch.listenerCount(); }
  hasPointerCapture(): boolean { return this.mouse.hasPointerCapture() || this.touch.hasPointerCapture(); }
  getChargeOwner() { return this.controller.owner(); }
  getTouchOwners() { return { movement: this.touch.movementOwner(), charge: this.touch.chargeOwner() }; }
  refreshTouchLayout(): void { this.touch.refreshLayout(); }
}
