export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Menu: 'MenuScene',
  Game: 'GameScene',
  HUD: 'HUDScene'
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];

