# Gate D - Ten-level Campaign Integration and Content Lock

## Scope and Result

Gate D audits Prompt 00-21 as one campaign. It adds no level, NPC, poop, hazard, art, audio, persistence, or Prompt 22 work. Candidate result: **PASS**, pending reviewer approval. Repository status is `GATE_D_READY_FOR_REVIEW`; Codex did not mark this gate `PASS`.

## Campaign Path

`CAMPAIGN_LEVELS` is the single ordered registry for menu entries and result routing:

`level_01 -> level_02 -> level_03 -> level_04 -> level_05 -> level_06 -> level_07 -> level_08 -> level_09 -> level_10 -> Campaign complete`

Level 10 failure exposes retry and menu return. Level 10 legal Boss success shows `十關 Campaign 完成` and has no Level 11 route.

## Ten-level Acceptance Matrix

| Level | Core content | Enter | Success / failure | Retry / menu | Result / next | Regression |
|---|---|---|---|---|---|---|
| 1 | normal charge, landing hit, caught/timeout | PASS | PASS | PASS | PASS -> 2 | PASS |
| 2 | sticky, fast target, final rush | PASS | PASS | PASS | PASS -> 3 | PASS |
| 3 | umbrella block, jumbo crack | PASS | PASS | PASS | PASS -> 4 | PASS |
| 4 | splash crowd multi-hit/dedupe | PASS | PASS | PASS | PASS -> 5 | PASS |
| 5 | deterministic wind, bounce surface | PASS | PASS | PASS | PASS -> 6 | PASS |
| 6 | stink zone, cleaner, truck cleanup | PASS | PASS | PASS | PASS -> 7 | PASS |
| 7 | angry counter telegraph/dodge/safety | PASS | PASS | PASS | PASS -> 8 | PASS |
| 8 | snapshot, recording, exposure, concealment | PASS | PASS | PASS | PASS -> 9 | PASS |
| 9 | guards, searchlight, cover, golden, blockade | PASS | PASS | PASS | PASS -> 10 | PASS |
| 10 | parade, three Boss phases, final golden | PASS | PASS | PASS | Campaign complete | PASS |

All definitions validate, use non-empty fixed seeds, contain exactly three valid star conditions, and trigger authored timed events once.

## Poop Behavior Matrix

| Type | Campaign role | Isolation and reset result |
|---|---|---|
| Normal | low-cost single target | no tactical capability leakage; PASS |
| Sticky | fast-target/Boss movement control | refreshes bounded slow, restores base speed; PASS |
| Jumbo | umbrella defense break | authored stock/cooldown/alert/travel cost; PASS |
| Splash | bounded crowd hit | landing-origin multi-hit and effect-token dedupe; PASS |
| Bouncy | tagged-surface skill shot | one bounce, visual/shadow/collision remain aligned; PASS |
| Stink | bounded area control | lifetime/cap/cleanup and NPC-zone dedupe; PASS |
| Split | bounded child projectiles | generation/global projectile caps; PASS |
| Golden | rare high-value/final interaction | Level 9 stock and Level 10 encounter inventory remain session-scoped; PASS |

## NPC Interaction Matrix

All authored spawn profiles reference registered definitions. Office workers, phone users, joggers, umbrella pedestrians, tourists, cleaners, angry pedestrians, photographers, streamers, guards, and Boss entourage appear only through level data. Recovering/Exiting legality, world-size landing tolerance, lane restraint, interaction-token dedupe, and pending cleaner/counter/surveillance/security/Boss reset are covered by the unit and E2E suite.

## Event Channels

`spawnChannel`, `windChannel`, `cleanupChannel`, `hazardChannel`, `surveillanceChannel`, `securityChannel`, `blockadeChannel`, `presentationChannel`, and `bossChannel` validate independently. Within a channel, priority then authored order is deterministic. Trigger IDs are one-shot per `LevelSession`; retries create a new attempt ID and empty triggered set. Cross-channel state is not replaced.

## Cross-hazard Safety

Levels 7-9 retain their domain safe-space checks for counterattack, surveillance, security, cover, and blockade. Level 10 routes combined blocked, surveillance, security, searchlight, and Boss-hit intervals through `FinalEncounterSafetyCoordinator`. Existing tests prove reachable, safe, throw, and Boss-hit widths remain available; the full Boss E2E reaches the legal final hit.

## Reset and Soak

Gate D performed five Level 7 retries and five menu round trips. Each running-state baseline remained: input listeners `6`; event bus score/alert/inventory/level listeners `1/1/1/1`; Phaser scene timers `0`; NPC/projectile/shadow/counter instances/counter queue `0`; triggered event IDs `0`; score `0`; alert `0`; selected inventory slot reset. Existing E2E also covers ten scene entries and Level 10 failure/retry inventory/Boss reset.

## Performance Baseline

- Highest authored simultaneous NPC cap: `17` (Level 10 parade).
- Normal projectile cap: `6`; split projectile cap: `12`; global active projectile cap: `18`.
- Shadow ownership: one per active projectile, pooled with projectile views.
- Active stink zones: `3` in authored Levels 6 and 10; global fallback cap `6`.
- Counterattack: 1 telegraph and 1 projectile, pool `3` in Level 7.
- Surveillance: at most 1 snapshot plus 1 recording active; view pool `4`.
- Security: Level 9 max 1 guard view and 2 searchlights, view pool `5`; Level 10 uses 1/1, pool `4`.
- Level 10 hazard concurrency budget: `3`.
- No entity/listener/timer/queue growth was observed in the Gate D soak or 31-test browser regression.

## Known Limitations

- Production JS is `1,683.00 kB` (`392.26 kB` gzip), so Vite emits the expected >500 kB chunk warning. This is a Prompt 25 release/performance risk, not a Gate D blocker.
- Campaign progression is session-local; persistence remains intentionally outside Gate D.
- Placeholder presentation remains for Prompt 22 polish.

## Prompt 22 Readiness

**YES, candidate pending reviewer approval.** Gate D automation and acceptance are complete, no blockers remain, and Prompt 22 was not executed.
