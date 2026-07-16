/// <reference types="vite/client" />

import type Phaser from 'phaser';
import type { AlertState } from './domain/alert/AlertSystem';
import type { WorldLayout } from './domain/layout/WorldLayout';
import type { GameplayEvent } from './domain/gameplay/GameplayEvents';
import type { NPCSpawnerState } from './domain/npc/NPCModel';
import type { PlayerState } from './domain/player/PlayerMovement';
import type { EnvironmentalEffectState } from './domain/poop/EnvironmentalEffectZone';
import type { PoopInventoryState } from './domain/poop/PoopInventory';
import type { ProjectileSystemState } from './domain/projectile/ProjectileSystem';
import type { ChargeMeterState, ChargeState } from './domain/projectile/ChargeSystem';
import type { ProjectileViewPoolStats } from './systems/projectile/PhaserProjectileSystem';
import type { NPCViewPoolStats } from './systems/npc/PhaserNPCSystem';
import type { ScoreState } from './domain/score/ScoreCalculator';
import type { GameConfig } from './runtime/GameConfig';
import type { LevelSession } from './domain/level/LevelDirector';
import type { WindState } from './domain/wind/WindSystem';
import type { CleanerSystemState } from './domain/poop/CleanerSystem';
import type { CounterattackState } from './domain/counterattack/CounterattackSystem';
import type { CounterattackViewStats } from './systems/counterattack/PhaserCounterattackSystem';
import type { SurveillanceState } from './domain/surveillance/SurveillanceSystem';
import type { SecurityState } from './domain/security/SecuritySystem';

declare global {
  interface Window {
    __SHIMING_BIDA_DEBUG__?: {
      game: Phaser.Game;
      config: GameConfig;
      layout?: WorldLayout;
      player?: PlayerState;
      npcSpawner?: NPCSpawnerState;
      npcViewCount?: number;
      npcViewPool?: NPCViewPoolStats;
      hitTokenCount?: number;
      eventBusListenerCounts?: {
        readonly score: number;
        readonly alert: number;
        readonly inventory: number;
        readonly level: number;
      };
      gameplayEvents?: readonly GameplayEvent[];
      score?: ScoreState;
      alert?: AlertState;
      poopInventory?: PoopInventoryState;
      environmentalEffects?: EnvironmentalEffectState;
      cleanerSystem?: CleanerSystemState;
      counterattackState?: CounterattackState;
      counterattackViewPool?: CounterattackViewStats;
      surveillanceState?: SurveillanceState;
      surveillanceViewPool?: { readonly active: number; readonly pooled: number; readonly created: number };
      securityState?: SecurityState;
      securityViewPool?: { readonly active: number; readonly pooled: number; readonly created: number; readonly blockadeViews: number };
      isGameOver?: boolean;
      isPlayerInCover?: boolean;
      hudScoreText?: string;
      hudPoopText?: string;
      hudAlertText?: string;
      hudBreakdownText?: string;
      hudLevelText?: string;
      hudResultText?: string;
      projectileSystem?: ProjectileSystemState;
      projectileViewPool?: ProjectileViewPoolStats;
      predictedLanding?: { readonly x: number; readonly y: number };
      actualLanding?: { readonly x: number; readonly y: number };
      landingError?: number;
      windAccelerationX?: number;
      windState?: WindState;
      windIndicatorText?: string;
      aimAssistVisible?: boolean;
      chargeState?: ChargeState;
      chargeMeterVisible?: boolean;
      chargeMeter?: ChargeMeterState & {
        readonly renderedFillWidth: number;
        readonly renderedFillHeight: number;
        readonly orientation: 'vertical';
        readonly bounds: {
          readonly x: number; readonly y: number;
          readonly left: number; readonly right: number;
          readonly top: number; readonly bottom: number;
          readonly labelX: number; readonly labelY: number;
        };
      };
      projectileShadows?: readonly {
        readonly projectileId: number;
        readonly x: number;
        readonly y: number;
        readonly scale: number;
        readonly alpha: number;
      }[];
      landingHit?: {
        readonly projectiles: readonly { readonly id: number; readonly x: number; readonly y: number }[];
        readonly npcs: readonly { readonly id: number; readonly x: number; readonly y: number; readonly state: string }[];
        readonly selectedNpcIds: readonly number[];
      };
      inputListenerCount?: number;
      debugOverlayVisible?: boolean;
      levelSession?: LevelSession;
      advanceLevelTime?: (seconds: number) => void;
      spawnNPCSandbox?: (npcType: string, x?: number, laneId?: 'back_shop' | 'mid_sidewalk' | 'front_road') => void;
      setPlayerX?: (x: number) => void;
      setNPCX?: (npcId: number, x: number) => void;
      clearNPCSandbox?: (disableAutoSpawn?: boolean) => void;
      primeCounterattackSandbox?: (npcIds: readonly number[]) => void;
    };
  }
}

export {};
