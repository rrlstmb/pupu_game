# Gate E: Product Integration And Release-Readiness Lock

## Status

`GATE_E_READY_FOR_REVIEW`. Gate E is a verification and minimal-regression-fix gate. It does not mark itself PASS and does not perform Prompt 25 work.

## Scope And Feature Lock

The locked baseline is the ten-level Campaign plus the reviewed mouse, presentation, persistence, touch, responsive, settings, and accessibility work through Prompt 24. No Level 11, NPC, poop, Boss, hazard, mode, balance change, bundle split, dynamic import, PWA, service worker, packaging, deployment, or release workflow was added.

## Product Flow

| Flow | Result | Evidence |
|---|---|---|
| Fresh player, Opening, Menu, Level 1, Level 2 unlock | PASS | Phase 22 Opening and Phase 23 fresh-save/reload E2E |
| Returning player and Continue | PASS | Continue creates a new LevelSession with zero score/Alert/projectiles and null charge owner |
| Campaign completion | PASS | Legal Level 10 final-golden landing, terminal Campaign result, no Level 11 |
| Failure and Retry | PASS | Failure is latched once; retry resets encounter/session inventory and hazards |
| Level Select and records | PASS | Lock/completed/mastered state and monotonic records share SaveData/Campaign registry |
| Extra modes and Settings | PASS | Dedicated Gate E mode launch E2E plus Phase 24 settings persistence E2E |

## Ten-Level Matrix

| Level | Core integration | Entry/result/reset | Input/presentation | Result |
|---:|---|---|---|---|
| 1 | movement, charge, hit, miss | success/failure/retry/Menu | keyboard, mouse, touch; character/VFX | PASS |
| 2 | sticky and rush | deterministic event/result | unified input; crowd cue | PASS |
| 3 | umbrella block/jumbo break | legal interaction/result | selector and block/break VFX | PASS |
| 4 | splash multi-hit dedupe | one scoring token per target | splash feedback | PASS |
| 5 | wind and bounce | seeded wind/event reset | WindIndicator/bounce cue | PASS |
| 6 | stink zone and Cleaner | bounded zone/clean reset | zone/cleaning cue | PASS |
| 7 | counterattack hit/dodge | bounded queue/safe reset | telegraph and non-color warning | PASS |
| 8 | snapshot/recording/blind spot | capture/avoid/reset | distinct SNAP/REC feedback | PASS |
| 9 | guard/searchlight/cover/golden/blockade | inventory and blockade reset | EXPOSED/security cues | PASS |
| 10 | three Boss phases/final golden | success/failure/retry/Campaign end | gate/window/final-hit presentation | PASS |

All levels use the same ordered `CAMPAIGN_LEVELS` registry. Each can start from Level Select; Result routing terminates after Level 10. Existing deterministic E2E fixtures cover success, failure, retry, Scene shutdown, authoritative shadow/hit windows, and no production aim/debug overlays.

## Input Matrix

| Input | Movement | Charge/release | Ownership/cancel | UI isolation | Result |
|---|---|---|---|---|---|
| Keyboard | axis | Space down/up | reset on blur/pause/Scene | focused UI consumes Space | PASS |
| Mouse | canonical pointer axis | left down/up | capture/blur/reset | HUD/Menu/dialog exclusion | PASS |
| Touch | independent movement pointer | independent throw pointer | cancel/lost capture/orientation reset | control/selector/dialog exclusion | PASS |
| Hybrid | shared controller priority | first valid source owns charge | non-owner release ignored | returns neutral across UI | PASS |

All adapters emit `GameplayInputIntent`; none moves Player or spawns a projectile directly. E2E reports one projectile per owned release and zero ghost projectiles.

## Save, Settings, And Session Matrix

- Progress key: `shiming-bida.save.v1`; settings key: `shiming-bida.settings.v1`.
- Both documents are runtime validated and use repository/service boundaries with memory fallback.
- Corrupt progress recovers; future progress/settings are not overwritten.
- Progress reset and Settings reset clear only their own keys.
- Result tokens are idempotent and the receipt list is bounded at 256.
- Save records only progression/records/discovery/tutorial/mode records. Settings records only audio, motion, visual, controls, and accessibility preferences.
- Inventory, cooldown, charge, pointer owners, projectiles, shadows, hazards, Boss phase/protection, blockade, final window, final golden, VFX/audio/camera and pools remain LevelSession/Scene-owned.

## Mode Isolation

| Mode | Campaign writes | Record context | Seed | Result |
|---|---|---|---|---|
| Campaign | eligible | Campaign record | authored | PASS |
| Free Play | none | practice session | authored/custom normalized | PASS |
| Precision/Frenzy/Challenge | mode record only | challenge ID | authored fixed | PASS |
| Endless | mode record only | `endless_patrol` | authored fixed | PASS |
| Daily | mode record only | `daily_mission` | local `YYYY-MM-DD` | PASS |

Challenge overrides are allowlisted, immutable, schema checked, and cannot alter collision, final-golden legality, or safety coordinators.

## Responsive Matrix

| Viewport | Layout result | Result |
|---|---|---|
| 1366x768, 1920x1080 | desktop | PASS |
| 1024x768 | tablet landscape | PASS |
| 768x1024 | tablet portrait | PASS |
| 844x390, 740x360 | mobile landscape | PASS |
| 390x844, 360x740 | mobile portrait | PASS |

The simulation remains canonical 1280x720. Safe-area, DPR, CSS/VisualViewport scale, handedness, orientation, and 130% text affect presentation only. The right-side vertical ChargeMeter and critical Alert/Timer/warnings remain visible.

## Accessibility Matrix

- Keyboard focus, visible focus ring, disabled controls, focus trap/restore, Escape close: PASS.
- High contrast, patterns/icons/text and non-color hazard cues: PASS.
- Text scale 100/115/130 percent with responsive reflow: PASS.
- Reduced motion, shake/zoom controls and flash full/reduced/off: PASS; no domain timing changes.
- Muted audio retains visual hazard meaning: PASS.
- Announcer token dedupe and queue bound 24: PASS.
- Formal WCAG certification and physical assistive-technology matrix: NOT TESTED.

## Presentation And Audio

Asset audit has zero unknown-source runtime entries and valid fallbacks. Character/Boss/projectile/environment skins remain polished prototypes. Domain state maps one-way to animation; visual bounds never drive gameplay. VFX and semantic audio are token-deduplicated and bounded; missing audio is nonfatal. Opening, Intro, result, and Campaign Complete are latched and clean on Scene changes.

## Lifecycle And Soak

Existing automated soak covers ten Scene entries, five retries, five Menu round trips, mouse retry/Menu cycles, touch orientation cancellation, persistence reload/recovery, and Settings reload. Input/EventBus listener baselines remain fixed, owners are null, pointer capture is false, projectiles/shadows and hazard queues return to baseline, and audio loops do not accumulate. Gate E adds a four-mode launch/return cycle and a 300-result receipt audit capped at 256.

## Performance Baseline

- Production build: 121 transformed modules.
- JS: 1,767.60 kB raw, 417.95 kB gzip; CSS: 4.47 kB raw, 1.69 kB gzip.
- Build: 5.43s final measured baseline.
- Unit: 55 files / 236 tests after Gate E audit.
- Chromium E2E: 45 tests after Gate E mode matrix.
- Authored hard bounds remain in LevelDefinition/system data for NPCs, projectiles/views, area zones, counterattack, surveillance, security, Boss hazards, VFX feedback pool (24), audio concurrency, announcer queue (24), and result receipts (256).

No bundle splitting was performed. The Vite chunk warning is a Prompt 25 release risk.

## Browser Status

| Target | Status |
|---|---|
| Chromium desktop | TESTED |
| Android Chromium emulation | TESTED |
| iPhone viewport/touch emulation | TESTED |
| Tablet viewport | TESTED |
| Firefox | NOT TESTED |
| WebKit | NOT TESTED |
| Physical Android | NOT TESTED |
| Physical iOS | NOT TESTED |

## Known Limitations

- No Gate E blocker identified.
- Vite's single JS chunk exceeds 500 kB; splitting/optimization belongs to Prompt 25.
- Firefox, WebKit, physical mobile devices, and a formal WCAG audit remain unverified.
- Art and generated audio are polished prototypes, not final commercial assets.
- PWA, service worker, packaging, deployment, and release automation do not exist yet.

## Prompt 25 Readiness

Candidate: **YES**, pending reviewer approval of Gate E. Gate D, mouse, Prompt 22, Prompt 23, and Prompt 24 regressions remain green; no unbounded listener/timer/pool growth or persistent transient-state leakage was found.
