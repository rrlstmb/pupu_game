# Phase 02 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 02, screen layering, alley lanes, and parallax scene.
- Dependency: user prompt states Prompt 01 acceptance passed. Codex did not mark Phase 01 as `PASS`.
- `git status --short` before Phase 02 edits showed existing untracked Phase 00/01 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: none.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run test -- --run tests/unit/WorldLayout.test.ts` | 0 | PASS | targeted | 1 file, 6 layout tests passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npm run typecheck` | 2 | FAIL | targeted | E2E helper type used mutable arrays for readonly layout data |
| `npm run test` | 0 | PASS | regression | 3 files, 9 tests passed |
| `npm run typecheck` | 0 | PASS | regression | Strict TypeScript passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npm run test:e2e` | 0 | PASS | e2e | 4 Chromium tests passed across 1280x720, 1920x1080, 390x844 |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted: 1 file, 6 tests passed.
- Vitest full: 3 files, 9 tests passed.
- Playwright: 4 Chromium tests passed.
- `npm run verify`: lint, typecheck, 9 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: N/A.
- Level: N/A.
- Reason: Phase 02 has no gameplay simulation, spawn rules, or level runtime.

## UI Evidence

- Screenshot: `docs/evidence/phase-02-layout-debug.png`.
- E2E viewports: 1280x720, 1920x1080, 390x844.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Active scene after start: `GameScene` and `HUDScene`.
- Debug overlay after pressing `L`: `true`.
- Debug layout exposed through `window.__SHIMING_BIDA_DEBUG__.layout`.
- Layout scene checks:
  - zones: `skyline`, `alley`, `rooftop`
  - lanes: `back_shop`, `mid_sidewalk`, `front_road`
  - cover slots: 2
- Scene disposer now guards cleanup so SHUTDOWN/DESTROY cannot run the same disposer twice.

## Acceptance Comparison

- MET: Screen clearly presents three vertical zones.
- MET: Three lanes are visible and identifiable through debug overlay.
- MET: Far, mid, and near placeholder parallax layers scroll with distinct factors.
- MET: Resize checks passed for 1280x720, 1920x1080, and 390x844.
- MET: Lane and rooftop boundaries are generated from pure `WorldLayout`.
- MET: No NPC is required to validate the spatial structure.
- MET: No player control, collision, or formal art was implemented.

## Known Limitations

- Placeholder geometry is intentionally simple and not final art.
- Parallax is decorative proof only; camera-follow behavior is not implemented yet.
- Vite/Playwright local server still requires escalated localhost permission in this sandbox.
- Build reports a large Phaser bundle chunk warning inherited from Phase 01.
