import type Phaser from 'phaser';
import { Depths } from '../../domain/layout/Depth';
import { createPresentationLedger, releasePresentation, reservePresentationToken, type PresentationLedgerState } from '../../domain/presentation/PresentationLedger';

type EffectView = { readonly ring: Phaser.GameObjects.Arc; readonly text: Phaser.GameObjects.Text };
export type PresentationEffectStats = { readonly active: number; readonly pooled: number; readonly created: number; readonly dropped: number };

export class PhaserPresentationEffects {
  private readonly active = new Set<EffectView>();
  private readonly pool: EffectView[] = [];
  private ledger: PresentationLedgerState = createPresentationLedger();
  private created = 0;
  constructor(private readonly scene: Phaser.Scene, private readonly capacity = 24) {}

  burst(token: string, x: number, y: number, label: string, color: number, heavy = false): boolean {
    const reserved = reservePresentationToken(this.ledger, token, this.capacity);
    this.ledger = reserved.state;
    if (!reserved.accepted) return false;
    const view = this.pool.pop() ?? this.createView();
    this.active.add(view);
    view.ring.setPosition(x, y).setRadius(heavy ? 30 : 18).setStrokeStyle(heavy ? 6 : 4, color, 0.95)
      .setScale(0.45).setAlpha(1).setVisible(true).setActive(true);
    view.text.setPosition(x, y - 38).setText(label).setColor(`#${color.toString(16).padStart(6, '0')}`)
      .setAlpha(1).setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: [view.ring, view.text], alpha: 0, duration: heavy ? 520 : 380, ease: 'Quad.easeOut',
      onUpdate: () => view.ring.setScale(Math.min(1.7, view.ring.scaleX + 0.045)),
      onComplete: () => this.release(view)
    });
    return true;
  }

  reset(): void {
    for (const view of this.active) this.release(view);
    this.ledger = createPresentationLedger();
  }
  dispose(): void { this.reset(); this.pool.forEach((view) => { view.ring.destroy(); view.text.destroy(); }); this.pool.length = 0; }
  stats(): PresentationEffectStats { return { active: this.active.size, pooled: this.pool.length, created: this.created, dropped: this.ledger.droppedCount }; }

  private createView(): EffectView {
    this.created += 1;
    return {
      ring: this.scene.add.circle(0, 0, 18).setFillStyle(0, 0).setDepth(Depths.particles + 2).setVisible(false),
      text: this.scene.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '18px', color: '#fff', stroke: '#111827', strokeThickness: 4 })
        .setOrigin(0.5).setDepth(Depths.particles + 3).setVisible(false)
    };
  }
  private release(view: EffectView): void {
    if (!this.active.delete(view)) return;
    this.scene.tweens.killTweensOf([view.ring, view.text]);
    view.ring.setVisible(false).setActive(false).setAlpha(1).setScale(1);
    view.text.setVisible(false).setActive(false).setAlpha(1).setText('').setScale(1).clearTint();
    this.pool.push(view);
    this.ledger = releasePresentation(this.ledger);
  }
}
