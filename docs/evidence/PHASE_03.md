# Phase 03 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 03, player horizontal movement and input abstraction.
- Dependency: user prompt states Prompt 02 acceptance passed. Codex did not mark Phase 02 as `PASS`.
- `git status --short` before Phase 03 edits showed existing untracked Phase 00/01/02 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: player horizontal movement only. No throw, collision, NPC, scoring, or level content.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run test -- --run tests/unit/ActionState.test.ts tests/unit/PlayerMovement.test.ts` | 0 | PASS | targeted | 2 files, 8 tests passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run test` | 0 | PASS | regression | 5 files, 17 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npm run test:e2e` | 0 | PASS | e2e | 5 Chromium tests passed, including keyboard movement and listener count |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted: 2 files, 8 tests passed.
- Vitest full: 5 files, 17 tests passed.
- Playwright: 5 Chromium tests passed.
- `npm run verify`: lint, typecheck, 17 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: N/A.
- Level: N/A.
- Reason: Phase 03 has deterministic movement and no RNG, spawn rules, or level runtime.

## UI Evidence

- Screenshot: `docs/evidence/phase-03-player-move.png`.
- E2E interaction: menu -> GameScene -> hold D -> hold A to left bound -> hold A+D -> hold Shift -> return menu -> re-enter GameScene.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Initial active scene after start: `GameScene` and `HUDScene`.
- Player debug state exposed through `window.__SHIMING_BIDA_DEBUG__.player`.
- Input listener count on first GameScene entry: 4.
- Input listener count after returning to menu and re-entering GameScene: 4.
- Unit tests verify `pressed`, `held`, `released`, held non-repeat, blur clear, neutral A+D intent, acceleration, deceleration, bounds, FPS tolerance, and nervous state.

## Acceptance Comparison

- MET: Player only moves horizontally.
- MET: Keyboard supports A/D and ArrowLeft/ArrowRight through InputAdapter.
- MET: Player cannot cross rooftop movement bounds.
- MET: Simultaneous left and right input resolves to neutral.
- MET: Movement uses delta seconds and passes 30 FPS vs 60 FPS tolerance.
- MET: Movement parameters are adjustable in `src/data/playerMovement.ts`.
- MET: Input state distinguishes `pressed`, `held`, and `released`.
- MET: Held throw action does not repeat `pressed` every frame in unit tests.
- MET: Re-entering GameScene does not increase input listener count.
- MET: No throwing, collision, or final mobile UI was implemented.

## Known Limitations

- Touch input has an adapter-ready action model but no final mobile UI.
- Placeholder player states are color/text blocks, not final animation.
- Vite/Playwright local server still requires escalated localhost permission in this sandbox.
- Build reports a large Phaser bundle chunk warning inherited from prior phases.
