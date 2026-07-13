# Phase 09 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 09, first tactical poop types.
- Dependency: user prompt states Prompt 08 acceptance passed. Codex did not mark Phase 08 as `PASS`.
- `git status --short` before Phase 09 edits showed existing untracked Phase 00-08 project files; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: normal, sticky, splash, and jumbo poop inventory/effects only.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 56 unit tests, and build passed before Phase 09 edits |
| `npm run test -- --run tests/unit/PoopInventory.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/HitDetection.test.ts tests/unit/ScoreCalculator.test.ts` | 0 | PASS | targeted | 4 files, 18 tests passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 09"` | 0 | PASS | targeted e2e | Tactical poop switching, sticky effect, jumbo depletion passed |
| `npm run test` | 0 | PASS | regression | 14 files, 62 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |
| `npm run test:e2e` | 1 | FAIL | regression e2e | Phase 04 exposed selected-poop projectile data resetting debug wind; Phase 08 exposed brittle cover movement timing |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 04"` | 1 | FAIL | targeted regression | Firing still used unmerged projectile config, causing predicted/actual landing mismatch |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 04"` | 0 | PASS | targeted regression | Confirmed selected-poop projectile data no longer resets debug wind |
| `npm run typecheck` | 2 | FAIL | targeted regression | E2E cover helper initially used `minX/maxX` for cover slots instead of `x/width` |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 08"` | 1 | FAIL | targeted regression | Cover helper stabilized position, then alert baseline needed to be captured before cover movement decay |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 08"` | 0 | PASS | targeted regression | Confirmed cover/alert flow after e2e movement stabilization |
| `npm run test:e2e` | 0 | PASS | regression e2e | 11 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 62 unit tests, and build passed |

## Test Counts

- Vitest targeted Phase 09: 4 files, 18 tests passed.
- Vitest full: 14 files, 62 tests passed.
- Playwright targeted Phase 09: 1 Chromium test passed.
- Playwright targeted regressions: Phase 04 and Phase 08 passed.
- Playwright full: 11 Chromium tests passed.
- `npm run verify`: lint, typecheck, 62 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-09-tactical-poop-hud.png`.
- E2E interaction: menu -> GameScene -> switch to sticky -> fire and observe slow effect -> switch through splash to jumbo -> observe slower jumbo projectile -> deplete jumbo stock -> confirm no extra projectile is fired while depleted.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Q/E switching updates `PoopInventoryState.selectedIndex` and HUD text.
- Cooldown is stored per inventory slot and ticks by game delta.
- Stock is consumed only after `PhaserProjectileSystem.fire(...)` succeeds.
- Normal poop has infinite stock and remains available.
- Sticky hit adds one timed slow effect; a same-type sticky hit refreshes instead of stacking.
- Sticky effect expiration restores NPC speed through the pure NPC state machine.
- Splash effect instance dedupes NPC ids, preventing duplicate same-explosion scoring/effects.
- Jumbo projectile carries `poopType: jumbo_poop` and lower initial x velocity than normal poop.
- Projectile prediction and firing use the same selected-poop config plus debug wind.

## Acceptance Comparison

- MET: Three special poop types each have best-use and cost fields in `poopDefinitions`.
- MET: Sticky effect ends and speed restores through `NPCStateMachine` tests.
- MET: Splash does not affect the same NPC twice for one effect instance.
- MET: Jumbo has slower/heavier trajectory, longer cooldown, and higher alert cost.
- MET: Q/E switching and HUD selected stock/cooldown stay consistent.
- MET: Effects are strategy/capability based, not scattered large switches in scene collision code.
- MET: No bouncing, stink, splitting, golden poop, or defense destruction was implemented.

## Known Limitations

- Severity: Low. Impact: effect icons are text/placeholder colors rather than final art. Planned fix: presentation/assets phase.
- Severity: Low. Impact: jumbo only marks `breaksDefense`; there are no defense objects yet. Planned fix: future defense/obstacle phase.
- Severity: Low. Impact: balance values are global and not level-authored yet. Planned fix: level data integration phase.
- Severity: Low. Impact: build still reports the inherited Phaser bundle chunk warning. Planned fix: consider code splitting only when bundle size becomes a release gate issue.
