# Prompt 04/06 Landing Hit Window Targeted Patch

## Scope

- Replace presentation-coupled projectile/NPC overlap with final landing-point resolution.
- Scale horizontal tolerance from each NPC's current world width while preserving lane isolation, immunity states, one-target ordinary poop, and area-poop behavior.
- No Prompt 13 work, new content, trajectory helpers, or gameplay feature was added.

## Fixed Rules

- Horizontal range: `clamp(npcWorldWidth * 1.0, 24, 96)` on each side of landing X.
- Vertical range: `clamp(npcWorldHeight * 0.5, 18, 40)`, additionally bounded by `laneHitToleranceY = 52`.
- Candidate eligibility still rejects `Recovering`, `Exiting`, inactive, and other non-hittable states.
- Ordinary selection order: squared landing distance, lane distance, stable NPC id; maximum target count is one.
- Splash behavior receives the selected landing target and retains its existing deterministic area deduplication.

## Automated Evidence

Fixed test seed/session: Level 1 seed `level-01-seed`; landing unit fixtures contain no randomness.

| Classification | Command | Exit | Result |
|---|---|---:|---|
| Baseline targeted | `npm run test -- --run tests/unit/HitDetection.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/ChargeSystem.test.ts` | 0 | 3 files, 24 tests passed before edits |
| Regression targeted | `npm run test -- --run tests/unit/LandingHitWindow.test.ts tests/unit/HitDetection.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/ChargeSystem.test.ts` | 0 | 4 files, 32 tests passed |
| Static | `npm run lint` | 0 | Passed |
| Static | `npm run typecheck` | 0 | Passed |
| CI-equivalent regression | `npm run verify` | 0 | lint, typecheck, 22 files / 113 unit tests, and production build passed |
| Browser/Gate C regression | `npm run test:e2e` | 0 | 19 Chromium tests passed; console-error assertions passed |

Build emitted the existing non-blocking Vite chunk-size warning for the 1.57 MB Phaser bundle.

## Manual Acceptance

1. Run `npm run dev -- --host 0.0.0.0` and open the reported URL.
2. Start Level 1; seed is `level-01-seed` in debug/settlement state.
3. Align X near an office worker and release Space at low, medium, and high charge for lower, middle, and top lanes.
4. Confirm a landing within roughly one rendered NPC width triggers Hit/Ranting and score, while a larger horizontal miss or wrong lane does not.
5. Confirm no hit window, collision box, or trajectory helper is visible with debug off.

## Acceptance Status

- Landing point collision, NPC-size scaling, lane bounds, deterministic ordinary selection, immunity handling, and top/middle/lower integration: `MET` by unit/e2e regression.
- Production debug visibility: `MET`; only a nonvisual debug snapshot is exposed and the overlay remains default-off.
- Gate C lifecycle regression: `MET`; all 19 e2e flows passed, including pause, retry, timeout, caught failure, success settlement, scene re-entry, pool reuse, and listener checks.

## Known Limits

- Severity low: rectangular placeholder world bounds approximate final art silhouettes; revisit collider tuning when authored sprites exist.
- Severity low: min/max padding caps intentionally prevent exceptionally large future NPC art from producing cross-lane or near-global hit windows.
