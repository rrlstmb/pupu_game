# Phase 10 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 10, advanced tactical poop types.
- Dependency: user prompt states Prompt 09 acceptance passed. Codex did not mark Phase 09 as `PASS`.
- `git status --short` before Phase 10 edits showed existing untracked Phase 00-09 project files; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: bouncy, stink, split, golden, arsenal sandbox, and effect safety stats only.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 62 unit tests, and build passed before Phase 10 edits |
| `npm run test -- --run tests/unit/AdvancedPoopSystems.test.ts tests/unit/PoopInventory.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/HitDetection.test.ts tests/unit/ScoreCalculator.test.ts` | 1 | FAIL | targeted | PoopInventory wraparound expected four-type matrix; updated to eight-type matrix |
| `npm run test -- --run tests/unit/AdvancedPoopSystems.test.ts tests/unit/PoopInventory.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/HitDetection.test.ts tests/unit/ScoreCalculator.test.ts` | 0 | PASS | targeted | 6 files, 26 tests passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 10"` | 1 | FAIL | targeted e2e | Initial bouncy active-state assertion was too transient; changed to bounce counter |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 10"` | 1 | FAIL | targeted e2e | Stink zone was only created on natural landing; fixed projectile impact path |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 10"` | 1 | FAIL | targeted e2e | Split assertion used active child count and global cooldown timing; fixed to use split stats and cooldown wait |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 10"` | 0 | PASS | targeted e2e | Arsenal sandbox and all eight poop types passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `npm run test` | 0 | PASS | regression | 15 files, 66 tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 66 unit tests, and build passed |
| `npm run test:e2e` | 0 | PASS | regression e2e | 12 Chromium tests passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted Phase 10: 6 files, 26 tests passed.
- Vitest full: 15 files, 66 tests passed.
- Playwright targeted Phase 10: 1 Chromium test passed.
- Playwright full: 12 Chromium tests passed.
- `npm run verify`: lint, typecheck, 66 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-10-arsenal-sandbox.png`.
- E2E interaction: menu -> GameScene -> Alt+1..Alt+8 verify labels -> fire bouncy and observe bounce counter -> fire stink and observe zone stats -> fire split and observe bounded split count -> fire golden and observe legal score bonus.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Projectile active cap remains <= 18 during split test.
- Split child generation count is bounded and no exponential spawn occurs.
- Stink zone `createdCount` increments and `recycledCount` increments after expiry.
- Environmental zone active count returns to 0 after lifecycle expiry.
- Golden stock reaches 0 after use.
- Golden score bonus appears only on a legal `NPC_RANT_STARTED` breakdown.
- Debug arsenal selection does not replace Q/E inventory controls.

## Acceptance Comparison

- MET: Eight poop types have recognizable HUD labels, projectile colors, and effect data.
- MET: No poop is dominant in all contexts; each has `bestAgainst`, `weakAgainst`, stock/cooldown/alert tradeoffs.
- MET: Bouncy uses tagged surface rules and bounces only the configured count.
- MET: Stink zone expires and cleans up.
- MET: Split has generation/global projectile caps.
- MET: Golden is rare stock and still goes through legal hit/rant scoring.
- MET: Full advanced NPCs and formal levels were not implemented.

## Known Limitations

- Severity: Low. Impact: arsenal sandbox is debug-only Alt+number, not final UI. Planned fix: final arsenal UI phase.
- Severity: Low. Impact: stink route fallback slows NPCs instead of computing alternate paths. Planned fix: cleaner/route behavior phase.
- Severity: Low. Impact: bounce surface is a placeholder `rooftop_floor` surface. Planned fix: authored level surface data phase.
- Severity: Low. Impact: visuals are placeholder colors/text. Planned fix: presentation/assets phase.
- Severity: Low. Impact: build still reports inherited Phaser bundle chunk warning. Planned fix: revisit at release gate if needed.
