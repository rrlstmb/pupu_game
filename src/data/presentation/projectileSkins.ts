import type { PoopType } from '../../domain/poop/PoopModel';

export type ProjectileSkinDefinition = {
  readonly id: PoopType;
  readonly assetKey: string;
  readonly fallbackAssetKey: string;
  readonly visualScale: number;
  readonly trailColor: number;
  readonly trailAlpha: number;
  readonly rotationSpeed: number;
  readonly impactKind: 'small' | 'sticky' | 'splash' | 'heavy' | 'bounce' | 'stink' | 'split' | 'golden';
  readonly hudGlyph: string;
};

export const PROJECTILE_SKINS: Readonly<Record<PoopType, ProjectileSkinDefinition>> = {
  normal_poop: { id: 'normal_poop', assetKey: 'projectile-normal_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1, trailColor: 0xa16207, trailAlpha: 0.26, rotationSpeed: 3.2, impactKind: 'small', hudGlyph: '●' },
  sticky_poop: { id: 'sticky_poop', assetKey: 'projectile-sticky_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.08, trailColor: 0x84cc16, trailAlpha: 0.42, rotationSpeed: 1.5, impactKind: 'sticky', hudGlyph: '◆' },
  splash_poop: { id: 'splash_poop', assetKey: 'projectile-splash_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.08, trailColor: 0x2dd4bf, trailAlpha: 0.38, rotationSpeed: 4.4, impactKind: 'splash', hudGlyph: '✹' },
  jumbo_poop: { id: 'jumbo_poop', assetKey: 'projectile-jumbo_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.35, trailColor: 0x78350f, trailAlpha: 0.28, rotationSpeed: 1.1, impactKind: 'heavy', hudGlyph: '⬟' },
  bouncy_poop: { id: 'bouncy_poop', assetKey: 'projectile-bouncy_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.05, trailColor: 0xf59e0b, trailAlpha: 0.44, rotationSpeed: 5.2, impactKind: 'bounce', hudGlyph: '⬢' },
  stink_poop: { id: 'stink_poop', assetKey: 'projectile-stink_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.12, trailColor: 0x65a30d, trailAlpha: 0.35, rotationSpeed: 2.2, impactKind: 'stink', hudGlyph: '☁' },
  split_poop: { id: 'split_poop', assetKey: 'projectile-split_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 0.92, trailColor: 0xc084fc, trailAlpha: 0.4, rotationSpeed: 6, impactKind: 'split', hudGlyph: '✦' },
  golden_poop: { id: 'golden_poop', assetKey: 'projectile-golden_poop', fallbackAssetKey: 'projectile-fallback', visualScale: 1.18, trailColor: 0xfde047, trailAlpha: 0.58, rotationSpeed: 2.8, impactKind: 'golden', hudGlyph: '★' }
};
