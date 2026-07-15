# Phase 16 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 16 only; Prompt 17 and Level 6 were not implemented.
- Dependency: user states Prompt 15 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node 22.
- Fixed acceptance seed: `level-05-headwind-seed`.
- Baseline targeted tests: 8 files / 36 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected unit tests | 0 | PASS | baseline | 8 files / 36 tests |
| Phase 16 targeted unit tests | 0 | PASS | targeted | 6 files / 29 tests after regression fixes |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 16 exposes" --repeat-each=2 --workers=1` | 0 | PASS | targeted e2e | 2/2 sequential repetitions |
| `npm run verify` | 0 | PASS | full regression | lint, strict typecheck, 29 files / 136 tests, build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 23/23 Chromium tests in 5.2 minutes |
| `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Automated Evidence

- Wind tests cover calm/left/right sign, strength ordering, warning timing, deterministic resolution, target-Y independence, clamp, and reset state.
- Event tests prove wind and spawn channels activate simultaneously, select deterministically, reset, and trigger once.
- Bounce tests cover legal/illegal surfaces, one-bounce cap, legacy normal-poop exclusion, landing, hit tag, and single recycle token.
- Browser flow covers warning UI, wind-biased normal projectile/shadow, bounce, legal rant/score, combined climax, bounded NPCs, settlement, and console errors.

## State and Resource Evidence

- Projectile visual and shadow read the same pure projectile state; landing collision reads `landedAt` from that state.
- Scene pause returns before projectile/NPC/wind updates; retry rebuilds WindState, projectile/shadow pools, session event ids, and input listeners.
- Screenshot: `docs/evidence/phase-16-level-05-wind-bounce.png`.

## Acceptance Comparison

- MET: Level 5 is selectable and settles through existing result infrastructure.
- MET: authored deterministic wind is visible before throws and does not alter charge-to-target Y.
- MET: bouncy poop uses a visible data-driven sign, bounces at most once, and scores only through legal rant flow.
- MET: spawn and wind climax channels coexist and trigger once.
- MET: Levels 1-4 retain their existing regression coverage.
- MET: Prompt 17 and Level 6 remain unimplemented.

## Known Limits

- Severity: Low. Wind presentation uses placeholder streaks and text rather than formal animated assets.
- Severity: Low. Bounce collision is evaluated at the authored projection endpoint; continuous mid-flight surface intersection remains future work.
- Severity: Medium. Event schema validates `merge` and `exclusive`, but Prompt 16 only executes deterministic priority-based `replace`.
