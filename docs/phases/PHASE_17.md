# Phase 17: Level 6 - Cleanup Battle

## Scope

- Add only Level 6, authored stink-zone rules, cleaner coordination, a cleanup-truck event, and zone-control star tracking.
- Reuse the existing stink poop, environmental zone, cleaner NPC, LevelDirector channels, projectile landing projection, and settlement UI.
- Preserve charged throws, landing hit windows, wind/bounce behavior, score/alert, and Levels 1-5.

## Level Data

- Id/name: `level_06`, `第 6 關：清潔大作戰`.
- Duration/countdown: 130 seconds / 3 seconds; target score 1750; seed `level-06-cleanup-seed`.
- Roster: office worker, tourist, jogger, and cleaner; base maximum 13, climax maximum 15.
- Available poop: normal and stink.
- Zone rules: radius 118, lifetime 9 seconds, maximum 3, oldest-first replacement, slow multiplier 0.56, and explicit create/affected alert costs.
- Stars: score, three NPCs affected by one zone, and four cleaner hits.

## Area Zone Contract

- A stink projectile creates its zone at authoritative `landedAt`, after which projectile and shadow recycle normally.
- Zone state owns source projectile id, creation order, one-time affected NPC ids, remaining game time, and active/being-cleaned state.
- At cap, Level 6 replaces the oldest zone. One NPC contributes at most once to each zone; no frame tick scores.
- Overlap applies the strongest deterministic slow. Resistance is data driven; leaving, immunity, expiry, clear, pause, and retry remove or freeze effects without mutating NPC definitions.

## Cleaner Contract

- Cleaners select the nearest eligible zone, then creation order and id. A zone can have one lock and a cleaner can hold one target.
- Warning precedes a data-driven cleaning duration. The zone remains effective and visibly changes while being cleaned, then clears once.
- Missing/expired targets cancel safely. Retry reconstructs lock and truck state.

## Cleanup Channel

- `cleanupChannel` is independent from spawn, wind, presentation, and hazard channels.
- Level 6 authors one exclusive truck event at 34 seconds remaining: five-second warning, two-second sweep delay, then deterministic creation-order clear of all active zones.
- A separate spawn-channel rush and presentation cue trigger at the same threshold without replacing cleanup state.

## Non-Goals

- Prompt 18, Level 7, new poop or NPC types, lane rerouting, cleaner pathfinding, formal art/audio, trajectory helpers, or a timed-event rewrite.

## Manual Acceptance

1. Select Level 6 and verify cleanup-day palette, signs/bins, normal and stink inventory, and fixed seed.
2. Select stink poop, charge/release, and verify a ground zone appears at the projectile landing projection.
3. Let office workers/tourists/joggers cross it and verify visible slowing, resistance differences, and one-time zone statistics.
4. Let a cleaner approach: verify warning/cleaning state before the zone clears.
5. At 34 seconds remaining verify truck warning, sweep, cleanup and spawn channels coexist once, and active zones disappear.
6. Complete or time out and inspect score, zone-control star, cleaner-hit star, and seed.
