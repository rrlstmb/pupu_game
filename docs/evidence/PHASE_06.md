# Phase 06 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 06, hit detection, rant loop, and repeated hits.
- Dependency: user prompt states Prompt 05 acceptance passed. Codex did not mark Phase 05 as `PASS`.
- `git status --short` before Phase 06 edits showed existing untracked Phase 00-05 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: hit/rant/recovery loop only. Score, combo, alert, and special poop remain out of scope.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run test -- --run tests/unit/HitDetection.test.ts tests/unit/NPCStateMachine.test.ts` | 0 | PASS | targeted | 2 files, 8 tests passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06"` | 1 | FAIL | targeted e2e | Initial e2e waited at the wrong moving-NPC x window and produced no first hit |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06"` | 1 | FAIL | targeted e2e | Hit occurred, but screenshot timing skipped the short `Recovering` state |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06"` | 1 | FAIL | targeted e2e | Second-hit wait expected the same NPC to re-enter the right-side window after it had stopped in the hit zone |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06"` | 0 | PASS | targeted e2e | Phase 06 hit/rant/recover/re-hit loop passed |
| `npm run test` | 0 | PASS | regression | 10 files, 41 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |
| `npm run test:e2e` | 1 | FAIL | regression e2e | Full e2e exposed Phase 04 projectile landing test interference from NPC hit recycling |
| `npm run test:e2e` | 0 | PASS | regression e2e | 8 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |

## Test Counts

- Vitest targeted Phase 06: 2 files, 8 tests passed.
- Vitest full: 10 files, 41 tests passed.
- Playwright targeted Phase 06: 1 Chromium test passed.
- Playwright full: 8 Chromium tests passed.
- `npm run verify`: lint, typecheck, 41 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-06-hit-rant.png`.
- E2E interaction: menu -> GameScene -> wait for a lane-valid moving NPC -> throw -> observe `NPC_RANT_STARTED` -> verify stop/rant -> verify recovery immunity -> verify return to `Walking` -> throw again -> verify same NPC reaches `validHitCount === 2`.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- First legal hit emits `PROJECTILE_HIT` and `NPC_RANT_STARTED`.
- Ordinary projectile id is recycled after hit.
- Hit NPC `currentSpeed` becomes `0` during `Ranting`.
- Recovery immunity rejects another hit and does not increment `validHitCount`.
- Same NPC can increment `validHitCount` from 1 to 2 after returning to `Walking`.
- Gameplay event list records two `NPC_RANT_STARTED` events for the same NPC in the Phase 06 e2e.
- `hitWindowId` advances after recovery so a later projectile can produce a new legal hit.

## Acceptance Comparison

- MET: Projectile/NPC geometric hit detection exists in pure domain code.
- MET: NPC states include `Hit`, `Ranting`, and `Recovering`.
- MET: Hit stops NPC movement immediately.
- MET: Placeholder rant bubble and state color render in Phaser.
- MET: Rant end leads to `Recovering`; immunity end leads back to `Walking`.
- MET: Immunity prevents `validHitCount` from increasing.
- MET: Second legal hit occurs only after the same NPC resumes `Walking`.
- MET: `validHitCount` is tracked per NPC.
- MET: Rant duration, immunity, and reaction level are data-driven.
- MET: Ordinary projectile recycles on hit.
- MET: `PROJECTILE_HIT`, `NPC_RANT_STARTED`, and `NPC_RECOVERED` are defined and emitted.
- MET: Future scoring trigger is reserved for `NPC_RANT_STARTED`, not collision.
- MET: Hit token dedupes repeated callbacks for the same projectile/NPC/window.
- MET: Exiting NPCs are not hittable.
- MET: Multiple NPC hit states remain independent in unit tests.
- MET: No formal score, combo, alert, or special poop was implemented.

## Known Limitations

- Severity: Low. Impact: collision uses coarse placeholder segment/rectangle overlap. Planned fix: tune collider data with final NPC/poop dimensions in later collision/content phases.
- Severity: Low. Impact: rant visuals are placeholder text/color only. Planned fix: replace with authored reaction animation/audio in presentation phases.
- Severity: Low. Impact: build still reports the inherited Phaser bundle chunk warning. Planned fix: consider code splitting only when bundle size becomes a release gate issue.
