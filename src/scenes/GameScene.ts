import Phaser from 'phaser';
import { ALERT_RULES } from '../data/alertRules';
import { NPC_DEFINITIONS, NPC_SPAWN_CONFIG } from '../data/npcDefinitions';
import { POOP_DEFINITIONS, poopDefinitionById } from '../data/poopDefinitions';
import { PLAYER_MOVEMENT_CONFIG } from '../data/playerMovement';
import { NORMAL_POOP_PROJECTILE_CONFIG, THROW_WORLD_CONFIG, type ProjectileConfig } from '../data/projectileConfig';
import { SCORE_RULES } from '../data/scoreRules';
import {
  applyAlertDelta,
  createAlertState,
  recordHit,
  recordThrow,
  riskMultiplierForAlert,
  updateAlertOverTime,
  type AlertState
} from '../domain/alert/AlertSystem';
import { isPlayerInCover } from '../domain/alert/CoverVisibility';
import { removeHitTokensForProjectiles, resolveProjectileNPCHits } from '../domain/gameplay/HitDetection';
import {
  collectNPCStateTransitionEvents,
  GameplayEventTypes,
  type GameplayEvent
} from '../domain/gameplay/GameplayEvents';
import { Depths } from '../domain/layout/Depth';
import { createWorldLayout, type Lane, type ParallaxLayer, type WorldLayout } from '../domain/layout/WorldLayout';
import { createNPCSpawnerState, spawnNPCOfType, updateNPCSpawner } from '../domain/npc/NPCSpawner';
import type { NPCSpawnerState } from '../domain/npc/NPCModel';
import { createInitialPlayerState, updatePlayerMovement, type PlayerState } from '../domain/player/PlayerMovement';
import {
  alertIncreaseFromZones,
  applyEnvironmentalEffectsToNPCs,
  clearEnvironmentalEffectsNearNPCs,
  createEnvironmentalEffectState,
  createStinkZone,
  updateEnvironmentalEffects,
  type EnvironmentalEffectState
} from '../domain/poop/EnvironmentalEffectZone';
import {
  canUseSelectedPoop,
  consumeSelectedPoop,
  createPoopInventory,
  selectPoopByIndex,
  selectedPoopType,
  switchPoop,
  updatePoopCooldowns,
  type PoopInventoryState
} from '../domain/poop/PoopInventory';
import { projectileRulesFor } from '../domain/poop/PoopBehaviorStrategy';
import type { Projectile } from '../domain/projectile/ProjectileSystem';
import type { TrajectoryInput, Vector2 } from '../domain/projectile/ProjectileTrajectory';
import { SeededRng } from '../domain/random/SeededRng';
import {
  applyMissPenalty,
  createScoreState,
  scoreRantEvent,
  updateComboTimer,
  type ScoreState
} from '../domain/score/ScoreCalculator';
import { eventBus } from '../runtime/EventBus';
import { GameEvents } from '../runtime/GameEvents';
import { GAME_CONFIG } from '../runtime/GameConfig';
import { SceneKeys } from '../runtime/SceneKeys';
import { emitSceneReady, emitSceneShutdown, registerSceneDisposer } from '../runtime/sceneLifecycle';
import { InputAdapter } from '../systems/input/InputAdapter';
import { PhaserNPCSystem } from '../systems/npc/PhaserNPCSystem';
import { AimAssist } from '../systems/projectile/AimAssist';
import { PhaserProjectileSystem } from '../systems/projectile/PhaserProjectileSystem';

export class GameScene extends Phaser.Scene {
  private layout!: WorldLayout;
  private inputAdapter!: InputAdapter;
  private projectileSystem!: PhaserProjectileSystem;
  private aimAssist!: AimAssist;
  private npcSystem!: PhaserNPCSystem;
  private npcSpawnerState!: NPCSpawnerState;
  private npcRng = new SeededRng(NPC_SPAWN_CONFIG.seed);
  private hitTokens = new Set<string>();
  private readonly gameplayEvents: GameplayEvent[] = [];
  private scoreState: ScoreState = createScoreState();
  private alertState: AlertState = createAlertState();
  private poopInventory: PoopInventoryState = createPoopInventory(POOP_DEFINITIONS);
  private environmentalEffects: EnvironmentalEffectState = createEnvironmentalEffectState();
  private projectileConfig: ProjectileConfig = NORMAL_POOP_PROJECTILE_CONFIG;
  private isGameOver = false;
  private playerState!: PlayerState;
  private playerAvatar?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Rectangle;
  private playerExpression?: Phaser.GameObjects.Arc;
  private playerLabel?: Phaser.GameObjects.Text;
  private readonly scrollingLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; factor: number }> = [];
  private debugOverlay?: Phaser.GameObjects.Container;
  private failureOverlay?: Phaser.GameObjects.Container;
  private readonly zoneViews = new Map<string, Phaser.GameObjects.Arc>();
  private debugOverlayVisible = false;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.hitTokens = new Set<string>();
    this.gameplayEvents.length = 0;
    this.scoreState = createScoreState();
    this.poopInventory = createPoopInventory(POOP_DEFINITIONS);
    this.environmentalEffects = createEnvironmentalEffectState();
    this.projectileConfig = NORMAL_POOP_PROJECTILE_CONFIG;
    this.npcRng = new SeededRng(NPC_SPAWN_CONFIG.seed);
    this.isGameOver = false;
    this.failureOverlay = undefined;
    this.scrollingLayers.length = 0;
    this.layout = createWorldLayout(GAME_CONFIG.width, GAME_CONFIG.height);
    this.inputAdapter = new InputAdapter(this);
    this.playerState = createInitialPlayerState(this.layout.rooftop);
    this.alertState = createAlertState(this.playerState.x);
    this.projectileSystem = new PhaserProjectileSystem(this, this.projectileGroundY(), this.projectileConfig);
    this.aimAssist = new AimAssist(this);
    this.npcSystem = new PhaserNPCSystem(this, NPC_DEFINITIONS);
    this.npcSpawnerState = createNPCSpawnerState();
    emitSceneReady(this);
    this.scene.launch(SceneKeys.HUD);

    this.renderWorldLayout(this.layout);
    this.renderPlayer();
    this.setDebugState();

    const menuButton = this.add
      .text(GAME_CONFIG.width - 32, 28, '返回主選單', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#171923',
        backgroundColor: '#a7f3d0',
        padding: { x: 18, y: 10 }
      })
      .setOrigin(1, 0)
      .setDepth(Depths.hud)
      .setInteractive({ useHandCursor: true });

    menuButton.setData('role', 'return-menu');
    menuButton.on(Phaser.Input.Events.POINTER_UP, this.returnToMenu, this);

    const toggleDebug = () => {
      this.setDebugOverlayVisible(!this.debugOverlayVisible);
    };
    const retryWhenFailed = () => {
      if (this.isGameOver) {
        this.scene.restart();
      }
    };
    const retryWhenFailedFromDocument = (event: KeyboardEvent) => {
      if (event.code === 'KeyR' && this.isGameOver) {
        event.preventDefault();
        this.scene.restart();
      }
    };
    const adjustWind = (event: KeyboardEvent) => {
      if (event.code === 'BracketLeft') {
        this.setWindAcceleration(this.projectileConfig.windAccelerationX - THROW_WORLD_CONFIG.debugWindStep);
      }
      if (event.code === 'BracketRight') {
        this.setWindAcceleration(this.projectileConfig.windAccelerationX + THROW_WORLD_CONFIG.debugWindStep);
      }
    };
    const arsenalSandbox = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (event.altKey && index >= 0 && index < POOP_DEFINITIONS.length) {
        event.preventDefault();
        this.poopInventory = selectPoopByIndex(this.poopInventory, index);
      }
    };
    const npcSandbox = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey) {
        return;
      }
      const index = npcSandboxIndex(event.code);
      if (index < 0 || index >= NPC_DEFINITIONS.length) {
        return;
      }
      event.preventDefault();
      this.npcSpawnerState = spawnNPCOfType(
        this.npcSpawnerState,
        NPC_DEFINITIONS[index].id,
        NPC_DEFINITIONS,
        this.layout.lanes,
        this.layout.width,
        NPC_SPAWN_CONFIG.spawnXPadding,
        this.npcRng
      );
    };
    this.input.keyboard?.on('keydown-L', toggleDebug);
    this.input.keyboard?.on('keydown-R', retryWhenFailed);
    document.addEventListener('keydown', retryWhenFailedFromDocument, true);
    window.addEventListener('keydown', adjustWind);
    window.addEventListener('keydown', arsenalSandbox);
    window.addEventListener('keydown', npcSandbox);

    registerSceneDisposer(this, () => {
      menuButton.off(Phaser.Input.Events.POINTER_UP, this.returnToMenu, this);
      this.input.keyboard?.off('keydown-L', toggleDebug);
      this.input.keyboard?.off('keydown-R', retryWhenFailed);
      document.removeEventListener('keydown', retryWhenFailedFromDocument, true);
      window.removeEventListener('keydown', adjustWind);
      window.removeEventListener('keydown', arsenalSandbox);
      window.removeEventListener('keydown', npcSandbox);
      this.inputAdapter.dispose();
      this.projectileSystem.dispose();
      this.aimAssist.dispose();
      this.npcSystem.dispose();
      this.scrollingLayers.length = 0;
      this.debugOverlay?.destroy(true);
      this.debugOverlay = undefined;
      this.failureOverlay?.destroy(true);
      this.failureOverlay = undefined;
      for (const view of this.zoneViews.values()) {
        view.destroy();
      }
      this.zoneViews.clear();
      this.scene.stop(SceneKeys.HUD);
      this.clearDebugState();
      emitSceneShutdown(this);
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) {
      this.inputAdapter.endFrame();
      this.setDebugState();
      return;
    }

    const deltaSeconds = delta / 1000;
    for (const layer of this.scrollingLayers) {
      layer.sprite.tilePositionX += deltaSeconds * this.layout.parallaxBaseSpeed * layer.factor;
    }

    const input = this.inputAdapter.snapshot();
    this.playerState = updatePlayerMovement(
      this.playerState,
      input,
      this.layout.rooftop,
      PLAYER_MOVEMENT_CONFIG,
      deltaSeconds
    );
    this.alertState = updateAlertOverTime(
      this.alertState,
      {
        deltaSeconds,
        playerX: this.playerState.x,
        isInCover: this.isPlayerInCover(),
        isThrowing: input.throw.pressed
      },
      ALERT_RULES
    );
    if (this.stopFrameIfCaught()) {
      return;
    }
    this.poopInventory = updatePoopCooldowns(this.poopInventory, deltaSeconds);
    if (input.switchPrev.pressed) {
      this.poopInventory = switchPoop(this.poopInventory, -1);
    }
    if (input.switchNext.pressed) {
      this.poopInventory = switchPoop(this.poopInventory, 1);
    }
    this.syncPlayerView();
    const previousNpcs = this.npcSpawnerState.npcs;
    this.npcSpawnerState = updateNPCSpawner(
      this.npcSpawnerState,
      NPC_SPAWN_CONFIG,
      NPC_DEFINITIONS,
      this.layout.lanes,
      deltaSeconds,
      this.layout.width,
      this.npcRng
    );
    const transitionEvents = collectNPCStateTransitionEvents(previousNpcs, this.npcSpawnerState.npcs);
    if (transitionEvents.length > 0) {
      this.gameplayEvents.push(...transitionEvents);
      this.applyGameplayEventsToScore(transitionEvents);
    }
    this.environmentalEffects = updateEnvironmentalEffects(this.environmentalEffects, deltaSeconds);
    this.npcSpawnerState = {
      ...this.npcSpawnerState,
      npcs: applyEnvironmentalEffectsToNPCs(this.npcSpawnerState.npcs, this.environmentalEffects.zones)
    };
    const stinkAlertIncrease = alertIncreaseFromZones(this.environmentalEffects.zones, deltaSeconds);
    if (stinkAlertIncrease > 0) {
      this.alertState = applyAlertDelta(this.alertState, stinkAlertIncrease, 'stink_zone', ALERT_RULES);
    }
    const npcAlertPulse = this.npcSpawnerState.npcs.reduce((total, npc) => total + (npc.alertPulse ?? 0), 0);
    if (npcAlertPulse > 0) {
      this.alertState = applyAlertDelta(this.alertState, npcAlertPulse, 'npc_danger', ALERT_RULES);
    }
    this.clearZonesByCleaners();
    if (this.stopFrameIfCaught()) {
      return;
    }
    const selectedDefinition = poopDefinitionById(selectedPoopType(this.poopInventory));
    this.projectileConfig = {
      ...selectedDefinition.projectile,
      windAccelerationX: this.projectileConfig.windAccelerationX
    };
    this.projectileSystem.setConfig(this.projectileConfig);
    const trajectory = this.currentThrowTrajectory();
    this.aimAssist.setVisible(input.aim.held && this.projectileConfig.aimAssistEnabled);
    this.aimAssist.update(
      trajectory,
      this.projectileGroundY(),
      this.projectileConfig,
      this.projectileSystem.getActualLandingError()
    );

    if (input.throw.pressed && canUseSelectedPoop(this.poopInventory)) {
      this.alertState = recordThrow(this.alertState, ALERT_RULES);
      if (this.stopFrameIfCaught()) {
        return;
      }
      const fired = this.projectileSystem.fire(
        trajectory.origin,
        this.projectileConfig,
        selectedDefinition.id,
        projectileRulesFor(selectedDefinition)
      );
      if (fired) {
        this.poopInventory = consumeSelectedPoop(this.poopInventory, POOP_DEFINITIONS);
      }
    }

    this.projectileSystem.update(deltaSeconds, this.aimAssist.getPredictedLanding());
    this.createZonesFromLandedProjectiles();
    this.syncZoneViews();
    const naturalRecycleCount = this.projectileSystem.consumeNaturalRecycleCount();
    for (let index = 0; index < naturalRecycleCount; index += 1) {
      this.scoreState = applyMissPenalty(this.scoreState, SCORE_RULES);
    }
    const projectileSnapshot = this.projectileSystem.snapshot().projectiles;
    const hitResult = resolveProjectileNPCHits(
      projectileSnapshot,
      this.npcSpawnerState.npcs,
      NPC_DEFINITIONS,
      this.hitTokens,
      POOP_DEFINITIONS
    );
    if (hitResult.events.length > 0) {
      this.npcSpawnerState = {
        ...this.npcSpawnerState,
        npcs: hitResult.npcs
      };
      this.hitTokens = new Set(hitResult.hitTokens);
      this.gameplayEvents.push(...hitResult.events);
      this.applyGameplayEventsToAlert(hitResult.events);
      this.applyGameplayEventsToScore(hitResult.events);
      this.createZonesFromHitProjectiles(projectileSnapshot, hitResult.projectileIdsToRecycle);
      this.projectileSystem.recycleByIds(hitResult.projectileIdsToRecycle);
      this.hitTokens = new Set(removeHitTokensForProjectiles(this.hitTokens, hitResult.projectileIdsToRecycle));
      if (this.stopFrameIfCaught()) {
        return;
      }
    }
    if (!this.isComboClockPaused()) {
      this.scoreState = updateComboTimer(this.scoreState, deltaSeconds);
    }
    this.checkFailureLatch();
    eventBus.emit(GameEvents.AlertUpdated, this.alertState);
    eventBus.emit(GameEvents.PoopInventoryUpdated, this.poopInventory);
    eventBus.emit(GameEvents.ScoreUpdated, this.scoreState);
    this.npcSystem.sync(this.npcSpawnerState, this.debugOverlayVisible);
    this.inputAdapter.endFrame();
    this.setDebugState();
  }

  private returnToMenu(): void {
    eventBus.emit(GameEvents.ReturnToMenu, undefined);
    this.scene.start(SceneKeys.Menu);
  }

  private applyGameplayEventsToScore(events: readonly GameplayEvent[]): void {
    for (const event of events) {
      if (event.type !== GameplayEventTypes.NPCRantStarted) {
        continue;
      }

      const definition = poopDefinitionById(event.poopType);
      const scoringRules = {
        ...SCORE_RULES,
        riskMultiplier: riskMultiplierForAlert(this.alertState, ALERT_RULES),
        specialEventScore: definition.capability.goldenSpecialEventScore ?? SCORE_RULES.specialEventScore,
        combo: {
          ...SCORE_RULES.combo,
          baseWindowSeconds:
            SCORE_RULES.combo.baseWindowSeconds + (definition.capability.goldenComboExtensionSeconds ?? 0)
        }
      };
      this.scoreState = scoreRantEvent(
        this.scoreState,
        {
          eventId: event.eventId,
          npcId: event.npcId,
          npcType: event.npcType,
          ammoType: event.poopType,
          validHitCount: event.validHitCount,
          impactDistance: event.impactDistance,
          specialEventScore:
            event.interactionScoreDelta + (poopDefinitionById(event.poopType).capability.goldenSpecialEventScore ?? 0)
        },
        scoringRules
      );
    }
  }

  private applyGameplayEventsToAlert(events: readonly GameplayEvent[]): void {
    for (const event of events) {
      if (event.type === GameplayEventTypes.ProjectileHit) {
        this.alertState = recordHit(
          this.alertState,
          event.validHitCount,
          ALERT_RULES,
          poopDefinitionById(event.poopType).alertCost + event.interactionAlertDelta
        );
      }
    }
  }

  private isComboClockPaused(): boolean {
    return this.npcSpawnerState.npcs.some(
      (npc) => npc.state === 'Hit' || npc.state === 'Ranting' || npc.state === 'Recovering'
    );
  }

  private isPlayerInCover(): boolean {
    return isPlayerInCover(this.playerState.x, this.layout.rooftop.coverSlots);
  }

  private checkFailureLatch(): void {
    if (this.isGameOver || !this.alertState.isCaught) {
      return;
    }

    this.isGameOver = true;
    this.renderFailureOverlay();
  }

  private stopFrameIfCaught(): boolean {
    if (!this.alertState.isCaught) {
      return false;
    }

    this.checkFailureLatch();
    eventBus.emit(GameEvents.AlertUpdated, this.alertState);
    eventBus.emit(GameEvents.PoopInventoryUpdated, this.poopInventory);
    eventBus.emit(GameEvents.ScoreUpdated, this.scoreState);
    this.syncPlayerView();
    this.npcSystem.sync(this.npcSpawnerState, this.debugOverlayVisible);
    this.inputAdapter.endFrame();
    this.setDebugState();
    return true;
  }

  private renderFailureOverlay(): void {
    const overlay = this.add.container(0, 0).setDepth(Depths.hud + 20);
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
      this.scene.restart();
    });
    overlay.add([panel, title, retry]);
    this.failureOverlay = overlay;
  }

  private createZonesFromLandedProjectiles(): void {
    for (const projectile of this.projectileSystem.consumeNaturalRecycledProjectiles()) {
      if (projectile.status !== 'landed' || !projectile.landedAt) {
        continue;
      }
      this.createZoneFromProjectile(projectile, projectile.landedAt);
    }
  }

  private createZonesFromHitProjectiles(projectiles: readonly Projectile[], projectileIds: readonly number[]): void {
    const ids = new Set(projectileIds);
    for (const projectile of projectiles) {
      if (ids.has(projectile.id)) {
        this.createZoneFromProjectile(projectile, projectile.position);
      }
    }
  }

  private createZoneFromProjectile(projectile: Projectile, position: Vector2): void {
    const definition = poopDefinitionById(projectile.poopType);
    if (definition.capability.kind === 'stink') {
      this.environmentalEffects = createStinkZone(this.environmentalEffects, definition, position);
    }
  }

  private clearZonesByCleaners(): void {
    const cleaners = this.npcSpawnerState.npcs
      .filter((npc) => npc.state === 'Cleaning')
      .map((npc) => ({ x: npc.x, y: npc.y, radius: 145 }));
    if (cleaners.length === 0 || this.environmentalEffects.zones.length === 0) {
      return;
    }
    this.environmentalEffects = clearEnvironmentalEffectsNearNPCs(this.environmentalEffects, cleaners);
  }

  private syncZoneViews(): void {
    const activeIds = new Set(this.environmentalEffects.zones.map((zone) => zone.id));
    for (const [id, view] of this.zoneViews.entries()) {
      if (!activeIds.has(id)) {
        view.destroy();
        this.zoneViews.delete(id);
      }
    }

    for (const zone of this.environmentalEffects.zones) {
      const existing = this.zoneViews.get(zone.id);
      if (existing) {
        existing.setAlpha(0.18 + Math.min(0.3, zone.remainingSeconds / 12));
        continue;
      }
      const view = this.add
        .circle(zone.x, zone.y, zone.radius, 0x84cc16, 0.28)
        .setStrokeStyle(3, 0xecfccb, 0.75)
        .setDepth(Depths.particles);
      this.zoneViews.set(zone.id, view);
    }
  }

  private renderWorldLayout(layout: WorldLayout): void {
    this.renderZoneBands(layout);
    this.renderParallax(layout.parallaxLayers);
    this.renderLanes(layout.lanes);
    this.renderRooftop(layout);
    this.renderDebugOverlay(layout);
  }

  private renderZoneBands(layout: WorldLayout): void {
    const colors = {
      skyline: 0x172033,
      alley: 0x293241,
      rooftop: 0x3d2f27
    };

    for (const zone of layout.zones) {
      this.add
        .rectangle(zone.x, zone.y, zone.width, zone.height, colors[zone.id], 1)
        .setOrigin(0, 0)
        .setDepth(zone.depth);
    }
  }

  private renderParallax(layers: readonly ParallaxLayer[]): void {
    for (const layer of layers) {
      const sprite = this.add
        .tileSprite(layer.x, layer.y, layer.width, layer.height, 'placeholder-tile')
        .setOrigin(0, 0)
        .setDepth(layer.depth)
        .setTint(layer.color)
        .setAlpha(0.5 + layer.scrollFactor * 0.35);

      sprite.tileScaleX = 1.4 - layer.scrollFactor * 0.5;
      sprite.tileScaleY = 1.4 - layer.scrollFactor * 0.5;
      this.scrollingLayers.push({ sprite, factor: layer.scrollFactor });

      this.drawSkylineBlocks(layer);
    }
  }

  private drawSkylineBlocks(layer: ParallaxLayer): void {
    const blockCount = layer.id === 'far' ? 8 : layer.id === 'mid' ? 10 : 13;
    const blockWidth = this.layout.width / blockCount;

    for (let index = 0; index < blockCount; index += 1) {
      const heightRatio = 0.35 + ((index * 17) % 40) / 100;
      const blockHeight = layer.height * heightRatio;
      this.add
        .rectangle(
          index * blockWidth + blockWidth * 0.12,
          layer.y + layer.height - blockHeight,
          blockWidth * 0.64,
          blockHeight,
          layer.color,
          0.72
        )
        .setOrigin(0, 0)
        .setDepth(layer.depth + 1);
    }
  }

  private renderLanes(lanes: readonly Lane[]): void {
    const laneColors: Record<Lane['id'], number> = {
      back_shop: 0x405167,
      mid_sidewalk: 0x52616f,
      front_road: 0x38424d
    };

    for (const lane of lanes) {
      this.add
        .rectangle(lane.bounds.x, lane.bounds.y, lane.bounds.width, lane.bounds.height, laneColors[lane.id], 0.62)
        .setOrigin(0, 0)
        .setDepth(lane.depth);

      this.add
        .line(0, 0, 0, lane.y, this.layout.width, lane.y, 0xf6bd60, 0.6)
        .setOrigin(0, 0)
        .setDepth(lane.depth + 2);
    }
  }

  private renderRooftop(layout: WorldLayout): void {
    this.add
      .rectangle(layout.rooftop.x, layout.rooftop.y, layout.rooftop.width, layout.rooftop.height, 0x5d4037, 0.94)
      .setOrigin(0, 0)
      .setDepth(Depths.rooftop);

    this.add
      .line(0, 0, layout.rooftop.minX, layout.rooftop.y, layout.rooftop.minX, layout.height, 0xf87171, 0.75)
      .setOrigin(0, 0)
      .setDepth(Depths.debug - 10);
    this.add
      .line(0, 0, layout.rooftop.maxX, layout.rooftop.y, layout.rooftop.maxX, layout.height, 0xf87171, 0.75)
      .setOrigin(0, 0)
      .setDepth(Depths.debug - 10);

    for (const cover of layout.rooftop.coverSlots) {
      this.add
        .rectangle(cover.x, cover.y, cover.width, cover.height, 0x6b7280, 0.86)
        .setOrigin(0, 0)
        .setDepth(cover.depth);
      this.add
        .text(cover.x + cover.width / 2, cover.y + cover.height / 2, cover.label, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#f7f0dc',
          align: 'center'
        })
        .setOrigin(0.5)
        .setDepth(cover.depth + 1);
    }
  }

  private renderPlayer(): void {
    const avatar = this.add.container(this.playerState.x, this.playerY()).setDepth(Depths.cover + 10);
    const shadow = this.add.ellipse(0, PLAYER_MOVEMENT_CONFIG.height / 2 + 8, 58, 14, 0x111827, 0.45);
    const body = this.add.rectangle(0, 0, PLAYER_MOVEMENT_CONFIG.width, PLAYER_MOVEMENT_CONFIG.height, 0xf6bd60, 1);
    const head = this.add.circle(0, -PLAYER_MOVEMENT_CONFIG.height / 2 + 8, 22, 0xf7f0dc, 1);
    const expression = this.add.circle(8, -PLAYER_MOVEMENT_CONFIG.height / 2 + 6, 5, 0x111827, 1);
    const label = this.add
      .text(0, PLAYER_MOVEMENT_CONFIG.height / 2 + 26, 'idle', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#111827',
        padding: { x: 6, y: 3 }
      })
      .setOrigin(0.5, 0);

    avatar.add([shadow, body, head, expression, label]);
    avatar.setData('role', 'player-placeholder');
    this.playerAvatar = avatar;
    this.playerBody = body;
    this.playerExpression = expression;
    this.playerLabel = label;
    this.syncPlayerView();
  }

  private syncPlayerView(): void {
    this.playerAvatar?.setPosition(this.playerState.x, this.playerY());

    const stateColor: Record<PlayerState['visualState'], number> = {
      idle: 0xf6bd60,
      move: 0x60a5fa,
      nervous: 0xf87171
    };
    this.playerBody?.setFillStyle(stateColor[this.playerState.visualState], 1);
    this.playerExpression?.setScale(this.playerState.visualState === 'nervous' ? 1.8 : 1);
    this.playerLabel?.setText(this.playerState.visualState);
  }

  private playerY(): number {
    return this.layout.rooftop.playerBaselineY;
  }

  private currentThrowTrajectory(): TrajectoryInput {
    return {
      origin: this.projectileOrigin(),
      initialVelocity: this.projectileConfig.initialVelocity,
      gravity: this.projectileConfig.gravity,
      windAccelerationX: this.projectileConfig.windAccelerationX
    };
  }

  private projectileOrigin(): Vector2 {
    return {
      x: this.playerState.x + PLAYER_MOVEMENT_CONFIG.width * THROW_WORLD_CONFIG.originOffsetPlayerWidthRatio,
      y: this.layout.rooftop.y + THROW_WORLD_CONFIG.originOffsetY
    };
  }

  private projectileGroundY(): number {
    return this.layout.rooftop.y + THROW_WORLD_CONFIG.landingPlaneOffsetY;
  }

  private setWindAcceleration(windAccelerationX: number): void {
    this.projectileConfig = {
      ...this.projectileConfig,
      windAccelerationX: Math.max(
        -THROW_WORLD_CONFIG.debugWindLimit,
        Math.min(THROW_WORLD_CONFIG.debugWindLimit, windAccelerationX)
      )
    };
    this.projectileSystem.setConfig(this.projectileConfig);
  }

  private renderDebugOverlay(layout: WorldLayout): void {
    const overlay = this.add.container(0, 0).setDepth(Depths.debug).setVisible(this.debugOverlayVisible);
    this.debugOverlay = overlay;

    const graphics = this.add.graphics();
    overlay.add(graphics);

    graphics.lineStyle(2, 0xffffff, 0.5);
    for (const zone of layout.zones) {
      graphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
      overlay.add(
        this.add.text(zone.x + 16, zone.y + 14, `${zone.label} ${Math.round(zone.ratio * 100)}%`, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff'
        })
      );
    }

    graphics.lineStyle(3, 0xf6bd60, 0.95);
    for (const lane of layout.lanes) {
      graphics.strokeRect(lane.bounds.x, lane.bounds.y, lane.bounds.width, lane.bounds.height);
      graphics.lineBetween(0, lane.y, layout.width, lane.y);
      overlay.add(
        this.add.text(18, lane.y - 24, `${lane.label} y=${Math.round(lane.y)} scale=${lane.scale}`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#f6bd60'
        })
      );
    }

    graphics.lineStyle(2, 0x34d399, 0.95);
    graphics.strokeRect(layout.rooftop.x, layout.rooftop.y, layout.rooftop.width, layout.rooftop.height);
    graphics.lineStyle(2, 0xf87171, 0.95);
    graphics.lineBetween(layout.rooftop.minX, layout.rooftop.y, layout.rooftop.minX, layout.height);
    graphics.lineBetween(layout.rooftop.maxX, layout.rooftop.y, layout.rooftop.maxX, layout.height);

    for (let x = 0; x <= layout.width; x += layout.debugStep) {
      graphics.lineStyle(1, 0xffffff, 0.12);
      graphics.lineBetween(x, 0, x, layout.height);
    }
    for (let y = 0; y <= layout.height; y += layout.debugStep) {
      graphics.lineStyle(1, 0xffffff, 0.12);
      graphics.lineBetween(0, y, layout.width, y);
    }

    overlay.add(
      this.add.text(layout.width - 24, layout.height - 24, 'L: debug layout overlay', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#111827',
        padding: { x: 8, y: 6 }
      }).setOrigin(1, 1)
    );
  }

  private setDebugOverlayVisible(visible: boolean): void {
    this.debugOverlayVisible = visible;
    this.debugOverlay?.setVisible(visible);
    this.setDebugState();
  }

  private setDebugState(): void {
    if (!window.__SHIMING_BIDA_DEBUG__) {
      return;
    }

    window.__SHIMING_BIDA_DEBUG__.layout = this.layout;
    window.__SHIMING_BIDA_DEBUG__.player = this.playerState;
    window.__SHIMING_BIDA_DEBUG__.npcSpawner = this.npcSpawnerState;
    window.__SHIMING_BIDA_DEBUG__.npcViewCount = this.npcSystem.viewCount();
    window.__SHIMING_BIDA_DEBUG__.npcViewPool = this.npcSystem.viewPoolStats();
    window.__SHIMING_BIDA_DEBUG__.hitTokenCount = this.hitTokens.size;
    window.__SHIMING_BIDA_DEBUG__.eventBusListenerCounts = {
      score: eventBus.listenerCount(GameEvents.ScoreUpdated),
      alert: eventBus.listenerCount(GameEvents.AlertUpdated),
      inventory: eventBus.listenerCount(GameEvents.PoopInventoryUpdated)
    };
    window.__SHIMING_BIDA_DEBUG__.gameplayEvents = this.gameplayEvents;
    window.__SHIMING_BIDA_DEBUG__.score = this.scoreState;
    window.__SHIMING_BIDA_DEBUG__.alert = this.alertState;
    window.__SHIMING_BIDA_DEBUG__.poopInventory = this.poopInventory;
    window.__SHIMING_BIDA_DEBUG__.environmentalEffects = this.environmentalEffects;
    window.__SHIMING_BIDA_DEBUG__.isGameOver = this.isGameOver;
    window.__SHIMING_BIDA_DEBUG__.isPlayerInCover = this.isPlayerInCover();
    window.__SHIMING_BIDA_DEBUG__.projectileSystem = this.projectileSystem.snapshot();
    window.__SHIMING_BIDA_DEBUG__.projectileViewPool = this.projectileSystem.viewPoolStats();
    window.__SHIMING_BIDA_DEBUG__.predictedLanding = this.aimAssist.getPredictedLanding();
    window.__SHIMING_BIDA_DEBUG__.actualLanding = this.projectileSystem.getLastLanding();
    window.__SHIMING_BIDA_DEBUG__.landingError = this.projectileSystem.getActualLandingError();
    window.__SHIMING_BIDA_DEBUG__.windAccelerationX = this.projectileConfig.windAccelerationX;
    window.__SHIMING_BIDA_DEBUG__.aimAssistVisible = this.aimAssist.isVisible();
    window.__SHIMING_BIDA_DEBUG__.inputListenerCount = this.inputAdapter.getBoundListenerCount();
    window.__SHIMING_BIDA_DEBUG__.debugOverlayVisible = this.debugOverlayVisible;
    window.__SHIMING_BIDA_DEBUG__.spawnNPCSandbox = (npcType: string, x?: number) => {
      const definition = NPC_DEFINITIONS.find((candidate) => candidate.id === npcType);
      if (!definition) {
        return;
      }
      this.npcSpawnerState = spawnNPCOfType(
        this.npcSpawnerState,
        definition.id,
        NPC_DEFINITIONS,
        this.layout.lanes,
        this.layout.width,
        NPC_SPAWN_CONFIG.spawnXPadding,
        this.npcRng,
        x
      );
    };
    window.__SHIMING_BIDA_DEBUG__.clearNPCSandbox = () => {
      this.npcSpawnerState = {
        ...this.npcSpawnerState,
        npcs: []
      };
    };
  }

  private clearDebugState(): void {
    const debug = window.__SHIMING_BIDA_DEBUG__;
    if (!debug) {
      return;
    }

    delete debug.layout;
    delete debug.player;
    delete debug.npcSpawner;
    delete debug.npcViewCount;
    delete debug.npcViewPool;
    delete debug.hitTokenCount;
    delete debug.eventBusListenerCounts;
    delete debug.gameplayEvents;
    delete debug.score;
    delete debug.alert;
    delete debug.poopInventory;
    delete debug.environmentalEffects;
    delete debug.isGameOver;
    delete debug.isPlayerInCover;
    delete debug.projectileSystem;
    delete debug.projectileViewPool;
    delete debug.predictedLanding;
    delete debug.actualLanding;
    delete debug.landingError;
    delete debug.windAccelerationX;
    delete debug.aimAssistVisible;
    delete debug.inputListenerCount;
    delete debug.debugOverlayVisible;
    delete debug.spawnNPCSandbox;
    delete debug.clearNPCSandbox;
  }
}

function npcSandboxIndex(code: string): number {
  const codes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];
  return codes.indexOf(code);
}
