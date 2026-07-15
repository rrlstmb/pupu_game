# Phase 15 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 15 only; Prompt 16 and Level 5 were not implemented.
- Dependency: user states Prompt 14 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node 22.
- Fixed acceptance seed: `level-04-market-seed`.
- Baseline targeted tests: 5 files / 32 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected unit tests | 0 | PASS | baseline | 5 files / 32 tests |
| Phase 15 targeted unit tests | 0 | PASS | targeted | 5 files / 33 tests |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 15 rewards"` | 0 | PASS | targeted e2e | 1/1 |
| `npm run verify` | 0 | PASS | full regression | lint, strict typecheck, 26 files / 126 tests, build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 22/22 Chromium tests in 4.8 minutes |

## Automated Evidence

- Level 4 schema validates market palette, duration, target, seed, weighted roster, splash unlock, event, and stars.
- Splash strategy uses landing origin, radius 96, max targets 4, deterministic ordering, and per-effect dedupe tokens.
- Walking and Distracted NPCs are eligible; Recovering and Exiting NPCs are excluded.
- Feature star fails at two and passes at three targets hit by one projectile.
- Market-exit event triggers once, resets on retry, and has maxActive 15.
- Browser flow produces three legal tourist rants from one splash, updates score/combo/alert/star metric, consumes one stock, and reaches timeout results without console errors.

## State and Resource Evidence

- Controlled splash: score 581, combo 3, Alert 69, stock 2, three splash rant breakdowns, `maxSplashTargetsHit=3`.
- Exit event latch: exactly `market_exit_crowd`; active count remains at or below 15.
- Existing full regression covers Levels 1-3, sticky restore, umbrella block/jumbo crack, charge/shadow, dynamic hit window, pools/listeners, retry, pause, and failure latches.
- Screenshot: `docs/evidence/phase-15-level-04-market-splash.png`.

## Acceptance Comparison

- MET: Level 4 is selectable and settles through existing success/timeout/caught infrastructure.
- MET: Market-evening profile and crowd configuration are data-driven.
- MET: Tourist-heavy base and climax spawn profiles create crowd-waiting opportunities.
- MET: Splash unlock, radius, cap, stock, cooldown, score multiplier, and alert cost are data.
- MET: One splash legally affects multiple NPCs without duplicate target scoring.
- MET: Recovering/Exiting states are excluded and ordinary poop remains single-target.
- MET: Three-person single-splash star is data-driven and displayed in results.
- MET: Market-exit event triggers once and remains bounded.
- MET: Prompt 16 and Level 5 remain unimplemented.

## Known Limits

- Severity: Low. Market identity is a placeholder evening palette and crowd composition, without formal stall/vendor art.
- Severity: Low. Tourists use existing distracted group-friendly movement rather than a dedicated formation controller.
- Severity: Medium. Repeated splash hits across different projectiles remain legal after NPC recovery, as intended by the core repeated-hit loop.
