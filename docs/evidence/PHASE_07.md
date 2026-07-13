# Phase 07 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 07, score, precision, and combo system.
- Dependency: user prompt states Prompt 06 acceptance passed. Codex did not mark Phase 06 as `PASS`.
- `git status --short` before Phase 07 edits showed existing untracked Phase 00-06 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: scoring, precision grading, combo window, miss penalty, HUD display, and breakdowns only.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 41 unit tests, and build passed before Phase 07 edits |
| `npm run test -- --run tests/unit/ScoreCalculator.test.ts tests/unit/HitDetection.test.ts` | 0 | PASS | targeted | 2 files, 12 tests passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run lint` | 1 | FAIL | targeted | Inline `import()` type in `GameEvents.ts` violated lint rule |
| `npm run lint` | 0 | PASS | targeted | Lint passed after converting to `import type` |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 07"` | 1 | FAIL | targeted e2e | Initial second-hit route let combo expire before the next score event |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 07"` | 0 | PASS | targeted e2e | Same-NPC repeat hit, HUD consistency, and combo timeout passed |
| `npm run test` | 0 | PASS | regression | 11 files, 48 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |
| `npm run test:e2e` | 0 | PASS | regression e2e | 9 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 48 unit tests, and build passed |

## Test Counts

- Vitest targeted Phase 07: 2 files, 12 tests passed.
- Vitest full: 11 files, 48 tests passed.
- Playwright targeted Phase 07: 1 Chromium test passed.
- Playwright full: 9 Chromium tests passed.
- `npm run verify`: lint, typecheck, 48 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-07-score-combo-hud.png`.
- E2E interaction: menu -> GameScene -> first legal hit/rant -> score breakdown appears -> same NPC recovers -> second legal hit -> combo count reaches 2 -> wait for combo timeout -> combo returns to 0 while total score remains.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Score state is stored in GameScene and exposed via debug state.
- HUD receives score state through `score:updated`; HUD does not calculate score.
- HUD text is mirrored to debug only for browser verification.
- First score breakdown includes `eventId`, NPC id, ammo type, neutral poop adaptation, and zero special event score.
- Combo timeout uses gameplay delta and resets combo count without clearing total score.
- `Hit`, `Ranting`, and `Recovering` pause combo timer as explicit hit-stop behavior.
- Empty projectile natural recycle applies miss penalty; hit recycle does not count as a miss.

## Acceptance Comparison

- MET: Player can see score, combo count, multiplier, time window, and latest breakdown in HUD.
- MET: Same event sequence produces deterministic score in unit tests.
- MET: Combo thresholds and multipliers are data-driven in `src/data/scoreRules.ts`.
- MET: Precision grading uses impact distance, not hidden probability.
- MET: Empty throw miss subtracts configured remaining combo time instead of immediate reset.
- MET: Score is calculated from validated `NPC_RANT_STARTED` events only.
- MET: Every score creates immutable `ScoreBreakdown` data.
- MET: HUD and internal score state are checked for consistency in Playwright.
- MET: Combo timeout resets combo count and leaves total score intact.
- MET: No caught/alert, frenzy effects, or level settlement was implemented.

## Known Limitations

- Severity: Low. Impact: precision distance uses placeholder collision geometry. Planned fix: tune with final collider data.
- Severity: Low. Impact: HUD is functional placeholder text. Planned fix: replace with final HUD art/layout in UI presentation phases.
- Severity: Low. Impact: base scores are global data, not authored per level. Planned fix: connect level score goals and tuning in later level phases.
- Severity: Low. Impact: build still reports the inherited Phaser bundle chunk warning. Planned fix: consider code splitting only when bundle size becomes a release gate issue.
