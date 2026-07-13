# Retro Gate A Evidence

## Conclusion

PASS for the automated technical and feel baseline. This does not mark Prompts 00-04 or any later phase as `PASS`; reviewer-controlled phase statuses remain unchanged.

## Scope

- Prompt 00: contracts, architecture, roadmap, acceptance, decisions, status, quality gates.
- Prompt 01: npm/Vite/Phaser toolchain and scene lifecycle.
- Prompt 02: canonical layout, zones, lanes, rooftop, parallax, resize behavior.
- Prompt 03: horizontal movement, input transitions, bounds, blur/visibility/pause cleanup, repeated entry.
- Prompt 04: deterministic trajectory, golden cases, aim agreement, cooldown/cap, view pool, landing/expiry/shutdown cleanup.
- Explicitly excluded: Prompt 12, Gate B, new gameplay, and changes to Prompt 05-11 rules.

## Findings and Repairs

| Severity | Initial Finding | Root Cause | Minimal Repair | Final |
|---|---|---|---|---|
| Major | Roadmap and acceptance described an obsolete phase split | Standalone summaries were not synchronized with `CODEX_PHASE_PLAN.md` V2.0 | Aligned Roadmap, Acceptance, Quality Gates, Contract, Architecture, and ADRs | MET |
| Major | Scene disposer left the untriggered shutdown/destroy counterpart registered | Two `once` hooks shared a latch but did not remove each other | Remove both hooks before invoking the disposer; add unit regression | MET |
| Major | Input did not clear on Phaser pause/resume | Adapter handled only blur and hidden-tab | Bind pause/resume clear handlers and dispose them | MET |
| Major | Phaser projectile views were destroyed, not pooled | Domain recycling existed but the display adapter had no reusable view pool | Added bounded-by-peak active/pooled view reuse and stats; destroy both collections on shutdown | MET |
| Minor | Game debug snapshot and callbacks remained visible after leaving GameScene | Optional global debug fields were only overwritten on next entry | Delete GameScene-owned debug fields during shutdown | MET |
| Minor | Scene contained throw/world tuning literals | Presentation offsets, debug wind bounds, and base parallax speed lacked typed owners | Moved values to `THROW_WORLD_CONFIG` and `WorldLayout` | MET |

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Existing repository remained entirely untracked; no files were removed |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 70 unit tests, build |
| `npx playwright test tests/e2e/app.spec.ts --grep "loads menu\|phase 02\|phase 03\|phase 04"` | 0 | PASS | baseline | 6 Chromium tests |
| `npm run test -- --run tests/unit/SceneLifecycle.test.ts tests/unit/ActionState.test.ts tests/unit/PlayerMovement.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/ProjectileSystem.test.ts` | 1 | FAIL | repair iteration | Phaser import required a Node-safe mock; 19 other tests passed |
| `npm run test -- --run tests/unit/SceneLifecycle.test.ts tests/unit/ActionState.test.ts tests/unit/PlayerMovement.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/ProjectileSystem.test.ts` | 0 | PASS | repair | 5 files, 21 tests |
| `npx playwright test tests/e2e/app.spec.ts --grep "loads menu\|phase 02\|phase 03\|phase 04\|retro Gate A"` | 1 | FAIL | repair iteration | Test assumed Phaser had only one active lifecycle listener; actual baseline was 13 |
| `npx playwright test tests/e2e/app.spec.ts --grep "retro Gate A"` | 1 | FAIL | repair iteration | Test assumed inactive Scene listeners were zero; Phaser retained a stable internal 1 shutdown/12 destroy baseline |
| `npx playwright test tests/e2e/app.spec.ts --grep "retro Gate A"` | 0 | PASS | repair | 1 test; 10 enter/exit cycles, pause, blur, pool reuse |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 72 unit tests, build |
| `npm run test:e2e` | 0 | PASS | regression | 14 Chromium tests, including Prompt 05-11 regression; 3.4 minutes |
| `npm run test -- --run tests/unit/WorldLayout.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/SceneLifecycle.test.ts` | 0 | PASS | final targeted | 4 files, 19 tests after config extraction |
| `npm run typecheck` | 0 | PASS | final targeted | strict TypeScript |
| `npm run verify` | 0 | PASS | final regression | lint, typecheck, 17 files/72 tests, build |
| `npx playwright test tests/e2e/app.spec.ts --grep "loads menu\|phase 02\|phase 03\|phase 04\|retro Gate A"` | 0 | PASS | final e2e | 7 Chromium tests; 1280x720, 1920x1080, 390x844 and lifecycle/physics flow |

The build emits the inherited warning that the minified Phaser bundle chunk exceeds 500 kB; build exit code remains 0.

## Determinism and Resource Evidence

- Fixed seed: `phase-05-seed` remains the runtime NPC seed; Prompt 04 trajectory itself uses no RNG.
- Five trajectory golden cases cover zero wind, tail wind, head wind, low gravity, and faster initial velocity.
- Prediction and simulation both call `ProjectileTrajectory.positionAt`; final browser landing error remains below the configured 4 canonical-pixel tolerance.
- Canonical world: 1280x720. Phaser `FIT` preserved a 16:9 canvas without overflow at all three required viewport sizes.
- Ten GameScene enter/exit cycles retained stable active and inactive Phaser lifecycle listener baselines; InputAdapter reported 6 owned bindings on every entry.
- Pause/resume, blur, and hidden-tab visibility change cleared held movement; the player decelerated to a stable position and did not continue moving.
- Projectile view stats showed `active=0` and `pooled>=1` after recycle, then `reused>=1` on the next throw.
- Leaving GameScene removed GameScene-owned debug state and callbacks.

## Acceptance Comparison

- MET: Prompt 00 contract documents exist and now agree with 26 prompts and Gates A-F.
- MET: lint, strict typecheck, unit tests, build, and applicable browser tests pass.
- MET: scene transition and shutdown disposal remain stable over 10 cycles.
- MET: zones, lanes, rooftop bounds, covers, player baseline, and parallax speed have typed data owners.
- MET: canonical FIT resize behavior passes 1280x720, 1920x1080, and 390x844.
- MET: player movement is horizontal-only, bounded, delta-time based, and clears held input on blur, hidden-tab logic, pause/resume, and disposal.
- MET: trajectory is deterministic, golden-tested, and shared by prediction and simulation.
- MET: aim landing and actual landing agree within configured tolerance.
- MET: projectile cooldown, maximum active count, landing/expiry recycling, view reuse, and shutdown destruction are covered.
- MET: no rule-affecting `Math.random`, wall-clock dependency, hidden hit rate, or unrecorded Foundation assumption was found.
- MET: no Prompt 12 or new gameplay was implemented.

## Manual Acceptance

1. Run `npm run dev` and open the reported localhost URL.
2. Use canonical 1280x720, then resize to 1920x1080 and 390x844-equivalent viewport sizes.
3. Enter GameScene, press `L`, and inspect the 25/45/30 zones, three lanes, rooftop bounds, and two covers.
4. Move with A/D and arrows; hold both directions; blur the window and return. Confirm no vertical movement, boundary crossing, or stuck key.
5. Hold Shift, adjust wind with `[`/`]`, and press Space. Confirm prediction shifts with wind and the projectile follows it.
6. Return to menu and re-enter repeatedly; confirm one input response per key press and no stale debug/game state.
7. Evidence image: `docs/evidence/gate-a-retro.png`.

## Non-Blocking Limits

- Chromium is the current documented browser target; Firefox/WebKit coverage is deferred until browser support is decided.
- The build chunk warning is inherited from bundling Phaser as one chunk; performance/bundle optimization belongs to Prompt 25 unless startup metrics regress earlier.
- Art and audio remain placeholders by Foundation design.
- Human feel judgment for acceleration and throw readability is still reviewer-owned even though deterministic/tolerance checks pass.
