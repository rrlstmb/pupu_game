import type Phaser from 'phaser';
import type { ChargeThrowConfig } from '../../data/projectileConfig';
import { chargeMeterLayout, chargeMeterState, type ChargeState } from '../../domain/projectile/ChargeSystem';
import { Depths } from '../../domain/layout/Depth';

export class PhaserChargeMeter {
  private readonly container: Phaser.GameObjects.Container;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private lastState: ChargeState = { isCharging: false, chargeTime: 0, chargePower: 0 };

  constructor(scene: Phaser.Scene, private readonly config: ChargeThrowConfig) {
    const layout = chargeMeterLayout(config, { width: scene.scale.width, height: scene.scale.height });
    const innerWidth = config.chargeMeterWidth - config.chargeMeterFillPadding * 2;
    const background = scene.add.rectangle(0, 0, config.chargeMeterWidth, config.chargeMeterHeight, 0x111827, 0.92)
      .setStrokeStyle(2, 0xf7f0dc, 0.85);
    this.fill = scene.add.rectangle(
      0,
      config.chargeMeterHeight / 2 - config.chargeMeterFillPadding,
      innerWidth,
      1,
      0x38bdf8,
      1
    ).setOrigin(0.5, 1);
    const minimumMarker = scene.add.rectangle(
      0,
      config.chargeMeterHeight / 2 - config.chargeMeterFillPadding -
        (config.chargeMeterHeight - config.chargeMeterFillPadding * 2) * config.chargePercentMin,
      config.chargeMeterWidth,
      2,
      0xfacc15,
      1
    );
    this.label = scene.add.text(layout.labelX, layout.labelY, 'POWER 1%', {
      fontFamily: 'monospace', fontSize: '15px', color: '#f7f0dc', backgroundColor: '#111827', padding: { x: 6, y: 3 }
    }).setOrigin(1, 0);
    this.container = scene.add.container(layout.x, layout.y, [background, this.fill, minimumMarker, this.label])
      .setDepth(Depths.hud)
      .setVisible(false);
  }

  sync(state: ChargeState): void {
    this.lastState = state;
    const presentation = chargeMeterState(state, this.config);
    this.container.setVisible(presentation.visible);
    this.fill
      .setDisplaySize(
        this.config.chargeMeterWidth - this.config.chargeMeterFillPadding * 2,
        presentation.fillHeight
      )
      .setFillStyle(presentation.isMax ? 0xfacc15 : 0x38bdf8, 1);
    this.label
      .setText(presentation.label)
      .setColor(presentation.isMax ? '#facc15' : '#f7f0dc');
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  snapshot(): ReturnType<typeof chargeMeterState> & {
    readonly renderedFillWidth: number;
    readonly renderedFillHeight: number;
    readonly orientation: 'vertical';
    readonly bounds: ReturnType<typeof chargeMeterLayout>;
  } {
    return {
      ...chargeMeterState(this.lastState, this.config),
      renderedFillWidth: this.fill.displayWidth,
      renderedFillHeight: this.fill.displayHeight,
      orientation: this.config.chargeMeterOrientation,
      bounds: chargeMeterLayout(this.config, { width: 1280, height: 720 })
    };
  }

  dispose(): void {
    this.container.destroy(true);
  }
}
