# Gate E Evidence

## Status

`GATE_E_READY_FOR_REVIEW` on 2026-07-21. Candidate conclusion: PASS. Reviewer approval is required.

## Environment

- Node: `v22.22.1`
- npm: `9.2.0`
- Playwright installed browser: Chromium 1228 only
- Canonical world: 1280x720

## Commands

| Label | Command | Exit | Result |
|---|---|---:|---|
| baseline verify | `npm run verify` | 0 | lint/typecheck; 54 files, 231 tests; 121-module build |
| Gate E targeted unit | `npx vitest run tests/unit/GateEIntegration.test.ts tests/unit/SurveillanceSystem.test.ts` | 0 | 2 files, 10 tests, 0.82s |
| initial Chromium full | `PLAYWRIGHT_PORT=5176 npm run test:e2e` | 1 | 43/44; Level 8 fixture missed short snapshot window |
| Level 8 reproduction | `PLAYWRIGHT_PORT=5176 npx playwright test tests/e2e/app.spec.ts -g "phase 19 level 8" --repeat-each=3` | 1 | 0/3 before fixture repair |
| Level 8 regression | `PLAYWRIGHT_PORT=5176 npx playwright test tests/e2e/app.spec.ts -g "phase 19 level 8"` | 0 | 1/1, 27.3s |
| Chromium full after repair | `PLAYWRIGHT_PORT=5176 npm run test:e2e` | 0 | 44/44, 10.5m |
| Gate E modes first run | `PLAYWRIGHT_PORT=5176 npx playwright test tests/e2e/gate-e.spec.ts` | 1 | assertion included legal Intro revision write |
| Gate E modes final | `PLAYWRIGHT_PORT=5176 npx playwright test tests/e2e/gate-e.spec.ts` | 0 | 1/1, 9.5s |
| final lint | `npm run lint` | 0 | no findings |
| final typecheck | `npm run typecheck` | 0 | no errors |
| final unit | `npm run test` | 0 | 55 files, 236 tests |
| final build | `npm run build` | 0 | 121 modules; JS 1,767.60 kB / 417.95 kB gzip; 5.43s |
| final full E2E | `PLAYWRIGHT_PORT=5176 npm run test:e2e` | 0 | 45 Chromium tests, 11.6m |
| diff | `git diff --check` | 0 | clean |

## Product And Campaign Evidence

- Fresh save/Level Select: `docs/evidence/phase-23-fresh-level-select.png`.
- Level 2 persistent unlock: `docs/evidence/phase-23-level-02-unlocked.png`.
- Continue clean-session assertions: score 0, Alert 0, charge owner null, projectiles 0.
- Campaign registry: `docs/evidence/gate-d-campaign-levels.png`.
- Legal final golden/Campaign Complete: `docs/evidence/phase-22-final-golden-hit.png`, `docs/evidence/phase-22-campaign-complete.png`.
- Boss protection/window: `docs/evidence/phase-22-boss-protections.png`, `docs/evidence/phase-22-final-vulnerable.png`.

## Input And Responsive Evidence

- Keyboard: core app suite covers A/D, Space ownership, pause/blur and ten Scene entries.
- Mouse: four dedicated tests cover movement, charge/release, selector, hazards, Boss and five retry/Menu cycles.
- Touch portrait charge: `docs/evidence/phase-24-mobile-portrait-touch-charge.png`.
- Mobile landscape: `docs/evidence/phase-24-mobile-landscape.png`.
- Orientation cancellation: `docs/evidence/phase-24-mobile-portrait-after-rotation.png`.
- Tablet, high contrast, text 130 percent, reduced motion, flash off and left-handed controls: `docs/evidence/phase-24-tablet-settings-high-contrast.png`.
- Hybrid ownership is covered by controller unit tests; all owners clear and ghost projectile count remains zero.

## Save, Settings, And Modes

- Corrupt/future progress recovery: `docs/evidence/phase-23-corrupt-recovery.png`.
- Progress reset cancel/confirm: `docs/evidence/phase-23-reset-dialog.png`.
- Challenge record/reload: `docs/evidence/phase-23-challenge-record.png`.
- Gate E mode selector: `docs/evidence/gate-e-extra-modes.png`.
- Browser mode matrix launched Frenzy Level 4, Challenge Level 9, Endless Level 7, and Daily Level 5; each returned to Menu with Campaign completed state, completed IDs, records and unlock IDs byte-equivalent.
- Daily seed matched local `daily-local-YYYY-MM-DD`; challenge overrides remained immutable in unit audit.
- Save/Settings keys differ; resetting either leaves the other document intact.
- Persistent schema excludes final golden, Boss, hazards, inventory, charge/pointer and presentation state.

## Lifecycle And Soak Data

| Diagnostic | Baseline | After cycles | Result |
|---|---:|---:|---|
| Mouse pointer listeners | 7 | 7 | stable |
| Touch listeners | 9 | 9 | stable |
| EventBus score/alert/inventory/level listeners | 1/2/1/2 | 1/2/1/2 | stable |
| Charge owner | null | null | clean |
| Touch movement/charge owners | null/null | null/null | clean |
| Pointer capture | false | false | clean |
| Ghost projectiles | 0 | 0 | clean |
| Announcer queue cap | 24 | <=24 | bounded |
| Feedback view pool | 24 | <=24 | bounded |
| Result receipts | 0 initial | 256 after 300 unique commits | bounded |

Covered cycles include ten GameScene entries, five retry cycles, five Menu round trips, touch orientation cancellation, persistence reload/recovery/reset, Settings reload, and four Gate E mode launch/Menu cycles. Existing domain hard limits constrain NPC, projectile, area, counterattack, surveillance, security and Boss hazard instances. Texture registration remains Preload-owned and Semantic Audio uses one application singleton with bounded voices.

## Repair

The old Level 8 E2E spawned a moving camera source at X=950 and polled a short-lived snapshot instance. Under the current presentation/runtime load the source/window could be missed reliably. The fixture now spawns at the authored right-side X=1260 and first verifies source creation. No SurveillanceSystem, timing, balance, or gameplay invariant changed. Regression: isolated Level 8 E2E and full Chromium suite.

The old Phase 05 E2E relied on the random sandbox roster to contain a phone user and sampled its brief `Distracted` state. The final fixture explicitly spawns the registered `phone_user` at the authored right-side boundary before checking the same real behavior. It passed three consecutive targeted runs and the final full suite; NPC logic and timing were unchanged.

The Gate E mode test initially compared the whole save revision. Entering a mode legitimately records its Intro tutorial and increments revision. The final assertion compares Campaign completion, IDs, records and unlocks, while revision behavior remains covered by persistence transaction tests.

## Performance Baseline

- Source files: 119 before Gate E test additions.
- Build: 121 transformed modules, 5.43s final baseline.
- JS: 1,767.60 kB raw, 417.95 kB gzip.
- CSS: 4.47 kB raw, 1.69 kB gzip.
- Full E2E: 11.6m for the final 45-test Chromium suite.
- Vite >500 kB warning remains a Prompt 25 risk; no splitting or dynamic import was added.

## Browser Matrix

| Browser/device | Status | Evidence |
|---|---|---|
| Chromium | TESTED | full suite |
| Android emulation | TESTED | mobile touch viewport |
| iPhone emulation | TESTED | portrait/landscape touch viewport |
| Tablet | TESTED | 768x1024 Settings/layout |
| Firefox | NOT TESTED | browser binary not installed |
| WebKit | NOT TESTED | browser binary not installed |
| Physical Android | NOT TESTED | no external deployment |
| Physical iOS | NOT TESTED | no external deployment |

## Known Risks

- Physical device/browser and formal WCAG audits remain release work.
- Art/audio remain polished prototypes.
- Bundle optimization, PWA, service worker, packaging and deployment were intentionally not performed.
