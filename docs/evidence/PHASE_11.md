# Phase 11 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 11, complete NPC roster and interaction matrix.
- Dependency: user prompt states Prompt 10 acceptance passed. Codex did not mark Phase 10 as `PASS`.
- `git status --short` before Phase 11 edits showed existing untracked Phase 00-10 project files; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: complete NPC roster, composed abilities, interaction matrix, cleaner zone clearing, and NPC sandbox only.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 66 unit tests, and build passed before Phase 11 edits |
| `npm run test -- --run tests/unit/NPCInteractionMatrix.test.ts tests/unit/HitDetection.test.ts tests/unit/NPCStateMachine.test.ts tests/unit/ScoreCalculator.test.ts` | 0 | PASS | targeted | 4 files, 19 tests passed |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 11"` | 1 | FAIL | targeted e2e | Security state needed longer wait after Entering -> Walking -> Searching transition |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 11"` | 0 | PASS | targeted e2e | NPC sandbox spawned all roster types and security state was visible |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06|phase 07|phase 09|phase 10"` | 1 | FAIL | targeted regression | New NPC roster made old random-hit helpers unstable; fixed tests to use deterministic sandbox targets |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 06|phase 07|phase 09|phase 10"` | 0 | PASS | targeted regression | Legacy hit, sticky, and arsenal flows passed with deterministic setup |
| `npm run test` | 0 | PASS | regression | 16 files, 70 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with inherited Phaser chunk-size warning |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, 70 unit tests, and build passed |
| `npm run test:e2e` | 0 | PASS | regression e2e | 13 Chromium tests passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted Phase 11: 4 files, 19 tests passed.
- Vitest full: 16 files, 70 tests passed.
- Playwright targeted Phase 11: 1 Chromium test passed.
- Playwright full: 13 Chromium tests passed.
- `npm run verify`: lint, typecheck, 70 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-11-npc-sandbox.png`.
- E2E interaction: menu -> GameScene -> debug overlay -> Alt+Shift+1..9/0/- spawn full roster -> verify every NPC type appears -> wait for security Searching state.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- All 11 NPC types can be spawned through sandbox.
- NPC view count remains synced through existing NPC system cleanup.
- Interaction matrix reports duplicate pairs as none and missing pairs through validation.
- Umbrella normal poop is blocked; jumbo and bounced bouncy hits are legal.
- Cleaner clears stink zones through shared environmental effect cleanup.
- Camera, dog, angry pedestrian, and security use danger phase/timer fields.

## Acceptance Comparison

- MET: Each new NPC changes targeting or ammo choice through ability, score, speed, alert, or matrix data.
- MET: Dangerous behaviors carry telegraph, active, and recovery state fields.
- MET: Cleaner removes stink/environmental zones through domain cleanup.
- MET: Camera can enter Recording and emit alert pressure; hit state interrupts it.
- MET: Security Searching is visible in NPC sandbox.
- MET: Matrix has dataized outcomes and safe defaults for missing pairs.
- MET: Germaphobe influencer boss and ten authored levels were not implemented.

## Known Limitations

- Severity: Low. Impact: dog, retaliation, recording, and security visuals are placeholder text/colors. Planned fix: presentation phase.
- Severity: Medium. Impact: retaliation does not yet spawn a dodgeable rooftop projectile. Planned fix: later hazard/retaliation phase.
- Severity: Medium. Impact: security has observation/search state but no final capture/pathfinding. Planned fix: security threat phase.
- Severity: Low. Impact: interaction matrix intentionally has safe-default missing pairs; final balance pass must fill or accept gaps. Planned fix: content/balance phase.
- Severity: Low. Impact: build still reports inherited Phaser bundle chunk warning. Planned fix: release gate if needed.
