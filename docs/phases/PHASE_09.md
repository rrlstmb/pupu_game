# Phase 09: First Tactical Poop Types

## Section

Tactical Vertical Slice

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 08 acceptance was declared passed by the user prompt. Codex did not mark Phase 08 as `PASS`.

## Scope

- Add typed `PoopDefinition`, `PoopInventory`, and `PoopBehaviorStrategy` domain modules.
- Keep normal poop and add sticky, splash, and jumbo poop.
- Add data-driven projectile physics, stock, cooldown, score multiplier, alert cost, tactical balance fields, and capability data for each poop type.
- Add Q/E switching through the existing input abstraction.
- Add HUD selected poop, stock, and cooldown readout.
- Apply sticky slow effects to NPC runtime state without mutating NPC definitions.
- Apply splash effects to multiple NPCs in radius with one-effect-instance dedupe.
- Mark jumbo poop as heavy/slow and `breaksDefense`, with longer cooldown and higher alert cost.
- Preserve deterministic projectile prediction by merging selected poop projectile data with debug wind before both prediction and firing.

## Tactical Rules

- `normal_poop`: infinite stock, baseline cooldown, baseline score and alert.
- `sticky_poop`: limited stock, lower score multiplier, lower alert cost, slows one NPC for a timed window.
- `splash_poop`: limited stock, lower score multiplier, radius effect, higher alert cost, best against clustered NPCs.
- `jumbo_poop`: limited stock, slower/heavier arc, longer cooldown, higher score multiplier, higher alert cost, and defense-breaking marker.

## Effect Instance Rules

- Effect ids are derived from projectile id, poop type, and impact window.
- Sticky refreshes an existing same-poop slow effect on the same NPC.
- Splash can affect each NPC at most once per effect instance.
- Normal poop has no additional effect beyond existing hit/rant behavior.
- Jumbo does not destroy defense in this phase; it only carries the marker for later phases.

## Interfaces

- `src/domain/poop/PoopModel.ts`: definitions, capabilities, and effect instance types.
- `src/domain/poop/PoopInventory.ts`: selected slot, stock, cooldown, and switching.
- `src/domain/poop/PoopBehaviorStrategy.ts`: capability-based hit effect resolution.
- `src/data/poopDefinitions.ts`: Phase 09 balance data.
- `resolveProjectileNPCHits(...)`: accepts poop definitions and returns poop-aware gameplay events.
- `PhaserProjectileSystem.fire(...)`: accepts projectile config and poop type.

## Non-Goals

- No bouncing poop.
- No stink cloud.
- No splitting poop.
- No golden poop.
- No defense object destruction.
- No final art or audio.
