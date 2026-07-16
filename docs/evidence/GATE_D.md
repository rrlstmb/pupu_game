# Gate D Evidence

Date: 2026-07-17  
Status: `GATE_D_READY_FOR_REVIEW`  
Candidate conclusion: `PASS`  
Fixed seeds: all registry seeds; Boss `level-10-clean-city-boss-seed`

## Commands

| Label | Command | Exit | Result |
|---|---|---:|---|
| Clean baseline | `npm run test` | 0 | 41 files, 181 tests passed, 4.27s |
| Targeted unit | `npx vitest run tests/unit/CampaignRegistry.test.ts tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts tests/unit/Level10.test.ts tests/unit/FinalEncounterSafetyCoordinator.test.ts` | 0 | 5 files, 22 tests passed, 0.85s |
| Targeted Gate D E2E | `npx playwright test tests/e2e/gate-d.spec.ts --project=chromium` | 0 | 2 tests passed, 28.6s |
| Targeted terminal E2E | `npx playwright test tests/e2e/app.spec.ts --project=chromium --grep "phase 12 settles Level 1 success|phase 21 level 10 completes"` | 0 | 2 tests passed, 45.6s |
| Campaign-complete evidence | `npx playwright test tests/e2e/app.spec.ts --project=chromium --grep "phase 21 level 10 completes"` | 0 | 1 test passed, 33.1s |
| Lint | `npm run lint` | 0 | ESLint passed, 5.1s |
| Typecheck | `npm run typecheck` | 0 | `tsc --noEmit` passed, 3.7s |
| Full unit | `npm run test` | 0 | 42 files, 185 tests passed, 4.37s |
| Build | `npm run build` | 0 | 83 modules; build passed, 5.12s |
| Full E2E | `npm run test:e2e` | 0 | 31 tests passed, 7.7m |
| Whitespace | `git diff --check` | 0 | passed |

The first full E2E attempt was 30/31 because the new terminal assertion was inserted in the Level 1 success case. Product behavior passed; the assertion was moved to the Level 10 Boss success case, targeted cases passed, then the complete 31-test suite passed.

## Per-level Smoke

| Level | Evidence |
|---|---|
| 1 | Phase 12 timeout/retry and legal scoring success E2E |
| 2 | sticky hit and one-shot rush E2E |
| 3 | umbrella block and jumbo crack E2E |
| 4 | three-person splash and dedupe E2E |
| 5 | wind plus bounce scored hit E2E |
| 6 | stink zone, NPC slow, cleaner warning/clear E2E |
| 7 | counterattack hit/dodge and Gate D retry soak E2E |
| 8 | snapshot/recording/concealment reset E2E |
| 9 | cover/exposure/golden/blockade E2E |
| 10 | three-stage legal final golden success plus timeout/retry E2E |

## Reset Diagnostics

Five retry cycles and five menu round trips retained the exact baseline:

| Metric | Before | After retry x5 | After menu x5 |
|---|---:|---:|---:|
| Input listeners | 6 | 6 | 6 |
| Event bus listeners (score/alert/inventory/level) | 1/1/1/1 | 1/1/1/1 | 1/1/1/1 |
| Scene timers | 0 | 0 | 0 |
| NPCs / projectiles / shadows | 0/0/0 | 0/0/0 | 0/0/0 |
| Counter instances / queue | 0/0 | 0/0 | 0/0 |
| Triggered events | 0 | 0 | 0 |
| Score / Alert | 0/0 | 0/0 | 0/0 |

Level 10 failure/retry additionally restored Boss phase 1, empty interaction tokens, zero blocked stages, and final golden stock `0` before phase 3 grant. Legal phase 3 grant remained `2`, final hit count `1`, and completion count `1`.

## Reproducible Visual Evidence

- Ten-level selection: `docs/evidence/gate-d-campaign-levels.png`
- Campaign complete after legal final golden hit: `docs/evidence/gate-d-campaign-complete.png`
- Reset soak running baseline: `docs/evidence/gate-d-reset-soak.png`
- Existing Boss safety/protection evidence: `docs/evidence/phase-21-boss-protections.png`, `docs/evidence/phase-21-final-safe-space.png`

## Campaign and Boss Evidence

The Gate D route test traversed Level 1 through Level 10 using each result's next action and found no Level 11 route. The Phase 21 deterministic success E2E completed parade, media gate, umbrella gate, sticky movement gate, two blockade stages, final vulnerable window, and exactly one legal golden landing hit. The result HUD displayed `十關 Campaign 完成`. The failure E2E settled once, retried, and verified clean Boss and inventory state.

## Known Risks

- Vite emitted the non-blocking 1.68 MB chunk warning; track for Prompt 25.
- Placeholder visual quality is intentionally deferred to Prompt 22.
- No save/progression persistence exists by Gate scope.
