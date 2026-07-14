# Prompt 04 Charged Y-Axis Throw Targeted Patch Evidence

Date: 2026-07-14
Status: READY_FOR_REVIEW
Scope: Prompt 04 and Gate C regression only; Prompt 13 remains NOT_STARTED.

## Root Cause

The existing input fired on Space press and used a positive X velocity. Production AimAssist rendered both projection and visual paths, making the interaction read as a diagonal aimed throw. It did not provide a hold duration that selected lane depth.

## Implementation

- `ChargeSystem` is pure and uses game delta time. Press starts, hold clamps power, release emits one throw power, and cleared input cancels without firing.
- `chargedProjectileConfig` maps power to target projection Y, apex height, and travel duration. Normal no-wind X velocity is zero.
- Collision continues to use ground projection; visual Y remains presentation-only.
- `PhaserChargeMeter` displays power and MAX at the bottom center only while charging.
- Production AimAssist is disabled. Existing trajectory graphics are available only with the default-off `L` debug overlay.
- Pause, blur, retry, menu return, scene shutdown, countdown, and settled states cancel charge.

## Automated Evidence

- `npm run verify` - exit code 0. Lint passed; typecheck passed; Vitest 21 files / 100 tests passed; production build passed.
- `npm run test:e2e` - exit code 0. Playwright Chromium 18 / 18 tests passed in 4.6 minutes.
- `npx playwright test tests/e2e/app.spec.ts --grep "phase 04 high charge" --project=chromium --repeat-each=2 --workers=1` - exit code 0; top-lane charged-hit regression passed twice consecutively.
- `npx playwright test tests/e2e/app.spec.ts --grep "phase 09" --project=chromium --repeat-each=2 --workers=1` - exit code 0; tactical-poop inventory/cooldown regression passed twice consecutively.
- Build retains the existing Vite warning for the Phaser bundle chunk exceeding 500 kB; it is non-blocking and unchanged in scope.

## Manual Acceptance

1. Run `npm run dev -- --host 127.0.0.1` and open the printed local URL.
2. Start Level 1 and wait for the countdown.
3. Verify no blue projection or green visual-arc helper line appears.
4. Hold Space and verify the bottom-center POWER meter appears; release to throw.
5. Use a short hold for the front lane, a medium hold for the middle lane, and a near-full hold for the top lane while aligning player X with the NPC.
6. Verify the projectile remains visually arced, the NPC rants, and score increases.

## Acceptance Mapping

- Production helper lines removed: automated Phase 04 e2e plus screenshot `phase-04-throw-aim.png`.
- Hold/release and charge meter: `ChargeSystem.test.ts` plus Phase 04 e2e.
- Lower/middle/top reach and visual/collision separation: `ChargeSystem.test.ts`, `HitDetection.test.ts`, and top-lane Phase 04 e2e.
- Pause/blur/retry reset: `ChargeSystem.test.ts`, Phase 04 e2e, and Phase 12 e2e.
- Gate C flow: Phase 06-12 and Gate B/C regression e2e coverage.

## Known Limits

- Placeholder meter and projectile visuals remain intentionally non-final.
- Charge tuning is an initial reversible baseline in `THROW_CHARGE_CONFIG`.
- Debug trajectory lines remain available only when the layout debug overlay is explicitly enabled.
