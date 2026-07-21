import type Phaser from 'phaser';
import { ASSET_MANIFEST } from '../../data/presentation/assetManifest';

type CharacterRecipe = {
  key: string;
  coat: number;
  accent: number;
  prop: 'none' | 'phone' | 'umbrella' | 'broom' | 'camera' | 'stream' | 'guard' | 'runner' | 'boss';
};

const characters: CharacterRecipe[] = [
  { key: 'character-player', coat: 0xf6bd60, accent: 0x2563eb, prop: 'none' },
  { key: 'character-office_worker', coat: 0x475569, accent: 0x38bdf8, prop: 'none' },
  { key: 'character-phone_user', coat: 0x7c3aed, accent: 0x111827, prop: 'phone' },
  { key: 'character-jogger', coat: 0xdc2626, accent: 0xfacc15, prop: 'runner' },
  { key: 'character-umbrella_pedestrian', coat: 0x0f766e, accent: 0x38bdf8, prop: 'umbrella' },
  { key: 'character-delivery_rider', coat: 0xea580c, accent: 0xfef3c7, prop: 'runner' },
  { key: 'character-dog_walker', coat: 0x9333ea, accent: 0xf59e0b, prop: 'none' },
  { key: 'character-cleaner', coat: 0x15803d, accent: 0xd9f99d, prop: 'broom' },
  { key: 'character-angry_pedestrian', coat: 0x991b1b, accent: 0xf97316, prop: 'none' },
  { key: 'character-camera_pedestrian', coat: 0x1d4ed8, accent: 0xfde047, prop: 'camera' },
  { key: 'character-streamer', coat: 0xbe185d, accent: 0x22d3ee, prop: 'stream' },
  { key: 'character-tourist', coat: 0x0891b2, accent: 0xf97316, prop: 'camera' },
  { key: 'character-security_guard', coat: 0x172554, accent: 0xfacc15, prop: 'guard' },
  { key: 'character-boss_influencer', coat: 0xf8fafc, accent: 0xf472b6, prop: 'boss' },
  { key: 'character-fallback', coat: 0x64748b, accent: 0xf8fafc, prop: 'none' }
];

const projectiles = [
  ['projectile-normal_poop', 0x7c4a2d, 1], ['projectile-sticky_poop', 0x65a30d, 2], ['projectile-splash_poop', 0x0d9488, 3],
  ['projectile-jumbo_poop', 0x422006, 4], ['projectile-bouncy_poop', 0xf59e0b, 5], ['projectile-stink_poop', 0x84cc16, 6],
  ['projectile-split_poop', 0xa855f7, 7], ['projectile-golden_poop', 0xfacc15, 8],
  ['projectile-fallback', 0x7c4a2d, 1]
] as const;

export function registerGeneratedPresentationAssets(scene: Phaser.Scene): void {
  createFallback(scene);
  characters.forEach((recipe) => createCharacter(scene, recipe));
  projectiles.forEach(([key, color, shape]) => createProjectile(scene, key, color, shape));
  createTiles(scene);
  const runtimeKeys = new Set(ASSET_MANIFEST.map((entry) => entry.assetKey));
  for (const key of runtimeKeys) {
    if (!scene.textures.exists(key) && key !== 'audio-generated-bank') createFallbackAlias(scene, key);
  }
}

function createFallback(scene: Phaser.Scene): void {
  if (scene.textures.exists('presentation-fallback')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xdb2777).fillRoundedRect(2, 2, 60, 60, 8);
  g.lineStyle(4, 0xffffff).strokeRoundedRect(2, 2, 60, 60, 8);
  g.lineBetween(14, 14, 50, 50).lineBetween(50, 14, 14, 50);
  g.generateTexture('presentation-fallback', 64, 64).destroy();
}

function createFallbackAlias(scene: Phaser.Scene, key: string): void {
  const source = scene.textures.get('presentation-fallback').getSourceImage() as HTMLCanvasElement;
  scene.textures.addCanvas(key, source);
}

function createCharacter(scene: Phaser.Scene, recipe: CharacterRecipe): void {
  if (scene.textures.exists(recipe.key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x111827, 0.22).fillEllipse(18, 104, 60, 12);
  g.lineStyle(7, 0x1f2937, 1).lineBetween(35, 75, 27, 103).lineBetween(45, 75, 54, 103);
  g.fillStyle(recipe.coat).fillRoundedRect(20, 39, 40, 47, 10);
  g.lineStyle(5, recipe.accent).strokeRoundedRect(20, 39, 40, 47, 10);
  g.fillStyle(0xf4c7a1).fillCircle(40, 25, 17);
  g.fillStyle(0x2f241f).fillEllipse(22, 8, 36, 16);
  g.fillStyle(0x111827).fillCircle(34, 25, 2).fillCircle(46, 25, 2);
  g.lineStyle(3, 0x1f2937).lineBetween(22, 48, 7, 69).lineBetween(58, 48, 73, 69);
  drawProp(g, recipe.prop, recipe.accent);
  g.generateTexture(recipe.key, 80, recipe.prop === 'umbrella' || recipe.prop === 'boss' ? 122 : 112).destroy();
}

function drawProp(g: Phaser.GameObjects.Graphics, prop: CharacterRecipe['prop'], accent: number): void {
  if (prop === 'phone') g.fillStyle(0x111827).fillRoundedRect(48, 51, 11, 19, 2);
  if (prop === 'umbrella' || prop === 'boss') {
    g.fillStyle(accent, 0.95).fillTriangle(4, 16, 76, 16, 40, -5);
    g.lineStyle(3, 0x334155).lineBetween(40, 14, 40, 75);
  }
  if (prop === 'broom') { g.lineStyle(4, 0xd6a96c).lineBetween(66, 40, 55, 103); g.fillStyle(0xfacc15).fillTriangle(45, 104, 66, 104, 56, 82); }
  if (prop === 'camera') { g.fillStyle(0x111827).fillRoundedRect(51, 46, 23, 17, 3); g.fillStyle(accent).fillCircle(62, 54, 5); }
  if (prop === 'stream') { g.lineStyle(3, accent).strokeRoundedRect(50, 43, 22, 29, 4); g.fillStyle(0xef4444).fillCircle(67, 48, 3); }
  if (prop === 'guard') { g.fillStyle(accent).fillTriangle(29, 3, 51, 3, 40, 15); g.lineStyle(4, accent).lineBetween(61, 47, 76, 62); }
  if (prop === 'runner') { g.lineStyle(6, accent).lineBetween(20, 66, 3, 82).lineBetween(60, 66, 77, 48); }
  if (prop === 'boss') { g.fillStyle(0xfacc15).fillCircle(18, 30, 5).fillCircle(62, 30, 5); }
}

function createProjectile(scene: Phaser.Scene, key: string, color: number, shape: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(color).fillCircle(24, 25, shape === 4 ? 21 : 16);
  g.fillTriangle(10, 21, 18, 4 + (shape % 3) * 3, 25, 22).fillTriangle(23, 20, 32, 2, 39, 23);
  g.lineStyle(shape === 8 ? 4 : 2, shape === 8 ? 0xffffff : 0x3f2a1d, 0.9).strokeCircle(24, 25, shape === 4 ? 21 : 16);
  if (shape === 2) g.lineStyle(4, 0xd9f99d).lineBetween(7, 30, 1, 39);
  if (shape === 3) g.fillStyle(0x5eead4).fillCircle(5, 35, 5).fillCircle(44, 37, 4);
  if (shape === 5) g.lineStyle(4, 0xfffbeb).strokeEllipse(5, 15, 38, 22);
  if (shape === 6) g.fillStyle(0xd9f99d, 0.7).fillCircle(8, 8, 6).fillCircle(40, 7, 5);
  if (shape === 7) g.lineStyle(3, 0xf5d0fe).lineBetween(24, 5, 24, 45);
  if (shape === 8) g.fillStyle(0xffffff, 0.9).fillCircle(17, 17, 5);
  g.generateTexture(key, 48, 48).destroy();
}

function createTiles(scene: Phaser.Scene): void {
  const tiles = [
    ['environment-city-tile', 0x334155, 0x94a3b8], ['environment-rooftop-tile', 0x713f12, 0xd6a96c],
    ['effect-spark', 0xfacc15, 0xffffff], ['effect-smoke', 0x65a30d, 0xd9f99d],
    ['ui-panel', 0x111827, 0xf6bd60], ['ui-icon-fallback', 0x374151, 0xf8fafc]
  ] as const;
  tiles.forEach(([key, fill, line]) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(fill).fillRoundedRect(1, 1, 62, 62, 6);
    g.lineStyle(3, line, 0.65).strokeRoundedRect(2, 2, 60, 60, 6);
    g.lineStyle(2, line, 0.25).lineBetween(4, 20, 60, 20).lineBetween(4, 43, 60, 43);
    g.generateTexture(key, 64, 64).destroy();
  });
}
