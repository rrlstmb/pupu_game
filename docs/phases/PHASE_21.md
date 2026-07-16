# Phase 21: Level 10 - Clean City Day

## Scope

- Add only Level 10, the three-stage Cleanliness Influencer encounter, ordered protection gates, final rooftop lockdown, bounded final golden attempts, Boss objectives, placeholder presentation, and regression evidence.
- Preserve Levels 1-9 and the existing movement, charged throw, projection shadow, landing collision, score, Combo, Alert, wind, bounce, area zone, cleaner, counterattack, surveillance, and security contracts.

## Three Stages

1. `phase_1_parade` uses a data-driven mixed parade. It exits only after phase score, unique interaction, and one-shot parade-wave conditions all pass.
2. `phase_2_protected_boss` presents the Boss and ordered media, umbrella, and movement gates. It has no HP and only typed, token-deduplicated legal interactions advance it.
3. `phase_3_rooftop_lockdown` warns before each authored blockade, grants final golden attempts once, and opens bounded vulnerable windows only after the shared safety coordinator confirms reachable, safe, throw, and Boss-hit space.

Transitions are atomic domain operations. Each transition appends one encounter-scoped token; terminal states reject later transitions and interactions.

## Boss Protections

- Media entourage: interrupt an active photographer/streamer instance with a legal NPC hit.
- Large umbrella: hit the authoritative Boss bounds with jumbo or legal bouncy poop after media protection is broken.
- Movement barrier: hit the authoritative Boss bounds with sticky poop after the umbrella gate is broken.
- Invalid order/type attempts provide authored feedback and cannot advance a gate. A projectile token can affect a gate once.

Boss movement uses deterministic canonical X bounds. Boss presentation is an adapter and does not define collision; final and protection hits use landing projection against authored Boss bounds.

## Final Safety

`FinalEncounterSafetyCoordinator` subtracts authored blockades and active security, surveillance, and counterattack danger intervals from canonical rooftop bounds. It validates minimum reachable, safe, throw, and Boss-hit widths and returns deterministic allow/delay/relocation guidance. Phaser visuals do not participate.

## Final Golden Rule

- Two encounter-owned attempts are granted exactly once on third-stage entry and mirrored into the existing inventory UI.
- They cannot accumulate across retry/menu/session, and misses consume attempts.
- Success requires `final_vulnerable`, an active window, all protections broken, golden poop, an unprocessed projectile token, and a legal authoritative Boss landing hit.
- Other poop, elapsed time, score, or presentation cannot complete the encounter. Accepted success latches immediately and shows placeholder `屎命完成` once.

## Failure And Reset

Timeout, caught Alert, phase timeout, or exhausted final attempts settle once. Scene restart reconstructs the Boss state, gates, tokens, blockades, windows, final inventory, metrics, adapters, and existing hazard systems from the same seed and a new attempt-scoped session id.

## Non-Goals

- Prompt 22, Level 11, persistence, extra modes, health/damage, formal cinematic/audio/art, automatic aiming, trajectory helpers, or a cross-repository hazard rewrite.
