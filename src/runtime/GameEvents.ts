import type { AlertState } from '../domain/alert/AlertSystem';
import type { PoopInventoryState } from '../domain/poop/PoopInventory';
import type { ScoreState } from '../domain/score/ScoreCalculator';
import type { LevelSession } from '../domain/level/LevelDirector';

export const GameEvents = {
  StartGame: 'game:start',
  ReturnToMenu: 'game:return_to_menu',
  AlertUpdated: 'alert:updated',
  PoopInventoryUpdated: 'poop_inventory:updated',
  PoopSelectionRequested: 'poop_inventory:selection_requested',
  ScoreUpdated: 'score:updated',
  LevelUpdated: 'level:updated',
  SceneReady: 'scene:ready',
  SceneShutdown: 'scene:shutdown'
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

export type GameEventPayloads = {
  [GameEvents.StartGame]: undefined;
  [GameEvents.ReturnToMenu]: undefined;
  [GameEvents.AlertUpdated]: AlertState;
  [GameEvents.PoopInventoryUpdated]: PoopInventoryState;
  [GameEvents.PoopSelectionRequested]: number;
  [GameEvents.ScoreUpdated]: ScoreState;
  [GameEvents.LevelUpdated]: LevelSession;
  [GameEvents.SceneReady]: { scene: string };
  [GameEvents.SceneShutdown]: { scene: string };
};
