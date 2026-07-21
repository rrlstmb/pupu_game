import type { AssetManifestEntry } from '../../data/presentation/assetManifest';
import type { CharacterSkinDefinition } from '../../data/presentation/characterSkins';

export type AssetAuditResult = { readonly valid: boolean; readonly errors: readonly string[] };

export function auditAssets(entries: readonly AssetManifestEntry[], skins: readonly CharacterSkinDefinition[]): AssetAuditResult {
  const errors: string[] = [];
  const keys = new Set(entries.map((entry) => entry.assetKey));
  for (const entry of entries) {
    if (!entry.id || !entry.assetKey || !entry.sourceNote) errors.push(`incomplete:${entry.id || entry.assetKey}`);
    if (entry.sourceType === 'unknown') errors.push(`unknown-source:${entry.id}`);
    if (entry.fallbackKey && !keys.has(entry.fallbackKey)) errors.push(`missing-fallback:${entry.id}:${entry.fallbackKey}`);
  }
  if (keys.size !== entries.length) errors.push('duplicate-asset-key');
  for (const skin of skins) {
    if (!keys.has(skin.assetKey)) errors.push(`missing-skin:${skin.id}:${skin.assetKey}`);
    if (!keys.has(skin.fallbackAssetKey)) errors.push(`missing-skin-fallback:${skin.id}`);
    if (Object.values(skin.animationMap).some((animation) => !animation)) errors.push(`invalid-animation:${skin.id}`);
  }
  return { valid: errors.length === 0, errors };
}
