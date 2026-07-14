# Gate C Evidence

## Status

READY_FOR_REVIEW

## Scope

- Audited the playable vertical slice formed by Prompts 00-12.
- Did not implement Prompt 13, Level 2-10, formal art, or audio.
- Fixed only Gate C data ownership and regression-evidence gaps.
- Fixed seed: `level-01-seed`.

## Initial Findings and Repairs

1. FAIL: `GameScene` directly read `LEVEL_01` for session, arsenal, aim assist, and spawn values.
   Root cause: Phase 12 integrated the first definition before adding a scene-entry data boundary.
   Minimal repair: Menu passes a validated definition; GameScene consumes its active definition.
2. FAIL: Scene assembled the level spawn config instead of obtaining the projection from `LevelDirector`.
   Root cause: authored data and runtime spawner data had no explicit adapter.
   Minimal repair: pure `spawnConfigForLevel` projection plus unit coverage.
3. FAIL: `targetScore` could disagree with the score star threshold.
   Root cause: schema validated both values independently but not their relationship.
   Minimal repair: reject inconsistent definitions plus regression coverage.
4. Evidence gap: pause and menu re-entry tests did not directly assert every Gate C resource.
   Minimal repair: browser regression now compares level/combo, NPC state, projectile position/age, alert, input handlers, EventBus listeners, and stale debug state.

## Commands

| Command | Exit Code | Result | Count / Notes |
|---|---:|---|---|
| `git status --short` | 0 | PASS | Clean baseline |
| `npm run test -- --run tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts` | 0 | PASS | Baseline: 2 files / 11 tests |
| Same targeted unit command after repair | 0 | PASS | Regression: 2 files / 13 tests |
| `npx playwright test tests/e2e/app.spec.ts --project=chromium --grep "phase 12 runs Level 1"` | 0 | PASS | Regression: 1 test / 20.0 s |
| `npm run lint` | 0 | PASS | ESLint |
| `npm run typecheck` | 0 | PASS | TypeScript strict, no emit |
| `npm run test` | 0 | PASS | 19 files / 89 tests |
| `npm run build` | 0 | PASS | 54 modules; inherited bundle-size warning only |
| `npm run test:e2e` | 0 | PASS | 17/17 Chromium / 4.2 min |

## Gate C Acceptance

- MET A: Menu enters Level 1, validated definition and seed load, countdown runs, and the 90-second clock begins afterward.
- MET B: Level 1 data defines 90 seconds, office workers, normal poop, always-on aim assist, score target, and spawn schedule without scene literals.
- MET C: Browser tests cover movement, deterministic throw, hit, rant, score, combo, alert, recovery, repeat decisions, and settlement.
- MET D: Success, timeout, and caught outcomes latch once; immutable results contain score, stars, combo, accuracy, hits, throws, and seed; all star rows render PASS/MISS.
- MET E: Pause freezes level/combo/NPC/projectile/alert state; retry clears session resources and reproduces the first spawn; menu re-entry preserves listener counts.
- MET F: schema, domain, lifecycle, pool, integration, and full browser suites pass after repair.

## Resource Evidence

- Pause snapshot remained identical for level time, combo time, NPC runtime fields, projectile position/age, and alert over 800 ms.
- Retry starts with zero NPCs, projectiles, combo, alert, hit tokens, and gameplay events.
- Retry preserves seed while changing attempt id and reproducing first NPC type/lane.
- InputAdapter, GameScene lifecycle, and EventBus listener counts remain stable across retry and menu re-entry.
- Existing reproducible screenshots: `docs/evidence/phase-12-level-01-results.png` and `docs/evidence/phase-12-level-01-success.png`.

## Known Limits

- Low: placeholder presentation remains intentional; no formal art or audio was added.
- Low: Playwright currently targets Chromium only.
- Low: production build emits the inherited Phaser bundle warning above 500 kB.
- Medium: session ids are local deterministic attempt ids, not persistence-safe global run ids; persistence is outside Gate C.
- Low: manual balance over a natural 90-second playthrough remains reviewer-owned; automated timeout uses the injected game clock.
