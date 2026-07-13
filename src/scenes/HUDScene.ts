import Phaser from 'phaser';
import { POOP_DEFINITIONS } from '../data/poopDefinitions';
import { type AlertState, createAlertState } from '../domain/alert/AlertSystem';
import { type PoopInventoryState, createPoopInventory, selectedSlot } from '../domain/poop/PoopInventory';
import { type ScoreState, createScoreState } from '../domain/score/ScoreCalculator';
import { eventBus } from '../runtime/EventBus';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { GameEvents } from '../runtime/GameEvents';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';

export class HUDScene extends Phaser.Scene {
  private scoreText?: Phaser.GameObjects.Text;
  private poopText?: Phaser.GameObjects.Text;
  private alertText?: Phaser.GameObjects.Text;
  private breakdownText?: Phaser.GameObjects.Text;
  private failureOverlay?: Phaser.GameObjects.Container;
  private scoreState: ScoreState = createScoreState();
  private poopInventory: PoopInventoryState = createPoopInventory(POOP_DEFINITIONS);
  private alertState: AlertState = createAlertState();
  private readonly scoreUpdated = (scoreState: ScoreState) => {
    this.scoreState = scoreState;
    this.renderScoreState();
  };
  private readonly alertUpdated = (alertState: AlertState) => {
    this.alertState = alertState;
    this.renderAlertState();
  };
  private readonly poopInventoryUpdated = (poopInventory: PoopInventoryState) => {
    this.poopInventory = poopInventory;
    this.renderPoopInventory();
  };

  constructor() {
    super(SceneKeys.HUD);
  }

  create(): void {
    emitSceneReady(this);

    this.scoreText = this.add.text(24, 20, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f7f0dc',
      backgroundColor: '#171923',
      padding: { x: 10, y: 6 }
    });
    this.breakdownText = this.add
      .text(24, 132, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#dbeafe',
        backgroundColor: '#111827',
        padding: { x: 8, y: 5 }
      })
      .setVisible(false);
    this.poopText = this.add.text(24, 82, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ecfccb',
      backgroundColor: '#24311f',
      padding: { x: 10, y: 6 }
    });
    this.alertText = this.add
      .text(GAME_CONFIG.width - 24, 82, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#fee2e2',
        backgroundColor: '#3f1d1d',
        padding: { x: 10, y: 6 },
        align: 'right'
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.alertText.on(Phaser.Input.Events.POINTER_UP, () => {
      if (this.alertState.isCaught || this.alertState.stage === 'caught') {
        this.scene.get(SceneKeys.Game).scene.restart();
      }
    });

    const bounds = this.add
      .rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width - 8, GAME_CONFIG.height - 8)
      .setStrokeStyle(2, 0xf6bd60, 0.6);
    bounds.setFillStyle(0x000000, 0);
    eventBus.on(GameEvents.ScoreUpdated, this.scoreUpdated);
    eventBus.on(GameEvents.AlertUpdated, this.alertUpdated);
    eventBus.on(GameEvents.PoopInventoryUpdated, this.poopInventoryUpdated);
    this.renderScoreState();
    this.renderPoopInventory();
    this.renderAlertState();

    registerSceneDisposer(this, () => {
      eventBus.off(GameEvents.PoopInventoryUpdated, this.poopInventoryUpdated);
      eventBus.off(GameEvents.AlertUpdated, this.alertUpdated);
      eventBus.off(GameEvents.ScoreUpdated, this.scoreUpdated);
      this.scoreText?.destroy();
      this.poopText?.destroy();
      this.alertText?.destroy();
      this.breakdownText?.destroy();
      this.failureOverlay?.destroy(true);
      bounds.destroy();
      emitSceneShutdown(this);
    });
  }

  private renderScoreState(): void {
    const timeWindow = this.scoreState.comboRemainingSeconds.toFixed(1);
    const scoreText = [
      `Score ${this.scoreState.totalScore}`,
      `Combo ${this.scoreState.comboCount}`,
      `x${this.scoreState.comboMultiplier.toFixed(2)}`,
      `${timeWindow}s`
    ].join('  ');
    this.scoreText?.setText(scoreText);
    if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudScoreText = scoreText;
    }
    const latest = this.scoreState.breakdowns[this.scoreState.breakdowns.length - 1];
    this.breakdownText?.setVisible(Boolean(latest));
    if (latest) {
      const breakdownText = [
        `+${latest.finalScore} ${latest.precisionGrade}`,
        `base ${latest.baseScore} poop x${latest.poopAdaptationMultiplier}`,
        `combo x${latest.comboMultiplier} repeat x${latest.repeatHitMultiplier}`,
        `risk x${latest.riskMultiplier} event ${latest.eventId}`
      ].join('\n');
      this.breakdownText?.setText(breakdownText);
      if (window.__SHIMING_BIDA_DEBUG__) {
        window.__SHIMING_BIDA_DEBUG__.hudBreakdownText = breakdownText;
      }
    } else if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudBreakdownText = '';
    }
  }

  private renderPoopInventory(): void {
    const slot = selectedSlot(this.poopInventory);
    const definition = POOP_DEFINITIONS.find((candidate) => candidate.id === slot.poopType);
    const stock = slot.stock === 'infinite' ? '∞' : String(slot.stock);
    const text = `${definition?.icon ?? '?'} ${definition?.label ?? slot.poopType}  stock ${stock}  cd ${slot.cooldownRemainingSeconds.toFixed(1)}s`;
    this.poopText?.setText(text);
    if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudPoopText = text;
    }
  }

  private renderAlertState(): void {
    const latest = this.alertState.recentChanges[0];
    const source = latest ? `${latest.source} ${latest.amount >= 0 ? '+' : ''}${latest.amount.toFixed(1)}` : 'none';
    const warning = this.alertState.value >= 80 ? '  !!' : '';
    const caughtText = this.alertState.stage === 'caught' ? '\n被抓包了！ R 重試' : '';
    const alertText = `Alert ${Math.round(this.alertState.value)}  ${this.alertState.stage}${warning}\n${source}${caughtText}`;
    this.alertText?.setText(alertText);
    if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudAlertText = alertText;
    }
    if (this.alertState.isCaught || this.alertState.stage === 'caught') {
      this.renderFailureOverlay();
    } else {
      this.failureOverlay?.destroy(true);
      this.failureOverlay = undefined;
    }
  }

  private renderFailureOverlay(): void {
    if (this.failureOverlay) {
      return;
    }

    const overlay = this.add.container(0, 0).setDepth(10_000);
    const panel = this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x111827, 0.78).setOrigin(0, 0);
    const title = this.add
      .text(GAME_CONFIG.width / 2, GAME_CONFIG.height * 0.38, '被抓包了！', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: '#fef3c7',
        backgroundColor: '#7f1d1d',
        padding: { x: 18, y: 10 }
      })
      .setOrigin(0.5);
    const retry = this.add
      .text(GAME_CONFIG.width / 2, GAME_CONFIG.height * 0.55, '重試', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#111827',
        backgroundColor: '#a7f3d0',
        padding: { x: 26, y: 12 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retry.on(Phaser.Input.Events.POINTER_UP, () => {
      this.scene.get(SceneKeys.Game).scene.restart();
    });
    overlay.add([panel, title, retry]);
    this.failureOverlay = overlay;
  }
}
