import type Phaser from 'phaser';
import type { SecurityDefinition } from '../../domain/level/LevelDefinition';
import type { SecurityState } from '../../domain/security/SecuritySystem';
import { Depths } from '../../domain/layout/Depth';

type SecurityView = { readonly zone: Phaser.GameObjects.Rectangle; readonly label: Phaser.GameObjects.Text; readonly progress: Phaser.GameObjects.Rectangle };

export class PhaserSecuritySystem {
  private readonly views = new Map<string, SecurityView>();
  private readonly pool: SecurityView[] = [];
  private readonly coverViews: Phaser.GameObjects.GameObject[] = [];
  private readonly blockadeViews: Phaser.GameObjects.Rectangle[] = [];
  private readonly exposedText: Phaser.GameObjects.Text;
  private readonly blockadeText: Phaser.GameObjects.Text;
  private created = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly rules: SecurityDefinition, private readonly rooftopY: number, private readonly rooftopHeight: number) {
    for (const cover of rules.covers) {
      const rectangle = scene.add.rectangle(cover.x, rooftopY, cover.width, rooftopHeight, 0x374151, 0.82)
        .setOrigin(0, 0).setDepth(Depths.cover);
      const label = scene.add.text(cover.x + cover.width / 2, rooftopY + 25, '掩體', {
        fontFamily: 'sans-serif', fontSize: '15px', color: '#f8fafc'
      }).setOrigin(0.5).setDepth(Depths.cover + 1);
      this.coverViews.push(rectangle, label);
    }
    this.exposedText = scene.add.text(640, rooftopY + rooftopHeight - 18, 'EXPOSED 投擲暴露', {
      fontFamily: 'monospace', fontSize: '18px', color: '#fef2f2', backgroundColor: '#991b1b', padding: { x: 9, y: 5 }
    }).setOrigin(0.5, 1).setDepth(Depths.hud).setVisible(false);
    this.blockadeText = scene.add.text(640, rooftopY + 8, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#fef3c7', backgroundColor: '#78350f', padding: { x: 9, y: 5 }
    }).setOrigin(0.5, 0).setDepth(Depths.hud).setVisible(false);
  }

  sync(state: SecurityState): void {
    const ids = new Set(state.instances.map((instance) => instance.id));
    for (const id of this.views.keys()) if (!ids.has(id)) this.release(id);
    for (const instance of state.instances) {
      const view = this.views.get(instance.id) ?? this.acquire(instance.id);
      const searching = instance.sourceType === 'searchlight';
      const observing = instance.state === 'observing';
      const color = searching ? 0xfacc15 : 0xfb923c;
      view.zone.setPosition(instance.zone.centerX, this.rooftopY + this.rooftopHeight * 0.58)
        .setDisplaySize(instance.zone.halfWidth * 2, 62).setFillStyle(color, observing ? 0.32 : 0.16).setStrokeStyle(3, color, 0.9);
      view.label.setPosition(instance.zone.centerX, this.rooftopY + 42)
        .setText(`${searching ? '搜索燈' : '保全查看'} ${observing ? 'ACTIVE' : `預告 ${instance.remainingSeconds.toFixed(1)}s`}`);
      const progress = instance.detectionProgress / this.rules.detectionThreshold;
      view.progress.setPosition(instance.zone.centerX - instance.zone.halfWidth, this.rooftopY + this.rooftopHeight * 0.58 + 36)
        .setOrigin(0, 0.5).setDisplaySize(instance.zone.halfWidth * 2 * progress, 7).setVisible(observing && progress > 0);
    }
    this.exposedText.setVisible(state.throwExposureSeconds > 0).setText(`EXPOSED ${state.throwExposureSeconds.toFixed(1)}s`);
    this.syncBlockade(state);
  }

  stats() { return { active: this.views.size, pooled: this.pool.length, created: this.created, blockadeViews: this.blockadeViews.length }; }

  dispose(): void {
    for (const view of [...this.views.values(), ...this.pool]) destroyView(view);
    for (const object of this.coverViews) object.destroy();
    for (const view of this.blockadeViews) view.destroy();
    this.views.clear(); this.pool.length = 0; this.coverViews.length = 0; this.blockadeViews.length = 0;
    this.exposedText.destroy(); this.blockadeText.destroy();
  }

  private syncBlockade(state: SecurityState): void {
    if (state.blockade.phase === 'warning') {
      this.blockadeText.setVisible(true).setText(`頂樓封鎖預告 ${state.blockade.remainingSeconds.toFixed(1)}s`);
    } else if (state.blockade.phase === 'active') {
      this.blockadeText.setVisible(true).setText('東側頂樓已封鎖');
    } else this.blockadeText.setVisible(false);
    if (state.blockade.phase !== 'active') return;
    while (this.blockadeViews.length < state.blockade.blockedIntervals.length) {
      this.blockadeViews.push(this.scene.add.rectangle(0, 0, 1, this.rooftopHeight, 0xdc2626, 0.42)
        .setOrigin(0, 0).setStrokeStyle(4, 0xfef3c7, 0.9).setDepth(Depths.cover + 4));
    }
    state.blockade.blockedIntervals.forEach((interval, index) => {
      this.blockadeViews[index].setPosition(interval.start, this.rooftopY).setDisplaySize(interval.end - interval.start, this.rooftopHeight).setVisible(true);
    });
  }

  private acquire(id: string): SecurityView {
    const view = this.pool.pop() ?? this.create();
    view.zone.setActive(true).setVisible(true); view.label.setActive(true).setVisible(true); view.progress.setActive(true);
    this.views.set(id, view); return view;
  }

  private create(): SecurityView {
    this.created += 1;
    return {
      zone: this.scene.add.rectangle(0, 0, 100, 62, 0xfacc15, 0.2).setDepth(Depths.rooftop + 12),
      label: this.scene.add.text(0, 0, '查看預告', { fontFamily: 'monospace', fontSize: '16px', color: '#111827', backgroundColor: '#fde68a', padding: { x: 7, y: 4 } }).setOrigin(0.5).setDepth(Depths.rooftop + 13),
      progress: this.scene.add.rectangle(0, 0, 1, 7, 0xef4444, 0.95).setDepth(Depths.rooftop + 14)
    };
  }

  private release(id: string): void {
    const view = this.views.get(id); if (!view) return;
    this.views.delete(id); view.zone.setActive(false).setVisible(false); view.label.setActive(false).setVisible(false); view.progress.setActive(false).setVisible(false);
    if (this.pool.length < this.rules.viewPoolSize) this.pool.push(view); else destroyView(view);
  }
}

function destroyView(view: SecurityView): void { view.zone.destroy(); view.label.destroy(); view.progress.destroy(); }
