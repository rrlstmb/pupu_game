# Phase 13 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 13, Level 2 - After-work rush.
- Dependencies: user states Prompts 00-12, Gates A/B/C, Prompt 09-11 regression, and Pre-Prompt 13 check are PASS.
- Initial worktree contained only user-owned modified evidence screenshots; they were preserved.
- Node/npm/package manager: Node `v22.22.1`, npm `9.2.0`, npm with `package-lock.json`.
- Fixed Level 2 seed: `level-02-rush-seed`.

## Targeted Evidence

- Level 2 schema, unlock, weighted roster, event threshold/latch, and jogger-hit star are covered in `tests/unit/Level02.test.ts`.
- Existing sticky strategy test proves the effect lowers speed and restores it after expiry.
- Browser flow enters Level 2, selects sticky poop, legally hits and scores a jogger, triggers the final rush once, and reaches timeout results.
- Screenshot: `docs/evidence/phase-13-level-02-rush.png`.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Existing user-owned evidence screenshot modifications preserved; source tree otherwise clean |
| `npm run test -- --run tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts tests/unit/NPCSpawner.test.ts tests/unit/PoopInventory.test.ts` | 0 | PASS | baseline | Existing phase dependencies executable |
| `npm run test -- --run tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts tests/unit/Level02.test.ts tests/unit/PoopBehaviorStrategy.test.ts` | 0 | PASS | targeted | 4 files / 19 tests |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 13 plays Level 2"` | 1 then 0 | PASS after test correction | targeted e2e | Product flow passed; first assertion incorrectly ignored elapsed real gameplay time before injected clock advance |
| `npm run verify` | 0 | PASS | full regression | lint, strict typecheck, 24 files / 119 unit tests, production build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 20/20 Chromium tests in 4.5 minutes |

The production build retains the known Vite warning that the Phaser bundle is larger than 500 kB after minification.

## State and Resource Evidence

- Level 2 session starts from `level-02-rush-seed`; the event latch is empty before 20 seconds and exactly `['final_20_second_rush']` after crossing it.
- Sticky projectile produces a legal jogger rant event, score breakdown with `sticky_poop`, and `npcHitCounts.jogger = 1`.
- Existing full e2e verifies charge meter, projectile shadow, landing hit window, retry cleanup, listener stability, and Level 1 success/timeout paths.
- Formal debug trajectory and hit-window overlays remain default-off and absent from the screenshot.

## Acceptance Comparison

- MET: Level 2 is selectable and completes through success/timeout/caught settlement infrastructure.
- MET: Evening colors are LevelDefinition data and rendered by GameScene.
- MET: office worker, phone user, and jogger weighted spawn data are present and schema validated.
- MET: sticky poop is available and its slowdown strategy remains covered by regression tests.
- MET: final rush triggers at 20 seconds remaining exactly once and replaces the spawn profile.
- MET: one star requires two jogger hits and is evaluated from immutable per-NPC hit metrics.
- MET: Level 1 remains available; its result next button enters Level 2.
- MET: Prompt 14 and Level 3 were not implemented.

## Known Limits

- Severity: Low. Evening presentation is a placeholder palette, not formal art.
- Severity: Low. Level selection has no persistence or unlock gating; those are later-phase concerns.
- Severity: Medium. Timed event precedence is latest-authored triggered event; concurrent composable event effects are deferred until required.
