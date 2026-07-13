# Phase 07: Score, Precision, and Combo System

## Section

Core Loop

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 06 acceptance was declared passed by the user prompt. Codex did not mark Phase 06 as `PASS`.

## Scope

- Add pure `ScoreCalculator` domain logic.
- Add data-driven score and combo rules.
- Score validated `NPC_RANT_STARTED` events.
- Produce immutable `ScoreBreakdown` entries.
- Add deterministic precision grading by hit distance.
- Add combo count, combo window, miss penalty, thresholds, and multipliers.
- Add HUD display for score, combo count, multiplier, time window, and latest breakdown.
- Keep HUD read-only; it renders score state but does not calculate score.

## Formula

`base score x poop adaptation multiplier x combo multiplier x precision multiplier x risk multiplier x repeat-hit multiplier + special event score`

Phase 07 has no special poop. Poop adaptation, risk, and special event values default to neutral values in `src/data/scoreRules.ts`.

## Combo Rules

- Base combo window: 3 seconds.
- Precision extension: 0.5 seconds for `perfect` and `clean`.
- Thresholds: 3, 6, 10, 15, 20, 30.
- Miss penalty: empty projectile landing/expiry subtracts 0.75 seconds from the remaining combo window.
- Miss penalty does not immediately reset combo unless remaining time reaches 0.
- `Hit`, `Ranting`, and `Recovering` pause combo time as the current hit-stop behavior.
- Scene pause/tab hidden stops gameplay updates and therefore does not consume combo time.

## Precision

Precision is distance based. It is deterministic and has no hidden chance.

- `perfect`: <= 10 px
- `clean`: <= 24 px
- `graze`: <= 48 px or larger fallback

## Interfaces

- `ScoreRules`
- `ScoreState`
- `ScoreEventInput`
- `ScoreBreakdown`
- `scoreRantEvent`
- `updateComboTimer`
- `applyMissPenalty`
- `precisionForDistance`
- `comboMultiplierForCount`
- `repeatMultiplierForHitCount`

## Non-Goals

- No caught/alert system.
- No frenzy mode formal effects.
- No level results or settlement screen.
- No special poop scoring behavior beyond neutral multipliers.
- No authored level score goals.
