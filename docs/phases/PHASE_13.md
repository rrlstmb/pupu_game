# Phase 13: Level 2 - After-work Rush

## Scope

- Add one validated, authored Level 2 definition and no later level content.
- Teach speed judgement with office workers, phone users, joggers, and normal/sticky poop.
- Apply a data-driven evening palette and a deterministic final-20-second rush event.
- Add a high-speed-target star condition and Level 1 to Level 2 navigation.

## Level Data

- Id/name: `level_02`, `第 2 關：下班尖峰`.
- Duration/countdown: 100 seconds / 3 seconds.
- Seed: `level-02-rush-seed`; target score: 850.
- NPC weights: office worker 5, phone user 3, jogger 2.
- Available poop: normal and sticky.
- Final rush: at 20 seconds remaining, interval changes from 1.05s to 0.45s, max active from 9 to 14, and jogger weight from 2 to 4.
- Stars: target score, two jogger hits, accuracy above 55%.

## Interfaces

- `LevelDefinition.visual` owns palette data used by GameScene rendering.
- `LevelDefinition.events` owns one-shot remaining-time triggers and replacement spawn profiles.
- `LevelSession.triggeredEventIds` is the deterministic event latch; `spawnConfigForLevel` selects the latest triggered profile.
- `LevelMetrics.npcHitCounts` and `npc_hit_target` provide reusable target-specific star evaluation.

## Navigation

- Menu exposes Level 1 and Level 2 buttons.
- Level 1 results advance to Level 2.
- Level 2 result keeps the next-level placeholder because Prompt 14 is out of scope.
- Retry preserves the active LevelDefinition and seed.

## Non-Goals

- Prompt 14, Level 3, persistence, or campaign locking.
- New NPC, poop, projectile, collision, charge, shadow, score, or alert mechanics.
- Formal art or audio.

## Manual Acceptance

1. Start Level 2 from the menu and verify the evening palette and three NPC types.
2. Press E to select sticky poop; hit a jogger and verify it slows and scores.
3. Play or use the debug injected clock until 20 seconds remain; verify denser, faster-weighted traffic activates once.
4. Finish by reaching 850 or timing out; verify the jogger-hit star row in results.
5. Retry and verify the seed remains `level-02-rush-seed`, event ids reset, and no runtime resources remain.
6. Return to menu and complete Level 1 to verify its next button enters Level 2.
