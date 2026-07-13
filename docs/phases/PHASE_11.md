# Phase 11: Complete NPC Roster and Interaction Matrix

## Section

Tactical Vertical Slice

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 10 acceptance was declared passed by the user prompt. Codex did not mark Phase 10 as `PASS`.

## Scope

- Add umbrella pedestrian, delivery rider, dog walker, cleaner, angry pedestrian, camera pedestrian, tourist, and security guard.
- Extend NPC definitions with score value, tags, and composed abilities.
- Add domain interaction matrix for NPC x poop outcomes, alert deltas, score deltas, and tags.
- Add safe default behavior and validation for matrix gaps.
- Add telegraph, active, and recovery state fields for dangerous NPC behavior.
- Add cleaner clearing of stink/environmental zones.
- Add debug NPC sandbox with deterministic spawn/clear support.

## NPC Rules

- Umbrella pedestrian blocks normal poop; jumbo or bounced bouncy hits can crack through.
- Delivery rider is fast and high score.
- Dog walker has visible dog alert telegraph and alert pulse.
- Cleaner can remove stink/environmental zones.
- Angry pedestrian can telegraph and enter retaliation.
- Camera pedestrian can enter Recording and emit alert pressure; hits interrupt via normal hit state.
- Tourist uses slower/distracted group behavior and rewards splash/split interactions.
- Security guard enters Searching through observation timing.

## Interfaces

- `NPCDefinition.tags` and `NPCDefinition.abilities`.
- `NPCInstanceState.dangerPhase`, `dangerKind`, `dangerRemainingSeconds`, `alertPulse`, and `retaliationCount`.
- `NPCInteractionMatrix` domain functions.
- `NPC_POOP_INTERACTIONS` authored data.
- Debug sandbox: Alt+Shift+1..9/0/- and `window.__SHIMING_BIDA_DEBUG__` spawn/clear hooks.

## Non-Goals

- No germaphobe influencer boss.
- No authored 10-level content.
- No final retaliating projectile collision damage.
- No final security pathfinding or rooftop capture flow.
- No final art/audio.
