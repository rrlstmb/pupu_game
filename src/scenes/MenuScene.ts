import Phaser from 'phaser';
import { CAMPAIGN_LEVELS, campaignLevelById } from '../data/campaign';
import type { LevelDefinition } from '../domain/level/LevelDefinition';
import {
  applyChallengeOverride, campaignRunContext, CHALLENGE_DEFINITIONS, modeRunContext, normalizeCustomSeed,
  type ChallengeDefinition, type RunContext
} from '../domain/modes/ModeRegistry';
import { continueLevelId, levelProgressState } from '../domain/progression/ProgressionService';
import { PLAYER_TITLE_LABELS } from '../domain/progression/PlayerTitles';
import { eventBus } from '../runtime/EventBus';
import { GameEvents } from '../runtime/GameEvents';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { saveService } from '../runtime/PersistenceRuntime';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';
import { audioSystem } from '../systems/audio/SemanticAudioSystem';

type MenuView = 'campaign' | 'modes' | 'free_play';

export class MenuScene extends Phaser.Scene {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private customSeed = '';

  constructor() { super(SceneKeys.Menu); }

  create(): void {
    emitSceneReady(this);
    this.cameras.main.setBackgroundColor('#111827');
    this.renderShell();
    this.renderCampaign();
    registerSceneDisposer(this, () => {
      this.objects.forEach((object) => { object.removeAllListeners(); object.destroy(); });
      this.objects = [];
      emitSceneShutdown(this);
    });
  }

  private track<T extends Phaser.GameObjects.GameObject>(object: T): T { this.objects.push(object); return object; }

  private renderShell(): void {
    const service = saveService();
    const save = service.state.data;
    this.track(this.add.text(46, 34, GAME_CONFIG.title, {
      fontFamily: 'sans-serif', fontSize: '46px', color: '#fef3c7', stroke: '#7c2d12', strokeThickness: 5
    }));
    const completeCount = save.campaign.completedLevelIds.length;
    const titleId = save.unlocks.titleIds.at(-1) as keyof typeof PLAYER_TITLE_LABELS | undefined;
    this.track(this.add.text(48, 95, `Campaign ${completeCount}/10  ${save.campaign.completed ? '已完成' : '進行中'}${titleId ? `  稱號：${PLAYER_TITLE_LABELS[titleId]}` : ''}`, {
      fontFamily: 'monospace', fontSize: '17px', color: '#cbd5e1'
    }));
    this.track(this.add.text(GAME_CONFIG.width - 38, 38,
      service.state.availability === 'persistent' ? `本機存檔 r${save.revision}` : service.state.notice ?? '暫時進度', {
        fontFamily: 'monospace', fontSize: '15px', color: service.state.availability === 'persistent' ? '#86efac' : '#fbbf24'
      }).setOrigin(1, 0).setData('role', 'save-status'));

    this.button(170, 160, '繼續', 'continue-campaign', () => {
      const id = continueLevelId(save);
      if (id) this.startLevel(campaignLevelById(id)!.definition, { ...campaignRunContext(id), runId: crypto.randomUUID() });
      else this.switchView('campaign');
    });
    this.button(400, 160, '從第 1 關重玩', 'new-campaign', () => {
      const level = CAMPAIGN_LEVELS[0].definition;
      this.startLevel(level, { ...campaignRunContext(level.id), runId: crypto.randomUUID() });
    });
    this.button(655, 160, '關卡選擇', 'level-select', () => this.switchView('campaign'));
    this.button(875, 160, '額外模式', 'extra-modes', () => this.switchView('modes'));
    this.button(1180, 270, '重播開場', 'watch-opening', () => this.scene.start(SceneKeys.Opening));
    this.button(1120, 224, '清除進度', 'reset-progress', () => this.renderResetDialog(), false, 17);
    if (window.__SHIMING_BIDA_DEBUG__) window.__SHIMING_BIDA_DEBUG__.saveState = service.state;
  }

  private switchView(view: MenuView): void {
    this.objects.filter((object) => object.getData?.('section') === 'content').forEach((object) => {
      object.removeAllListeners(); object.destroy();
    });
    this.objects = this.objects.filter((object) => object.active);
    if (view === 'modes') this.renderModes(); else this.renderCampaign(view === 'free_play');
  }

  private renderCampaign(freePlay = false): void {
    const save = saveService().state.data;
    this.contentText(GAME_CONFIG.width / 2, 248, freePlay
      ? `自由練習：選擇已解鎖關卡  seed ${this.customSeed || '關卡預設'}`
      : '十關 Campaign 進度', 21).setOrigin(0.5);
    CAMPAIGN_LEVELS.forEach((entry) => {
      const state = levelProgressState(save, entry.definition.id);
      const record = save.campaign.levelRecords[entry.definition.id];
      const x = entry.menuPosition.x;
      const y = entry.menuPosition.y;
      const marker = state === 'locked' ? '[LOCKED]' : state === 'mastered' ? '[MASTERED]' : state === 'completed' ? '[DONE]' : '[OPEN]';
      const label = `${entry.definition.name.replace(/^第.+關：|^第一關：/, '')}\n${marker} ${record?.bestStars ?? 0}/3★ BEST ${record?.bestScore ?? 0}`;
      this.levelButton(x, y, label, entry.definition, entry.menuRole, state !== 'locked', freePlay);
    });
    if (freePlay) {
      this.contentButton(380, 650, '輸入自訂 seed', 'custom-seed', () => {
        const value = window.prompt('自訂 seed（最多 40 字）', this.customSeed || 'my-seed');
        if (value !== null) { this.customSeed = normalizeCustomSeed(value); this.switchView('free_play'); }
      });
      this.contentButton(650, 650, '返回額外模式', 'back-to-modes', () => this.switchView('modes'));
    }
  }

  private renderModes(): void {
    const save = saveService().state.data;
    this.contentText(GAME_CONFIG.width / 2, 248, '額外模式與獨立紀錄', 21).setOrigin(0.5);
    const freeUnlocked = save.unlocks.modeIds.includes('free_play');
    this.contentButton(185, 335, freeUnlocked ? '自由練習\n已解鎖關卡' : '自由練習\n完成第 1 關解鎖', 'free-play', () => {
      if (freeUnlocked) this.switchView('free_play'); else this.lockedFeedback();
    }, freeUnlocked);
    CHALLENGE_DEFINITIONS.forEach((challenge, index) => {
      const unlocked = challenge.unlock === 'level_01_complete'
        ? save.campaign.completedLevelIds.includes('level_01') : save.campaign.completed;
      const record = save.modes.challengeRecords[challenge.id];
      const x = 425 + (index % 3) * 280;
      const y = 330 + Math.floor(index / 3) * 180;
      const label = `${challenge.title}\n${unlocked ? challenge.description : '[LOCKED] Campaign 條件未達'}\nBEST ${record?.bestScore ?? 0}  ${record?.bestRank ?? '-'}`;
      this.contentButton(x, y, label, `mode-${challenge.id}`, () => unlocked ? this.startChallenge(challenge) : this.lockedFeedback(), unlocked, 17);
    });
    this.contentButton(650, 650, '返回關卡選擇', 'back-to-levels', () => this.switchView('campaign'));
  }

  private levelButton(x: number, y: number, label: string, definition: LevelDefinition, role: string, enabled: boolean, freePlay: boolean): void {
    const button = this.contentText(x, y, label, 17, enabled ? '#171923' : '#94a3b8', enabled ? '#f6bd60' : '#334155')
      .setOrigin(0.5).setInteractive({ useHandCursor: enabled }).setData('role', role);
    button.on(Phaser.Input.Events.POINTER_UP, () => {
      if (!enabled) return this.lockedFeedback();
      if (freePlay) {
        const seed = this.customSeed || definition.seed;
        this.startLevel({ ...definition, seed }, {
          modeId: 'free_play', levelId: definition.id, seed, progressionEligibility: 'none', runId: crypto.randomUUID()
        });
      } else this.startLevel(definition, { ...campaignRunContext(definition.id), runId: crypto.randomUUID() });
    });
  }

  private startChallenge(challenge: ChallengeDefinition): void {
    const base = campaignLevelById(challenge.levelId)!.definition;
    const date = new Date().toLocaleDateString('en-CA');
    const level = applyChallengeOverride(base, challenge, date);
    this.startLevel(level, { ...modeRunContext(challenge, level.seed), runId: crypto.randomUUID() });
  }

  private startLevel(definition: LevelDefinition, runContext: RunContext): void {
    audioSystem.play('ui_confirm', `menu-start-${runContext.runId}`);
    eventBus.emit(GameEvents.StartGame, undefined);
    this.scene.start(SceneKeys.Game, { levelDefinition: definition, runContext });
  }

  private renderResetDialog(): void {
    if (this.objects.some((object) => object.getData?.('role') === 'reset-confirm')) return;
    const overlay = this.track(this.add.container(0, 0).setDepth(20_000).setData('section', 'dialog'));
    const shade = this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x020617, 0.78).setOrigin(0, 0);
    const panel = this.add.rectangle(640, 360, 660, 330, 0x1f2937, 1).setStrokeStyle(3, 0xf6bd60);
    const text = this.add.text(640, 280, '確認清除本機進度？\n將清除關卡、星級、紀錄、大便發現、模式紀錄與開場狀態。\n不會影響瀏覽器其他資料。', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc', align: 'center', wordWrap: { width: 570 }, lineSpacing: 10
    }).setOrigin(0.5);
    const cancel = this.dialogButton(525, 455, '取消', 'reset-cancel', () => overlay.destroy(true));
    const confirm = this.dialogButton(755, 455, '確認清除', 'reset-confirm', () => {
      saveService().resetProgress();
      this.scene.restart();
    }, '#fecaca', '#7f1d1d');
    overlay.add([shade, panel, text, cancel, confirm]);
  }

  private lockedFeedback(): void { audioSystem.play('ui_back', `locked-${this.time.now}`); }

  private button(x: number, y: number, label: string, role: string, action: () => void, enabled = true, fontSize = 19): Phaser.GameObjects.Text {
    const button = this.track(this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: `${fontSize}px`, color: enabled ? '#111827' : '#94a3b8',
      backgroundColor: enabled ? '#a7f3d0' : '#334155', padding: { x: 16, y: 9 }, align: 'center'
    }).setOrigin(0.5).setInteractive({ useHandCursor: enabled }).setData('role', role));
    button.on(Phaser.Input.Events.POINTER_UP, action);
    return button;
  }

  private contentButton(x: number, y: number, label: string, role: string, action: () => void, enabled = true, fontSize = 19): Phaser.GameObjects.Text {
    return this.button(x, y, label, role, action, enabled, fontSize).setData('section', 'content');
  }

  private contentText(x: number, y: number, label: string, fontSize: number, color = '#e2e8f0', backgroundColor?: string): Phaser.GameObjects.Text {
    return this.track(this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: `${fontSize}px`, color, ...(backgroundColor ? { backgroundColor, padding: { x: 14, y: 10 } } : {}), align: 'center'
    }).setData('section', 'content'));
  }

  private dialogButton(x: number, y: number, label: string, role: string, action: () => void, color = '#111827', backgroundColor = '#a7f3d0'): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: '20px', color, backgroundColor, padding: { x: 22, y: 10 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setData('role', role);
    button.on(Phaser.Input.Events.POINTER_UP, action);
    return button;
  }
}
