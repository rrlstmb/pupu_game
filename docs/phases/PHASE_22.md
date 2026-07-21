# Phase 22: Commercial Presentation Layer

## Scope

Upgrade the ten-level engineering prototype with repository-owned polished-prototype character/projectile textures, state-driven motion, bounded VFX, layered environment variants, consistent UI tokens, semantic generated audio, an optional skippable Opening, countdown-backed Level Intro, and Boss presentation. Preserve Gate D gameplay and unified keyboard/mouse input.

## Architecture

- `AssetManifest` records status/source/fallback for every runtime presentation asset; unknown sources are rejected by audit.
- `CharacterSkinDefinition`, `ProjectileSkinDefinition`, and `EnvironmentSkinDefinition` map domain ids to views without changing authoritative bounds.
- `CharacterPresentation` is a pure state mapper. Phaser views read mapped states; animation never emits gameplay outcomes.
- Existing NPC/projectile pools now reset texture, tint, alpha, scale, rotation, flip, trail, and visibility on reuse.
- `PhaserPresentationEffects` is a 24-view bounded pool keyed by interaction token.
- `SemanticAudioSystem` resolves semantic events to repository-generated WebAudio cues with token dedupe, voice limits, silent failure, and reset/dispose lifecycle.

## Presentation

The player and NPC roster use distinct silhouette/prop recipes. Eight poop types use distinct generated textures, motion, trails, HUD glyph data, and impact kinds. Ten environment profiles share layered renderer code and vary palette/atmosphere through data. Boss uses a separate large silhouette, protection aura, gate text, final-vulnerable tint, and authoritative state mapping without HP.

Opening is explicitly selectable from Menu, can be skipped by mouse or Enter, latches completion, and enters Level 1 with no pending pointer ownership. Level Intro uses the existing countdown; it can be dismissed without starting charge or changing the level timer contract.

## Mouse Protections

`GameplayInputController` remains the only gameplay intent owner. Presentation does not listen to A/D, Space, pointerdown, or pointerup. Opening/Intro/HUD controls carry UI roles; gameplay pointer routing excludes them. Projectile spawn remains synchronous with the existing charge-release domain event. Camera-transforming gameplay effects were intentionally not introduced, preserving canonical mouse mapping.

## Performance Constraints

Character/projectile views retain bounded pools. Main VFX is capped at 24. Audio cues have per-event voice caps. Generated textures are registered once in Preload. Scene disposer clears VFX, views, tweens, overlays, adapters, and hazard presentation. Vite chunk optimization remains Prompt 25 work.

## Non-Goals

No Prompt 23 persistence/unlocks/modes, Prompt 24 touch/responsive/accessibility/settings, Prompt 25 packaging/splitting, Level 11, new NPC/poop/hazard/Boss, balance changes, final outsourced art/audio, health, throw helper, or gameplay-domain rewrite.
