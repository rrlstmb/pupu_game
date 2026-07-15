# Phase 14 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 14 only; Prompt 15 and Level 4 were not implemented.
- Dependency: user states Prompt 13 Regression PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node 22.
- Fixed acceptance seed: `level-03-umbrella-seed`.
- Baseline targeted command: 5 files / 32 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `npm run test -- --run tests/unit/Level02.test.ts tests/unit/LevelDirector.test.ts tests/unit/NPCInteractionMatrix.test.ts tests/unit/HitDetection.test.ts tests/unit/PoopInventory.test.ts` | 0 | PASS | baseline | 5 files / 32 tests |
| `npm run test -- --run tests/unit/Level03.test.ts tests/unit/NPCInteractionMatrix.test.ts tests/unit/LevelDefinition.test.ts tests/unit/LevelDirector.test.ts tests/unit/HitDetection.test.ts` | 0 | PASS | targeted | 5 files / 33 tests |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 14 teaches"` | 1, 1, then 0 | PASS after test repair | targeted e2e | First wait ignored jumbo global cooldown; second helper excluded non-legacy NPC rants; gameplay succeeded in both diagnostic runs |
| `npm run verify` | 0 | PASS | full regression | lint, strict typecheck, 25 files / 122 tests, build |
| `npm run test:e2e` | 0 | PASS | full regression e2e | 21/21 Chromium tests in 4.9 minutes |
| Final targeted Level 3 rerun | 0 | PASS | visual evidence | 1/1; block label screenshot inspected without Canvas artifacts |

The production build retains the known Vite warning for the Phaser bundle over 500 kB.

## Automated Evidence

- Level 3 schema validates rain, weighted umbrella roster, jumbo unlock, timed group, target score, duration, seed, and stars.
- Normal poop produces one `PROJECTILE_BLOCKED`, leaves the umbrella NPC at zero valid hits, recycles, and cannot create rant score.
- Jumbo and one-bounce bouncy projectiles remain legal umbrella cracks; Level 3 only exposes jumbo.
- Interaction star ignores block tags and passes only at three `umbrella_crack` events.
- Climax event triggers once, switches to umbrella-only spawn data, remains max-active bounded, and resets on retry.
- Browser evidence verifies normal block/zero score, jumbo rant/score/stock cost, rain, climax, timeout result, and no console errors.

## State and Resource Evidence

- Blocked normal throw: score 0, hit count 0, alert source `npc_danger +4`, projectile recycled.
- Jumbo crack: score 309 in fixed scenario, one `umbrella_crack`, stock decreases from 2 to 1, alert reflects jumbo plus interaction cost.
- Climax latch: exactly `matching_company_umbrella_group`; spawned roster is umbrella-only and does not exceed 14.
- Existing full e2e passes Level 1 and Level 2 flows, sticky slowdown, charge/shadow cleanup, LandingHitWindow, pools, listeners, pause, retry, and failure latches.
- Screenshots: `docs/evidence/phase-14-umbrella-block.png`, `docs/evidence/phase-14-level-03-umbrella.png`.

## Acceptance Comparison

- MET: Level 3 is selectable and can settle through existing success/timeout/caught infrastructure.
- MET: Rain profile and streak parameters are validated data and do not obscure HUD or landing regions.
- MET: Umbrella pedestrians dominate base spawn and exclusively populate the one-shot climax.
- MET: Jumbo is available with stock 2, 1.4-second cooldown, slower physics, and alert cost 12.
- MET: Normal poop block has explicit feedback, no effective hit, no rant, and no score.
- MET: Jumbo cracks umbrella defense and creates a legal hit, rant, score, interaction metric, and stock cost.
- MET: Legal bouncy crack behavior remains covered but bouncy is not unlocked in Level 3.
- MET: Umbrella-crack star is data-driven and visible in result rows.
- MET: Level 1 and Level 2 full browser regressions pass.
- MET: Prompt 15 and Level 4 remain unimplemented.

## Known Limits

- Severity: Low. Rain is static placeholder streak presentation without formal animation/audio.
- Severity: Low. Block feedback is a transient 900ms text label, pending polish phases.
- Severity: Medium. Timed level events still use latest-triggered spawn-profile precedence; concurrent composable events remain deferred.
