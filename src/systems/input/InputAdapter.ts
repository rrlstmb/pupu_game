import Phaser from 'phaser';
import { ActionStateStore, InputActions, type InputSnapshot } from '../../domain/input/ActionState';

type KeyMapping = {
  readonly action: keyof typeof InputActions;
  readonly codes: readonly string[];
};

const KEY_MAPPINGS: readonly KeyMapping[] = [
  { action: 'Left', codes: ['KeyA', 'ArrowLeft'] },
  { action: 'Right', codes: ['KeyD', 'ArrowRight'] },
  { action: 'Throw', codes: ['Space'] },
  { action: 'Aim', codes: ['ShiftLeft', 'ShiftRight'] },
  { action: 'SwitchPrev', codes: ['KeyQ'] },
  { action: 'SwitchNext', codes: ['KeyE'] }
];

export class InputAdapter {
  private readonly actions = new ActionStateStore();
  private readonly keydownHandler = (event: KeyboardEvent) => this.handleKey(event, true);
  private readonly keyupHandler = (event: KeyboardEvent) => this.handleKey(event, false);
  private readonly blurHandler = () => this.clearAll();
  private readonly visibilityHandler = () => {
    if (document.hidden) {
      this.clearAll();
    }
  };
  private readonly pauseHandler = () => this.clearAll();
  private readonly resumeHandler = () => this.clearAll();
  private disposed = false;
  private listenerCount = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.bind();
  }

  snapshot(): InputSnapshot {
    return this.actions.snapshot();
  }

  endFrame(): void {
    this.actions.clearTransient();
  }

  clearAll(): void {
    this.actions.clearAll();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.keydownHandler);
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.keyupHandler);
    window.removeEventListener('blur', this.blurHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.resumeHandler);
    this.listenerCount = 0;
    this.clearAll();
  }

  getBoundListenerCount(): number {
    return this.listenerCount;
  }

  private bind(): void {
    this.scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.keydownHandler);
    this.scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.keyupHandler);
    window.addEventListener('blur', this.blurHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, this.pauseHandler);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, this.resumeHandler);
    this.listenerCount = 6;
  }

  private handleKey(event: KeyboardEvent, held: boolean): void {
    const action = actionForCode(event.code);
    if (!action) {
      return;
    }

    event.preventDefault();
    this.actions.setHeld(action, held);
  }
}

function actionForCode(code: string) {
  for (const mapping of KEY_MAPPINGS) {
    if (mapping.codes.includes(code)) {
      return InputActions[mapping.action];
    }
  }

  return undefined;
}
