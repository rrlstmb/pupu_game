# Phase 21 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 21 only; Prompt 22, Level 11, persistence, health, formal assets, and core-system rewrites were omitted.
- Dependency: user states Prompt 20 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node v22.22.1, npm 9.2.0.
- Fixed acceptance seed: `level-10-clean-city-boss-seed`.
- Baseline affected tests: 8 files / 50 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected Vitest set | 0 | PASS | targeted baseline | 8 files / 50 tests |
| `npx vitest run tests/unit/Level10.test.ts tests/unit/BossPhaseStateMachine.test.ts tests/unit/FinalEncounterSafetyCoordinator.test.ts` | 0 | PASS | targeted unit | 3 files / 9 tests |
| `npx vitest run tests/unit/LevelDirector.test.ts tests/unit/BossPhaseStateMachine.test.ts tests/unit/Level10.test.ts tests/unit/FinalEncounterSafetyCoordinator.test.ts` | 0 | PASS | targeted regression | 4 files / 18 tests |
| Initial Phase 21 success E2E iterations | 1 | FAIL | regression discovery | corrected transition observation timing, surveillance telegraph observation, and cross-process Space-hold overshoot in the test controller |
| Final Phase 21 success E2E | 0 | PASS | targeted e2e | 1/1 Chromium deterministic success flow |
| Phase 21 failure/retry E2E | 0 | PASS | targeted e2e | 1/1 Chromium timeout/reset flow |
| `npm run lint` | 0 | PASS | full static regression | repository ESLint scan |
| `npm run typecheck` | 0 | PASS | full static regression | strict TypeScript |
| `npm run test` | 0 | PASS | full unit regression | 41 files / 181 tests |
| `npm run build` | 0 | PASS | production build | 82 modules; existing chunk-size warning only |
| First `npm run test:e2e` | 1 | FAIL | fixture discovery | 28/29; Level 1 exact reset fixture omitted new zero-valued Boss metrics |
| Targeted Level 1 reset E2E | 0 | PASS | targeted regression | 1/1 Chromium test |
| Final `npm run test:e2e` | 0 | PASS | full browser regression | 29/29 Chromium tests |
| `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Deterministic Encounter Evidence

- Transition tokens are encounter/session scoped and append once for parade start, phase-one completion, Boss arrival, protection completion, and rooftop entry.
- The successful browser path uses a legal active-camera interruption, authoritative jumbo landing, authoritative sticky landing, two warned blockade stages, one final-window opening, and one legal golden landing hit.
- Screenshots:
  - `docs/evidence/phase-21-boss-protections.png`
  - `docs/evidence/phase-21-final-safe-space.png`
  - `docs/evidence/phase-21-final-golden-hit.png`

## Safety And Reset Evidence

- Third-stage authored blockades leave a continuous interval from 245 to 930, meeting reachable, safe, throw, and Boss-hit width requirements.
- Before retry after failure: LevelSession is settled once and the attempt-scoped Boss state is terminal.
- After retry: phase starts clean at phase 1; protections return to initial active/locked states; blocked stage count, interaction tokens, final grants/stock, completion/failure counts are zero; input listeners remain six.
- Domain clocks use frame delta. Existing scene disposers clear Phaser adapters/listeners; Boss views and blockade views are destroyed on shutdown.

## Known Limits

- Placeholder Boss, blockade, and status presentation only; no formal cinematic, audio, or commercial art.
- Boss movement is deterministic bounded ping-pong presentation rather than a fully animated dash choreography.
- Cross-hazard safety is centralized for the final stage only; earlier level hazard systems retain their accepted local coordinators.
