# Prompt 09-11 Post-Gate Regression Evidence

## Status

READY_FOR_REVIEW

## Scope

- Verify that Retro Gate A/B repairs did not regress completed Prompt 09 tactical poop, Prompt 10 advanced poop, or Prompt 11 NPC behavior.
- No new feature, balance change, large refactor, Gate C acceptance, or Prompt 12 work.
- Fixed runtime seed: `phase-05-seed`. Authored level: N/A because Prompt 12 remains `NOT_STARTED`.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Repository retained its pre-existing entirely untracked state |
| `npm run test -- --run tests/unit/PoopInventory.test.ts tests/unit/PoopBehaviorStrategy.test.ts tests/unit/AdvancedPoopSystems.test.ts tests/unit/ProjectileSystem.test.ts tests/unit/HitDetection.test.ts tests/unit/ScoreCalculator.test.ts tests/unit/NPCInteractionMatrix.test.ts tests/unit/NPCStateMachine.test.ts` | 0 | PASS | targeted regression | 8 files, 36 tests |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 09\|phase 10\|phase 11"` | 0 | PASS | targeted e2e | 3 Chromium tests, 1.0 minute |
| `npm run verify` | 0 | PASS | full regression | lint, strict typecheck, 17 files/76 unit tests, build |

Build emits the inherited Phaser minified chunk warning above 500 kB; exit code remains 0.

## Prompt 09 Results

- MET: Normal, sticky, splash, and jumbo definitions remain data driven with distinct physics, stock, cooldown, score, alert, and tactical fields.
- MET: Q/E inventory state, stock exhaustion, cooldown, selection, and HUD synchronization remain covered.
- MET: Sticky refreshes its bounded slow effect, splash deduplicates each NPC per effect instance, and jumbo retains slower/heavier/high-alert tradeoffs plus `breaksDefense` capability.

## Prompt 10 Results

- MET: Bouncy uses tagged surfaces and its configured bounce count.
- MET: Stink zones create, affect, expire, and increment cleanup statistics.
- MET: Split generation and global active-projectile limits prevent unbounded growth.
- MET: Golden stock remains rare and its bonus/extension still requires a legal rant-scoring event.
- MET: The eight-slot arsenal sandbox displays all types; projectile/effect counts remain bounded and return through lifecycle cleanup.

## Prompt 11 Results

- MET: Umbrella pedestrian, delivery rider, dog walker, cleaner, angry pedestrian, camera pedestrian, tourist, and security guard remain available through the NPC sandbox.
- MET: Umbrella normal blocking and jumbo/bounced-bouncy exceptions still resolve through the interaction matrix.
- MET: Cleaner removes stink zones; camera, dog, angry, and security behavior retains telegraph/active/recovery state data.
- MET: Interaction-matrix validation reports no duplicate pairs, uses explicit safe defaults for missing pairs, and follows the Gate B collision-then-rant event boundary.

## Resource and Lifecycle Checks

- Prompt 10 browser test asserts active projectile count remains at or below 18 during splitting.
- Stink active zones return to zero after expiry and recycled statistics increment.
- Golden stock reaches zero after use; score bonus appears only after legal `NPC_RANT_STARTED` processing.
- Prompt 11 sandbox spawns the complete 11-type roster and exposes security search state.
- Gate B hit-token cleanup and delayed rant event remain exercised by the targeted hit/score tests; no Prompt 09-11 fixture depends on the obsolete immediate-rant event.

## Changes

- Source code: none.
- Tests: none.
- Architecture/ADR: none; no new decision was required.
- Documentation: this evidence file and the current audit entry in `docs/STATUS.md` only.

## Manual Acceptance

1. Run `npm run dev`, enter GameScene, and use Q/E to check inventory/HUD switching.
2. Use Alt+1 through Alt+8 to inspect all poop types; throw bouncy, stink, split, and golden and inspect debug lifecycle counters.
3. Use Alt+Shift+1..9/0/- to spawn the full NPC roster; inspect umbrella, cleaner, camera, angry, dog, tourist, delivery, and security behavior.
4. Existing screenshots: `docs/evidence/phase-09-tactical-poop-hud.png`, `docs/evidence/phase-10-arsenal-sandbox.png`, and `docs/evidence/phase-11-npc-sandbox.png`.

## Limits

- Chromium is the only configured browser target.
- Visuals and effect icons remain placeholders.
- Prompt 11 evidence already records that retaliation projectile and final security capture/pathfinding are planned later behavior; this regression does not implement them.
- Prompt 12 remains `NOT_STARTED`; this check is not Gate C and does not validate a playable authored Level 1.
