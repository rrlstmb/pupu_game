# Phase 20 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 20 only; Prompt 21, Level 10, Boss, health, and core projectile rewrites were not implemented.
- Dependency: user states Prompt 19 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node v22.22.1, npm 9.2.0.
- Fixed acceptance seed: `level-09-security-patrol-seed`.
- Baseline affected tests: 7 files / 38 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected Vitest set | 0 | PASS | baseline | 7 files / 38 tests |
| `npx vitest run tests/unit/SecuritySystem.test.ts tests/unit/Level09.test.ts` | 0 | PASS | targeted unit | 2 files / 9 tests |
| First targeted Phase 20 E2E | 1 | FAIL | regression discovery | test helper read selected slot only; no runtime defect |
| Blockade targeted E2E rerun | 1 | FAIL | regression discovery | player relocated to inclusive blocked boundary |
| Final `npx playwright test tests/e2e/app.spec.ts --grep "phase 20 level 9"` | 0 | PASS | targeted e2e | 1/1 Chromium flow |
| `npm run verify` | 0 | PASS | regression | lint + typecheck + 38 unit files / 172 tests + build |
| `npm run lint` (through verify) | 0 | PASS | regression | repository ESLint scan |
| `npm run typecheck` (through verify) | 0 | PASS | regression | strict TypeScript |
| `npm run test` (through verify) | 0 | PASS | regression | 38 files / 172 tests |
| `npm run build` (through verify) | 0 | PASS | regression | TypeScript plus Vite; 78 modules |
| First full `npm run test:e2e` | 1 | FAIL | regression discovery | 26/27; Level 1 exact reset fixture omitted new zero metrics |
| Second full `npm run test:e2e` | 1 | FAIL | regression flake audit | 26/27; existing Phase 05 `Distracted` timing observation missed its 12s window |
| `npx playwright test --grep "phase 05 spawns pooled"` | 0 | PASS | flake confirmation | 1/1 Chromium test |
| Final `npm run test:e2e -- --retries=1` | 0 | PASS | full regression e2e | 27/27 Chromium tests, no retry required in final run |
| Final `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Automated Evidence

- Security tests cover warning-before-observation, continuous threshold detection, decay, one-shot penalty, cover, throw exposure, pause/no-delta, reset, bounded deterministic searchlights, queue ownership, blockade warning, relocation, and route validation.
- Level tests cover schema, fixed seed, guard roster, searchlights, cover, rare golden stock, independent event channels, one-shot climax ids, and security/golden stars.
- Browser flow enters Level 9, observes detection progress, proves cover decay and throw exposure, consumes and legally scores the sole golden shot, activates the blockade, verifies deterministic relocation outside the blocked interval, captures evidence, and retries to clean state.

## State And Resource Evidence

- Before retry: security instances are bounded by one guard view and two searchlights; golden stock is zero after one legal use; blockade interval is `[900,1178]`; player is relocated to `899` when necessary.
- After retry: throw exposure 0, throw lock 0, security invulnerability 0, blockade inactive, golden stock 1; scene-owned active/pooled security views are rebuilt and old views disposed.
- Event/listener/timer evidence: Security uses frame delta rather than Phaser timers; scene disposer removes the adapter and existing lifecycle regression verifies stable input/event listener counts.
- Screenshot: `docs/evidence/phase-20-security-blockade.png`.

## Acceptance Comparison

- MET: Level 9 is selectable, data-driven, deterministic, and settleable through the existing LevelDirector.
- MET: guards and staggered searchlights use authoritative canonical intervals with readable warnings and matching placeholder visuals.
- MET: typed cover blocks configured sources; throw exposure temporarily removes cover benefit and shows `EXPOSED` without changing throws.
- MET: detection adds Alert only at threshold and each observation can punish once; no health system was added.
- MET: golden poop has one-shot authored inventory, legal-hit-only metrics, existing trajectory/shadow/hit rules, high value, cooldown, and Alert tradeoff.
- MET: blockade warns, activates once, cannot retain the player in its interval, and leaves movement, cover, and throw space.
- MET: security and blockade channels coexist with spawn and presentation without replacing prior channels.
- MET: Levels 1-8 and production no-helper/debug-hidden behavior pass the final 27/27 full Chromium regression.

## Known Limits

- Severity: Low. Guard/searchlight/cover/blockade art is placeholder geometry and text.
- Severity: Medium. Occlusion is an authored one-dimensional rooftop interval model, not full ray casting; this is intentional for horizontal-only movement.
- Severity: Low. Guard patrol presentation uses deterministic authored observation points rather than a continuous rooftop guard avatar path.
- Severity: Low. Build retains the existing Vite chunk-size warning.
