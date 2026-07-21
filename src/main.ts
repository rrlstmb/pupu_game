import Phaser from 'phaser';
import { GAME_CONFIG } from './runtime/GameConfig';
import { createPhaserConfig } from './runtime/createPhaserConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { OpeningScene } from './scenes/OpeningScene';
import './styles.css';
import { SettingsPanel } from './ui/SettingsPanel';
import { AccessibilityAnnouncer } from './ui/AccessibilityAnnouncer';
import { settingsService } from './runtime/SettingsRuntime';
import { responsiveLayout } from './runtime/LayoutRuntime';
import { CanvasAccessibilityBridge } from './ui/CanvasAccessibilityBridge';
import { eventBus } from './runtime/EventBus';
import { GameEvents } from './runtime/GameEvents';

const game = new Phaser.Game(
  createPhaserConfig(GAME_CONFIG, [BootScene, PreloadScene, MenuScene, OpeningScene, GameScene, HUDScene])
);
const root = document.getElementById('app')!;
const settingsPanel = new SettingsPanel(root, game);
const accessibilityAnnouncer = new AccessibilityAnnouncer(root, () => settingsService().data.accessibility.importantEventAnnouncements);
const canvasAccessibility = new CanvasAccessibilityBridge(root, game);
let lastLevelPhase = '';
eventBus.on(GameEvents.LevelUpdated, (session) => {
  if (session.phase === lastLevelPhase) return; lastLevelPhase = session.phase;
  if (session.phase === 'running') accessibilityAnnouncer.announce(`${session.definition.name}開始`, `level-start:${session.id}`);
  if (session.phase === 'settled') accessibilityAnnouncer.announce(session.result?.outcome === 'success' ? '關卡成功' : '關卡失敗', `level-result:${session.id}`, 'assertive');
});
eventBus.on(GameEvents.AlertUpdated, (alert) => { if (alert.value >= 80) accessibilityAnnouncer.announce('警戒值危險', `alert-danger:${Math.floor(alert.value / 10)}`, 'assertive'); });
settingsService().apply();

window.addEventListener('beforeunload', () => {
  settingsPanel.dispose(); accessibilityAnnouncer.dispose(); canvasAccessibility.dispose(); responsiveLayout.dispose();
}, { once: true });

if (GAME_CONFIG.debug) {
  window.__SHIMING_BIDA_DEBUG__ = {
    game,
    config: GAME_CONFIG
  };
  window.__SHIMING_BIDA_DEBUG__.settingsState = { data: settingsService().data, availability: settingsService().availability };
  window.__SHIMING_BIDA_DEBUG__.responsiveLayout = responsiveLayout.snapshot;
  window.__SHIMING_BIDA_DEBUG__.announce = (message, token, priority) => accessibilityAnnouncer.announce(message, token, priority);
  window.__SHIMING_BIDA_DEBUG__.accessibilityStats = { announcerQueue: accessibilityAnnouncer.size(), canvasControls: canvasAccessibility.count() };
}
