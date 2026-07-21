# Phase 22 Evidence

## Status

`PHASE_22_READY_FOR_REVIEW` on 2026-07-20. Reviewer, not Codex, decides PASS.

## Commands

| Label | Command | Exit | Result | Time |
|---|---|---:|---|---:|
| targeted baseline | `npx vitest run GameplayInputController PlayerMovement SceneLifecycle CampaignRegistry` | 0 | 4 files, 18 tests | 0.92s |
| mouse baseline | `npx playwright test tests/e2e/mouse-input.spec.ts --project=chromium` | 0 | 4 tests | 59.1s |
| presentation unit | `npx vitest run tests/unit/PresentationAssets.test.ts tests/unit/CharacterPresentation.test.ts tests/unit/PresentationLedger.test.ts tests/unit/SemanticAudioSystem.test.ts tests/unit/GameplayInputController.test.ts` | 0 | 5 files, 14 tests | 1.33s |
| presentation E2E | `npx playwright test tests/e2e/phase22-presentation.spec.ts --project=chromium` | 0 | 1 test | 8.0s |
| mouse/hazard targeted | representative mouse hazard/Boss and soak greps | 0 | 3 tests | 61.3s combined |
| lint | `npm run lint` | 0 | no findings | 8.2s |
| typecheck | `npm run typecheck` | 0 | no errors | 6.2s |
| full unit | `npm run test` | 0 | 47 files, 201 tests | 5.97s |
| build | `npm run build` | 0 | 99 modules | 5.34s Vite |
| full E2E | `npm run test:e2e` | 0 | 36 tests | 9.8m |
| retry/menu presentation soak | `npx playwright test tests/e2e/mouse-input.spec.ts --grep "retry and menu soak"` | 0 | 1 test | 10.8s |

The final post-evidence lint/typecheck/unit/build/diff checks are recorded in the completion report. Audio is muted by test policy where needed, but `SemanticAudioSystem` lifecycle is created and audited.

## Asset Audit

- Manifest entries: 31 repository-generated polished-prototype entries, including fallback families and semantic audio bank.
- Runtime unknown-source assets: 0.
- Missing registered runtime keys after Preload fallback resolution: 0.
- Missing fallback keys: 0.
- Missing audio semantic definitions: 0.
- Final production assets: 0; all new art/audio remains `polished_prototype`.

## Screenshots

| File | Verification |
|---|---|
| `phase-22-opening.png` | Opening title, skyline, player silhouette, dual-input help, mouse Skip |
| `phase-22-level-01-characters.png` | layered Level 1, player and phone-user silhouette |
| `phase-22-mouse-charge.png` | mouse charge, right vertical bottom-up meter |
| `phase-22-umbrella-block.png` | umbrella defense feedback |
| `phase-22-umbrella-break.png` | jumbo umbrella interaction |
| `phase-22-wind-bounce.png` | windy environment and legal bounce flow |
| `phase-22-stink-cleaner.png` | stink zone and cleaner lifecycle |
| `phase-22-counterattack.png` | counterattack telegraph |
| `phase-22-snapshot.png` | snapshot warning zone |
| `phase-22-recording.png` | streamer REC/exposure |
| `phase-22-security.png` | guard/searchlight/blockade presentation |
| `phase-22-boss-protections.png` | Boss silhouette and protection UI |
| `phase-22-final-vulnerable.png` | third-stage safe space and final window |
| `phase-22-final-golden-hit.png` | legal final hit result |
| `phase-22-campaign-complete.png` | terminal Campaign Complete result |

## Reset And Soak

The mouse soak performs 5 GameScene retries and 5 Menu round trips. Each iteration reports:

- pointer listeners: 7 -> 7
- charge owner: `null` -> `null`
- pointer capture: `false` -> `false`
- active projectiles/shadows: 0 -> 0
- active presentation effects: 0 -> 0
- active audio loops: 0 -> 0
- ghost projectile: 0

Gate D soak also confirms timers, queues, pools, inventory, metrics, and event listeners return to baseline. Opening Skip and Intro Skip each enter/dismiss once and leave no projectile or charge owner.

## Presentation Baseline

- NPC view pool: existing level `maxActive` hard caps; reuse counters remain bounded.
- Projectile views/shadows: pure projectile max active 18; one pooled shadow per active projectile.
- Primary impact/floating feedback: one combined view, hard cap 24.
- Audio: per-semantic-event concurrency 1-3; no persistent loop in current generated prototype bank.
- Generated texture registration: one Preload pass; no per-frame Graphics/Text allocation.
- Build: 99 transformed modules; JS 1,716.24 kB, gzip 402.20 kB; CSS 0.28 kB.
- Vite build time: 5.34s.
- Missing texture console errors: 0.
- Missing audio crashes: 0.

## Regression Notes

Full E2E covers Levels 1-10, success/failure/retry, campaign routing, eight poop types, all NPC systems, cross-hazard safety, legal final golden completion, keyboard, mouse, UI isolation, and soak. Presentation load exposed frame-assuming E2E fixtures; fixtures now use authoritative active trajectory data and neutral mouse axis rather than fixed 60fps offsets. No gameplay balance/domain timing was changed.

## Known Limitations

- Character/environment/projectile art and synthesized cues are polished prototype, not final production assets.
- Sustained music/ambience composition, full animation atlases, richer particles, and commercial sound design remain future asset work.
- The single Phaser/Vite chunk exceeds 500 kB. Prompt 25 owns code splitting and release optimization.
- Touch, responsive UI, accessibility, and settings remain Prompt 24. Persistence/unlocks/modes remain Prompt 23.
