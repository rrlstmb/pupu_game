import { createResponsiveLayout, type Insets, type ResponsiveLayoutSnapshot } from '../domain/layout/ResponsiveLayout';

export type LayoutSubscriber = (snapshot: ResponsiveLayoutSnapshot) => void;

export class ResponsiveLayoutService {
  private subscribers = new Set<LayoutSubscriber>();
  private textScale = 1;
  private handedness: 'right_handed' | 'left_handed' = 'right_handed';
  private snapshotValue: ResponsiveLayoutSnapshot;
  private frame = 0;

  constructor(private readonly target: Window = window) {
    this.snapshotValue = this.compute();
    target.addEventListener('resize', this.schedule);
    target.addEventListener('orientationchange', this.schedule);
    target.visualViewport?.addEventListener('resize', this.schedule);
  }

  get snapshot(): ResponsiveLayoutSnapshot { return this.snapshotValue; }
  configure(textScale: number, handedness: 'right_handed' | 'left_handed'): void {
    this.textScale = textScale; this.handedness = handedness; this.refresh();
  }
  subscribe(subscriber: LayoutSubscriber): () => void {
    this.subscribers.add(subscriber); subscriber(this.snapshotValue);
    return () => this.subscribers.delete(subscriber);
  }
  refresh(): void {
    this.snapshotValue = this.compute();
    this.subscribers.forEach((subscriber) => subscriber(this.snapshotValue));
  }
  dispose(): void {
    this.target.removeEventListener('resize', this.schedule);
    this.target.removeEventListener('orientationchange', this.schedule);
    this.target.visualViewport?.removeEventListener('resize', this.schedule);
    if (this.frame) this.target.cancelAnimationFrame(this.frame);
    this.subscribers.clear();
  }
  listenerCount(): number { return 2 + (this.target.visualViewport ? 1 : 0); }
  subscriptionCount(): number { return this.subscribers.size; }

  private readonly schedule = () => {
    if (this.frame) return;
    this.frame = this.target.requestAnimationFrame(() => { this.frame = 0; this.refresh(); });
  };
  private compute(): ResponsiveLayoutSnapshot {
    const viewport = this.target.visualViewport;
    const style = getComputedStyle(document.documentElement);
    const inset = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0;
    const safeArea: Insets = { top: inset('--safe-top'), right: inset('--safe-right'), bottom: inset('--safe-bottom'), left: inset('--safe-left') };
    return createResponsiveLayout({
      cssWidth: viewport?.width ?? this.target.innerWidth,
      cssHeight: viewport?.height ?? this.target.innerHeight,
      devicePixelRatio: this.target.devicePixelRatio || 1,
      safeArea
    }, this.textScale, this.handedness);
  }
}
