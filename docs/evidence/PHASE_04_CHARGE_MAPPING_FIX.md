# Prompt 04 Charge Meter and Distance Mapping Patch Evidence

Date: 2026-07-15
Status: READY_FOR_REVIEW
Scope: Prompt 04 ChargeMeter, pure charge-to-target mapping, and Gate C regression only. Prompt 13 remains NOT_STARTED.
Seed: `level-01-seed`

## Root Cause

- The Phaser fill rectangle was created with zero geometry width and later resized through display scale, so its visual width was not reliable.
- Meter text displayed raw charge power while projectile configuration independently clamped throws to a 5% minimum. The two values could disagree.
- Target Y interpolation lived inside projectile config assembly instead of a named pure mapping function.

## Repair

- `normalizeChargePower` produces the single 1%-100% value in visible one-percent increments.
- `getTargetYFromChargePower` maps 1% exactly to near Y and 100% exactly to far Y.
- `chargeMeterState` derives integer percent, label, ratio, and bounded inner pixel width from the same power.
- `PhaserChargeMeter` creates a non-zero inner fill rectangle and applies the derived width; its read-only snapshot exposes rendered width for browser regression.
- Normal projectile collision remains ground-projection based. Production trajectory helpers remain disabled.

## Distance Mapping

- 1%: target Y 463, the near/lower alley hit line.
- 50%: target Y 347.6768, the middle alley region.
- 100%: target Y 230, the far/top alley hit line.

## Evidence

- Screenshot: `docs/evidence/phase-04-throw-aim.png` shows visible POWER text and proportional cyan fill without a trajectory helper line.
- Baseline `npm run test -- --run tests/unit/ChargeSystem.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/HitDetection.test.ts`: exit code 0, 3 files / 22 tests before this patch.
- Targeted command after repair: exit code 0, 3 files / 27 tests.
- `npx playwright test tests/e2e/app.spec.ts --grep "phase 04" --project=chromium`: exit code 0, 2 / 2 tests.
- `npm run verify`: exit code 0. Lint and typecheck passed; Vitest 21 files / 105 tests passed; production build passed.
- `npm run test:e2e`: exit code 0, Playwright Chromium 18 / 18 tests passed in 5.0 minutes.
- Browser console assertions reported no unhandled errors in the top-lane charged-hit flow.

## Manual Acceptance

1. Start Level 1 with seed `level-01-seed`.
2. Hold Space and observe the cyan fill grow with POWER percentage.
3. Release near 1%, 50%, and 100%; verify lower, middle, and top projection distances.
4. Align X with a top-lane office worker, charge to MAX, release, and verify rant plus score.
5. Pause, blur, retry, and return to menu while charging; verify no meter or throw state remains.

## Known Limits

- Placeholder meter styling remains non-final.
- The 1%-100% endpoint mapping places 50% 1.18px from the geometric midpoint; this is below collision tolerance and follows the exact endpoint contract.
- Existing Vite Phaser bundle-size warning remains outside this patch.
