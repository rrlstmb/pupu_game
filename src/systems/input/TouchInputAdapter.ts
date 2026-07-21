import type { TouchInputConfig } from '../../data/touchInput';
import { touchHorizontalAxis, type TouchInputSnapshot } from '../../domain/input/TouchInput';

type TouchInputOptions = {
  readonly root: HTMLElement;
  readonly config: TouchInputConfig;
  readonly getSensitivity: () => number;
  readonly getHandedness: () => 'right_handed' | 'left_handed';
  readonly canStartGameplayPointer: () => boolean;
};

export class TouchInputAdapter {
  private movementPointerId: number | null = null;
  private chargePointerId: number | null = null;
  private movementStartX = 0;
  private movementCurrentX = 0;
  private pressed = false;
  private held = false;
  private released = false;
  private activeThisFrame = false;
  private lastTouchAt = -Infinity;
  readonly overlay: HTMLDivElement;
  readonly movementZone: HTMLDivElement;
  readonly throwButton: HTMLButtonElement;

  constructor(private readonly options: TouchInputOptions) {
    this.overlay = document.createElement('div'); this.overlay.className = 'touch-controls'; this.overlay.dataset.uiInteractive = 'true';
    this.movementZone = document.createElement('div'); this.movementZone.className = 'touch-movement-zone'; this.movementZone.setAttribute('aria-label', '左右移動區');
    this.throwButton = document.createElement('button'); this.throwButton.className = 'touch-throw-button'; this.throwButton.type = 'button'; this.throwButton.textContent = '按住蓄力\n放開投擲';
    this.overlay.append(this.movementZone, this.throwButton); options.root.append(this.overlay); this.applyHandedness();
    this.movementZone.addEventListener('pointerdown', this.onMovementDown);
    this.movementZone.addEventListener('pointermove', this.onMovementMove);
    this.movementZone.addEventListener('pointerup', this.onMovementEnd);
    this.movementZone.addEventListener('pointercancel', this.onMovementCancel);
    this.movementZone.addEventListener('lostpointercapture', this.onMovementCancel);
    this.throwButton.addEventListener('pointerdown', this.onChargeDown);
    this.throwButton.addEventListener('pointerup', this.onChargeUp);
    this.throwButton.addEventListener('pointercancel', this.onChargeCancel);
    this.throwButton.addEventListener('lostpointercapture', this.onChargeCancel);
  }

  snapshot(): TouchInputSnapshot {
    const axis = this.movementPointerId === null ? 0 : touchHorizontalAxis(this.movementStartX, this.movementCurrentX, this.options.config, this.options.getSensitivity());
    return { horizontalAxis: axis, charge: { pressed: this.pressed, held: this.held, released: this.released }, activeThisFrame: this.activeThisFrame };
  }
  endFrame(): void { this.pressed = false; this.released = false; this.activeThisFrame = false; }
  clearAll(): void {
    this.release(this.movementZone, this.movementPointerId); this.release(this.throwButton, this.chargePointerId);
    this.movementPointerId = null; this.chargePointerId = null; this.pressed = false; this.held = false; this.released = false; this.activeThisFrame = false;
    this.throwButton.dataset.charging = 'false';
  }
  dispose(): void {
    this.clearAll();
    this.movementZone.removeEventListener('pointerdown', this.onMovementDown); this.movementZone.removeEventListener('pointermove', this.onMovementMove);
    this.movementZone.removeEventListener('pointerup', this.onMovementEnd); this.movementZone.removeEventListener('pointercancel', this.onMovementCancel);
    this.movementZone.removeEventListener('lostpointercapture', this.onMovementCancel);
    this.throwButton.removeEventListener('pointerdown', this.onChargeDown); this.throwButton.removeEventListener('pointerup', this.onChargeUp);
    this.throwButton.removeEventListener('pointercancel', this.onChargeCancel); this.throwButton.removeEventListener('lostpointercapture', this.onChargeCancel);
    this.overlay.remove();
  }
  setVisible(visible: boolean): void { this.overlay.hidden = !visible; if (!visible) this.clearAll(); }
  refreshLayout(): void { this.applyHandedness(); this.clearAll(); }
  listenerCount(): number { return 9; }
  hasPointerCapture(): boolean { return this.movementPointerId !== null || this.chargePointerId !== null; }
  movementOwner(): number | null { return this.movementPointerId; }
  chargeOwner(): number | null { return this.chargePointerId; }
  shouldSuppressMouse(now = performance.now()): boolean { return now - this.lastTouchAt <= this.options.config.preventSyntheticMouseMs; }

  private readonly onMovementDown = (event: PointerEvent) => {
    if (!this.isTouchLike(event) || this.movementPointerId !== null || !this.options.canStartGameplayPointer()) return;
    event.preventDefault(); this.lastTouchAt = performance.now(); this.movementPointerId = event.pointerId; this.movementStartX = event.clientX; this.movementCurrentX = event.clientX; this.activeThisFrame = true; this.capture(this.movementZone, event.pointerId);
  };
  private readonly onMovementMove = (event: PointerEvent) => { if (event.pointerId === this.movementPointerId) { event.preventDefault(); this.movementCurrentX = event.clientX; this.activeThisFrame = true; this.lastTouchAt = performance.now(); } };
  private readonly onMovementEnd = (event: PointerEvent) => { if (event.pointerId === this.movementPointerId) { event.preventDefault(); this.release(this.movementZone, event.pointerId); this.movementPointerId = null; this.activeThisFrame = true; this.lastTouchAt = performance.now(); } };
  private readonly onMovementCancel = (event: PointerEvent) => { if (event.pointerId === this.movementPointerId) { this.release(this.movementZone, event.pointerId); this.movementPointerId = null; } };
  private readonly onChargeDown = (event: PointerEvent) => {
    if (!this.isTouchLike(event) || this.chargePointerId !== null || !this.options.canStartGameplayPointer()) return;
    event.preventDefault(); this.lastTouchAt = performance.now(); this.chargePointerId = event.pointerId; this.pressed = true; this.held = true; this.activeThisFrame = true; this.throwButton.dataset.charging = 'true'; this.capture(this.throwButton, event.pointerId);
  };
  private readonly onChargeUp = (event: PointerEvent) => { if (event.pointerId === this.chargePointerId) { event.preventDefault(); this.held = false; this.released = true; this.activeThisFrame = true; this.lastTouchAt = performance.now(); this.release(this.throwButton, event.pointerId); this.chargePointerId = null; this.throwButton.dataset.charging = 'false'; } };
  private readonly onChargeCancel = (event: PointerEvent) => { if (event.pointerId === this.chargePointerId) { this.release(this.throwButton, event.pointerId); this.chargePointerId = null; this.held = false; this.pressed = false; this.released = false; this.throwButton.dataset.charging = 'false'; } };
  private isTouchLike(event: PointerEvent): boolean { return event.pointerType === 'touch' || (event.pointerType === 'pen' && this.options.config.penPolicy === 'touch_like'); }
  private applyHandedness(): void { this.overlay.dataset.handedness = this.options.getHandedness(); }
  private capture(element: HTMLElement, pointerId: number): void { try { element.setPointerCapture(pointerId); } catch { /* capture support varies */ } }
  private release(element: HTMLElement, pointerId: number | null): void { if (pointerId === null) return; try { if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId); } catch { /* browser already released */ } }
}
