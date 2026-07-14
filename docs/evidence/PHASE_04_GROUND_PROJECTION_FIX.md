# Phase 04 Ground Projection Targeted Fix

## Status

READY_FOR_REVIEW

## Scope

- Prompt 04 bugfix after Gate C; no Prompt 13 or Level 2 content.
- Fixed seed/level: `level-01-seed` / `level_01`.
- No player vertical movement, formal art/audio, or broad projectile rewrite.

## Root Cause

The projectile's single `position` represented its visual ballistic arc and was used by both the Phaser sprite and `HitDetection`. At the X coordinate where a normal throw met the back/top lane, visual Y could remain far above the NPC hit area. The collision therefore depended on presentation height rather than the intended alley-plane projection.

## Repair

- A normalized `u=0..1` drives a linear ground Y projection and a separate `4 * apexHeight * u * (1-u)` visual height.
- Projectile `position`/`previousPosition` are authoritative ground projection points; `visualPosition` fields only place the Phaser view.
- Collision uses ground segments plus `collisionRadius` and never visual Y.
- Aim assist samples the same pure functions into visual and projection paths, collision point, and top-lane reach band.
- Debug projectile views distinguish visual body, connecting line, ground marker, collision radius, and existing lane hit areas.
- Existing poop visual/collision radii, pool lifecycle, bounce/split safety limits, and Level 1 rules remain intact.

## Data

`ProjectileConfig` owns `startProjectionY`, `targetProjectionY`, `apexHeight`, `travelDuration`, `collisionRadius`, `aimAssistSampleCount`, `topLaneReachPadding`, `windAffectX`, and `windAffectY`.

## Commands

| Command | Exit Code | Result | Count / Notes |
|---|---:|---|---|
| `git status --short` | 0 | PASS | Clean baseline |
| Initial projectile targeted unit tests | 0 | PASS | Baseline 3 files / 17 tests; exposed missing acceptance coverage rather than a failing existing test |
| Projection/collision/AimAssist targeted unit tests | 0 | PASS | 5 files / 25 tests |
| Top-lane targeted Playwright | 1, then 0 | PASS after test isolation | Initial target collided with schedule NPC first / final 1 test passed |
| Gate C targeted Playwright (`phase 04|phase 08|phase 12`) | 0 | PASS | 5/5 |
| First full `npm run test:e2e` | 1 | FAIL | 14/18; old sandbox timing/target assumptions exposed |
| Repaired Phase 06/07/Gate B/Phase 10 targeted reruns | 0 | PASS | 4 relevant flows pass across final isolated reruns |
| `npm run lint` | 0 | PASS | ESLint |
| `npm run typecheck` | 0 | PASS | strict TypeScript |
| `npm run test` | 0 | PASS | 20 files / 93 tests |
| `npm run build` | 0 | PASS | 55 modules; inherited bundle warning only |
| Final `npm run test:e2e` | 0 | PASS | 18/18 Chromium / 4.4 min |
| Final `npm run verify` | 0 | PASS | lint, typecheck, 93 unit tests, build |

## Regression Evidence

- Unit: projection starts at Y 500 and reaches Y 230; midpoint visual height is 190; repeated inputs are identical.
- Unit: top (250), middle (358), and bottom (463) lane NPCs are hit from ground projection while visual Y is 220 pixels higher.
- Unit: AimAssist samples exactly match runtime trajectory states and include canonical top-lane Y 250.2.
- Browser: isolated back-shop NPC receives `NPC_RANT_STARTED`, adds score, and emits no console errors.
- Browser: player remains horizontal-only and X-aligns for a recovered NPC's second hit.
- Gate C: pause freezes projectile ground and visual positions because both are advanced only by game delta.
- Gate C: timeout, caught retry, deterministic cleanup, and score-target success remain one-shot and pass.
- Updated visual evidence: `docs/evidence/phase-04-throw-aim.png`.

## Known Limits

- Low: Chromium remains the only configured Playwright browser.
- Low: Phaser production bundle still emits the inherited >500 kB warning.
- Low: projection balance values are initial data-driven defaults and remain subject to manual feel review.
