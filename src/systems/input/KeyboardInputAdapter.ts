import Phaser from 'phaser';
import { ActionStateStore, InputActions, type InputSnapshot } from '../../domain/input/ActionState';

const KEY_MAPPINGS = [
  { action: InputActions.Left, codes: ['KeyA', 'ArrowLeft'] },
  { action: InputActions.Right, codes: ['KeyD', 'ArrowRight'] },
  { action: InputActions.Throw, codes: ['Space'] },
  { action: InputActions.Aim, codes: ['ShiftLeft', 'ShiftRight'] },
  { action: InputActions.SwitchPrev, codes: ['KeyQ'] },
  { action: InputActions.SwitchNext, codes: ['KeyE'] }
] as const;

export class KeyboardInputAdapter {
  private readonly actions = new ActionStateStore();
  private readonly keydownHandler = (event: KeyboardEvent) => this.handleKey(event, true);
  private readonly keyupHandler = (event: KeyboardEvent) => this.handleKey(event, false);

  constructor(private readonly scene: Phaser.Scene) {
    this.scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.keydownHandler);
    this.scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.keyupHandler);
  }

  snapshot(): InputSnapshot { return this.actions.snapshot(); }
  endFrame(): void { this.actions.clearTransient(); }
  clearAll(): void { this.actions.clearAll(); }
  listenerCount(): number { return 2; }

  dispose(): void {
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.keydownHandler);
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.keyupHandler);
    this.clearAll();
  }

  private handleKey(event: KeyboardEvent, held: boolean): void {
    const mapping = KEY_MAPPINGS.find((candidate) => candidate.codes.includes(event.code as never));
    if (!mapping) return;
    event.preventDefault();
    this.actions.setHeld(mapping.action, held);
  }
}
