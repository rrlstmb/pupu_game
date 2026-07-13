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
import type { ProjectileViewPoolStats } from './systems/projectile/PhaserProjectileSystem';
import type { NPCViewPoolStats } from './systems/npc/PhaserNPCSystem';
import type { ScoreState } from './domain/score/ScoreCalculator';
import type { GameConfig } from './runtime/GameConfig';

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
      projectileSystem?: ProjectileSystemState;
      projectileViewPool?: ProjectileViewPoolStats;
      predictedLanding?: { readonly x: number; readonly y: number };
      actualLanding?: { readonly x: number; readonly y: number };
      landingError?: number;
      windAccelerationX?: number;
      aimAssistVisible?: boolean;
      inputListenerCount?: number;
      debugOverlayVisible?: boolean;
      spawnNPCSandbox?: (npcType: string, x?: number) => void;
      clearNPCSandbox?: () => void;
    };
  }
}

export {};
