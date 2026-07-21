# Phase 24 Evidence

## Status

`PHASE_24_READY_FOR_REVIEW` on 2026-07-21. Reviewer, not Codex, decides PASS.

## Commands

| Label | Command | Exit | Result |
|---|---|---:|---|
| baseline | `npm run test -- --run tests/unit/GameplayInputController.test.ts tests/unit/GameConfig.test.ts tests/unit/SaveSchema.test.ts tests/unit/SemanticAudioSystem.test.ts` | 0 | 4 files, 13 tests |
| touch/layout/settings | `npx vitest run tests/unit/TouchInput.test.ts tests/unit/ResponsiveLayout.test.ts tests/unit/SettingsData.test.ts tests/unit/GameplayInputController.test.ts` | 0 | 4 files, 18 tests |
| mobile targeted E2E | `PLAYWRIGHT_PORT=5176 npx playwright test tests/e2e/phase24-touch-accessibility.spec.ts --project=chromium` | 0 | 3 tests, 20.3s; includes slider debounce persistence |
| touch + mouse + persistence regression | `npx playwright test tests/e2e/phase24-touch-accessibility.spec.ts tests/e2e/mouse-input.spec.ts tests/e2e/phase23-persistence.spec.ts --project=chromium` | 0 | 12 tests, 1.8m |
| lint | `npm run lint` | 0 | no findings |
| typecheck | `npm run typecheck` | 0 | no errors |
| full unit | `npm run test` | 0 | 54 files, 231 tests, 5.47s |
| build | `npm run build` | 0 | 121 modules, JS 1,767.60 kB, gzip 417.95 kB, 5.55s |
| full E2E first run | `npm run test:e2e` | 1 | 43/44 passed; fixed one stale EventBus listener baseline |
| failed case rerun | `npx playwright test tests/e2e/app.spec.ts --project=chromium --grep "phase 08 raises alert"` | 0 | 1/1, 43.0s |
| full E2E final | `PLAYWRIGHT_PORT=5176 npm run test:e2e` | 0 | 44/44 tests, 11.4m; final worktree after debounce fix |
| diff | `git diff --check` | 0 | clean after final evidence update |

The first targeted E2E launch exposed an initialization-order error in `ResponsiveLayoutService`; its snapshot had been calculated before the injected Window field was assigned. Moving initial computation into the constructor fixed boot without changing layout rules. A second E2E setup issue was the authored countdown progressing slowly in mobile emulation; the deterministic fixture uses the existing `advanceLevelTime` hook to enter running state and then exercises real touch input.

The first full E2E run found a stale assertion expecting one Alert and Level EventBus listener. The application-level announcer intentionally adds one bounded listener for each; retry counts were stable. The expected baseline was updated from 1/1 to 2/2 and the isolated case plus complete 44-test suite passed.

## Viewports And Flows

- Desktop: 1366x768 and 1920x1080 pure layout snapshots.
- Tablet: 1024x768 landscape and 768x1024 portrait snapshots; Settings captured at 768x1024.
- Mobile landscape: 844x390 and 740x360 classification/control layout.
- Mobile portrait: 390x844 and 360x740 classification/control layout.
- Mobile E2E: independent movement pointer 11 and charge pointer 22 remain active simultaneously; release creates one projectile.
- Orientation E2E: active touch charge is cancelled, owners become null, and projectile count remains zero.
- Settings E2E: high contrast, reduced motion, flash off, 130% text, and left-handed touch persist across reload while the progress JSON remains byte-identical.

## Screenshots

- `phase-24-mobile-portrait-touch-charge.png`: portrait gameplay, simultaneous movement/charge controls.
- `phase-24-mobile-landscape.png`: landscape gameplay before rotation.
- `phase-24-mobile-portrait-after-rotation.png`: reflow after rotation with no ghost throw.
- `phase-24-tablet-settings-high-contrast.png`: tablet Settings at 130%, high contrast, reduced motion, flash off, left-handed layout.

## Lifecycle And Isolation

- Mouse pointer listeners remain 7 before/after; touch listeners are a separate fixed 9.
- Input adapter total listeners are fixed per active GameScene and disposed on shutdown.
- Touch movement/charge owners are null after release, cancel, orientation, pause, retry, Menu, and shutdown.
- Pointer capture is false after cancellation and transition; ghost projectile count is zero.
- Responsive service owns two Window listeners plus optional VisualViewport resize and uses one requestAnimationFrame debounce.
- Announcer queue is capped at 24; Canvas focus proxy refresh uses one application-owned interval.
- Settings writes occur only from user controls/reset. Slider writes use one 180ms debounce timer that is cleared on close/dispose. SaveData and SettingsData use distinct keys and reset paths.
- Existing Mouse retry/menu soak and Persistence recovery/reset/mode tests pass unchanged.

## Accessibility Audit

- DOM Settings controls have labels, visible focus rings, values, minimum 44px targets, focus trap, Escape close, and focus restore.
- Canvas Menu/HUD controls receive keyboard-focusable proxy buttons; Space on a focused button activates UI rather than gameplay charge.
- Warnings retain text/icon/shape semantics; high contrast and pattern settings do not modify authoritative bounds.
- Reduced motion and flash settings alter presentation only. No new repeating or >3Hz full-screen flash exists.
- Live regions are token-deduplicated, bounded, optional, and never the only cue.

## Known Limitations

- Chromium emulation is evidence, not a physical iOS/Android device matrix.
- This phase is not a formal WCAG conformance certification; final art contrast and screen-reader behavior require external audit.
- Canvas remains canonical 16:9 with mobile HUD reflow and external controls; portrait uses letterboxing rather than a second gameplay camera.
- Phase 22 art/audio remains polished prototype.
- Bundle splitting, performance tuning, release build, PWA/deployment, and packaging remain Prompt 25 work.
