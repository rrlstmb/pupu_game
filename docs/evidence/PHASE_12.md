# Phase 12 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 12, level framework and Level 1 vertical slice.
- Dependencies: user states Prompts 00-11, Retro Gates A/B, and Prompt 09-11 regression are complete/PASS.
- Initial worktree: clean.
- Node: `v22.22.1`; npm: `9.2.0`; package manager/lockfile: npm / `package-lock.json`.
- Baseline `npm run verify`: exit 0, 17 files/76 tests, lint, typecheck, and build passed.
- Fixed Level 1 seed: `level-01-seed`.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Clean worktree |
| `npm run verify` | 0 | PASS | baseline | 17 files/76 tests plus lint, typecheck, build |
| `npm run test -- --run tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts` | 0 | PASS | targeted | 2 files/11 tests |
| `npm run typecheck` | 1 | FAIL | implementation iteration | Obsolete GameScene failure-overlay method became unused after domain result UI replaced it |
| `npm run typecheck`, `npm run lint`, targeted level/hit/matrix unit tests | 0 | PASS | targeted regression | 4 files/21 tests in the targeted unit run |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 12"` | 1 | FAIL | e2e iteration | First combined shell web server did not start; independent rerun reached the test and exposed a pre-pause sampling race |
| Phase 12 timeout/retry e2e after snapshot repair | 0 | PASS | targeted e2e | 1 test |
| Gate A/B and Prompt 05-11 targeted e2e | 1 | FAIL | compatibility iteration | Old tests sent input during countdown or assumed full arsenal in authored Level 1 |
| Prompt 05-09/Gate B targeted rerun | 1 | FAIL | compatibility iteration | 5 passed/1 failed because score success ended the isolated caught test first |
| Phase 08 isolated reruns | 1 then 0 | PASS after repair | compatibility | Isolated alert test moved out of cover and removed targets before rapid throws |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 12"` | 1 then 0 | PASS after repair | targeted e2e | Success flow corrected an invalid 100%-accuracy test assumption; legal scoring still reached target |
| `npm run verify` | 0 | PASS | regression | lint, strict typecheck, 19 files/87 tests, build |
| `npm run test:e2e` | 0 | PASS | regression e2e | 17/17 Chromium tests, 4.0 minutes |
| Strengthened nonzero-combo pause e2e | 0 | PASS | final targeted | 1 test, level and combo clocks unchanged over 800ms pause |

The build succeeds with the inherited warning that the minified Phaser bundle exceeds 500 kB.

## Automated Coverage

- Schema accepts Level 1 and rejects missing/invalid fields with diagnostic errors.
- Countdown completes without consuming the 90-second play clock.
- Timeout below target, score-target success, and caught failure settle exactly once.
- Pause freezes the level director and GameScene combo clock.
- Accuracy is zero for zero throws and must be strictly greater than 60% for its star.
- Reset clears metrics/result, increments attempt id, preserves seed, and restores 90 seconds.
- Browser timeout path renders result, three MISS rows, and retries cleanly.
- Browser success path reaches 500 through legal normal-poop rant scoring and renders success once.

## State and Resource Evidence

- Before/after retry: NPCs 0 at countdown start, projectiles 0, combo 0, alert 0, hit tokens 0, gameplay events 0.
- InputAdapter, GameScene lifecycle, and EventBus listener counts remain unchanged across retry; EventBus has one score, alert, inventory, and level subscriber.
- Retry changes session id from attempt 1 to attempt 2 while preserving `level-01-seed`.
- First post-countdown spawn repeats the same NPC type/lane under the same seed.
- Every runtime gameplay event includes the active session id; stale-session score events are rejected by GameScene.
- Screenshots: `docs/evidence/phase-12-level-01-results.png` and `docs/evidence/phase-12-level-01-success.png`.

## Acceptance Comparison

- MET: Level 1 is playable from menu through success or timeout/caught result and retry.
- MET: Duration and score target are LevelDefinition data, not Scene literals.
- MET: Three star conditions render individual PASS/MISS rows.
- MET: Success/failure settlement is latched once.
- MET: Esc pause consumes neither level time nor nonzero combo time.
- MET: Retry clears NPC, projectile, combo, alert, timers, effects, tokens, events, and preserves listener counts.
- MET: Same-seed retry reproduces the first spawn and displays seed in HUD/result/debug.
- MET: Runtime schema validation prevents silent undefined configuration.
- MET: Result metrics come from immutable domain session snapshot.
- MET: lint, typecheck, 87 unit tests, build, and 17 browser tests pass.
- MET: Prompt 13 and Levels 2-10 were not implemented.

## Known Limits

- Severity: Low. Result and countdown presentation use placeholder text/panels with no formal audio or animation.
- Severity: Low. Chromium is the only configured browser target.
- Severity: Low. Next Level is intentionally a non-navigating placeholder until Prompt 13.
- Severity: Medium. Session ids are deterministic per local attempt and are not persistence-safe global run ids; persistence is out of Phase 12 scope.
- Severity: Low. Full 90-second manual feel/balance remains reviewer-owned; automated timeout uses the injected game clock.
