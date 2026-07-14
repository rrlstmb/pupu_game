import type Phaser from 'phaser';
import type { ChargeThrowConfig } from '../../data/projectileConfig';
import { chargeMeterState, type ChargeState } from '../../domain/projectile/ChargeSystem';
import { Depths } from '../../domain/layout/Depth';

export class PhaserChargeMeter {
  private readonly container: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private readonly config: ChargeThrowConfig) {
    const { x, y } = config.chargeMeterPosition;
    const background = scene.add.rectangle(0, 0, config.chargeMeterWidth, config.chargeMeterHeight, 0x111827, 0.92)
      .setStrokeStyle(2, 0xf7f0dc, 0.85);
    this.fill = scene.add.rectangle(
      -config.chargeMeterWidth / 2,
      0,
      0,
      config.chargeMeterHeight - 6,
      0x38bdf8,
      1
    ).setOrigin(0, 0.5);
    const minimumMarker = scene.add.rectangle(
      -config.chargeMeterWidth / 2 + config.chargeMeterWidth * config.minThrowPower,
      0,
      2,
      config.chargeMeterHeight,
      0xfacc15,
      1
    );
    this.label = scene.add.text(0, -25, 'POWER 0%', {
      fontFamily: 'monospace', fontSize: '15px', color: '#f7f0dc', backgroundColor: '#111827', padding: { x: 6, y: 3 }
    }).setOrigin(0.5);
    this.container = scene.add.container(x, y, [background, this.fill, minimumMarker, this.label])
      .setDepth(Depths.hud)
      .setVisible(false);
  }

  sync(state: ChargeState): void {
    const presentation = chargeMeterState(state, this.config);
    this.container.setVisible(presentation.visible);
    this.fill
      .setDisplaySize(this.config.chargeMeterWidth * presentation.fillRatio, this.config.chargeMeterHeight - 6)
      .setFillStyle(presentation.isMax ? 0xfacc15 : 0x38bdf8, 1);
    this.label
      .setText(presentation.label)
      .setColor(presentation.isMax ? '#facc15' : '#f7f0dc');
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  dispose(): void {
    this.container.destroy(true);
  }
}
