# Pre-Phase 22 Mouse Input Evidence

Date: 2026-07-17  
Status: `MOUSE_INPUT_READY_FOR_REVIEW`

## Commands

| Label | Command | Exit | Result |
|---|---|---:|---|
| Baseline | `npx vitest run ActionState PlayerMovement ChargeSystem SceneLifecycle` | 0 | 4 files, 23 tests passed |
| Targeted unit | `npx vitest run GameplayInputController ActionState PlayerMovement ChargeSystem SceneLifecycle` | 0 | 5 files, 30 tests passed, 0.98s |
| Targeted mouse E2E | `npx playwright test tests/e2e/mouse-input.spec.ts --project=chromium` | 0 | 4 tests passed |
| Parallel regression sample | `npx playwright test --project=chromium --grep "mouse-only Level 1|phase 04 charges" --workers=2` | 0 | 2 tests passed, 34.2s |
| Lint | `npm run lint` | 0 | ESLint passed |
| Typecheck | `npm run typecheck` | 0 | `tsc --noEmit` passed |
| Full unit | `npm run test` | 0 | 43 files, 192 tests passed, 7.31s |
| Build | `npm run build` | 0 | 87 modules, 5.08s; non-blocking chunk warning |
| Full E2E | `npm run test:e2e` | 0 | 35 tests passed, 8.6m |
| Whitespace | `git diff --check` | 0 | passed |

## Pure Mouse Flow

The deterministic browser fixture enters Level 1 without keyboard input, moves left/right using pointer world X, stops in the dead zone, charges while moving, compares a short and full-power landing target, and scores a legal lower-lane hit. Additional mouse-only fixtures select poop from HUD, reject right/middle buttons, dodge Level 7 counterattack, avoid Level 8 surveillance, enter Level 9 cover, and fire during the Level 10 Boss encounter.

## UI and Pointer Evidence

- `docs/evidence/pre-phase-22-mouse-charge.png`: mouse-owned charge meter while moving.
- `docs/evidence/pre-phase-22-mouse-throw.png`: mouse release and projectile/shadow flight.
- `docs/evidence/pre-phase-22-mouse-arsenal.png`: clickable poop HUD selection with no charge owner.
- Playwright trace is retained on first retry by repository configuration.

## Retry and Menu Soak

| Metric | Baseline | Retry x5 | Menu round trip x5 |
|---|---:|---:|---:|
| Total input listeners | 13 | 13 | 13 |
| Native pointer listeners | 7 | 7 | 7 |
| Charge owner | null | null | null |
| Pointer capture | false | false | false |
| Active projectile / shadow | 0 / 0 | 0 / 0 | 0 / 0 |
| Ghost throws | 0 | 0 | 0 |

Blur during mouse charge also ended with owner null, capture false, hidden meter, and zero projectiles. UI clicks on arsenal and menu controls did not begin charge.

## Known Limitations

- Desktop mouse only; touch remains deferred to Prompt 24.
- The HUD control copy is a compact placeholder, not a Prompt 22 visual redesign.
- Vite's existing >500kB production chunk warning remains a Prompt 25 release risk.
- Playwright is intentionally configured for one worker because concurrent Phaser canvas simulations made real-time pointer assertions dependent on host frame contention; the serial suite completed in 8.6 minutes.
