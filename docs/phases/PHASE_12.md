# Phase 12: Level Framework and Level 1 Vertical Slice

## Scope

- Runtime-validated `LevelDefinition` schema.
- Pure LevelDirector, ObjectiveSystem, and StarEvaluation.
- One authored Level 1 with a complete menu, countdown, play, pause, success/failure, result, retry flow.
- Domain result snapshot and session-scoped event protection.
- Placeholder presentation only.

## Level 1 Data

- Id/name: `level_01`, `第一關：準時上班`.
- Duration/countdown: 90 seconds / 3 seconds.
- Seed: `level-01-seed`.
- Target score: 500.
- NPC roster: office worker only, with weighted three-lane spawn data.
- Poop inventory: normal poop only.
- Aim assist: always visible.
- Stars: score >= 500, highest combo >= 5, and accuracy strictly greater than 60%.

## Interfaces

- `validateLevelDefinition(input)` returns typed validation success or diagnostic errors.
- `loadLevelDefinition(input)` returns a valid immutable definition or throws one diagnostic load error.
- `createLevelSession`, `updateLevelSession`, `updateLevelMetrics`, `toggleLevelPause`, `failLevelCaught`, and `resetLevelSession` are pure reducers.
- `evaluateObjective` owns basic target-score completion.
- `evaluateStars` owns the three independent result conditions.
- `LevelSession.result` is the sole settlement source for total score, stars, highest combo, accuracy, hits, throws, outcome, seed, and session id.

## Event and Lifecycle Design

- Gameplay events carry `sessionId`; score consumes only events matching the active session.
- Completion has a one-way `settled` phase and `completionCount=1` latch.
- Paused sessions consume neither level delta nor GameScene combo delta.
- Retry uses Phaser scene restart but creates `attempt-N+1`, resets all runtime state, and reseeds NPC RNG from the same LevelDefinition seed.
- HUD subscribes to `LevelUpdated` and disposes exactly one listener at shutdown.

## Non-Goals

- Prompt 13 and Levels 2-10.
- Campaign selection, unlocks, persistence, or real next-level navigation.
- Formal art, animation, audio, or final responsive result UI.
- Refactoring Gate A/B physics, NPC, score, combo, or alert rules.

## Manual Acceptance

1. Start from Menu with `開始第 1 關`.
2. Observe the 3-second countdown, always-visible landing guide, office workers, normal-only inventory, target and seed.
3. Press Esc; verify time and combo freeze. Press Esc again to resume.
4. Reach 500 points for success or let 90 seconds expire below target for failure.
5. Verify result metrics and each PASS/MISS star row.
6. Select retry and verify a clean `attempt-2` with the same `level-01-seed`.
7. Select next level and verify only the unavailable placeholder appears.
