import type Phaser from 'phaser';
import type { ChargeThrowConfig } from '../../data/projectileConfig';
import { chargeMeterState, type ChargeState } from '../../domain/projectile/ChargeSystem';
import { Depths } from '../../domain/layout/Depth';

export class PhaserChargeMeter {
  private readonly container: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private lastState: ChargeState = { isCharging: false, chargeTime: 0, chargePower: 0 };

  constructor(scene: Phaser.Scene, private readonly config: ChargeThrowConfig) {
    const { x, y } = config.chargeMeterPosition;
    const innerWidth = config.chargeMeterWidth - config.chargeMeterFillPadding * 2;
    const background = scene.add.rectangle(0, 0, config.chargeMeterWidth, config.chargeMeterHeight, 0x111827, 0.92)
      .setStrokeStyle(2, 0xf7f0dc, 0.85);
    this.fill = scene.add.rectangle(
      -config.chargeMeterWidth / 2 + config.chargeMeterFillPadding,
      0,
      innerWidth,
      config.chargeMeterHeight - config.chargeMeterFillPadding * 2,
      0x38bdf8,
      1
    ).setOrigin(0, 0.5);
    const minimumMarker = scene.add.rectangle(
      -config.chargeMeterWidth / 2 + config.chargeMeterFillPadding + innerWidth * config.chargePercentMin,
      0,
      2,
      config.chargeMeterHeight,
      0xfacc15,
      1
    );
    this.label = scene.add.text(0, -25, 'POWER 1%', {
      fontFamily: 'monospace', fontSize: '15px', color: '#f7f0dc', backgroundColor: '#111827', padding: { x: 6, y: 3 }
    }).setOrigin(0.5);
    this.container = scene.add.container(x, y, [background, this.fill, minimumMarker, this.label])
      .setDepth(Depths.hud)
      .setVisible(false);
  }

  sync(state: ChargeState): void {
    this.lastState = state;
    const presentation = chargeMeterState(state, this.config);
    this.container.setVisible(presentation.visible);
    this.fill
      .setDisplaySize(
        presentation.fillWidth,
        this.config.chargeMeterHeight - this.config.chargeMeterFillPadding * 2
      )
      .setFillStyle(presentation.isMax ? 0xfacc15 : 0x38bdf8, 1);
    this.label
      .setText(presentation.label)
      .setColor(presentation.isMax ? '#facc15' : '#f7f0dc');
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  snapshot(): ReturnType<typeof chargeMeterState> & { readonly renderedFillWidth: number } {
    return {
      ...chargeMeterState(this.lastState, this.config),
      renderedFillWidth: this.fill.displayWidth
    };
  }

  dispose(): void {
    this.container.destroy(true);
  }
}
