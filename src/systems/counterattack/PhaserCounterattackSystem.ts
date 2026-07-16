import type Phaser from 'phaser';
import type { CounterattackDefinition } from '../../domain/level/LevelDefinition';
import type { CounterattackState } from '../../domain/counterattack/CounterattackSystem';
import { Depths } from '../../domain/layout/Depth';

type CounterView = {
  readonly warning: Phaser.GameObjects.Ellipse;
  readonly label: Phaser.GameObjects.Text;
  readonly projectile: Phaser.GameObjects.Arc;
};

export type CounterattackViewStats = {
  readonly active: number;
  readonly pooled: number;
  readonly created: number;
  readonly reused: number;
};

export class PhaserCounterattackSystem {
  private readonly views = new Map<string, CounterView>();
  private readonly pool: CounterView[] = [];
  private created = 0;
  private reused = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly rules: CounterattackDefinition) {}

  sync(state: CounterattackState): void {
    const ids = new Set(state.instances.map((instance) => instance.id));
    for (const id of this.views.keys()) if (!ids.has(id)) this.release(id);
    for (const instance of state.instances) {
      const view = this.views.get(instance.id) ?? this.acquire(instance.id);
      const telegraph = instance.state === 'telegraph';
      view.warning.setPosition(instance.lockedTargetX, instance.targetY)
        .setDisplaySize(this.rules.targetHalfWidth * 2, 42)
        .setVisible(telegraph)
        .setAlpha(0.35 + 0.45 * (1 - instance.remainingSeconds / instance.totalSeconds));
      view.label.setPosition(instance.lockedTargetX, instance.targetY - 34)
        .setText(`! 反擊 ${instance.remainingSeconds.toFixed(1)}s`)
        .setVisible(telegraph);
      const progress = 1 - instance.remainingSeconds / instance.totalSeconds;
      view.projectile.setPosition(
        instance.sourceX + (instance.lockedTargetX - instance.sourceX) * progress,
        instance.sourceY + (instance.targetY - instance.sourceY) * progress - 80 * 4 * progress * (1 - progress)
      ).setVisible(!telegraph);
    }
  }

  dispose(): void {
    for (const view of [...this.views.values(), ...this.pool]) destroy(view);
    this.views.clear();
    this.pool.length = 0;
  }

  stats(): CounterattackViewStats {
    return { active: this.views.size, pooled: this.pool.length, created: this.created, reused: this.reused };
  }

  private acquire(id: string): CounterView {
    const view = this.pool.pop() ?? this.create();
    if (view === undefined) throw new Error('Counterattack view allocation failed');
    if (this.created > 0 && !this.views.has(id) && !view.warning.active) this.reused += 1;
    view.warning.setActive(true);
    view.label.setActive(true);
    view.projectile.setActive(true);
    this.views.set(id, view);
    return view;
  }

  private create(): CounterView {
    this.created += 1;
    return {
      warning: this.scene.add.ellipse(0, 0, this.rules.targetHalfWidth * 2, 42, 0xdc2626, 0.5)
        .setStrokeStyle(3, 0xfef2f2, 0.95).setDepth(Depths.rooftop + 15),
      label: this.scene.add.text(0, 0, '! 反擊', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', backgroundColor: '#991b1b', padding: { x: 7, y: 4 }
      }).setOrigin(0.5).setDepth(Depths.rooftop + 16),
      projectile: this.scene.add.circle(0, 0, this.rules.projectileRadius, 0xf97316, 1)
        .setStrokeStyle(2, 0xfef3c7, 1).setDepth(Depths.projectile + 1)
    };
  }

  private release(id: string): void {
    const view = this.views.get(id);
    if (!view) return;
    this.views.delete(id);
    view.warning.setActive(false).setVisible(false);
    view.label.setActive(false).setVisible(false);
    view.projectile.setActive(false).setVisible(false);
    if (this.pool.length < this.rules.projectilePoolSize) this.pool.push(view);
    else destroy(view);
  }
}

function destroy(view: CounterView): void {
  view.warning.destroy();
  view.label.destroy();
  view.projectile.destroy();
}
