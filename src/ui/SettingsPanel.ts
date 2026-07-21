import type Phaser from 'phaser';
import type { SettingsData } from '../domain/settings/SettingsData';
import { responsiveLayout } from '../runtime/LayoutRuntime';
import { settingsService } from '../runtime/SettingsRuntime';
import { audioSystem } from '../systems/audio/SemanticAudioSystem';

export class SettingsPanel {
  private readonly button: HTMLButtonElement;
  private readonly dialog: HTMLDivElement;
  private returnFocus?: HTMLElement;
  private pausedScene?: Phaser.Scene;
  private pendingSliderTimer = 0;

  constructor(root: HTMLElement, private readonly game: Phaser.Game) {
    this.button = document.createElement('button'); this.button.className = 'settings-launch'; this.button.textContent = '⚙ 設定'; this.button.dataset.uiInteractive = 'true'; this.button.setAttribute('aria-haspopup', 'dialog');
    this.dialog = document.createElement('div'); this.dialog.className = 'settings-backdrop'; this.dialog.hidden = true; this.dialog.dataset.uiInteractive = 'true';
    this.button.addEventListener('click', this.open); this.dialog.addEventListener('keydown', this.onKeyDown); root.append(this.button, this.dialog);
    settingsService().subscribe(this.applySettings);
  }
  dispose(): void { this.clearPendingSlider(); this.button.removeEventListener('click', this.open); this.dialog.removeEventListener('keydown', this.onKeyDown); this.button.remove(); this.dialog.remove(); }

  private readonly open = () => {
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : this.button;
    const gameScene = this.game.scene.getScene('GameScene');
    if (gameScene?.scene.isActive()) { this.pausedScene = gameScene; gameScene.scene.pause(); }
    this.render(); this.dialog.hidden = false; this.firstFocusable()?.focus();
  };
  private close = () => { this.clearPendingSlider(); this.dialog.hidden = true; this.dialog.replaceChildren(); this.pausedScene?.scene.resume(); this.pausedScene = undefined; this.returnFocus?.focus(); };
  private render(): void {
    const settings = settingsService().data;
    const panel = document.createElement('section'); panel.className = 'settings-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '遊戲設定');
    const title = document.createElement('h2'); title.textContent = '遊戲設定'; panel.append(title);
    panel.append(
      this.slider('主音量', 'master-volume', settings.audio.masterVolume, (v) => this.updateAudio('masterVolume', v)),
      this.slider('音樂', 'music-volume', settings.audio.musicVolume, (v) => this.updateAudio('musicVolume', v)),
      this.slider('環境音', 'ambience-volume', settings.audio.ambienceVolume, (v) => this.updateAudio('ambienceVolume', v)),
      this.slider('音效', 'sfx-volume', settings.audio.sfxVolume, (v) => this.updateAudio('sfxVolume', v)),
      this.slider('介面音', 'ui-volume', settings.audio.uiVolume, (v) => this.updateAudio('uiVolume', v)),
      this.toggle('靜音', 'muted', settings.audio.muted, (v) => this.patch({ audio: { ...settingsService().data.audio, muted: v } })),
      this.toggle('減少動態', 'reduced-motion', settings.motion.reducedMotion, (v) => this.patch({ motion: { ...settingsService().data.motion, reducedMotion: v } })),
      this.select('畫面晃動', 'screen-shake', settings.motion.screenShake, [['full','完整'],['reduced','降低'],['off','關閉']], (v) => this.patch({ motion: { ...settingsService().data.motion, screenShake: v as SettingsData['motion']['screenShake'] } })),
      this.toggle('鏡頭縮放效果', 'camera-zoom', settings.motion.cameraZoomEffects, (v) => this.patch({ motion: { ...settingsService().data.motion, cameraZoomEffects: v } })),
      this.select('閃光強度', 'flash', settings.motion.flashIntensity, [['full','完整'],['reduced','降低'],['off','關閉']], (v) => this.patch({ motion: { ...settingsService().data.motion, flashIntensity: v as SettingsData['motion']['flashIntensity'] } })),
      this.toggle('高對比', 'high-contrast', settings.visual.highContrast, (v) => this.patch({ visual: { ...settingsService().data.visual, highContrast: v } })),
      this.select('文字大小', 'text-scale', String(settings.visual.textScale), [['1','100%'],['1.15','115%'],['1.3','130%']], (v) => this.patch({ visual: { ...settingsService().data.visual, textScale: Number(v) as SettingsData['visual']['textScale'] } })),
      this.toggle('危險圖樣提示', 'patterns', settings.visual.hazardPatternCues, (v) => this.patch({ visual: { ...settingsService().data.visual, hazardPatternCues: v } })),
      this.toggle('操作提示', 'control-hints', settings.visual.showControlHints, (v) => this.patch({ visual: { ...settingsService().data.visual, showControlHints: v } })),
      this.select('觸控配置', 'touch-layout', settings.controls.touchLayout, [['right_handed','右手投擲'],['left_handed','左手投擲']], (v) => this.patch({ controls: { ...settingsService().data.controls, touchLayout: v as SettingsData['controls']['touchLayout'] } })),
      this.slider('觸控靈敏度', 'touch-sensitivity', settings.controls.touchMovementSensitivity, (v) => this.patch({ controls: { ...settingsService().data.controls, touchMovementSensitivity: 0.5 + v } }), 0.5),
      this.slider('滑鼠靈敏度', 'mouse-sensitivity', settings.controls.mouseMovementSensitivity, (v) => this.patch({ controls: { ...settingsService().data.controls, mouseMovementSensitivity: 0.5 + v } }), 0.5),
      this.toggle('重要事件朗讀', 'announcements', settings.accessibility.importantEventAnnouncements, (v) => this.patch({ accessibility: { ...settingsService().data.accessibility, importantEventAnnouncements: v } })),
      this.toggle('音訊視覺提示', 'visual-audio', settings.accessibility.visualAudioCues, (v) => this.patch({ accessibility: { ...settingsService().data.accessibility, visualAudioCues: v } }))
    );
    const actions = document.createElement('div'); actions.className = 'settings-actions';
    const reset = this.action('重設設定', () => { if (window.confirm('確認重設所有設定？Campaign 進度不受影響。')) { settingsService().reset(); this.render(); } });
    const close = this.action('完成', this.close); actions.append(reset, close); panel.append(actions); this.dialog.replaceChildren(panel);
  }
  private patch(partial: Partial<SettingsData>): void { settingsService().update((data) => ({ ...data, ...partial })); }
  private updateAudio(key: keyof SettingsData['audio'], value: number): void { this.patch({ audio: { ...settingsService().data.audio, [key]: value } }); audioSystem.play('ui_hover', `settings-preview-${key}-${Math.round(value * 10)}`); }
  private slider(label: string, id: string, value: number, update: (value: number) => void, offset = 0): HTMLElement { const row = this.row(label); const input = document.createElement('input'); input.id = id; input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.05'; input.value = String(value - offset); const output = document.createElement('output'); output.textContent = `${Math.round(value * 100)}%`; input.setAttribute('aria-label', label); input.addEventListener('input', () => { const next = Number(input.value) + offset; output.textContent = `${Math.round(next * 100)}%`; this.clearPendingSlider(); this.pendingSliderTimer = window.setTimeout(() => { this.pendingSliderTimer = 0; update(next); }, 180); }); row.append(input, output); return row; }
  private toggle(label: string, id: string, value: boolean, update: (value: boolean) => void): HTMLElement { const row = this.row(label); const input = document.createElement('input'); input.id = id; input.type = 'checkbox'; input.checked = value; input.setAttribute('aria-label', label); const state = document.createElement('span'); state.textContent = value ? '開啟' : '關閉'; input.addEventListener('change', () => { state.textContent = input.checked ? '開啟' : '關閉'; update(input.checked); }); row.append(input, state); return row; }
  private select(label: string, id: string, value: string, options: readonly (readonly [string,string])[], update: (value: string) => void): HTMLElement { const row = this.row(label); const select = document.createElement('select'); select.id = id; select.setAttribute('aria-label', label); options.forEach(([v,t]) => { const option = document.createElement('option'); option.value = v; option.textContent = t; select.append(option); }); select.value = value; select.addEventListener('change', () => update(select.value)); row.append(select); return row; }
  private row(label: string): HTMLLabelElement { const row = document.createElement('label'); row.className = 'settings-row'; const text = document.createElement('span'); text.textContent = label; row.append(text); return row; }
  private action(label: string, action: () => void): HTMLButtonElement { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', action); return button; }
  private firstFocusable(): HTMLElement | null { return this.dialog.querySelector('input,select,button'); }
  private clearPendingSlider(): void { if (this.pendingSliderTimer) window.clearTimeout(this.pendingSliderTimer); this.pendingSliderTimer = 0; }
  private readonly onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); this.close(); return; } if (event.key !== 'Tab') return; const focusable = [...this.dialog.querySelectorAll<HTMLElement>('input,select,button')]; if (!focusable.length) return; const first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } };
  private readonly applySettings = (settings: SettingsData) => {
    document.documentElement.dataset.highContrast = String(settings.visual.highContrast);
    document.documentElement.dataset.reducedMotion = String(settings.motion.reducedMotion);
    document.documentElement.dataset.flash = settings.motion.flashIntensity;
    document.documentElement.dataset.touchLayout = settings.controls.touchLayout;
    document.documentElement.style.setProperty('--text-scale', String(settings.visual.textScale));
    audioSystem.configure(settings.audio);
    responsiveLayout.configure(settings.visual.textScale, settings.controls.touchLayout);
  };
}
