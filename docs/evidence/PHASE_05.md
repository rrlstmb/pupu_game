# Phase 05 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 05, basic NPCs, spawner, and state machine.
- Dependency: user prompt states Prompt 04 acceptance passed. Codex did not mark Phase 04 as `PASS`.
- `git status --short` before Phase 05 edits showed existing untracked Phase 00-04 files and `pupu_game_plan.txt`; all were preserved.
- Package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Formal gameplay implemented: NPC spawn, movement, and basic state machine only. No hit, rant, score, or advanced NPCs.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed existing untracked project files were preserved |
| `npm run test -- --run tests/unit/NPCSpawner.test.ts tests/unit/NPCStateMachine.test.ts` | 1 | FAIL | targeted | Entering -> Walking transition used previous distance and lagged one update |
| `npm run lint` | 1 | FAIL | targeted | Phaser import in `PhaserNPCSystem` needed `import type` |
| `npm run typecheck` | 0 | PASS | targeted | TypeScript passed before NPC display integration cleanup |
| `npm run test -- --run tests/unit/NPCSpawner.test.ts tests/unit/NPCStateMachine.test.ts` | 0 | PASS | targeted | 2 files, 8 NPC tests passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npm run typecheck` | 0 | PASS | targeted | Strict TypeScript passed |
| `npm run test` | 0 | PASS | regression | 9 files, 36 tests passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 05"` | 0 | PASS | e2e | Targeted Phase 05 NPC e2e passed |
| `npm run test:e2e` | 1 | FAIL | e2e | Initial full run had a spawn timing flake before first NPC appeared |
| `npx playwright test tests/e2e/app.spec.ts -g "phase 05"` | 0 | PASS | e2e | Targeted Phase 05 passed after initial spawn was made immediate |
| `npm run test:e2e` | 0 | PASS | e2e | 7 Chromium tests passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |

## Test Counts

- Vitest targeted NPC: 2 files, 8 tests passed.
- Vitest full: 9 files, 36 tests passed.
- Playwright full: 7 Chromium tests passed.
- `npm run verify`: lint, typecheck, 36 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: `phase-05-seed`.
- Level: N/A.
- Reason: NPC spawn schedule is seeded, but no authored level runtime exists yet.

## UI Evidence

- Screenshot: `docs/evidence/phase-05-npc-debug.png`.
- E2E interaction: menu -> GameScene -> debug overlay -> observe NPC spawn/move -> observe three type set -> observe `Distracted` state -> run long enough to recycle.
- Trace: none retained because final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- First NPC x starts greater than 1280.
- Same NPC x decreases after 500 ms.
- Active NPC count remains `<= 8`.
- Phaser NPC view count equals active NPC runtime count.
- `recycledCount` becomes greater than 0 after long run.
- `skippedSpawnCount` is tracked and remains bounded.

## Acceptance Comparison

- MET: NPCs spawn from the right side.
- MET: NPC x decreases; no rightward drift is introduced.
- MET: Three NPC types are observable in e2e.
- MET: Phone user can enter `Distracted`.
- MET: Same seed reproduces spawn sequence in unit tests.
- MET: Exiting NPCs are recycled and removed from active state/view maps.
- MET: Lane y, scale, depth, and speed multiplier come from `WorldLayout`.
- MET: Definitions are readonly data and are not mutated by runtime state.
- MET: No hit, rant, score, or advanced NPC behavior was implemented.

## Known Limitations

- NPC visuals are placeholder rectangles/circles.
- Spawn config is global Phase 05 data, not level-authored data yet.
- Phone-user distracted schedule is simple and will need tuning with level pacing.
- Vite/Playwright local server still requires escalated localhost permission in this sandbox.
- Build reports a large Phaser bundle chunk warning inherited from prior phases.
