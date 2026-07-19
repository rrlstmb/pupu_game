import Phaser from 'phaser';
import { ALERT_RULES } from '../data/alertRules';
import { NPC_DEFINITIONS, NPC_SPAWN_CONFIG } from '../data/npcDefinitions';
import { LEVEL_01 } from '../data/levels/level01';
import { POOP_DEFINITIONS, poopDefinitionById } from '../data/poopDefinitions';
import { PLAYER_MOVEMENT_CONFIG } from '../data/playerMovement';
import {
  NORMAL_POOP_PROJECTILE_CONFIG,
  THROW_CHARGE_CONFIG,
  THROW_WORLD_CONFIG,
  type ProjectileConfig
} from '../data/projectileConfig';
import { SCORE_RULES } from '../data/scoreRules';
import { NPC_AREA_EFFECT_RESISTANCE } from '../data/npcAreaEffectResistance';
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
import { createCounterattackState, registerAngryHit, updateCounterattacks, type CounterattackState } from '../domain/counterattack/CounterattackSystem';
import { cancelSurveillanceForSource, createSurveillanceState, updateSurveillance, type SurveillanceState } from '../domain/surveillance/SurveillanceSystem';
import { cancelSecurityForGuard, createSecurityState, getReachableHorizontalIntervals, registerThrowExposure, relocatePlayerFromBlockade, updateSecurity, type SecurityState } from '../domain/security/SecuritySystem';
import {
  acceptFinalBossHit, consumeFinalGolden, createBossEncounterState, failIfFinalAttemptsExhausted,
  isBossLandingHit, registerBossInteraction, updateBossEncounter, type BossEncounterState
} from '../domain/boss/BossPhaseStateMachine';
import { evaluateFinalEncounterSafety } from '../domain/boss/FinalEncounterSafetyCoordinator';
import { removeHitTokensForProjectiles, resolveProjectileNPCHits } from '../domain/gameplay/HitDetection';
import {
  collectNPCStateTransitionEvents,
  GameplayEventTypes,
  type GameplayEvent
} from '../domain/gameplay/GameplayEvents';
import { Depths } from '../domain/layout/Depth';
import {
  createLevelSession,
  activeEventForChannel,
  completeBossLevel,
  failBossLevel,
  failLevelCaught,
  spawnConfigForLevel,
  toggleLevelPause,
  updateLevelMetrics,
  updateLevelSession,
  type LevelSession
} from '../domain/level/LevelDirector';
import type { LevelDefinition } from '../domain/level/LevelDefinition';
import { createWorldLayout, type Lane, type ParallaxLayer, type WorldLayout } from '../domain/layout/WorldLayout';
import { createNPCSpawnerState, spawnNPCOfType, updateNPCSpawner } from '../domain/npc/NPCSpawner';
import type { NPCSpawnerState, NPCSpawnConfig } from '../domain/npc/NPCModel';
import { createInitialPlayerState, updatePlayerMovement, type PlayerState } from '../domain/player/PlayerMovement';
import {
  alertIncreaseFromZones,
  applyAreaEffectsToNPCs,
  clearEnvironmentalEffectsByIds,
  createEnvironmentalEffectState,
  createStinkZone,
  markZonesBeingCleaned,
  updateEnvironmentalEffects,
  type EnvironmentalEffectState
} from '../domain/poop/EnvironmentalEffectZone';
import {
  createCleanerSystemState,
  startCleanupTruck,
  updateCleanerSystem,
  type CleanerSystemState
} from '../domain/poop/CleanerSystem';
import {
  canUseSelectedPoop,
  consumeSelectedPoop,
  createPoopInventory,
  selectPoopByIndex,
  selectedPoopType,
  setPoopStock,
  switchPoop,
  updatePoopCooldowns,
  type PoopInventoryState
} from '../domain/poop/PoopInventory';
import { projectileRulesFor } from '../domain/poop/PoopBehaviorStrategy';
import type { BounceSurface, Projectile } from '../domain/projectile/ProjectileSystem';
import {
  cancelCharge,
  chargedProjectileConfig,
  createChargeState,
  updateCharge,
  type ChargeState
} from '../domain/projectile/ChargeSystem';
import type { TrajectoryInput, Vector2 } from '../domain/projectile/ProjectileTrajectory';
import { SeededRng } from '../domain/random/SeededRng';
import { CALM_WIND_STATE, resolveWindState, type WindState } from '../domain/wind/WindSystem';
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
import type { GameplayInputIntent } from '../domain/input/GameplayInputController';
import { PhaserNPCSystem } from '../systems/npc/PhaserNPCSystem';
import { AimAssist } from '../systems/projectile/AimAssist';
import { PhaserProjectileSystem } from '../systems/projectile/PhaserProjectileSystem';
import { PhaserChargeMeter } from '../systems/projectile/PhaserChargeMeter';
import { PhaserWindIndicator } from '../systems/wind/PhaserWindIndicator';
import { PhaserCounterattackSystem } from '../systems/counterattack/PhaserCounterattackSystem';
import { PhaserSurveillanceSystem } from '../systems/surveillance/PhaserSurveillanceSystem';
import { PhaserSecuritySystem } from '../systems/security/PhaserSecuritySystem';
import { PhaserBossSystem } from '../systems/boss/PhaserBossSystem';

export class GameScene extends Phaser.Scene {
  private levelDefinition: LevelDefinition = LEVEL_01;
  private layout!: WorldLayout;
  private inputAdapter!: InputAdapter;
  private inputIntent: GameplayInputIntent = {
    horizontalAxis: 0, chargePressed: false, chargeHeld: false, chargeReleased: false,
    aimHeld: false, switchPrevPressed: false, switchNextPressed: false, activeDevice: 'keyboard'
  };
  private projectileSystem!: PhaserProjectileSystem;
  private aimAssist!: AimAssist;
  private chargeMeter!: PhaserChargeMeter;
  private windIndicator!: PhaserWindIndicator;
  private windState: WindState = CALM_WIND_STATE;
  private debugWindAccelerationX?: number;
  private npcSystem!: PhaserNPCSystem;
  private npcSpawnerState!: NPCSpawnerState;
  private npcRng = new SeededRng(this.levelDefinition.seed);
  private levelSession?: LevelSession;
  private hitTokens = new Set<string>();
  private readonly gameplayEvents: GameplayEvent[] = [];
  private scoreState: ScoreState = createScoreState();
  private alertState: AlertState = createAlertState();
  private poopInventory: PoopInventoryState = createPoopInventory(POOP_DEFINITIONS);
  private environmentalEffects: EnvironmentalEffectState = createEnvironmentalEffectState();
  private cleanerState: CleanerSystemState = createCleanerSystemState();
  private counterattackState: CounterattackState = createCounterattackState();
  private counterattackSystem?: PhaserCounterattackSystem;
  private surveillanceState: SurveillanceState = createSurveillanceState();
  private surveillanceSystem?: PhaserSurveillanceSystem;
  private securityState: SecurityState = createSecurityState();
  private securitySystem?: PhaserSecuritySystem;
  private bossState?: BossEncounterState;
  private bossSystem?: PhaserBossSystem;
  private projectileConfig: ProjectileConfig = NORMAL_POOP_PROJECTILE_CONFIG;
  private chargeState: ChargeState = createChargeState();
  private lastLandingHitDebug?: {
    readonly projectiles: readonly { readonly id: number; readonly x: number; readonly y: number }[];
    readonly npcs: readonly { readonly id: number; readonly x: number; readonly y: number; readonly state: string }[];
    readonly selectedNpcIds: readonly number[];
  };
  private isGameOver = false;
  private playerState!: PlayerState;
  private playerAvatar?: Phaser.GameObjects.Container;
  private playerBody?: Phaser.GameObjects.Rectangle;
  private playerExpression?: Phaser.GameObjects.Arc;
  private playerLabel?: Phaser.GameObjects.Text;
  private readonly scrollingLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; factor: number }> = [];
  private debugOverlay?: Phaser.GameObjects.Container;
  private readonly zoneViews = new Map<string, Phaser.GameObjects.Arc>();
  private cleanupStatusText?: Phaser.GameObjects.Text;
  private debugOverlayVisible = false;
  private readonly poopSelectionRequested = (index: number) => {
    const slot = this.poopInventory.slots[index];
    if (!slot || slot.cooldownRemainingSeconds > 0 || (slot.stock !== 'infinite' && slot.stock <= 0)) return;
    this.poopInventory = selectPoopByIndex(this.poopInventory, index);
    eventBus.emit(GameEvents.PoopInventoryUpdated, this.poopInventory);
  };

  constructor() {
    super(SceneKeys.Game);
  }

  init(data?: { readonly levelDefinition?: LevelDefinition }): void {
    if (data?.levelDefinition) {
      this.levelDefinition = data.levelDefinition;
    }
  }

  create(): void {
    const attempt = (this.levelSession?.attempt ?? 0) + 1;
    this.levelSession = createLevelSession(this.levelDefinition, attempt);
    const levelPoopDefinitions = this.levelPoopDefinitions();
    this.hitTokens = new Set<string>();
    this.gameplayEvents.length = 0;
    this.scoreState = createScoreState();
    this.poopInventory = createPoopInventory(levelPoopDefinitions);
    this.environmentalEffects = createEnvironmentalEffectState();
    this.cleanerState = createCleanerSystemState();
    this.counterattackState = createCounterattackState();
    this.surveillanceState = createSurveillanceState();
    this.securityState = createSecurityState();
    this.bossState = this.levelDefinition.bossEncounter
      ? createBossEncounterState(this.levelSession.id, this.levelDefinition.bossEncounter) : undefined;
    this.projectileConfig = NORMAL_POOP_PROJECTILE_CONFIG;
    this.chargeState = createChargeState();
    this.windState = CALM_WIND_STATE;
    this.debugWindAccelerationX = undefined;
    this.lastLandingHitDebug = undefined;
    this.npcRng = new SeededRng(this.levelSession.definition.seed);
    this.isGameOver = false;
    this.scrollingLayers.length = 0;
    this.layout = createWorldLayout(GAME_CONFIG.width, GAME_CONFIG.height);
    this.playerState = createInitialPlayerState(this.layout.rooftop);
    this.inputIntent = {
      horizontalAxis: 0, chargePressed: false, chargeHeld: false, chargeReleased: false,
      aimHeld: false, switchPrevPressed: false, switchNextPressed: false, activeDevice: 'keyboard'
    };
    this.inputAdapter = new InputAdapter(this, {
      worldSize: { width: GAME_CONFIG.width, height: GAME_CONFIG.height },
      getPlayerX: () => this.playerState.x,
      isOverUi: (x, y) => this.isPointerOverInteractiveUi(x, y),
      canStartGameplayPointer: () => !this.isGameOver && this.levelSession?.phase === 'running'
    });
    this.alertState = createAlertState(this.playerState.x);
    this.projectileSystem = new PhaserProjectileSystem(
      this, this.projectileGroundY(), this.projectileConfig, this.levelBounceSurfaces()
    );
    this.aimAssist = new AimAssist(this);
    this.chargeMeter = new PhaserChargeMeter(this, THROW_CHARGE_CONFIG);
    this.windIndicator = new PhaserWindIndicator(this, GAME_CONFIG.width - 285, 82);
    this.windIndicator.sync(this.windState);
    this.npcSystem = new PhaserNPCSystem(this, NPC_DEFINITIONS);
    this.counterattackSystem = this.levelDefinition.counterattack
      ? new PhaserCounterattackSystem(this, this.levelDefinition.counterattack)
      : undefined;
    this.surveillanceSystem = this.levelDefinition.surveillance
      ? new PhaserSurveillanceSystem(this, this.levelDefinition.surveillance, this.playerY() + 34)
      : undefined;
    this.securitySystem = this.levelDefinition.security
      ? new PhaserSecuritySystem(this, this.levelDefinition.security, this.layout.rooftop.y, this.layout.rooftop.height)
      : undefined;
    this.bossSystem = this.levelDefinition.bossEncounter
      ? new PhaserBossSystem(
        this,
        this.levelDefinition.bossEncounter,
        this.layout.rooftop.y,
        this.layout.rooftop.height
      ) : undefined;
    this.npcSpawnerState = createNPCSpawnerState();
    emitSceneReady(this);
    this.scene.launch(SceneKeys.HUD);

    this.renderWorldLayout(this.layout);
    this.cleanupStatusText = this.add.text(GAME_CONFIG.width / 2, 150, '', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ecfccb', backgroundColor: '#365314', padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setDepth(Depths.hud).setVisible(false);
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
        if (this.poopInventory.slots.length !== POOP_DEFINITIONS.length) {
          this.poopInventory = createPoopInventory(POOP_DEFINITIONS);
        }
        this.poopInventory = selectPoopByIndex(this.poopInventory, index);
      }
    };
    const togglePause = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || !this.levelSession || this.levelSession.phase === 'settled') {
        return;
      }
      event.preventDefault();
      this.resetCharge();
      this.levelSession = toggleLevelPause(this.levelSession);
      eventBus.emit(GameEvents.LevelUpdated, this.levelSession);
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
    document.addEventListener('keydown', togglePause, true);
    eventBus.on(GameEvents.PoopSelectionRequested, this.poopSelectionRequested);

    registerSceneDisposer(this, () => {
      menuButton.off(Phaser.Input.Events.POINTER_UP, this.returnToMenu, this);
      this.input.keyboard?.off('keydown-L', toggleDebug);
      this.input.keyboard?.off('keydown-R', retryWhenFailed);
      document.removeEventListener('keydown', retryWhenFailedFromDocument, true);
      window.removeEventListener('keydown', adjustWind);
      window.removeEventListener('keydown', arsenalSandbox);
      window.removeEventListener('keydown', npcSandbox);
      document.removeEventListener('keydown', togglePause, true);
      eventBus.off(GameEvents.PoopSelectionRequested, this.poopSelectionRequested);
      this.inputAdapter.dispose();
      this.projectileSystem.dispose();
      this.aimAssist.dispose();
      this.chargeMeter.dispose();
      this.windIndicator.dispose();
      this.counterattackSystem?.dispose();
      this.counterattackSystem = undefined;
      this.surveillanceSystem?.dispose();
      this.surveillanceSystem = undefined;
      this.securitySystem?.dispose();
      this.securitySystem = undefined;
      this.bossSystem?.dispose();
      this.bossSystem = undefined;
      this.npcSystem.dispose();
      this.scrollingLayers.length = 0;
      this.debugOverlay?.destroy(true);
      this.debugOverlay = undefined;
      for (const view of this.zoneViews.values()) {
        view.destroy();
      }
      this.zoneViews.clear();
      this.cleanupStatusText?.destroy();
      this.cleanupStatusText = undefined;
      this.scene.stop(SceneKeys.HUD);
      this.clearDebugState();
      emitSceneShutdown(this);
    });
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    if (!this.levelSession) {
      return;
    }
    this.levelSession = updateLevelSession(this.levelSession, deltaSeconds);
    if (this.levelSession.phase === 'settled') {
      this.isGameOver = true;
    }
    if (this.isGameOver || this.levelSession.phase === 'paused' || this.levelSession.phase === 'countdown') {
      this.resetCharge();
      this.updateAimAssistForLevel();
      this.emitRuntimeState();
      this.inputAdapter.endFrame();
      this.setDebugState();
      return;
    }

    for (const layer of this.scrollingLayers) {
      layer.sprite.tilePositionX += deltaSeconds * this.layout.parallaxBaseSpeed * layer.factor;
    }

    const input = this.inputAdapter.snapshot();
    this.inputIntent = input;
    const staggerMultiplier = this.counterattackState.staggerSeconds > 0
      ? this.levelDefinition.counterattack?.staggerMovementMultiplier ?? 1
      : 1;
    const movementBounds = this.securityMovementBounds();
    const relocatedX = relocatePlayerFromBlockade(this.playerState.x, [{ start: movementBounds.minX, end: movementBounds.maxX }]);
    if (relocatedX !== this.playerState.x) this.playerState = { ...this.playerState, x: relocatedX, velocityX: 0 };
    this.playerState = updatePlayerMovement(
      this.playerState,
      input.horizontalAxis,
      movementBounds,
      {
        ...PLAYER_MOVEMENT_CONFIG,
        maxSpeed: PLAYER_MOVEMENT_CONFIG.maxSpeed * staggerMultiplier,
        acceleration: PLAYER_MOVEMENT_CONFIG.acceleration * staggerMultiplier
      },
      deltaSeconds,
      input.aimHeld
    );
    this.alertState = updateAlertOverTime(
      this.alertState,
      {
        deltaSeconds,
        playerX: this.playerState.x,
        isInCover: this.isPlayerInCover(),
        isThrowing: input.chargeHeld
      },
      ALERT_RULES
    );
    if (this.stopFrameIfCaught()) {
      return;
    }
    this.poopInventory = updatePoopCooldowns(this.poopInventory, deltaSeconds);
    if (input.switchPrevPressed) {
      this.poopInventory = switchPoop(this.poopInventory, -1);
    }
    if (input.switchNextPressed) {
      this.poopInventory = switchPoop(this.poopInventory, 1);
    }
    this.syncPlayerView();
    this.updateBossRuntime(deltaSeconds);
    if (this.isGameOver) {
      this.emitRuntimeState();
      this.inputAdapter.endFrame();
      this.setDebugState();
      return;
    }
    const previousNpcs = this.npcSpawnerState.npcs;
    this.npcSpawnerState = updateNPCSpawner(
      this.npcSpawnerState,
      this.levelSpawnConfig(),
      NPC_DEFINITIONS,
      this.layout.lanes,
      deltaSeconds,
      this.layout.width,
      this.npcRng
    );
    const transitionEvents = collectNPCStateTransitionEvents(previousNpcs, this.npcSpawnerState.npcs, this.levelSession.id);
    if (transitionEvents.length > 0) {
      this.gameplayEvents.push(...transitionEvents);
      this.applyGameplayEventsToScore(transitionEvents);
    }
    this.updateCounterattackRuntime(deltaSeconds);
    this.updateSurveillanceRuntime(deltaSeconds, input.chargeHeld);
    this.updateSecurityRuntime(deltaSeconds, input.chargeHeld);
    this.environmentalEffects = updateEnvironmentalEffects(this.environmentalEffects, deltaSeconds);
    this.updateCleanupSystems(deltaSeconds);
    const areaUpdate = applyAreaEffectsToNPCs(
      this.environmentalEffects, this.npcSpawnerState.npcs, NPC_AREA_EFFECT_RESISTANCE
    );
    this.environmentalEffects = areaUpdate.state;
    this.npcSpawnerState = { ...this.npcSpawnerState, npcs: areaUpdate.npcs };
    if (areaUpdate.newlyAffected.length > 0) {
      this.levelSession = updateLevelMetrics(this.levelSession, {
        zoneAffectedNpcCount: this.environmentalEffects.stats.affectedNpcCount,
        maxNpcAffectedBySingleZone: this.environmentalEffects.stats.maxAffectedBySingleZone
      });
      const alertCost = areaUpdate.newlyAffected.length * (this.levelDefinition.areaZone?.alertCostPerAffectedNpc ?? 0);
      if (alertCost > 0) this.alertState = applyAlertDelta(this.alertState, alertCost, 'stink_zone', ALERT_RULES);
    }
    const stinkAlertIncrease = alertIncreaseFromZones(this.environmentalEffects.zones, deltaSeconds);
    if (stinkAlertIncrease > 0) {
      this.alertState = applyAlertDelta(this.alertState, stinkAlertIncrease, 'stink_zone', ALERT_RULES);
    }
    const npcAlertPulse = this.npcSpawnerState.npcs.reduce((total, npc) =>
      total + (this.levelDefinition.surveillance && (npc.definitionId === 'camera_pedestrian' || npc.definitionId === 'streamer') ? 0 : npc.alertPulse ?? 0), 0);
    if (npcAlertPulse > 0) {
      this.alertState = applyAlertDelta(this.alertState, npcAlertPulse, 'npc_danger', ALERT_RULES);
    }
    if (this.stopFrameIfCaught()) {
      return;
    }
    const selectedDefinition = poopDefinitionById(selectedPoopType(this.poopInventory));
    this.windState = resolveWindState(this.levelDefinition.wind, this.levelSession.remainingSeconds, selectedDefinition.id);
    this.windIndicator.sync(this.windState);
    this.projectileConfig = {
      ...selectedDefinition.projectile,
      windAccelerationX: this.debugWindAccelerationX ?? this.windState.accelerationX,
      windMaxHorizontalOffset: this.levelDefinition.wind?.maxHorizontalOffset ?? selectedDefinition.projectile.windMaxHorizontalOffset
    };
    this.projectileSystem.setConfig(this.projectileConfig);
    this.projectileSystem.setDebugVisible(this.debugOverlayVisible);
    const chargeUpdate = updateCharge(
      this.chargeState,
      { pressed: input.chargePressed, held: input.chargeHeld, released: input.chargeReleased },
      deltaSeconds,
      canUseSelectedPoop(this.poopInventory) && this.counterattackState.throwLockSeconds <= 0 && this.surveillanceState.throwLockSeconds <= 0 && this.securityState.throwLockSeconds <= 0,
      THROW_CHARGE_CONFIG
    );
    this.chargeState = chargeUpdate.state;
    this.chargeMeter.sync(this.chargeState);
    const previewPower = Math.max(THROW_CHARGE_CONFIG.minThrowPower, this.chargeState.chargePower);
    const previewConfig = chargedProjectileConfig(
      this.projectileConfig,
      previewPower,
      THROW_CHARGE_CONFIG,
      true
    );
    const trajectory = this.currentThrowTrajectory(previewConfig);
    this.aimAssist.setVisible(this.shouldShowAimAssist());
    this.aimAssist.update(
      trajectory,
      this.projectileGroundY(),
      previewConfig,
      this.projectileSystem.getActualLandingError()
    );

    if (chargeUpdate.releasedThrowPower !== undefined && canUseSelectedPoop(this.poopInventory) && this.counterattackState.throwLockSeconds <= 0 && this.surveillanceState.throwLockSeconds <= 0 && this.securityState.throwLockSeconds <= 0) {
      this.alertState = recordThrow(this.alertState, ALERT_RULES);
      if (this.stopFrameIfCaught()) {
        return;
      }
      const chargedConfig = chargedProjectileConfig(
        this.projectileConfig,
        chargeUpdate.releasedThrowPower,
        THROW_CHARGE_CONFIG,
        true
      );
      const fired = this.projectileSystem.fire(
        trajectory.origin,
        chargedConfig,
        selectedDefinition.id,
        projectileRulesFor(selectedDefinition)
      );
      if (fired) {
        if (this.levelDefinition.security) this.securityState = registerThrowExposure(this.securityState, this.playerState.x, this.levelDefinition.security);
        this.poopInventory = consumeSelectedPoop(this.poopInventory, POOP_DEFINITIONS);
        if (selectedDefinition.id === 'golden_poop' && this.bossState) {
          this.bossState = consumeFinalGolden(this.bossState);
          this.poopInventory = setPoopStock(this.poopInventory, 'golden_poop', this.bossState.finalGoldenRemaining);
        }
        this.levelSession = updateLevelMetrics(this.levelSession, {
          throwCount: this.levelSession.metrics.throwCount + 1,
          goldenPoopUsed: (this.levelSession.metrics.goldenPoopUsed ?? 0) + (selectedDefinition.id === 'golden_poop' ? 1 : 0),
          goldenPoopRemaining: this.goldenStock(),
          finalGoldenUsed: (this.levelSession.metrics.finalGoldenUsed ?? 0) +
            (selectedDefinition.id === 'golden_poop' && this.bossState ? 1 : 0),
          finalGoldenRemaining: this.bossState?.finalGoldenRemaining ?? this.levelSession.metrics.finalGoldenRemaining
        });
      }
    }

    this.projectileSystem.update(deltaSeconds, this.aimAssist.getPredictedLanding());
    const naturallyRecycledProjectiles = this.projectileSystem.consumeNaturalRecycledProjectiles();
    const bossProjectileIds = this.processBossLandingProjectiles(naturallyRecycledProjectiles);
    const npcProjectiles = naturallyRecycledProjectiles.filter((projectile) => !bossProjectileIds.has(projectile.id));
    this.createZonesFromLandedProjectiles(npcProjectiles);
    this.syncZoneViews();
    const naturalRecycleCount = this.projectileSystem.consumeNaturalRecycleCount();
    const hitResult = resolveProjectileNPCHits(
      npcProjectiles,
      this.npcSpawnerState.npcs,
      NPC_DEFINITIONS,
      this.hitTokens,
      POOP_DEFINITIONS,
      this.levelSession.id
    );
    if (naturallyRecycledProjectiles.some((projectile) => projectile.status === 'landed')) {
      this.lastLandingHitDebug = {
        projectiles: naturallyRecycledProjectiles
          .filter((projectile) => projectile.status === 'landed')
          .map((projectile) => ({ id: projectile.id, x: projectile.position.x, y: projectile.position.y })),
        npcs: this.npcSpawnerState.npcs.map((npc) => ({
          id: npc.id, x: npc.x, y: npc.y, state: npc.state
        })),
        selectedNpcIds: hitResult.events.map((event) => event.npcId)
      };
    }
    if (hitResult.events.length > 0) {
      this.npcSpawnerState = {
        ...this.npcSpawnerState,
        npcs: hitResult.npcs
      };
      this.hitTokens = new Set(hitResult.hitTokens);
      this.gameplayEvents.push(...hitResult.events);
      this.applyGameplayEventsToAlert(hitResult.events);
      this.applyGameplayEventsToScore(hitResult.events);
      this.renderInteractionFeedback(hitResult.events);
      const counterRules = this.levelDefinition.counterattack;
      if (counterRules) {
        for (const event of hitResult.events) {
          if (event.type === GameplayEventTypes.ProjectileHit && event.npcType === 'angry_pedestrian') {
            this.counterattackState = registerAngryHit(this.counterattackState, event.token, event.npcId, counterRules);
          }
        }
      }
      if (this.levelDefinition.surveillance) {
        for (const event of hitResult.events) {
          if (event.type !== GameplayEventTypes.ProjectileHit || (event.npcType !== 'camera_pedestrian' && event.npcType !== 'streamer')) continue;
          const wasRecording = this.surveillanceState.instances.some((instance) => instance.sourceNpcId === event.npcId);
          if (wasRecording) {
            this.surveillanceState = cancelSurveillanceForSource(this.surveillanceState, event.npcId);
            this.alertState = applyAlertDelta(this.alertState, this.levelDefinition.surveillance.interruptionAlertPenalty, 'npc_danger', ALERT_RULES);
            if (this.bossState && this.levelDefinition.bossEncounter) {
              const before = this.bossState;
              this.bossState = registerBossInteraction(before, 'camera_interrupt', event.token, this.levelDefinition.bossEncounter);
              if (before.protections[0].state !== 'broken' && this.bossState.protections[0].state === 'broken') {
                this.levelSession = updateLevelMetrics(this.levelSession, {
                  cameraEscortInterruptions: (this.levelSession.metrics.cameraEscortInterruptions ?? 0) + 1
                });
              }
            }
          }
        }
      }
      if (this.levelDefinition.security) {
        for (const event of hitResult.events) {
          if (event.type !== GameplayEventTypes.ProjectileHit || event.npcType !== 'security_guard') continue;
          const hadObservation = this.securityState.instances.some((instance) => instance.sourceId === `guard:${event.npcId}`);
          this.securityState = cancelSecurityForGuard(this.securityState, event.npcId);
          if (hadObservation) this.alertState = applyAlertDelta(this.alertState, this.levelDefinition.security.guardHitAlertPenalty, 'npc_danger', ALERT_RULES);
        }
      }
      const splashHitsByProjectile = new Map<number, number>();
      for (const event of hitResult.events) {
        if (event.type === GameplayEventTypes.ProjectileHit && event.poopType === 'splash_poop') {
          splashHitsByProjectile.set(event.projectileId, (splashHitsByProjectile.get(event.projectileId) ?? 0) + 1);
        }
      }
      const maxSplashTargetsHit = Math.max(0, ...splashHitsByProjectile.values());
      this.levelSession = updateLevelMetrics(this.levelSession, {
        hitCount: this.levelSession.metrics.hitCount + hitResult.events.filter(
          (event) => event.type === GameplayEventTypes.ProjectileHit
        ).length,
        npcHitCounts: hitResult.events.reduce((counts, event) => {
          if (event.type !== GameplayEventTypes.ProjectileHit) return counts;
          return { ...counts, [event.npcType]: (counts[event.npcType] ?? 0) + 1 };
        }, { ...(this.levelSession.metrics.npcHitCounts ?? {}) }),
        interactionCounts: hitResult.events.reduce((counts, event) => {
          if (event.type !== GameplayEventTypes.ProjectileHit) return counts;
          const next = { ...counts };
          for (const tag of event.interactionTags) next[tag] = (next[tag] ?? 0) + 1;
          return next;
        }, { ...(this.levelSession.metrics.interactionCounts ?? {}) }),
        maxSplashTargetsHit,
        goldenPoopHits: (this.levelSession.metrics.goldenPoopHits ?? 0) + hitResult.events.filter(
          (event) => event.type === GameplayEventTypes.ProjectileHit && event.poopType === 'golden_poop'
        ).length,
        goldenPoopRemaining: this.goldenStock()
      });
      this.projectileSystem.recycleByIds(hitResult.projectileIdsToRecycle);
      this.hitTokens = new Set(removeHitTokensForProjectiles(this.hitTokens, hitResult.projectileIdsToRecycle));
      if (this.stopFrameIfCaught()) {
        return;
      }
    }
    const hitProjectileIds = new Set([...hitResult.projectileIdsToRecycle, ...bossProjectileIds]);
    const missedRecycleCount = Math.max(0, naturalRecycleCount - hitProjectileIds.size);
    for (let index = 0; index < missedRecycleCount; index += 1) {
      this.scoreState = applyMissPenalty(this.scoreState, SCORE_RULES);
    }
    if (!this.isComboClockPaused()) {
      this.scoreState = updateComboTimer(this.scoreState, deltaSeconds);
    }
    const priorSessionScore = this.levelSession.metrics.totalScore;
    this.levelSession = updateLevelMetrics(this.levelSession, {
      totalScore: this.scoreState.totalScore,
      highestCombo: this.scoreState.comboCount,
      scoreAfterBlockade: this.securityState.blockade.phase === 'active'
        ? (this.levelSession.metrics.scoreAfterBlockade ?? 0) + Math.max(0, this.scoreState.totalScore - priorSessionScore)
        : this.levelSession.metrics.scoreAfterBlockade
    });
    if (this.levelSession.phase === 'settled') {
      this.isGameOver = true;
    }
    this.checkFailureLatch();
    this.emitRuntimeState();
    this.npcSystem.sync(this.npcSpawnerState, this.debugOverlayVisible);
    this.inputAdapter.endFrame();
    this.setDebugState();
  }

  private returnToMenu(): void {
    this.resetCharge();
    eventBus.emit(GameEvents.ReturnToMenu, undefined);
    this.scene.start(SceneKeys.Menu);
  }

  private applyGameplayEventsToScore(events: readonly GameplayEvent[]): void {
    for (const event of events) {
      if (event.type !== GameplayEventTypes.NPCRantStarted || event.sessionId !== this.levelSession?.id) {
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
      const scoreBefore = this.scoreState.totalScore;
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
      if (event.poopType === 'golden_poop' && this.levelSession) {
        const session = this.levelSession;
        this.levelSession = updateLevelMetrics(session, {
          goldenPoopScore: (session.metrics.goldenPoopScore ?? 0) + this.scoreState.totalScore - scoreBefore
        });
      }
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
      } else if (event.type === GameplayEventTypes.ProjectileBlocked) {
        this.alertState = applyAlertDelta(this.alertState, event.interactionAlertDelta, 'npc_danger', ALERT_RULES);
      }
    }
  }

  private renderInteractionFeedback(events: readonly GameplayEvent[]): void {
    for (const event of events) {
      if (event.type !== GameplayEventTypes.ProjectileBlocked) continue;
      const npc = this.npcSpawnerState.npcs.find((candidate) => candidate.id === event.npcId);
      if (!npc) continue;
      const label = this.add.text(npc.x, npc.y - 58 * npc.scale, event.feedbackLabel, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#fef3c7', backgroundColor: '#7c2d12',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(Depths.particles);
      this.time.delayedCall(900, () => label.destroy());
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

  private levelPoopDefinitions() {
    return POOP_DEFINITIONS
      .filter((definition) => this.levelDefinition.availablePoopTypes.includes(definition.id))
      .map((definition) => ({
        ...definition,
        initialStock: this.levelDefinition.poopStockOverrides?.[definition.id] ?? definition.initialStock
      }));
  }

  private goldenStock(): number {
    const slot = this.poopInventory.slots.find((candidate) => candidate.poopType === 'golden_poop');
    return slot?.stock === 'infinite' ? 0 : slot?.stock ?? 0;
  }

  private levelSpawnConfig(): NPCSpawnConfig {
    if (this.levelDefinition.bossEncounter && this.bossState) {
      const phaseIndex = this.bossState.phase === 'phase_1_parade' || this.bossState.phase === 'not_started' ? 0
        : this.bossState.phase === 'phase_2_protected_boss' || this.bossState.phase === 'transition_1' ? 1 : 2;
      return { seed: this.levelDefinition.seed, ...this.levelDefinition.bossEncounter.phases[phaseIndex].spawn };
    }
    return spawnConfigForLevel(this.levelDefinition, this.levelSession);
  }

  private shouldShowAimAssist(): boolean {
    return this.debugOverlayVisible && THROW_CHARGE_CONFIG.allowDebugTrajectoryOverlay;
  }

  private updateAimAssistForLevel(): void {
    const previewConfig = chargedProjectileConfig(
      this.projectileConfig,
      THROW_CHARGE_CONFIG.minThrowPower,
      THROW_CHARGE_CONFIG,
      true
    );
    const trajectory = this.currentThrowTrajectory(previewConfig);
    this.aimAssist.setVisible(this.shouldShowAimAssist());
    this.aimAssist.update(
      trajectory,
      this.projectileGroundY(),
      previewConfig,
      this.projectileSystem.getActualLandingError()
    );
  }

  private emitRuntimeState(): void {
    eventBus.emit(GameEvents.AlertUpdated, this.alertState);
    eventBus.emit(GameEvents.PoopInventoryUpdated, this.poopInventory);
    eventBus.emit(GameEvents.ScoreUpdated, this.scoreState);
    if (this.levelSession) {
      eventBus.emit(GameEvents.LevelUpdated, this.levelSession);
    }
  }

  private checkFailureLatch(): void {
    if (this.isGameOver || !this.alertState.isCaught) {
      return;
    }

    if (this.levelSession) {
      this.levelSession = failLevelCaught(this.levelSession);
    }
    this.isGameOver = true;
  }

  private stopFrameIfCaught(): boolean {
    if (!this.alertState.isCaught) {
      return false;
    }

    this.checkFailureLatch();
    this.emitRuntimeState();
    this.syncPlayerView();
    this.npcSystem.sync(this.npcSpawnerState, this.debugOverlayVisible);
    this.inputAdapter.endFrame();
    this.setDebugState();
    return true;
  }

  private createZonesFromLandedProjectiles(projectiles: readonly Projectile[]): void {
    for (const projectile of projectiles) {
      if (projectile.status !== 'landed' || !projectile.landedAt) {
        continue;
      }
      this.createZoneFromProjectile(projectile, projectile.landedAt);
    }
  }

  private processBossLandingProjectiles(projectiles: readonly Projectile[]): Set<number> {
    const consumed = new Set<number>();
    const rules = this.levelDefinition.bossEncounter;
    let bossState = this.bossState;
    const levelSession = this.levelSession;
    if (!rules || !bossState || !levelSession) return consumed;
    let session: LevelSession = levelSession;
    for (const projectile of projectiles) {
      if (projectile.status !== 'landed' || !projectile.landedAt ||
        !isBossLandingHit(bossState, projectile.landedAt.x, projectile.landedAt.y, rules)) continue;
      const token: string = `${session.id}:${bossState.encounterId}:boss-projectile:${projectile.id}`;
      consumed.add(projectile.id);
      const before: BossEncounterState = bossState;
      if (before.phase === 'phase_2_protected_boss') {
        const activeGate = before.protections.find((gate) => gate.state === 'active');
        const interaction = projectile.poopType === 'jumbo_poop' || projectile.poopType === 'bouncy_poop'
          ? 'jumbo_or_bounce' as const : projectile.poopType === 'sticky_poop' ? 'sticky_slow' as const : undefined;
        if (interaction) bossState = registerBossInteraction(before, interaction, token, rules);
        else bossState = { ...before, processedInteractionTokens: [...before.processedInteractionTokens, token],
          feedback: activeGate ? rules.protections.find((gate) => gate.id === activeGate.id)!.feedbackLocked : '防護中' };
      } else {
        bossState = acceptFinalBossHit(before, projectile.poopType, token);
      }
      const brokenBefore = before.protections.filter((gate) => gate.state === 'broken').length;
      const brokenAfter = bossState.protections.filter((gate) => gate.state === 'broken').length;
      const acceptedFinal = before.phase !== 'completed' && bossState.phase === 'completed';
      const rejectedFinalGolden = projectile.poopType === 'golden_poop' && !acceptedFinal;
      session = updateLevelMetrics(session, {
        largeUmbrellaBreaks: (session.metrics.largeUmbrellaBreaks ?? 0) +
          (brokenAfter > brokenBefore && projectile.poopType !== 'sticky_poop' ? 1 : 0),
        bossStickySlows: (session.metrics.bossStickySlows ?? 0) +
          (brokenAfter > brokenBefore && projectile.poopType === 'sticky_poop' ? 1 : 0),
        bossProtectionMistakes: (session.metrics.bossProtectionMistakes ?? 0) +
          (brokenAfter === brokenBefore && !acceptedFinal ? 1 : 0),
        finalGoldenHits: (session.metrics.finalGoldenHits ?? 0) + (acceptedFinal ? 1 : 0),
        finalGoldenMisses: (session.metrics.finalGoldenMisses ?? 0) + (rejectedFinalGolden ? 1 : 0),
        finalEncounterCompleted: acceptedFinal ? 1 : session.metrics.finalEncounterCompleted
      });
      if (rejectedFinalGolden) bossState = failIfFinalAttemptsExhausted(bossState);
    }
    const missedFinalGolden = projectiles.some((projectile) => projectile.status === 'landed' && projectile.poopType === 'golden_poop' && !consumed.has(projectile.id));
    if (missedFinalGolden) {
      session = updateLevelMetrics(session, {
        finalGoldenMisses: (session.metrics.finalGoldenMisses ?? 0) + 1
      });
      bossState = failIfFinalAttemptsExhausted(bossState);
    }
    this.bossState = bossState;
    this.levelSession = session;
    this.bossSystem?.sync(bossState);
    return consumed;
  }

  private createZoneFromProjectile(projectile: Projectile, position: Vector2): void {
    const definition = poopDefinitionById(projectile.poopType);
    if (definition.capability.kind === 'stink') {
      const createdBefore = this.environmentalEffects.stats.createdCount;
      this.environmentalEffects = createStinkZone(
        this.environmentalEffects, definition, position, this.levelDefinition.areaZone, projectile.id
      );
      if (this.environmentalEffects.stats.createdCount > createdBefore) {
        const alertCost = this.levelDefinition.areaZone?.alertCostOnCreate ?? 0;
        if (alertCost > 0) this.alertState = applyAlertDelta(this.alertState, alertCost, 'stink_zone', ALERT_RULES);
      }
    }
  }

  private updateCleanupSystems(deltaSeconds: number): void {
    const rules = this.levelDefinition.cleaner;
    if (!rules) return;
    const cleanupEvent = activeEventForChannel(this.levelDefinition, this.levelSession!, 'cleanupChannel');
    if (cleanupEvent?.cleanup) {
      this.cleanerState = startCleanupTruck(this.cleanerState, cleanupEvent.id, cleanupEvent.cleanup);
    }
    const update = updateCleanerSystem(
      this.cleanerState,
      this.npcSpawnerState.npcs.filter((npc) => npc.definitionId === 'cleaner'),
      this.environmentalEffects.zones,
      rules,
      deltaSeconds,
      cleanupEvent?.cleanup
    );
    this.cleanerState = update.state;
    this.environmentalEffects = markZonesBeingCleaned(this.environmentalEffects, update.zoneIdsBeingCleaned);
    this.environmentalEffects = clearEnvironmentalEffectsByIds(this.environmentalEffects, update.zoneIdsToClear);
    const cleaningIds = new Set(update.cleaningNpcIds);
    this.npcSpawnerState = {
      ...this.npcSpawnerState,
      npcs: this.npcSpawnerState.npcs.map((npc) => cleaningIds.has(npc.id)
        ? { ...npc, state: 'Cleaning' as const, currentSpeed: 0 }
        : npc)
    };
    const truck = this.cleanerState.truck;
    this.cleanupStatusText?.setVisible(Boolean(truck && truck.phase !== 'complete')).setText(
      truck ? `${truck.phase === 'warning' ? '清潔車預告' : truck.phase === 'delay' ? '清潔車掃街中' : ''} ${Math.ceil(truck.remainingSeconds)}s` : ''
    );
  }

  private updateCounterattackRuntime(deltaSeconds: number): void {
    const baseRules = this.levelDefinition.counterattack;
    if (!baseRules) return;
    const climax = activeEventForChannel(this.levelDefinition, this.levelSession!, 'hazardChannel')?.counterattack;
    const rules = climax ? {
      ...baseRules,
      globalMinimumGapSeconds: baseRules.globalMinimumGapSeconds * climax.globalGapMultiplier,
      maxConcurrentTelegraphs: baseRules.maxConcurrentTelegraphs + climax.maxConcurrentTelegraphsBonus
    } : baseRules;
    const update = updateCounterattacks(this.counterattackState, {
      deltaSeconds,
      playerX: this.playerState.x,
      targetY: this.playerY(),
      movementBounds: this.layout.rooftop,
      sources: this.npcSpawnerState.npcs
        .filter((npc) => npc.definitionId === 'angry_pedestrian' && npc.state !== 'Exiting')
        .map((npc) => ({ id: npc.id, x: npc.x, y: npc.y }))
    }, rules);
    this.counterattackState = update.state;
    for (const result of update.results) {
      if (result.outcome === 'hit') {
        this.alertState = applyAlertDelta(this.alertState, rules.alertPenalty, 'npc_danger', ALERT_RULES);
      }
    }
    this.levelSession = updateLevelMetrics(this.levelSession!, {
      counterattacksTelegraphed: update.state.stats.telegraphed,
      counterattacksFired: update.state.stats.fired,
      counterattacksDodged: update.state.stats.dodged,
      counterattacksHitPlayer: update.state.stats.hitPlayer,
      maxConcurrentCounterattacksObserved: update.state.stats.maxConcurrentObserved
    });
    this.counterattackSystem?.sync(this.counterattackState);
  }

  private updateSurveillanceRuntime(deltaSeconds: number, isThrowing: boolean): void {
    const baseRules = this.levelDefinition.surveillance;
    if (!baseRules || !this.levelSession) return;
    const climax = activeEventForChannel(this.levelDefinition, this.levelSession, 'surveillanceChannel')?.surveillance;
    const rules = climax ? {
      ...baseRules,
      globalMinimumGapSeconds: baseRules.globalMinimumGapSeconds * climax.globalGapMultiplier,
      maxConcurrentTelegraphs: baseRules.maxConcurrentTelegraphs + climax.maxConcurrentTelegraphsBonus
    } : baseRules;
    const update = updateSurveillance(this.surveillanceState, {
      deltaSeconds,
      playerX: this.playerState.x,
      isThrowing,
      isClimax: Boolean(climax),
      movementBounds: this.layout.rooftop,
      sources: this.npcSpawnerState.npcs
        .filter((npc) => (npc.definitionId === 'camera_pedestrian' || npc.definitionId === 'streamer') &&
          npc.state !== 'Exiting' && npc.state !== 'Hit' && npc.state !== 'Ranting' && npc.state !== 'Recovering')
        .map((npc) => ({ id: npc.id, x: npc.x, mode: npc.definitionId === 'streamer' ? 'recording' as const : 'snapshot' as const }))
    }, rules);
    this.surveillanceState = update.state;
    for (const result of update.results) {
      if (result.outcome !== 'captured') continue;
      const definition = result.mode === 'snapshot' ? rules.snapshot : rules.recording;
      this.alertState = applyAlertDelta(
        this.alertState,
        definition.alertPenalty * rules.alertMultiplier,
        'npc_danger',
        ALERT_RULES
      );
    }
    const stats = update.state.stats;
    this.levelSession = updateLevelMetrics(this.levelSession, {
      cameraTelegraphsStarted: stats.telegraphsStarted,
      snapshotsActivated: stats.snapshotsActivated,
      snapshotsAvoided: stats.snapshotsAvoided,
      snapshotCaptures: stats.snapshotCaptures,
      recordingWindowsStarted: stats.recordingWindowsStarted,
      recordingWindowsSurvived: stats.recordingWindowsSurvived,
      recordingCaptures: stats.recordingCaptures,
      maximumExposureReached: stats.maximumExposureReached,
      capturesDuringThrow: stats.capturesDuringThrow,
      capturesDuringClimax: stats.capturesDuringClimax
    });
    this.surveillanceSystem?.sync(this.surveillanceState);
  }

  private updateSecurityRuntime(deltaSeconds: number, isCharging: boolean): void {
    const baseRules = this.levelDefinition.security;
    if (!baseRules || !this.levelSession) return;
    const securityEvent = activeEventForChannel(this.levelDefinition, this.levelSession, 'securityChannel')?.security;
    const blockadeEvent = activeEventForChannel(this.levelDefinition, this.levelSession, 'blockadeChannel')?.blockade;
    const rules = securityEvent ? {
      ...baseRules,
      detectionRatePerSecond: baseRules.detectionRatePerSecond * securityEvent.detectionRateMultiplier
    } : baseRules;
    const update = updateSecurity(this.securityState, {
      deltaSeconds,
      playerX: this.playerState.x,
      isCharging,
      movementBounds: { minX: this.layout.rooftop.minX, maxX: this.layout.rooftop.maxX },
      guards: this.npcSpawnerState.npcs
        .filter((npc) => npc.definitionId === 'security_guard' &&
          npc.state !== 'Hit' && npc.state !== 'Ranting' && npc.state !== 'Recovering' && npc.state !== 'Exiting')
        .map((npc) => ({ id: npc.id, x: npc.x })),
      activateBlockade: Boolean(blockadeEvent),
      detectionRateMultiplier: 1
    }, rules, this.levelDefinition.blockade);
    this.securityState = update.state;
    for (const result of update.results) {
      if (result.outcome !== 'detected') continue;
      this.alertState = applyAlertDelta(this.alertState, rules.spottedAlertPenalty, 'npc_danger', ALERT_RULES);
    }
    const stats = this.securityState.stats;
    this.levelSession = updateLevelMetrics(this.levelSession, {
      guardObservationsStarted: stats.guardObservationsStarted,
      guardObservationsAvoided: stats.guardObservationsAvoided,
      searchlightWindowsSurvived: stats.searchlightWindowsSurvived,
      securityDetections: stats.securityDetections,
      detectionsWhileExposed: stats.detectionsWhileExposed,
      throwsWhileConcealed: stats.throwsWhileConcealed,
      goldenPoopRemaining: this.goldenStock(),
      blockadeTriggered: stats.blockadeTriggered,
      maximumSecurityDetectionProgress: stats.maximumDetectionProgress
    });
    this.securitySystem?.sync(this.securityState);
  }

  private securityMovementBounds(): { readonly minX: number; readonly maxX: number } {
    const rooftop = { minX: this.layout.rooftop.minX, maxX: this.layout.rooftop.maxX };
    const blocked = [...this.securityState.blockade.blockedIntervals, ...this.bossBlockedIntervals()];
    if (blocked.length === 0) return rooftop;
    const reachable = getReachableHorizontalIntervals(rooftop, blocked);
    const containingPlayer = reachable.find((interval) => this.playerState.x >= interval.start && this.playerState.x <= interval.end);
    const selected = containingPlayer ?? [...reachable].sort((left, right) =>
      (right.end - right.start) - (left.end - left.start) || left.start - right.start
    )[0];
    return selected ? { minX: selected.start, maxX: selected.end } : rooftop;
  }

  private updateBossRuntime(deltaSeconds: number): void {
    const rules = this.levelDefinition.bossEncounter;
    if (!rules || !this.bossState || !this.levelSession) return;
    const previous = this.bossState;
    const nextStage = rules.safety.blockedStages[Math.min(previous.blockedStageCount, rules.safety.blockedStages.length - 1)];
    const blocked = previous.phase === 'phase_3_rooftop_lockdown' && nextStage ? nextStage.intervals : this.bossBlockedIntervals();
    const danger = [
      ...this.securityState.instances.filter((item) => item.state === 'observing').map((item) => ({ start: item.zone.centerX - item.zone.halfWidth, end: item.zone.centerX + item.zone.halfWidth })),
      ...this.surveillanceState.instances.filter((item) => item.state === 'active').map((item) => ({ start: item.targetZone.centerX - item.targetZone.halfWidth, end: item.targetZone.centerX + item.targetZone.halfWidth })),
      ...this.counterattackState.instances.filter((item) => item.state === 'telegraph' || item.state === 'flying').map((item) => ({ start: item.lockedTargetX - rules.safety.minimumSafeWidth / 2, end: item.lockedTargetX + rules.safety.minimumSafeWidth / 2 }))
    ];
    const safety = evaluateFinalEncounterSafety({
      playerMovementBounds: rules.safety.playerBounds, playerX: this.playerState.x,
      blockedIntervals: blocked, dangerIntervals: danger, coverIntervals: rules.safety.coverIntervals,
      bossReachableHitIntervals: rules.safety.bossHitIntervals,
      minimumReachableWidth: rules.safety.minimumReachableWidth, minimumSafeWidth: rules.safety.minimumSafeWidth,
      minimumThrowPositionWidth: rules.safety.minimumThrowPositionWidth,
      minimumBossHitPositionWidth: rules.safety.minimumBossHitPositionWidth
    });
    this.bossState = updateBossEncounter(previous, {
      deltaSeconds, paused: false,
      phase1Score: Math.max(this.levelSession.metrics.phase1Score ?? 0, this.scoreState.totalScore),
      phase1UniqueInteractions: Math.max(
        this.levelSession.metrics.phase1UniqueInteractionTypes ?? 0,
        Object.keys(this.levelSession.metrics.interactionCounts ?? {}).length
      ),
      paradeWaveCompleted: this.levelSession.triggeredEventIds.includes('clean_city_parade'),
      safetyAllowsProgress: safety.allowed
    }, rules);
    if (safety.suggestedAction === 'relocate_player' && safety.relocationX !== undefined) {
      this.playerState = { ...this.playerState, x: safety.relocationX, velocityX: 0 };
    }
    if (previous.finalGoldenGranted === 0 && this.bossState.finalGoldenGranted > 0) {
      this.poopInventory = setPoopStock(this.poopInventory, 'golden_poop', this.bossState.finalGoldenRemaining);
    }
    this.levelSession = updateLevelMetrics(this.levelSession, {
      phase1Score: previous.phase === 'phase_1_parade' ? this.scoreState.totalScore : this.levelSession.metrics.phase1Score,
      phase1UniqueInteractionTypes: Object.keys(this.levelSession.metrics.interactionCounts ?? {}).length,
      paradeWaveCompleted: this.levelSession.triggeredEventIds.includes('clean_city_parade') ? 1 : 0,
      phaseTransitionsCompleted: this.bossState.transitionSequence,
      finalGoldenGranted: this.bossState.finalGoldenGranted,
      finalGoldenRemaining: this.bossState.finalGoldenRemaining,
      finalWindowAttempts: this.bossState.finalWindowAttempts,
      finalEncounterCompleted: this.bossState.completionCount,
      maximumAlert: this.alertState.value,
      completionTime: this.bossState.phase === 'completed' ? this.levelSession.elapsedSeconds : this.levelSession.metrics.completionTime
    });
    if (this.bossState.phase === 'completed') {
      this.levelSession = completeBossLevel(this.levelSession);
      this.isGameOver = true;
    } else if (this.bossState.phase === 'failed') {
      this.levelSession = failBossLevel(this.levelSession);
      this.isGameOver = true;
    }
    this.bossSystem?.sync(this.bossState);
  }

  private bossBlockedIntervals(): readonly { readonly start: number; readonly end: number }[] {
    const rules = this.levelDefinition.bossEncounter;
    if (!rules || !this.bossState || this.bossState.blockedStageCount <= 0) return [];
    return rules.safety.blockedStages[this.bossState.blockedStageCount - 1]?.intervals ?? [];
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
        existing.setFillStyle(zone.state === 'being_cleaned' ? 0xfacc15 : 0x84cc16, 0.28);
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
    this.renderWeather(layout);
    this.renderCleanupDayDecorations(layout);
    this.renderResidentialAlleyDecorations(layout);
    this.renderLiveEventDecorations(layout);
    this.renderBounceSurfaces();
    this.renderDebugOverlay(layout);
  }

  private renderWeather(layout: WorldLayout): void {
    const weather = this.levelDefinition.visual.weather;
    if (weather.kind !== 'rain' && this.levelDefinition.visual.profile !== 'windy_afternoon') return;
    for (let index = 0; index < weather.streakCount; index += 1) {
      const x = ((index * 97) % layout.width) + 18;
      const y = ((index * 53) % layout.height) + 12;
      this.add.line(0, 0, x, y, x - 9, y + 28, weather.streakColor, weather.streakAlpha)
        .setOrigin(0, 0)
        .setDepth(Depths.particles - 2);
    }
  }

  private renderCleanupDayDecorations(layout: WorldLayout): void {
    if (this.levelDefinition.visual.profile !== 'cleanup_day') return;
    const depth = Depths.alleyBack + 12;
    this.add.text(layout.width / 2, layout.zones[0].height + 18, '城市清潔日  CLEAN STREET DAY', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ecfccb', backgroundColor: '#3f6212', padding: { x: 14, y: 6 }
    }).setOrigin(0.5, 0).setDepth(depth);
    for (const x of [115, layout.width - 115]) {
      this.add.rectangle(x, layout.lanes[1].y, 42, 58, 0x166534, 0.9).setDepth(depth);
      this.add.text(x, layout.lanes[1].y, 'BIN', { fontFamily: 'monospace', fontSize: '12px', color: '#dcfce7' })
        .setOrigin(0.5).setDepth(depth + 1);
    }
  }

  private renderResidentialAlleyDecorations(layout: WorldLayout): void {
    if (this.levelDefinition.visual.profile !== 'residential_alley') return;
    const depth = Depths.alleyBack + 12;
    this.add.text(layout.width / 2, layout.zones[0].height + 18, '巷口注意投擲物  WATCH OUT', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fee2e2', backgroundColor: '#7f1d1d', padding: { x: 14, y: 6 }
    }).setOrigin(0.5, 0).setDepth(depth);
    for (const x of [145, layout.width - 145]) {
      this.add.rectangle(x, layout.lanes[1].y, 52, 46, 0x334155, 0.9).setDepth(depth);
      this.add.text(x, layout.lanes[1].y, '巷口', { fontFamily: 'sans-serif', fontSize: '14px', color: '#f8fafc' })
        .setOrigin(0.5).setDepth(depth + 1);
    }
  }

  private renderLiveEventDecorations(layout: WorldLayout): void {
    if (this.levelDefinition.visual.profile !== 'live_event') return;
    const depth = Depths.alleyBack + 12;
    this.add.text(layout.width / 2, layout.zones[0].height + 18, 'LIVE CORNER  全城直播中', {
      fontFamily: 'monospace', fontSize: '20px', color: '#cffafe', backgroundColor: '#155e75', padding: { x: 14, y: 6 }
    }).setOrigin(0.5, 0).setDepth(depth);
    for (const zone of this.levelDefinition.surveillance?.concealmentZones ?? []) {
      this.add.rectangle(zone.x, layout.rooftop.y + 12, zone.width, layout.rooftop.height - 24, 0x0f172a, 0.82)
        .setOrigin(0, 0).setDepth(Depths.cover);
      this.add.text(zone.x + zone.width / 2, layout.rooftop.y + 32, '盲區', {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#e2e8f0'
      }).setOrigin(0.5).setDepth(Depths.cover + 1);
    }
  }

  private renderBounceSurfaces(): void {
    for (const surface of this.levelDefinition.bounceSurfaces ?? []) {
      const view = this.add.rectangle(
        surface.bounds.x, surface.bounds.y, surface.bounds.width, surface.bounds.height, 0xfbbf24, 0.88
      ).setOrigin(0, 0).setDepth(Depths.alleyBack + 16);
      this.add.text(surface.bounds.x + surface.bounds.width / 2, surface.bounds.y + surface.bounds.height / 2, 'BOUNCE SIGN', {
        fontFamily: 'monospace', fontSize: '14px', color: '#422006'
      }).setOrigin(0.5).setDepth(view.depth + 1);
    }
  }

  private renderZoneBands(layout: WorldLayout): void {
    const colors = {
      skyline: this.levelDefinition.visual.skylineColor,
      alley: this.levelDefinition.visual.alleyColor,
      rooftop: this.levelDefinition.visual.rooftopColor
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

  private currentThrowTrajectory(config = this.projectileConfig): TrajectoryInput {
    return {
      origin: this.projectileOrigin(),
      initialVelocity: config.initialVelocity,
      gravity: config.gravity,
      windAccelerationX: config.windAccelerationX,
      startProjectionY: config.startProjectionY,
      targetProjectionY: config.targetProjectionY,
      apexHeight: config.apexHeight,
      travelDuration: config.travelDuration,
      windAffectX: config.windAffectX,
      windAffectY: config.windAffectY,
      windMaxHorizontalOffset: config.windMaxHorizontalOffset
    };
  }

  private projectileOrigin(): Vector2 {
    return {
      x: this.playerState.x,
      y: this.layout.rooftop.y + THROW_WORLD_CONFIG.originOffsetY
    };
  }

  private projectileGroundY(): number {
    return this.layout.rooftop.y + THROW_WORLD_CONFIG.landingPlaneOffsetY;
  }

  private levelBounceSurfaces(): readonly BounceSurface[] {
    return (this.levelDefinition.bounceSurfaces ?? []).map((surface) => ({
      id: surface.id,
      bounds: surface.bounds,
      normal: surface.normal,
      bounceCoefficient: surface.bounceCoefficient,
      enabled: surface.enabled,
      allowedPoopTags: surface.allowedPoopTags,
      tag: 'sign'
    }));
  }

  private setWindAcceleration(windAccelerationX: number): void {
    this.debugWindAccelerationX = Math.max(
      -THROW_WORLD_CONFIG.debugWindLimit,
      Math.min(THROW_WORLD_CONFIG.debugWindLimit, windAccelerationX)
    );
    this.projectileConfig = {
      ...this.projectileConfig,
      windAccelerationX: this.debugWindAccelerationX
    };
    this.projectileSystem.setConfig(this.projectileConfig);
  }

  private resetCharge(): void {
    this.chargeState = cancelCharge();
    this.inputAdapter?.clearAll();
    this.chargeMeter?.sync(this.chargeState);
  }

  private isPointerOverInteractiveUi(x: number, y: number): boolean {
    for (const scene of this.game.scene.getScenes(true)) {
      for (const child of scene.children.list) {
        const bounded = child as Phaser.GameObjects.GameObject & {
          readonly visible?: boolean; readonly active?: boolean; getBounds?: () => Phaser.Geom.Rectangle;
        };
        if (bounded.visible === false || bounded.active === false || !bounded.getData?.('role')) continue;
        if (bounded.getBounds?.().contains(x, y)) return true;
      }
    }
    return false;
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
      inventory: eventBus.listenerCount(GameEvents.PoopInventoryUpdated),
      level: eventBus.listenerCount(GameEvents.LevelUpdated)
    };
    window.__SHIMING_BIDA_DEBUG__.gameplayEvents = this.gameplayEvents;
    window.__SHIMING_BIDA_DEBUG__.score = this.scoreState;
    window.__SHIMING_BIDA_DEBUG__.alert = this.alertState;
    window.__SHIMING_BIDA_DEBUG__.poopInventory = this.poopInventory;
    window.__SHIMING_BIDA_DEBUG__.environmentalEffects = this.environmentalEffects;
    window.__SHIMING_BIDA_DEBUG__.cleanerSystem = this.cleanerState;
    window.__SHIMING_BIDA_DEBUG__.counterattackState = this.counterattackState;
    window.__SHIMING_BIDA_DEBUG__.counterattackViewPool = this.counterattackSystem?.stats();
    window.__SHIMING_BIDA_DEBUG__.surveillanceState = this.surveillanceState;
    window.__SHIMING_BIDA_DEBUG__.surveillanceViewPool = this.surveillanceSystem?.stats();
    window.__SHIMING_BIDA_DEBUG__.securityState = this.securityState;
    window.__SHIMING_BIDA_DEBUG__.securityViewPool = this.securitySystem?.stats();
    window.__SHIMING_BIDA_DEBUG__.bossState = this.bossState;
    window.__SHIMING_BIDA_DEBUG__.isGameOver = this.isGameOver;
    window.__SHIMING_BIDA_DEBUG__.isPlayerInCover = this.isPlayerInCover();
    window.__SHIMING_BIDA_DEBUG__.projectileSystem = this.projectileSystem.snapshot();
    window.__SHIMING_BIDA_DEBUG__.projectileViewPool = this.projectileSystem.viewPoolStats();
    window.__SHIMING_BIDA_DEBUG__.projectileShadows = this.projectileSystem.shadowSnapshot();
    window.__SHIMING_BIDA_DEBUG__.predictedLanding = this.aimAssist.getPredictedLanding();
    window.__SHIMING_BIDA_DEBUG__.actualLanding = this.projectileSystem.getLastLanding();
    window.__SHIMING_BIDA_DEBUG__.landingError = this.projectileSystem.getActualLandingError();
    window.__SHIMING_BIDA_DEBUG__.windAccelerationX = this.projectileConfig.windAccelerationX;
    window.__SHIMING_BIDA_DEBUG__.windState = this.windState;
    window.__SHIMING_BIDA_DEBUG__.windIndicatorText = this.windIndicator.snapshot();
    window.__SHIMING_BIDA_DEBUG__.aimAssistVisible = this.aimAssist.isVisible();
    window.__SHIMING_BIDA_DEBUG__.chargeState = this.chargeState;
    window.__SHIMING_BIDA_DEBUG__.chargeMeterVisible = this.chargeMeter.isVisible();
    window.__SHIMING_BIDA_DEBUG__.chargeMeter = this.chargeMeter.snapshot();
    window.__SHIMING_BIDA_DEBUG__.landingHit = this.lastLandingHitDebug;
    window.__SHIMING_BIDA_DEBUG__.inputListenerCount = this.inputAdapter.getBoundListenerCount();
    window.__SHIMING_BIDA_DEBUG__.pointerListenerCount = this.inputAdapter.getPointerListenerCount();
    window.__SHIMING_BIDA_DEBUG__.pointerCaptureActive = this.inputAdapter.hasPointerCapture();
    window.__SHIMING_BIDA_DEBUG__.chargeInputOwner = this.inputAdapter.getChargeOwner();
    window.__SHIMING_BIDA_DEBUG__.gameplayInputIntent = this.inputIntent;
    const clock = this.time as unknown as { _active: readonly unknown[]; _pendingInsertion: readonly unknown[] };
    window.__SHIMING_BIDA_DEBUG__.sceneTimerCount = clock._active.length + clock._pendingInsertion.length;
    window.__SHIMING_BIDA_DEBUG__.debugOverlayVisible = this.debugOverlayVisible;
    window.__SHIMING_BIDA_DEBUG__.levelSession = this.levelSession;
    window.__SHIMING_BIDA_DEBUG__.advanceLevelTime = (seconds: number) => {
      if (!this.levelSession) {
        return;
      }
      this.levelSession = updateLevelSession(this.levelSession, seconds);
      if (this.levelSession.phase === 'settled') {
        this.isGameOver = true;
      }
      this.emitRuntimeState();
      this.setDebugState();
    };
    window.__SHIMING_BIDA_DEBUG__.spawnNPCSandbox = (npcType: string, x?: number, laneId?: Lane['id']) => {
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
        x,
        laneId
      );
    };
    window.__SHIMING_BIDA_DEBUG__.clearNPCSandbox = (disableAutoSpawn = false) => {
      this.npcSpawnerState = {
        ...this.npcSpawnerState,
        npcs: [],
        timeUntilNextSpawn: disableAutoSpawn ? Number.POSITIVE_INFINITY : this.npcSpawnerState.timeUntilNextSpawn
      };
    };
    window.__SHIMING_BIDA_DEBUG__.setPlayerX = (x: number) => {
      this.playerState = {
        ...this.playerState,
        x: Phaser.Math.Clamp(x, this.layout.rooftop.minX, this.layout.rooftop.maxX),
        velocityX: 0
      };
      this.syncPlayerView();
    };
    window.__SHIMING_BIDA_DEBUG__.setNPCX = (npcId: number, x: number) => {
      this.npcSpawnerState = {
        ...this.npcSpawnerState,
        npcs: this.npcSpawnerState.npcs.map((npc) => npc.id === npcId ? { ...npc, x } : npc)
      };
    };
    window.__SHIMING_BIDA_DEBUG__.primeCounterattackSandbox = (npcIds: readonly number[]) => {
      const rules = this.levelDefinition.counterattack;
      if (!rules) return;
      for (const npcId of [...npcIds].sort((left, right) => left - right)) {
        for (let hit = 0; hit < rules.hitThreshold; hit += 1) {
          const eventId = `sandbox:${this.levelSession?.id}:${npcId}:${this.counterattackState.processedHitEventIds.length}`;
          this.counterattackState = registerAngryHit(this.counterattackState, eventId, npcId, rules);
        }
      }
    };
    window.__SHIMING_BIDA_DEBUG__.primeBossPhaseOneSandbox = () => {
      if (!this.levelSession || !this.levelDefinition.bossEncounter || this.bossState?.phase !== 'phase_1_parade') return;
      const phase = this.levelDefinition.bossEncounter.phases[0];
      this.levelSession = updateLevelMetrics(this.levelSession, {
        phase1Score: phase.phaseScoreTarget ?? 0,
        phase1UniqueInteractionTypes: phase.uniqueInteractionTarget ?? 0,
        paradeWaveCompleted: 1
      });
      if (!this.levelSession.triggeredEventIds.includes('clean_city_parade')) {
        this.levelSession = { ...this.levelSession, triggeredEventIds: [...this.levelSession.triggeredEventIds, 'clean_city_parade'] };
      }
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
    delete debug.cleanerSystem;
    delete debug.counterattackState;
    delete debug.counterattackViewPool;
    delete debug.surveillanceState;
    delete debug.surveillanceViewPool;
    delete debug.securityState;
    delete debug.securityViewPool;
    delete debug.bossState;
    delete debug.isGameOver;
    delete debug.isPlayerInCover;
    delete debug.projectileSystem;
    delete debug.projectileViewPool;
    delete debug.projectileShadows;
    delete debug.predictedLanding;
    delete debug.actualLanding;
    delete debug.landingError;
    delete debug.windAccelerationX;
    delete debug.windState;
    delete debug.windIndicatorText;
    delete debug.aimAssistVisible;
    delete debug.chargeState;
    delete debug.chargeMeterVisible;
    delete debug.chargeMeter;
    delete debug.landingHit;
    delete debug.inputListenerCount;
    delete debug.pointerListenerCount;
    delete debug.pointerCaptureActive;
    delete debug.chargeInputOwner;
    delete debug.gameplayInputIntent;
    delete debug.sceneTimerCount;
    delete debug.debugOverlayVisible;
    delete debug.levelSession;
    delete debug.advanceLevelTime;
    delete debug.spawnNPCSandbox;
    delete debug.setPlayerX;
    delete debug.primeCounterattackSandbox;
    delete debug.primeBossPhaseOneSandbox;
    delete debug.setNPCX;
    delete debug.clearNPCSandbox;
  }
}

function npcSandboxIndex(code: string): number {
  const codes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];
  return codes.indexOf(code);
}
