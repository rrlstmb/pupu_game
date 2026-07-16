# Phase 18 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 18 only; Prompt 19 and Level 8 were not implemented.
- Dependency: user states Prompt 17 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node v22.22.1, npm 9.2.0.
- Fixed acceptance seed: `level-07-counterattack-seed`.
- Baseline targeted tests: 6 files / 34 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected unit tests | 0 | PASS | baseline | 6 files / 34 tests |
| Phase 18 targeted unit tests | 0 | PASS | targeted | 3 files / 19 tests |
| `npx playwright test --grep "phase 18 level 7"` | 0 | PASS | targeted e2e | 1/1 Chromium flow |
| `npm run lint` | 0 | PASS | regression | ESLint repository scan |
| `npm run typecheck` | 0 | PASS | regression | strict TypeScript |
| `npm run test` | 0 | PASS | regression | 34 files / 155 tests |
| `npm run build` | 0 | PASS | regression | TypeScript plus Vite production build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 25/25 Chromium tests in 6.1 minutes |
| `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Automated Evidence

- Domain tests cover threshold, duplicate hit rejection, one pending attack per source, telegraph-before-flight, snapshot lock, stationary hit, moved dodge, one-shot result, pause, source cancellation, queue/cap ordering, escape-space rejection, reset, and star boundaries.
- Level tests cover schema, fixed seed, angry weighting, limits, hazard/spawn/presentation channel coexistence, one-shot climax, retry reset, and dodge-star boundaries.
- Browser flow uses legal normal-poop hits to reach the threshold, captures telegraph, proves stationary Alert penalty, retries cleanly, proves keyboard dodge and no tracking, then exercises bounded multi-source climax scheduling.

## State And Resource Evidence

- Before retry: completed hit had no active instance; Alert penalty and temporary player state were recorded.
- After retry: instances 0, queue 0, telegraphed/fired/dodged/hit 0, stagger 0, throw lock 0, invulnerability 0.
- Climax observed at least two overlapping scheduled instances, never more than configured two telegraphs plus one projectile; Phaser view creation stayed at or below pool size 3.
- EventBus and input listeners continue to use the existing scene disposer; full Gate A retry/menu regression remains green.
- Screenshot: `docs/evidence/phase-18-counterattack-telegraph.png`.

## Acceptance Comparison

- MET: Level 7 is selectable, deterministic, playable, and uses an angry-heavy data roster.
- MET: legal hit threshold and hit-token dedupe own retaliation progress.
- MET: warning precedes flight and matches collision width; flight never tracks new player X.
- MET: stationary player receives Alert/stagger/throw-lock; horizontal movement produces one completed dodge.
- MET: queue, concurrency, global gap, per-source ownership, escape width, source cancellation, and pool are bounded.
- MET: hazard, spawn, and presentation climax events coexist once and reset by attempt.
- MET: retry clears all counter entities, queue, penalties, invulnerability, metrics, and views.
- MET: Levels 1-6 and production no-helper/debug-default-off rules pass full E2E regression.
- MET: Prompt 19 and Level 8 remain unimplemented.

## Known Limits

- Severity: Low. Warning, drink-can projectile, and alley props are placeholder geometry/text.
- Severity: Medium. Counter collision resolves at authored flight completion rather than swept overlap; snapshot target geometry remains authoritative.
- Severity: Low. Queue fairness is stable source-id order, not rotating fairness across long-lived NPCs.
