# Retro Gate B Evidence

## Conclusion

PASS for the automated Core Loop MVP baseline after the minimal repairs below. This does not mark Prompts 05-08 or any later phase as `PASS`; reviewer-controlled phase statuses remain unchanged.

## Scope

- Prompt 05: seeded NPC spawning, right-to-left movement, lane mapping, state and view recycling.
- Prompt 06: legal hits, hit-token deduplication, Hit/Ranting/Recovering transitions, repeat hits.
- Prompt 07: rant-sourced score, immutable breakdowns, combo windows, timeout and reset.
- Prompt 08: alert sources/decay/stages, risk multiplier, caught latch and clean retry.
- Explicitly excluded: new gameplay, Gate C, Prompt 12, and feature changes to Prompts 09-11.

## Findings and Repairs

| Severity | Initial Finding | Root Cause | Minimal Repair | Final |
|---|---|---|---|---|
| Major | Collision emitted both hit and rant events before the NPC entered `Ranting` | Hit resolution conflated geometric collision with a later state transition | Collision now stores pending context and emits only `PROJECTILE_HIT`; a pure transition collector emits `NPC_RANT_STARTED` | MET |
| Major | `NPC_RECOVERED` was declared but never emitted | No state-transition event collector existed | Emit recovery only when immunity ends, hit window advances, and leftward movement resumes | MET |
| Major | A recovering NPC could become hittable without first moving again | Recovery restored `Walking` after consuming the whole update as stationary time | Apply post-immunity delta to leftward motion before opening the next hit window | MET |
| Major | Replaying a rant event could score twice | `ScoreCalculator` did not reject an existing event id | Make rant scoring idempotent by immutable `eventId` | MET |
| Major | NPC domain recycling destroyed Phaser views instead of pooling them | Display adapter had no reusable NPC view pool | Added active/pooled view ownership, reuse statistics, and shutdown destruction | MET |
| Major | Retry retained alert history and runtime projectile wind/config | Reset reused prior alert records and did not restore projectile defaults | Recreate alert state and reset projectile config/wind in GameScene `create()` | MET |
| Major | Alert stage boundaries were hard coded | Stage calculation did not receive `AlertRules` | Added typed stage thresholds and injected rules into all calculations | MET |
| Minor | Hit-token storage retained tokens after projectile recycle | Token ownership had no retirement path | Remove standard and splash tokens when their projectile recycles | MET |
| Minor | Later interaction-matrix unit test expected the obsolete immediate rant event | Prompt 11 fixture encoded the old Gate B event contract | Updated only the assertion to validate hit plus pending-rant context | MET |

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Repository was already entirely untracked; no user file was removed or overwritten |
| `npm run verify` | 0 | PASS | baseline | lint, typecheck, 17 files/72 unit tests, build |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 05\|phase 06\|phase 07\|phase 08"` | 0 | PASS | baseline | 4 Chromium tests |
| `npm run test -- --run tests/unit/NPCSpawner.test.ts tests/unit/NPCStateMachine.test.ts tests/unit/HitDetection.test.ts tests/unit/ScoreCalculator.test.ts tests/unit/AlertSystem.test.ts` | 1 | FAIL | repair iteration | 32 tests passed; follow-up typecheck found an unused parameter and union narrowing issue |
| Same targeted unit command after repair | 0 | PASS | repair | 5 files/32 tests |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 05\|phase 06\|phase 07\|phase 08\|retro Gate B"` | 1 | FAIL | repair iteration | 3 passed/2 failed; test snapshots crossed frames and an immunity prefire raced into the next hit window |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 06\|phase 08"` and Phase 06 rerun | 0 | PASS | repair | Retry and repeat-hit assertions corrected to observe domain boundaries |
| Targeted Gate B five-test command | 0 | PASS | regression | 5 Chromium tests, 2.0 minutes |
| `npm run verify` | 1 | FAIL | regression iteration | 16 files passed; Prompt 11 test retained obsolete immediate-rant expectation, 75/76 tests passed |
| `npm run verify` | 0 | PASS | regression | lint, strict typecheck, 17 files/76 unit tests, build |
| `npm run test:e2e` | 1 | FAIL | regression iteration | Gate B passed; 13/15 total passed, two later timing/snapshot assertions failed |
| `npx playwright test tests/e2e/app.spec.ts --grep "phase 05\|phase 10"` | 0 | PASS | repair | 2 Chromium tests after atomic NPC snapshot and load-tolerant movement wait |
| `npm run verify` | 0 | PASS | final regression | lint, strict typecheck, 17 files/76 unit tests, build |
| `npm run test:e2e` | 0 | PASS | final regression | 15/15 Chromium tests, including Retro Gates A/B and Prompt 09-11 regression; 3.6 minutes |

Build succeeds with the inherited warning that the minified Phaser bundle chunk exceeds 500 kB.

## Determinism and Resource Evidence

- Fixed seed: `phase-05-seed`; seeded spawn order remains covered by unit tests and browser behavior.
- Lane y/scale/depth are checked against `WorldLayout` for every sampled NPC; NPCs enter beyond canonical x=1280 and move left.
- NPC view pool remains bounded by the configured concurrent population, reports reuse, and keeps active view/domain counts equal in one browser snapshot.
- A legal collision logs `PROJECTILE_HIT` before `NPC_RANT_STARTED`; one rant creates one score breakdown, combo increment, and alert change.
- Recovery emits exactly one `NPC_RECOVERED`, restores positive speed, moves x left, advances the hit window, then permits a second valid hit.
- Recycled projectiles leave zero owned hit tokens in the Gate B scenario.
- Retry restores alert=0 with empty history, score/combo=0, zero projectiles/tokens/events, default wind=0, a fresh NPC id sequence, and unchanged InputAdapter, scene, and EventBus listener counts.
- EventBus acceptance baseline after retry is exactly one score, one alert, and one inventory subscriber.
- Failure is latched at alert 100; later gameplay cannot mutate score, combo, or alert before retry.

## Core Loop Acceptance

- MET: Observe target - seeded NPCs visibly enter from the right on three data-driven lanes with distinct base behaviors.
- MET: Choose timing and throw - deterministic Prompt 04 throw remains the only hit input; no hidden hit rate exists.
- MET: Hit NPC - geometric collision creates one legal hit token and one `PROJECTILE_HIT`.
- MET: Stop and rant - NPC speed becomes zero, state advances `Hit -> Ranting`, and the rant event is emitted at that transition.
- MET: Score and combo - only the validated rant event creates an immutable, idempotent score breakdown and combo update.
- MET: Alert - hit/throw/stationary sources raise alert; idle and cover decay lower it; injected thresholds select the stage and risk multiplier.
- MET: Recover - rant ends, immunity remains during `Recovering`, then leftward movement resumes before the next hit window opens.
- MET: Decide again - the same NPC accepts a second explicit throw only after recovery and produces a second score/combo/alert result.
- MET: Failure and retry - alert 100 latches gameplay; retry clears entities, runtime state, timers/events/tokens/config, and does not add listeners.
- MET: Prompt 05-08 state transitions have direct unit coverage and the full loop has Playwright evidence.
- MET: No Prompt 12 or Gate C behavior was implemented or inspected as an acceptance target.

## Manual Acceptance

1. Run `npm run dev` and open the reported localhost URL.
2. Start GameScene with fixed runtime seed `phase-05-seed`; press `L` for NPC/state diagnostics.
3. Observe NPCs entering right and moving left. Press Space when one reaches the throw path.
4. Confirm the NPC stops, shows a rant, score/combo/alert change, then resumes leftward movement.
5. Hit that NPC again only after it resumes. Stop throwing or stand in either rooftop cover to observe alert decay.
6. Continue throwing until alert reaches 100, confirm the caught screen latches, then retry and inspect clean values/listeners.
7. Evidence image: `docs/evidence/gate-b-retro.png`.

## Non-Blocking Limits

- Chromium is the current documented browser target; Firefox/WebKit remain deferred until browser targets are decided.
- No authored Level 1 duration, success result, or five-minute balancing session exists before Prompt 12; Gate B proves the repeatable MVP loop and failure/retry path only.
- Placeholder visuals limit subjective clarity judgment; human review still owns the five-minute comprehension and timing-feel checks.
- Prompt 09-11 are exercised only as regressions and are not accepted by this Gate.
- The repository remains entirely untracked, as it was before this audit.
