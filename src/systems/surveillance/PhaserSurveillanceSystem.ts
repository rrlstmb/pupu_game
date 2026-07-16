import type Phaser from 'phaser';
import type { SurveillanceDefinition } from '../../domain/level/LevelDefinition';
import type { SurveillanceState } from '../../domain/surveillance/SurveillanceSystem';
import { Depths } from '../../domain/layout/Depth';

type CameraView = {
  readonly zone: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly exposure: Phaser.GameObjects.Rectangle;
};

export class PhaserSurveillanceSystem {
  private readonly views = new Map<string, CameraView>();
  private readonly pool: CameraView[] = [];
  private created = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rules: SurveillanceDefinition,
    private readonly targetY: number
  ) {}

  sync(state: SurveillanceState): void {
    const activeIds = new Set(state.instances.map((instance) => instance.id));
    for (const id of this.views.keys()) if (!activeIds.has(id)) this.release(id);
    for (const instance of state.instances) {
      const view = this.views.get(instance.id) ?? this.acquire(instance.id);
      const recording = instance.mode === 'recording';
      const active = instance.state === 'active';
      const color = recording ? 0x0891b2 : 0xf59e0b;
      view.zone.setPosition(instance.targetZone.centerX, this.targetY)
        .setDisplaySize(instance.targetZone.halfWidth * 2, 58)
        .setFillStyle(color, active ? 0.32 : 0.2)
        .setStrokeStyle(3, color, 0.9);
      const progress = active && recording ? instance.exposure / this.rules.recording.captureThreshold : 0;
      view.label.setPosition(instance.targetZone.centerX, this.targetY - 44)
        .setText(recording
          ? `${active ? 'REC' : '直播預告'} ${Math.round(progress * 100)}%`
          : `${active ? 'FLASH' : '快照倒數'} ${instance.remainingSeconds.toFixed(1)}s`);
      view.exposure.setPosition(instance.targetZone.centerX - instance.targetZone.halfWidth, this.targetY + 35)
        .setOrigin(0, 0.5).setDisplaySize(instance.targetZone.halfWidth * 2 * progress, 7)
        .setVisible(recording && active);
    }
  }

  stats() {
    return { active: this.views.size, pooled: this.pool.length, created: this.created };
  }

  dispose(): void {
    for (const view of [...this.views.values(), ...this.pool]) destroy(view);
    this.views.clear();
    this.pool.length = 0;
  }

  private acquire(id: string): CameraView {
    const view = this.pool.pop() ?? this.create();
    view.zone.setActive(true).setVisible(true);
    view.label.setActive(true).setVisible(true);
    view.exposure.setActive(true);
    this.views.set(id, view);
    return view;
  }

  private create(): CameraView {
    this.created += 1;
    return {
      zone: this.scene.add.rectangle(0, 0, 100, 58, 0xf59e0b, 0.2).setDepth(Depths.rooftop + 12),
      label: this.scene.add.text(0, 0, '快照倒數', {
        fontFamily: 'monospace', fontSize: '17px', color: '#ffffff', backgroundColor: '#164e63', padding: { x: 7, y: 4 }
      }).setOrigin(0.5).setDepth(Depths.rooftop + 13),
      exposure: this.scene.add.rectangle(0, 0, 1, 7, 0x67e8f9, 0.95).setDepth(Depths.rooftop + 14)
    };
  }

  private release(id: string): void {
    const view = this.views.get(id);
    if (!view) return;
    this.views.delete(id);
    view.zone.setActive(false).setVisible(false);
    view.label.setActive(false).setVisible(false);
    view.exposure.setActive(false).setVisible(false);
    if (this.pool.length < this.rules.viewPoolSize) this.pool.push(view);
    else destroy(view);
  }
}

function destroy(view: CameraView): void {
  view.zone.destroy();
  view.label.destroy();
  view.exposure.destroy();
}
