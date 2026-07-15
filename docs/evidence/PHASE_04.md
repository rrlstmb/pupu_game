# Phase 04 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 04, predictable trajectory, throwing, and aim assist.
- Dependency: user prompt states Prompt 03 acceptance passed. Codex did not mark Phase 03 as `PASS`.
- `git status --short` before Phase 04 edits showed existing untracked Phase 00-03 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: ordinary placeholder projectile throw only. No NPC hit, score, special poop, or formal effects.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run test -- --run tests/unit/ProjectileTrajectory.test.ts tests/unit/ProjectileSystem.test.ts` | 1 | FAIL | targeted | Initial golden expected values were hand-calculated incorrectly |
| `npm run typecheck` | 0 | PASS | targeted | TypeScript passed before scene integration |
| `npm run test -- --run tests/unit/ProjectileTrajectory.test.ts tests/unit/ProjectileSystem.test.ts` | 0 | PASS | targeted | 2 files, 11 projectile tests passed |
| `npm run lint` | 1 | FAIL | targeted | Phaser imports in projectile adapters needed `import type` |
| `npm run typecheck` | 2 | FAIL | targeted | AimAssist had an unused private scene property |
| `npm run lint` | 0 | PASS | targeted | ESLint passed after adapter cleanup |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run test` | 0 | PASS | regression | 7 files, 28 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npm run test:e2e` | 1 | FAIL | e2e | Wind prediction test read predicted landing before next update tick |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 04"` | 1 | FAIL | e2e | Landing plane semantics caused projectile not to recycle within timeout |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 04"` | 0 | PASS | e2e | Targeted Phase 04 e2e passed |
| `npm run lint` | 0 | PASS | regression | ESLint passed |
| `npm run typecheck` | 0 | PASS | regression | TypeScript passed |
| `npm run test` | 0 | PASS | regression | 7 files, 28 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npm run test:e2e` | 0 | PASS | e2e | 6 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted projectile: 2 files, 11 tests passed.
- Vitest full: 7 files, 28 tests passed.
- Playwright full: 6 Chromium tests passed.
- `npm run verify`: lint, typecheck, 28 unit tests, and build passed.

## Golden Cases

Trajectory golden cases cover:

- zero wind
- tail wind
- head wind
- lower gravity
- faster initial velocity

These are stored in `tests/unit/ProjectileTrajectory.test.ts`.

## Fixed Seed / Level

- Fixed seed: N/A.
- Level: N/A.
- Reason: Phase 04 projectile motion is deterministic and does not use RNG or level runtime.

## UI Evidence

- Screenshot: `docs/evidence/phase-04-throw-aim.png`.
- E2E interaction: menu -> GameScene -> hold Shift -> adjust wind with `]` -> Space throw -> projectile visible -> projectile recycles -> landing error is within tolerance -> release Shift.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Active projectile count after Space: 1.
- Active projectile count after landing/recycle: 0.
- Recycled projectile count increments through `ProjectileSystemState`.
- Aim assist visible while Shift is held.
- Wind debug value changes from 0 to 90 with `]`.
- Predicted landing x increases under positive wind.
- Actual landing error is below configured tolerance.

## Acceptance Comparison

- MET: Same input produces deterministic trajectory.
- MET: Prediction and simulation share trajectory functions.
- MET: Predicted landing and actual landing error stay within configured tolerance.
- MET: Cooldown prevents held throw from firing every frame.
- MET: Active projectile cap and recycle behavior are unit tested.
- MET: Space fires an ordinary placeholder projectile.
- MET: Shift toggles aim assist.
- MET: Wind debug adjustment changes predicted landing and actual trajectory together.
- MET: No hidden hit rate was introduced.
- MET: No NPC hit, special poop, score, or formal effects were implemented.

## Known Limitations

- Projectile art is a placeholder circle.
- Landing plane is a horizontal scaffold, not collision against authored world geometry.
- Wind debug is keyboard-only and intended for development.
- Vite/Playwright local server still requires escalated localhost permission in this sandbox.
- Build reports a large Phaser bundle chunk warning inherited from prior phases.

## Post-Gate C Targeted Fix

- Ground projection and visual arc were separated after manual Gate C review exposed unreliable top-lane collision.
- Current evidence and regression commands: `docs/evidence/PHASE_04_GROUND_PROJECTION_FIX.md`.

## Charged Y-Axis Throw Patch

- A subsequent manual review replaced press-to-fire diagonal throws with Space hold/release charging along the player's X.
- Production trajectory helpers are disabled; a bottom-center charge meter communicates depth power.
- Evidence and Gate C regression commands: `docs/evidence/PHASE_04_CHARGED_THROW_FIX.md`.

## Charge Meter and Distance Mapping Patch

- The meter now uses a non-zero fill geometry and exposes a tested rendered width.
- One 1%-100% domain charge value drives label, fill, target Y, apex, and duration.
- Evidence and Gate C regression commands: `docs/evidence/PHASE_04_CHARGE_MAPPING_FIX.md`.
