# Phase 10: Advanced Tactical Poop Types

## Section

Tactical Vertical Slice

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 09 acceptance was declared passed by the user prompt. Codex did not mark Phase 09 as `PASS`.

## Scope

- Add bouncy, stink, split, and golden poop to complete the eight-type tactical matrix.
- Keep all poop physics, stock, cooldown, score multiplier, alert cost, skill floor, strengths, weaknesses, and capabilities in `poopDefinitions`.
- Add projectile-level rules for one-bounce behavior and bounded split child projectile spawning.
- Add environmental stink zones with lifetime, slow effect, alert pressure, stats, and cleanup.
- Add golden score bonus and combo extension through legal rant scoring only.
- Add debug arsenal sandbox with Alt+1 through Alt+8.
- Add safety counters for bounce, split children, projectiles, and environmental zones.

## Tactical Rules

- `bouncy_poop`: one tagged-surface bounce, medium stock, useful for late correction, weaker for close fast targets.
- `stink_poop`: creates a timed zone that slows NPCs and increases alert, useful for lane control but costly.
- `split_poop`: splits into three child projectiles at a configured time, useful for spread coverage but low precision multiplier.
- `golden_poop`: rare stock, high score, combo extension, and special score feedback; still requires legal hit/rant scoring.

## Effect Rules

- Bouncy surfaces use tags such as `rooftop_floor`, not object names.
- Stink route fallback is slow-in-zone; it never blocks NPC motion or creates a stuck state.
- Split generation is capped at one generation and global projectile count remains bounded.
- Golden effects do not bypass alert, stock, projectile cooldown, hit legality, game-over latch, or scoring events.

## Interfaces

- `PoopCapability`: adds `bouncy`, `stink`, `split`, and `golden`.
- `ProjectileSystem`: stores per-projectile config/rules, bounce count, split child count, parent id, and generation.
- `EnvironmentalEffectZone`: creates, updates, applies, and clears timed zone effects.
- `GameScene`: maps projectile impact/landing to stink zones and exposes debug arsenal selection.

## Non-Goals

- No complete advanced NPC behavior.
- No authored level progression.
- No cleaner NPC implementation.
- No final arsenal UI.
- No final art/audio.
