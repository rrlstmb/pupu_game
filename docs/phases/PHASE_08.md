# Phase 08: Alert, Cover, Stages, and Failure

## Section

Core Loop

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 07 acceptance was declared passed by the user prompt. Codex did not mark Phase 07 as `PASS`.

## Scope

- Add pure `AlertSystem` domain logic.
- Add shared `CoverVisibility` rule for rooftop cover.
- Add data-driven alert source values, decay, stages, and risk multipliers.
- Raise alert from normal hits, repeat hits, rapid throw attempts, and exposed stationary play.
- Decay alert slowly while not throwing and faster while stopped in cover.
- Show alert value, stage, recent source, and caught warning in HUD.
- Apply alert-stage risk multiplier to score.
- Latch game over at alert 100.
- Stop gameplay update after game over.
- Add retry reset for alert, score, combo, projectiles, NPCs, hit tokens, RNG, and failure state.

## Alert Stages

- `safe`: 0-29
- `suspicious`: 30-59
- `high_alert`: 60-79
- `exposed_soon`: 80-99
- `caught`: 100

## Alert Sources

- `normal_hit`
- `rapid_throw`
- `repeat_hit`
- `stationary`
- `idle_decay`
- `cover_decay`

Recent source records are retained for HUD/debug. Tiny per-frame negative decay updates are allowed to change the value without flooding recent source records.

## Cover Rules

Cover is computed by `isPlayerInCover(playerX, coverSlots)`. It uses the existing rooftop cover slots from `WorldLayout` so future security visibility can share one rule instead of diverging.

## Failure and Retry

When alert reaches 100, `isGameOver` latches true. Gameplay update returns early, so score, combo, NPCs, projectiles, and alert stop changing.

Retry restarts the GameScene. Because Phaser reuses scene instances, Phase 08 explicitly resets runtime fields in `create()`.

## Non-Goals

- No cameras.
- No security guard NPC.
- No advanced alert sources.
- No final failure art or level settlement.
