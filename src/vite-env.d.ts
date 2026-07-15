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
      aimAssistVisible?: boolean;
      chargeState?: ChargeState;
      chargeMeterVisible?: boolean;
      chargeMeter?: ChargeMeterState & { readonly renderedFillWidth: number };
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
    };
  }
}

export {};
