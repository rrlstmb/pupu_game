# Asset Manifest

All Phase 22 assets are generated inside the repository at preload/runtime and are `polished_prototype`. No external binary, font, image, music, or recording is used.

| Asset family | Runtime keys | Type | Status | Source | Fallback | Final needed |
|---|---|---|---|---|---|---|
| Character fallback | `character-fallback` | character | polished_prototype | generated_in_project | self | Yes |
| Player | `character-player` | character | polished_prototype | generated_in_project | `character-fallback` | Yes |
| NPC roster | `character-{npc_type}` (12) | character | polished_prototype | generated_in_project | `character-fallback` | Yes |
| Boss | `character-boss_influencer` | character | polished_prototype | generated_in_project | `character-fallback` | Yes |
| Projectile fallback | `projectile-fallback` | projectile | polished_prototype | generated_in_project | self | Yes |
| Poop roster | `projectile-{poop_type}` (8) | projectile | polished_prototype | generated_in_project | `projectile-fallback` | Yes |
| City tile | `environment-city-tile` | environment | polished_prototype | generated_in_project | presentation fallback | Yes |
| Rooftop tile | `environment-rooftop-tile` | environment | polished_prototype | generated_in_project | presentation fallback | Yes |
| Impact/smoke | `effect-spark`, `effect-smoke` | effect | polished_prototype | generated_in_project | presentation fallback | Yes |
| UI panel/icon | `ui-panel`, `ui-icon-fallback` | UI | polished_prototype | generated_in_project | presentation fallback | Yes |
| Semantic audio bank | `audio-generated-bank` | audio | polished_prototype | generated oscillator cues | silent fallback | Yes |

The authoritative registry is `src/data/presentation/assetManifest.ts`. Audit verifies ids, runtime keys, fallback keys, source metadata, animation references, and that `unknown` is absent from runtime.

## Replacement Contract

Production replacement may change texture/atlas/audio keys, skin pivot, visual scale, animation map, and presentation timing. It must not modify `NPCDefinition`, `PoopDefinition`, projectile physics, LandingHitWindow, Boss bounds/gates, or event timing.
