import type Phaser from 'phaser';
import { Depths } from '../../domain/layout/Depth';
import type { WindState } from '../../domain/wind/WindSystem';

export class PhaserWindIndicator {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.text = scene.add.text(x, y, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e0f2fe', backgroundColor: '#1f2937',
      padding: { x: 10, y: 7 }, align: 'center'
    }).setOrigin(0.5, 0).setDepth(Depths.hud).setData('role', 'wind-indicator');
  }

  sync(state: WindState): void {
    const direction = state.direction === 'left' ? '< 左風' : state.direction === 'right' ? '右風 >' : '- 無風 -';
    const next = state.warningDirection === 'left' ? '< 左風' : state.warningDirection === 'right' ? '右風 >' : '無風';
    const warning = state.warningSegmentId ? `\nNEXT ${next} ${Math.round((state.warningStrength ?? 0) * 100)}%  ${Math.ceil(state.warningRemainingSeconds)}s` : '';
    this.text.setText(`WIND ${direction}  ${Math.round(state.strength * 100)}%${warning}`);
  }

  snapshot(): string { return this.text.text; }
  dispose(): void { this.text.destroy(); }
}
