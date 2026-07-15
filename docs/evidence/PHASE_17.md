# Phase 17 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 17 only; Prompt 18 and Level 7 were not implemented.
- Dependency: user states Prompt 16 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node 22.
- Fixed acceptance seed: `level-06-cleanup-seed`.
- Baseline targeted tests: 6 files / 28 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected unit tests | 0 | PASS | baseline | 6 files / 28 tests |
| Phase 17 targeted unit tests | 0 | PASS | targeted | 6 files / 20 tests |
| `npx playwright test --grep "phase 17 level 6"` | 0 | PASS | targeted e2e | 1/1 Chromium flow |
| `npm run lint` | 0 | PASS | regression | ESLint repository scan |
| `npm run typecheck` | 0 | PASS | regression | strict TypeScript |
| `npm run test` | 0 | PASS | regression | 32 files / 145 tests |
| `npm run build` | 0 | PASS | regression | TypeScript plus Vite production build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 24/24 Chromium tests in 5.6 minutes |
| `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Automated Evidence

- Zone tests cover landing origin, duration, pause, cap/replacement, entry dedupe, overlap, resistance, immunity, expiry, clear, and reset state.
- Cleaner tests cover nearest deterministic targeting, tie-break, warning, cleaning duration, duplicate-lock prevention, missing-target cancel, truck warning/order/clear, pause, and reset constructor.
- Level tests prove schema validity, stink unlock, cleaner weights, zone/NPC caps, three event channels coexisting once, retry event reset, and single-zone star boundaries.
- Browser flow covers Level 6 entry, stink selection/throw, zone creation, NPC effect, cleaner warning/clear, cleanup truck warning/clear, one-shot event id, screenshot, and console health.

## State and Resource Evidence

- Pause returns before zone/cleaner/truck updates; retry reconstructs environmental state, cleaner locks, session events, projectile/shadow pools, and input listeners.
- Cleared/expired zones are removed from the Phaser zone-view map and their NPC effect tokens are removed on the same gameplay update.
- Screenshot: `docs/evidence/phase-17-cleanup-day.png`.

## Acceptance Comparison

- MET: Level 6 is selectable, data driven, and settles through existing result infrastructure.
- MET: stink zones use authoritative landing projection, bounded lifetime/count, visible ground presentation, deterministic slowing, and per-zone dedupe.
- MET: cleaners warn, lock one target, clear once, and cancel missing targets safely.
- MET: cleanup truck warns, clears deterministic active zones once, and coexists with the spawn channel.
- MET: zone-control star metrics reset and do not award frame-tick score.
- MET: Levels 1-5 retain full unit/e2e regression coverage.
- MET: Prompt 18 and Level 7 remain unimplemented.

## Known Limits

- Severity: Low. Cleanup-day visuals, cleaner telegraph, and truck sweep are placeholder geometry/text.
- Severity: Medium. Cleaners lock zones already within detection radius and stop in place; deterministic approach pathfinding is deferred.
- Severity: Low. Level 6 uses strongest-slow overlap and oldest-first replacement; refresh/reject remain schema-supported for other authored definitions.
