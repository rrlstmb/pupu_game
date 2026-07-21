import type { MouseInputConfig } from '../../data/mouseInput';
import { mouseHorizontalAxis, pointerClientToWorld, type MouseInputSnapshot } from '../../domain/input/GameplayInputController';

type MouseInputOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly config: MouseInputConfig;
  readonly worldSize: { readonly width: number; readonly height: number };
  readonly getPlayerX: () => number;
  readonly isOverUi: (worldX: number, worldY: number) => boolean;
  readonly canStartGameplayPointer: () => boolean;
  readonly shouldIgnoreMouse?: () => boolean;
};

export class MouseInputAdapter {
  private horizontalAxis = 0;
  private pointerInside = false;
  private overUi = false;
  private pressed = false;
  private held = false;
  private released = false;
  private activeThisFrame = false;
  private capturedPointerId: number | null = null;
  private pointerWorldX = 0;
  private pointerWorldY = 0;

  constructor(private readonly options: MouseInputOptions) {
    const canvas = options.canvas;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('lostpointercapture', this.onLostPointerCapture);
    canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  snapshot(): MouseInputSnapshot {
    this.overUi = this.pointerInside && this.options.isOverUi(this.pointerWorldX, this.pointerWorldY);
    this.horizontalAxis = this.pointerInside && !this.overUi
      ? mouseHorizontalAxis(this.pointerWorldX, this.options.getPlayerX(), this.options.config)
      : 0;
    return {
      horizontalAxis: this.horizontalAxis,
      charge: { pressed: this.pressed, held: this.held, released: this.released },
      pointerInside: this.pointerInside,
      overUi: this.overUi,
      activeThisFrame: this.activeThisFrame
    };
  }

  endFrame(): void {
    this.pressed = false;
    this.released = false;
    this.activeThisFrame = false;
  }

  clearAll(): void {
    this.horizontalAxis = 0;
    this.pointerInside = false;
    this.overUi = false;
    this.pressed = false;
    this.held = false;
    this.released = false;
    this.activeThisFrame = false;
    this.releaseCapture();
  }

  dispose(): void {
    const canvas = this.options.canvas;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerCancel);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    canvas.removeEventListener('lostpointercapture', this.onLostPointerCapture);
    canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.clearAll();
  }

  listenerCount(): number { return 7; }
  hasPointerCapture(): boolean { return this.capturedPointerId !== null; }

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || this.options.shouldIgnoreMouse?.()) return;
    const point = this.toWorld(event);
    this.pointerWorldX = point.x;
    this.pointerWorldY = point.y;
    this.pointerInside = point.inside;
    this.overUi = point.inside && this.options.isOverUi(point.x, point.y);
    this.horizontalAxis = point.inside && !this.overUi
      ? mouseHorizontalAxis(point.x, this.options.getPlayerX(), this.options.config)
      : 0;
    this.activeThisFrame = true;
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || this.options.shouldIgnoreMouse?.()) return;
    const point = this.toWorld(event);
    this.pointerWorldX = point.x;
    this.pointerWorldY = point.y;
    this.pointerInside = point.inside;
    this.overUi = point.inside && this.options.isOverUi(point.x, point.y);
    if (!point.inside || this.overUi || !this.options.canStartGameplayPointer()) return;
    event.preventDefault();
    if (!this.held) {
      this.pressed = true;
      this.held = true;
    }
    this.activeThisFrame = true;
    try {
      this.options.canvas.setPointerCapture(event.pointerId);
      this.capturedPointerId = event.pointerId;
    } catch {
      this.capturedPointerId = null;
    }
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || this.options.shouldIgnoreMouse?.()) return;
    if (this.held) {
      this.held = false;
      this.released = true;
      this.activeThisFrame = true;
    }
    this.releaseCapture(event.pointerId);
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.clearAll();
  };

  private readonly onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.pointerInside = false;
    this.overUi = false;
    this.horizontalAxis = 0;
  };

  private readonly onLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId !== this.capturedPointerId) return;
    this.capturedPointerId = null;
    if (this.held) this.clearAll();
  };

  private readonly onContextMenu = (event: MouseEvent) => event.preventDefault();

  private toWorld(event: PointerEvent) {
    return pointerClientToWorld(
      { x: event.clientX, y: event.clientY },
      this.options.canvas.getBoundingClientRect(),
      this.options.worldSize
    );
  }

  private releaseCapture(pointerId = this.capturedPointerId): void {
    if (pointerId === null) return;
    try {
      if (this.options.canvas.hasPointerCapture(pointerId)) this.options.canvas.releasePointerCapture(pointerId);
    } catch {
      // Capture can already be released by the browser during blur or scene shutdown.
    }
    if (this.capturedPointerId === pointerId) this.capturedPointerId = null;
  }
}
