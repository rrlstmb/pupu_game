# Prompt 13 Regression Evidence

## Status

READY_FOR_REVIEW

The regression conclusion is PASS. This does not change Phase 13 itself to `PASS`; phase approval remains reviewer-owned.

## Preflight

- Scope: Prompt 13 Level 2 and Level 1 regression only; Prompt 14 and Level 3 remain out of scope.
- Initial worktree: clean.
- Package manager: npm with `package-lock.json`.
- Level 1 seed: `level-01-seed`; Level 2 seed: `level-02-rush-seed`.
- Existing Phase 13 state: `READY_FOR_REVIEW`.

## Commands

| Command | Exit Code | Result | Count / Notes |
|---|---:|---|---|
| `git status --short` | 0 | PASS | Clean regression baseline |
| `npm run lint` | 0 | PASS | ESLint |
| `npm run typecheck` | 0 | PASS | TypeScript strict, no emit |
| `npm run test` | 0 | PASS | 24 files, 119 tests |
| `npm run build` | 0 | PASS | Vite production build; known bundle-size warning only |
| `npm run test:e2e` | 0 | PASS | 20/20 Chromium tests in 4.5 minutes |

## A-F Level 2 Audit

- MET A: menu selection and Level 1 next navigation both supply validated `LEVEL_02`; level content is in `src/data/levels/level02.ts`, not Scene rules.
- MET A: name, 100-second duration, score 850, seed, weighted NPCs, poop availability, timed event, palette, and stars are schema-validated data.
- MET B: evening palette is visible; base interval/max-active are 1.05s/9 versus Level 1's 1.15s/8, and rush values are 0.45s/14.
- MET B: office worker, phone user, and jogger are in weighted seeded spawn data; existing NPC state tests cover deterministic distraction and speed differences.
- MET C: HUD selection, stock/cooldown, sticky slowdown, refresh, expiry restoration, and tactical jogger hit pass unit/e2e coverage.
- MET C: Scene retry reconstructs NPC state and inventory, so sticky effects do not persist.
- MET D: `npc_hit_target` counts only configured jogger hits; result rows expose PASS/MISS, and reset starts with an empty count map.
- MET E: remaining-time threshold latches `final_20_second_rush` once; pause freezes LevelSession, max-active bounds spawning, and retry clears event ids.
- MET E: seeded RNG and same definition/seed reproduce schedule inputs and event timing.
- MET F: Level 2 timeout path is exercised directly; success/caught use the same definition-independent one-shot settlement reducers covered by LevelDirector and browser regressions.
- MET F: pause, retry, menu, immutable result fields, and all required result metrics use shared verified LevelSession/HUD paths.

## G Throw and Hit Regression

- MET: right-side vertical bottom-up ChargeMeter and shared charge-to-target mapping pass unit/browser tests.
- MET: ground-projection shadow follows collision position and is recycled without residue.
- MET: lower/middle/top charge hits and NPC-size dynamic landing windows pass regression tests.
- MET: production trajectory, hit-window, and debug overlays remain absent/default-off; screenshot confirms normal presentation.

## H Level 1 Regression

- MET: Level 1 remains selectable with 90 seconds, target 500, `level-01-seed`, office-worker-only spawn, and normal-poop-only inventory.
- MET: Level 1 timeout/result/clean deterministic retry and legal-score success paths pass browser tests.
- MET: Level 1 retains score/combo/accuracy stars and has no Level 2 NPC-hit condition.

## Visual and Resource Evidence

- `docs/evidence/phase-13-level-02-rush.png`: evening Level 2, sticky HUD, score, seed, and 19-second rush state; no production debug overlays.
- Full e2e covers scene-entry listener stability, projectile/NPC pools, retry cleanup, shadow cleanup, charge reset, and alert failure latch.

## Repairs

- No product or test repair was required. All baseline and regression checks passed on the existing implementation.

## Non-blocking Limits

- Chromium is the only configured browser target.
- Evening visuals remain placeholder palette data.
- Bundle output retains the known Phaser chunk-size warning.
- Spawn pressure is bounded and deterministic, but long-duration low-end-device profiling remains a later release-quality concern.
