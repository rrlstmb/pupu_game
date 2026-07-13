# Phase 08 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 08, alert, cover, stages, and failure.
- Dependency: user prompt states Prompt 07 acceptance passed. Codex did not mark Phase 07 as `PASS`.
- `git status --short` before Phase 08 edits showed existing untracked Phase 00-07 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: alert, cover decay, risk multiplier, caught failure latch, and retry reset only.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 48 unit tests, and build passed before Phase 08 edits |
| `npm run test -- --run tests/unit/AlertSystem.test.ts tests/unit/ScoreCalculator.test.ts` | 1 | FAIL | targeted | Initial risk multiplier expectation used alert 28, below suspicious threshold |
| `npm run test -- --run tests/unit/AlertSystem.test.ts tests/unit/ScoreCalculator.test.ts` | 0 | PASS | targeted | 2 files, 15 tests passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 08"` | 1 | FAIL | targeted e2e | Recent source was flooded by per-frame decay/stationary records |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 08"` | 1 | FAIL | targeted e2e | Retry exposed Phaser scene instance field reset bug |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 08"` | 0 | PASS | targeted e2e | Alert raise/cover decay/caught/retry reset passed |
| `npm run test` | 0 | PASS | regression | 12 files, 56 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |
| `npm run test:e2e` | 1 | FAIL | regression e2e | Alert HUD initially overlapped existing return-menu click target; Phase 07 combo timeout needed longer after hit-stop changes |
| `npx playwright test tests/e2e/app.spec.ts -g "loads menu|phase 03|phase 07"` | 0 | PASS | targeted regression | Previously failed menu, Phase 03, and Phase 07 checks passed |
| `npm run test:e2e` | 0 | PASS | regression e2e | 10 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 56 unit tests, and build passed |

## Test Counts

- Vitest targeted Phase 08: 2 files, 15 tests passed.
- Vitest full: 12 files, 56 tests passed.
- Playwright targeted Phase 08: 1 Chromium test passed.
- Playwright full: 10 Chromium tests passed.
- `npm run verify`: lint, typecheck, 56 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-08-alert-failure-retry.png`.
- E2E interaction: menu -> GameScene -> rapid throws raise alert -> move into left cover -> alert decays -> rapid throws/hits reach alert 100 -> caught text appears -> click HUD alert retry -> runtime state resets.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Alert reaches `caught` at 100 and `isGameOver` becomes true.
- After game over, extra throw input does not change score.
- Retry resets alert value to 0.
- Retry resets score total and combo to 0.
- Retry leaves active projectiles at 0.
- Retry reinitializes NPC spawner; first immediate spawn is clean and not a leftover pre-failure NPC.
- Retry resets hit tokens, gameplay event log, RNG, and failure state through GameScene `create()` initialization.
- Alert HUD moved below the return-menu click target to avoid blocking earlier flows.

## Acceptance Comparison

- MET: Player can lower alert by stopping and hiding in cover.
- MET: High alert risk multiplier is visible in score breakdown as `risk x1.7` near caught state.
- MET: Failure at alert 100 latches `isGameOver` and stops score changes.
- MET: Retry resets alert, combo, projectiles, NPCs, and runtime state.
- MET: Alert state records recent increase/decrease sources.
- MET: Cover check uses shared `CoverVisibility` and existing rooftop cover slots.
- MET: No camera, security guard, or advanced alert source was implemented.

## Known Limitations

- Severity: Low. Impact: failure presentation is functional HUD text plus retry, not final art. Planned fix: presentation/failure screen phase.
- Severity: Low. Impact: cover is x-range based and does not yet model line-of-sight geometry beyond cover membership. Planned fix: future security visibility phase.
- Severity: Low. Impact: alert tuning is global, not level-authored. Planned fix: level data integration phase.
- Severity: Low. Impact: build still reports the inherited Phaser bundle chunk warning. Planned fix: consider code splitting only when bundle size becomes a release gate issue.
