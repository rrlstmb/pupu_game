import Phaser from 'phaser';
import { POOP_DEFINITIONS } from '../data/poopDefinitions';
import { type AlertState, createAlertState } from '../domain/alert/AlertSystem';
import { type PoopInventoryState, createPoopInventory, selectedSlot } from '../domain/poop/PoopInventory';
import { type ScoreState, createScoreState } from '../domain/score/ScoreCalculator';
import type { LevelSession } from '../domain/level/LevelDirector';
import { LEVEL_02 } from '../data/levels/level02';
import { LEVEL_03 } from '../data/levels/level03';
import { LEVEL_04 } from '../data/levels/level04';
import { LEVEL_05 } from '../data/levels/level05';
import { LEVEL_06 } from '../data/levels/level06';
import { eventBus } from '../runtime/EventBus';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { GameEvents } from '../runtime/GameEvents';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';

export class HUDScene extends Phaser.Scene {
  private scoreText?: Phaser.GameObjects.Text;
  private poopText?: Phaser.GameObjects.Text;
  private alertText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private breakdownText?: Phaser.GameObjects.Text;
  private failureOverlay?: Phaser.GameObjects.Container;
  private scoreState: ScoreState = createScoreState();
  private poopInventory: PoopInventoryState = createPoopInventory(POOP_DEFINITIONS);
  private alertState: AlertState = createAlertState();
  private levelSession?: LevelSession;
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
  private readonly levelUpdated = (levelSession: LevelSession) => {
    this.levelSession = levelSession;
    this.renderLevelState();
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
    this.levelText = this.add
      .text(GAME_CONFIG.width / 2, 20, '', {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#fef3c7',
        backgroundColor: '#263238',
        padding: { x: 12, y: 7 },
        align: 'center'
      })
      .setOrigin(0.5, 0);

    const bounds = this.add
      .rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width - 8, GAME_CONFIG.height - 8)
      .setStrokeStyle(2, 0xf6bd60, 0.6);
    bounds.setFillStyle(0x000000, 0);
    eventBus.on(GameEvents.ScoreUpdated, this.scoreUpdated);
    eventBus.on(GameEvents.AlertUpdated, this.alertUpdated);
    eventBus.on(GameEvents.PoopInventoryUpdated, this.poopInventoryUpdated);
    eventBus.on(GameEvents.LevelUpdated, this.levelUpdated);
    this.renderScoreState();
    this.renderPoopInventory();
    this.renderAlertState();

    registerSceneDisposer(this, () => {
      eventBus.off(GameEvents.PoopInventoryUpdated, this.poopInventoryUpdated);
      eventBus.off(GameEvents.AlertUpdated, this.alertUpdated);
      eventBus.off(GameEvents.ScoreUpdated, this.scoreUpdated);
      eventBus.off(GameEvents.LevelUpdated, this.levelUpdated);
      this.scoreText?.destroy();
      this.poopText?.destroy();
      this.alertText?.destroy();
      this.breakdownText?.destroy();
      this.levelText?.destroy();
      this.failureOverlay?.destroy(true);
      bounds.destroy();
      if (window.__SHIMING_BIDA_DEBUG__) {
        delete window.__SHIMING_BIDA_DEBUG__.hudLevelText;
        delete window.__SHIMING_BIDA_DEBUG__.hudResultText;
      }
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
  }

  private renderLevelState(): void {
    const session = this.levelSession;
    if (!session) return;
    const prefix = session.phase === 'countdown'
      ? `倒數 ${Math.max(1, Math.ceil(session.countdownRemainingSeconds))}`
      : session.phase === 'paused'
        ? '已暫停'
        : `時間 ${Math.ceil(session.remainingSeconds)}s`;
    const text = `${session.definition.name}  ${prefix}\n目標 ${session.definition.targetScore}  seed ${session.definition.seed}`;
    this.levelText?.setText(text);
    if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudLevelText = text;
    }

    if (session.phase === 'settled' && session.result) {
      this.renderResultOverlay(session);
    } else if (session.phase === 'paused') {
      this.renderPauseOverlay();
    } else {
      this.failureOverlay?.destroy(true);
      this.failureOverlay = undefined;
    }
  }

  private renderPauseOverlay(): void {
    if (this.failureOverlay?.getData('kind') === 'pause') return;
    this.failureOverlay?.destroy(true);
    const overlay = this.add.container(0, 0).setDepth(10_000).setData('kind', 'pause');
    const panel = this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x111827, 0.62).setOrigin(0, 0);
    const title = this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, '已暫停\nEsc 繼續', {
      fontFamily: 'sans-serif', fontSize: '38px', color: '#fef3c7', align: 'center'
    }).setOrigin(0.5);
    overlay.add([panel, title]);
    this.failureOverlay = overlay;
  }

  private renderResultOverlay(session: LevelSession): void {
    if (this.failureOverlay?.getData('sessionId') === session.id) return;
    this.failureOverlay?.destroy(true);
    const result = session.result!;

    const overlay = this.add.container(0, 0).setDepth(10_000).setData('sessionId', session.id);
    const panel = this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x111827, 0.78).setOrigin(0, 0);
    const title = this.add
      .text(GAME_CONFIG.width / 2, 105, result.outcome === 'success' ? '任務成功' : result.outcome === 'caught' ? '被抓包了' : '時間到', {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        color: '#fef3c7',
        backgroundColor: result.outcome === 'success' ? '#166534' : '#7f1d1d',
        padding: { x: 18, y: 10 }
      })
      .setOrigin(0.5);
    const summary = this.add.text(GAME_CONFIG.width / 2, 215, [
      `總分 ${result.totalScore}    星級 ${result.stars.starsEarned}/3`,
      `最高連擊 ${result.highestCombo}    命中率 ${(result.accuracy * 100).toFixed(1)}%`,
      `命中 ${result.hitCount}    投擲 ${result.throwCount}`,
      `seed ${result.seed}`
    ].join('\n'), {
      fontFamily: 'monospace', fontSize: '22px', color: '#f7f0dc', align: 'center', lineSpacing: 8
    }).setOrigin(0.5, 0);
    const stars = this.add.text(GAME_CONFIG.width / 2, 370, result.stars.conditions.map((condition) =>
      `${condition.passed ? '[PASS]' : '[MISS]'} ${condition.label}`
    ).join('\n'), {
      fontFamily: 'monospace', fontSize: '20px', color: '#dbeafe', align: 'left', lineSpacing: 9
    }).setOrigin(0.5, 0);
    const retry = this.add
      .text(GAME_CONFIG.width / 2 - 110, 590, '重試', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#111827',
        backgroundColor: '#a7f3d0',
        padding: { x: 26, y: 12 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    retry.setData('role', 'retry-level');
    const nextLevel = session.definition.id === 'level_01'
      ? LEVEL_02
      : session.definition.id === 'level_02' ? LEVEL_03
        : session.definition.id === 'level_03' ? LEVEL_04
          : session.definition.id === 'level_04' ? LEVEL_05
            : session.definition.id === 'level_05' ? LEVEL_06 : undefined;
    const hasNextLevel = nextLevel !== undefined;
    const next = this.add
      .text(GAME_CONFIG.width / 2 + 110, 590, '下一關', {
        fontFamily: 'sans-serif', fontSize: '24px', color: hasNextLevel ? '#111827' : '#9ca3af',
        backgroundColor: hasNextLevel ? '#f6bd60' : '#374151', padding: { x: 22, y: 11 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setData('role', hasNextLevel ? 'next-level' : 'next-level-placeholder');
    const nextStatus = this.add.text(GAME_CONFIG.width / 2, 645, '下一關尚未開放', {
      fontFamily: 'monospace', fontSize: '17px', color: '#9ca3af'
    }).setOrigin(0.5).setVisible(false);

    retry.on(Phaser.Input.Events.POINTER_UP, () => {
      this.scene.get(SceneKeys.Game).scene.restart({ levelDefinition: session.definition });
    });
    next.on(Phaser.Input.Events.POINTER_UP, () => {
      if (hasNextLevel) {
        this.scene.get(SceneKeys.Game).scene.restart({ levelDefinition: nextLevel });
      } else {
        nextStatus.setVisible(true);
      }
    });
    overlay.add([panel, title, summary, stars, retry, next, nextStatus]);
    this.failureOverlay = overlay;
    if (window.__SHIMING_BIDA_DEBUG__) {
      window.__SHIMING_BIDA_DEBUG__.hudResultText = `${title.text}\n${summary.text}\n${stars.text}`;
    }
  }
}
