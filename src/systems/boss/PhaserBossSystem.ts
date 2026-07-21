import type Phaser from 'phaser';
import type { BossEncounterDefinition } from '../../domain/level/LevelDefinition';
import type { BossEncounterState } from '../../domain/boss/BossPhaseStateMachine';
import { Depths } from '../../domain/layout/Depth';
import { BOSS_SKIN } from '../../data/presentation/characterSkins';
import { animationForBoss } from '../../domain/presentation/CharacterPresentation';

export class PhaserBossSystem {
  private readonly boss: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly aura: Phaser.GameObjects.Arc;
  private readonly label: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;
  private readonly blocked: Phaser.GameObjects.Rectangle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rules: BossEncounterDefinition,
    private readonly rooftopY: number,
    private readonly rooftopHeight: number
  ) {
    this.aura = scene.add.circle(0, -rules.bossHeight * 0.35, rules.bossWidth * 0.7, 0xfacc15, 0.12)
      .setStrokeStyle(5, 0xfef08a, 0.75);
    this.body = scene.add.image(0, -rules.bossHeight * 0.34, BOSS_SKIN.assetKey)
      .setDisplaySize(rules.bossWidth * 1.3, rules.bossHeight * 1.5);
    this.label = scene.add.text(0, 0, '潔癖網紅\n大型雨傘', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#111827', align: 'center'
    }).setOrigin(0.5);
    this.label.setPosition(0, rules.bossHeight * 0.42);
    this.boss = scene.add.container(0, rules.bossY, [this.aura, this.body, this.label]).setDepth(Depths.particles).setVisible(false);
    this.status = scene.add.text(640, rooftopY + 10, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fef3c7', backgroundColor: '#831843', padding: { x: 12, y: 7 }, align: 'center'
    }).setOrigin(0.5, 0).setDepth(Depths.hud).setVisible(false);
  }

  sync(state: BossEncounterState): void {
    const visible = state.phase !== 'not_started' && state.phase !== 'phase_1_parade' && state.phase !== 'transition_1' && state.phase !== 'failed';
    this.boss.setVisible(visible).setPosition(state.bossX, this.rules.bossY);
    const brokenGates = state.protections.filter((gate) => gate.state === 'broken').length;
    this.label.setText(`潔癖網紅\n防護解除 ${brokenGates}/${state.protections.length}`);
    const animation = animationForBoss(state);
    this.body.setTint(animation === 'boss_vulnerable' ? 0xfef08a : animation === 'boss_complete' ? 0xa7f3d0 : 0xffffff)
      .setRotation(animation === 'boss_protected' ? Math.sin(state.bossX * 0.04) * 0.025 : 0);
    this.aura.setAlpha(animation === 'boss_vulnerable' ? 0.52 : 0.14)
      .setScale(animation === 'boss_vulnerable' ? 1.14 : 1);
    this.status.setVisible(true).setText(`${phaseLabel(state.phase)}｜${state.feedback}\n黃金 ${state.finalGoldenRemaining}  機會 ${state.finalWindowAttempts}/${this.rules.finalWindow.repeatLimit}`);
    const intervals = state.blockedStageCount > 0 ? this.rules.safety.blockedStages[state.blockedStageCount - 1].intervals : [];
    while (this.blocked.length < intervals.length) {
      this.blocked.push(this.scene.add.rectangle(0, 0, 1, this.rooftopHeight, 0xdc2626, 0.42)
        .setOrigin(0, 0).setDepth(Depths.cover + 5));
    }
    this.blocked.forEach((view, index) => {
      const interval = intervals[index];
      view.setVisible(Boolean(interval));
      if (interval) view.setPosition(interval.start, this.rooftopY)
        .setDisplaySize(interval.end - interval.start, this.rooftopHeight);
    });
  }

  dispose(): void { this.boss.destroy(true); this.status.destroy(); this.blocked.forEach((item) => item.destroy()); this.blocked.length = 0; }
}

function phaseLabel(phase: BossEncounterState['phase']): string {
  if (phase === 'phase_1_parade') return '第一階段';
  if (phase === 'phase_2_protected_boss') return '第二階段';
  if (phase === 'phase_3_rooftop_lockdown' || phase === 'final_vulnerable') return '第三階段';
  if (phase === 'completed') return '屎命完成';
  return phase;
}
