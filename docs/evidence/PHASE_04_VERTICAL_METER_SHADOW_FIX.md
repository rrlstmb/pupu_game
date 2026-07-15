# Prompt 04 Vertical Meter and Ground Shadow Targeted Patch

## Scope

- Move ChargeMeter to a data-driven right anchor and render charge bottom-to-top.
- Add one pooled ground-projection shadow per active projectile without changing projectile simulation or collision.
- No Prompt 13 work, new level, NPC, poop type, path helper, or authored asset was added.

## Fixed Rules

- Meter config: vertical, right anchored, 28x210 canonical pixels, right margin 24, top margin 270, fill padding 4.
- Meter fill height and POWER label consume the same quantized 1%-100% charge power used by target Y.
- Shadow X/Y are exactly projectile ground projection X/Y; visual height only reduces shadow scale and alpha.
- Shadow depth is above alley ground and below NPC/projectile visuals. Shadow acquire/release/dispose follows the existing bounded projectile view pool.

## Automated Evidence

Fixed test seed/session: Level 1 seed `level-01-seed`; presentation unit fixtures contain no randomness.

| Classification | Command | Exit | Result |
|---|---|---:|---|
| Baseline targeted | `npm run test -- --run tests/unit/ChargeSystem.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/HitDetection.test.ts` | 0 | 4 files, 35 tests passed before edits |
| Regression targeted | `npm run test -- --run tests/unit/ChargeSystem.test.ts tests/unit/GroundProjectionShadow.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/ProjectileTrajectory.test.ts tests/unit/HitDetection.test.ts` | 0 | 5 files, 38 tests passed |
| Targeted browser | `npx playwright test tests/e2e/app.spec.ts --grep "phase 04 charges" --reporter=line` | 0 | Vertical meter, ground/visual separation, pause freeze, and shadow recycle passed |
| CI-equivalent regression | `npm run verify` | 0 | lint, typecheck, 23 files / 116 unit tests, and production build passed |
| Browser/Gate C regression | `npm run test:e2e` | 0 | 19 Chromium tests passed; console-error assertions passed |

Build emitted the existing non-blocking Vite chunk-size warning for the 1.57 MB Phaser bundle.

## Visual Evidence

- Vertical meter: `docs/evidence/phase-04-throw-aim.png`
- In-flight ground shadow: `docs/evidence/phase-04-projectile-shadow.png`

## Manual Acceptance

1. Start Level 1 with seed `level-01-seed`.
2. Hold Space and confirm the right-side meter fills upward while POWER increases.
3. Release Space and observe the dark oval moving on the alley ground below the airborne poop.
4. Pause while airborne and verify both projectile and shadow stop.
5. Let it land, retry, and return to menu; verify no shadow remains and no trajectory helper appears.

## Known Limits

- Severity low: shadow is a placeholder ellipse and does not yet reflect authored sprite silhouette or scene lighting.
- Severity low: the 28px meter occupies the extreme right edge of the alley band; final responsive HUD work remains Prompt 24 scope.
