# Phase 16: Level 5 - Headwind Delivery

## Scope

- Add only Level 5, a deterministic authored wind schedule, visible wind state, one data-driven bounce surface, and bouncy-poop teaching.
- Preserve charged Y-axis distance, ground projection, projectile shadow, landing hit windows, score/alert, and Levels 1-4.
- Make spawn and wind climax events coexist through explicit event channels.

## Level Data

- Id/name: `level_05`, `第 5 關：逆風投遞`.
- Duration/countdown: 125 seconds / 3 seconds; target score 1650; seed `level-05-headwind-seed`.
- Roster: office worker, phone user, and jogger; base max 12, climax max 16.
- Available poop: normal and bouncy.
- Wind segments: opening calm, right breeze, left wind, and final right gale. Direction, strength, warning, duration, influence, resistance, and offset cap are data.
- Stars: score, two bounced hits, and four jogger hits.

## Wind Contract

- `WindSystem` is pure and resolves state from validated level data, level remaining time, and poop type.
- Wind primarily modifies ground-projection X. Target Y remains owned by charge power.
- A projectile stores one trajectory used by visual body, ground shadow, and authoritative landing collision.
- Warnings expose next direction, strength, and countdown without drawing a trajectory or landing helper.
- Pause freezes level time and therefore wind schedule; retry reconstructs the session and calm state.

## Event Channels

- Channels are `spawnChannel`, `windChannel`, `presentationChannel`, and `hazardChannel`.
- Cross-channel events coexist. Within one channel, highest priority wins; authored order is the deterministic tie-break.
- Prompt 16 uses `replace`; `merge` and `exclusive` remain validated schema values for later authored rules.
- The final 28-second climax triggers one spawn event and one wind event together.

## Bounce Contract

- Bounce surfaces are validated data with id, bounds, normal, enabled state, allowed tags, and coefficient.
- Bouncy poop supports `sign` and the legacy sandbox `rooftop_floor`; normal poop has no bounce capability.
- A projectile records `lastSurfaceId`, can bounce at most once, and reuses remaining presentation/collision ownership through a second trajectory.
- Legal bounced hits append `bounced_hit` to the existing interaction tags and follow the normal one-hit/rant/score flow.

## Non-Goals

- Prompt 17, Level 6, new poop/NPC definitions, formal art/audio, trajectory helpers, campaign persistence, or broad event-system rewrites.

## Manual Acceptance

1. Select Level 5 and verify the windy-afternoon palette, visible sign, and WindIndicator.
2. At 111 seconds remaining, verify the upcoming right-wind warning; at 108 verify right wind is active.
3. Throw normal poop and compare projectile body and shadow X movement.
4. Select bouncy poop, use near-full power against the sign, and verify one bounce followed by a legal rant/score.
5. At 28 seconds remaining verify right gale and jogger-heavy spawn pressure coexist once and stay at or below 16 NPCs.
6. Time out or complete the level and verify bounced-hit star status and seed in results.
