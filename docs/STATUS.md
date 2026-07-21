# Status

Allowed phase statuses: `NOT_STARTED`, `IN_PROGRESS`, `READY_FOR_REVIEW`, `BLOCKED`, `PASS`.

Codex must not set any phase to `PASS`.

## Current Phase

- Phase: 24
- Name: Touch, Responsive, Accessibility, and Settings
- Status: PHASE_24_READY_FOR_REVIEW
- Updated: 2026-07-21

## Current Audit

- Audit: Gate E - Product Integration and Pre-release Feature Lock
- Status: GATE_E_READY_FOR_REVIEW
- Evidence: `docs/evidence/GATE_E.md`
- Gate D and Prompts 22-24 remain reviewer-confirmed PASS; Gate E is ready for reviewer verification.

## Current Patch

- Patch: Pre-Prompt 22 Mouse Input
- Status: MOUSE_INPUT_READY_FOR_REVIEW
- Evidence: `docs/evidence/PRE_PHASE_22_MOUSE_INPUT.md`
- Mouse Input Patch remains reviewer-confirmed PASS.

## Audit History

- Retro Gate A - Technical and Feel Baseline: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/GATE_A_RETRO.md`.
- Retro Gate B - Core Loop MVP: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/GATE_B_RETRO.md`.
- Prompt 09-11 Post-Gate Regression: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/PROMPT_09_11_REGRESSION.md`.
- Gate C - Vertical Slice: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/GATE_C.md`.
- Prompt 04 Ground Projection Targeted Fix: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/PHASE_04_GROUND_PROJECTION_FIX.md`.
- Prompt 04 Charged Y-Axis Throw Targeted Patch: `READY_FOR_REVIEW` on 2026-07-14; evidence at `docs/evidence/PHASE_04_CHARGED_THROW_FIX.md`.
- Prompt 04 Charge Meter and Distance Mapping Targeted Patch: `READY_FOR_REVIEW` on 2026-07-15; evidence at `docs/evidence/PHASE_04_CHARGE_MAPPING_FIX.md`.
- Prompt 04/06 Landing Hit Window Targeted Patch: `READY_FOR_REVIEW` on 2026-07-15; evidence at `docs/evidence/PHASE_06_LANDING_HIT_WINDOW_FIX.md`.
- Prompt 04 Vertical Charge Meter and Ground Shadow Targeted Patch: `READY_FOR_REVIEW` on 2026-07-15; evidence at `docs/evidence/PHASE_04_VERTICAL_METER_SHADOW_FIX.md`.
- Prompt 13 Regression - Level 2 After-work Rush: `READY_FOR_REVIEW` on 2026-07-15; evidence at `docs/evidence/PROMPT_13_REGRESSION.md`.
- Gate D - Ten-level Campaign Integration and Content Lock: `GATE_D_READY_FOR_REVIEW` on 2026-07-17; evidence at `docs/evidence/GATE_D.md`.
- Pre-Prompt 22 Mouse Input: `MOUSE_INPUT_READY_FOR_REVIEW` on 2026-07-17; evidence at `docs/evidence/PRE_PHASE_22_MOUSE_INPUT.md`.
- Gate E - Product Integration and Pre-release Feature Lock: `GATE_E_READY_FOR_REVIEW` on 2026-07-21; evidence at `docs/evidence/GATE_E.md`.

## Baseline

- Repository had no commits on `master` during Phase 00 baseline.
- `git status --short` before edits: `?? pupu_game_plan.txt`
- Existing tracked files: none
- User-provided untracked plan: `pupu_game_plan.txt`
- Node: `v22.22.1`
- npm: `9.2.0`
- Lockfile: none
- `package.json`: absent
- Existing install/lint/typecheck/test/build/e2e scripts: absent

## Phase 01 Baseline

- User prompt states Prompt 00 acceptance passed. Codex did not mark Phase 00 as `PASS`.
- Package manager: npm
- Lockfile: `package-lock.json`
- Node support: `>=22.0.0`
- npm support: `>=9.0.0`
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `verify`

## Phase 02 Baseline

- User prompt states Prompt 01 acceptance passed. Codex did not mark Phase 01 as `PASS`.
- Canonical canvas: 1280x720.
- Vertical zones: 25% skyline, 45% alley, 30% rooftop.
- Lanes: `back_shop`, `mid_sidewalk`, `front_road`.
- Debug overlay: `L` key.
- E2E viewports: 1280x720, 1920x1080, 390x844.

## Phase 03 Baseline

- User prompt states Prompt 02 acceptance passed. Codex did not mark Phase 02 as `PASS`.
- Input actions: `left`, `right`, `throw`, `aim`, `switchPrev`, `switchNext`.
- Keyboard mapping: A/D, ArrowLeft/ArrowRight, Space, Shift, Q/E.
- Simultaneous left/right rule: neutral.
- Player movement is horizontal only and clamped to rooftop movement bounds.
- Movement parameters live in `src/data/playerMovement.ts`.

## Phase 04 Baseline

- User prompt states Prompt 03 acceptance passed. Codex did not mark Phase 03 as `PASS`.
- Projectile units: canonical pixels, px/s velocity, px/s^2 gravity and wind.
- Ordinary projectile config: `src/data/projectileConfig.ts`.
- Default wind: `0`.
- Debug wind controls: `[` decreases wind, `]` increases wind.
- Aim assist: hold `Shift`.
- Throw: `Space`.

## Phase 05 Baseline

- User prompt states Prompt 04 acceptance passed. Codex did not mark Phase 04 as `PASS`.
- NPC seed: `phase-05-seed`.
- NPC types: `office_worker`, `phone_user`, `jogger`.
- NPC states: `Entering`, `Walking`, `Distracted`, `Exiting`.
- Max active NPCs: 8.
- Spawn overflow strategy: skip and count.

## Phase 06 Baseline

- User prompt states Prompt 05 acceptance passed. Codex did not mark Phase 05 as `PASS`.
- New NPC states: `Hit`, `Ranting`, `Recovering`.
- Gameplay events: `PROJECTILE_HIT`, `NPC_RANT_STARTED`, `NPC_RECOVERED`.
- Hit token: `projectileId:npcId:hitWindowId`.
- Ordinary projectile recycles after a legal hit.
- Formal score, combo, and alert remain unimplemented.

## Phase 07 Baseline

- User prompt states Prompt 06 acceptance passed. Codex did not mark Phase 06 as `PASS`.
- Score source: validated `NPC_RANT_STARTED` gameplay event.
- Score formula: base x poop adaptation x combo x precision x risk x repeat-hit + special event score.
- Combo base window: 3 seconds.
- Precision hit combo extension: 0.5 seconds for `perfect` and `clean` grades.
- Combo thresholds: 3, 6, 10, 15, 20, 30.
- Air throw miss penalty: subtracts 0.75 seconds from combo window.
- Hit/rant/recover states pause combo timer as explicit hit-stop behavior.

## Phase 08 Baseline

- User prompt states Prompt 07 acceptance passed. Codex did not mark Phase 07 as `PASS`.
- Alert range: 0-100.
- Alert stages: safe, suspicious, high_alert, exposed_soon, caught.
- Alert sources: normal hit, rapid throw, repeat hit, stationary exposed position, idle decay, cover decay.
- Cover uses `WorldLayout` rooftop cover slots through shared `CoverVisibility`.
- High alert raises score risk multiplier.
- Caught state latches game over and retry resets runtime state.

## Phase 09 Baseline

- User prompt states Prompt 08 acceptance passed. Codex did not mark Phase 08 as `PASS`.
- Poop types: `normal_poop`, `sticky_poop`, `splash_poop`, `jumbo_poop`.
- Switch controls: Q previous, E next.
- HUD shows selected poop type, stock, and cooldown.
- Tactical fields: physics, stock, cooldown, score multiplier, alert cost, skill floor, best against, weak against, and capability.
- Sticky effect rule: same poop type refreshes the slow effect instance.
- Splash effect rule: one splash effect instance can affect each NPC once.
- Jumbo effect rule: slower/heavier trajectory, longer cooldown, higher alert cost, and `breaksDefense` marker.

## Phase 10 Baseline

- User prompt states Prompt 09 acceptance passed. Codex did not mark Phase 09 as `PASS`.
- Poop types now cover eight entries: normal, sticky, splash, jumbo, bouncy, stink, split, and golden.
- Arsenal sandbox: Alt+1 through Alt+8 selects each poop type for debug acceptance.
- Projectile state carries its own config/rules to prevent later selection changes from mutating active projectiles.
- Bouncy uses tagged `rooftop_floor` surface capability and one configured bounce.
- Stink creates environmental effect zones with lifecycle, slow effect, alert pressure, stats, and cleanup.
- Split creates three child projectiles with generation and global active-count limits.
- Golden uses rare stock, higher score multiplier, special score bonus, and combo extension only through legal rant scoring.

## Phase 11 Baseline

- User prompt states Prompt 10 acceptance passed. Codex did not mark Phase 10 as `PASS`.
- NPC roster now covers 11 types: office worker, phone user, jogger, umbrella pedestrian, delivery rider, dog walker, cleaner, angry pedestrian, camera pedestrian, tourist, and security guard.
- NPC capabilities use tags/composition: umbrella shield, dog alert, cleaner, retaliate, recording, tourist group, and security.
- NPC danger behavior follows telegraph -> active -> recovery fields.
- NPC x poop interaction matrix is data-driven with safe defaults for missing combinations.
- Debug NPC sandbox can spawn roster entries through Alt+Shift+1..9/0/- and debug API.

## Phase Table

| Phase | Status | Evidence |
|---:|---|---|
| 00 | READY_FOR_REVIEW | `docs/evidence/PHASE_00.md` |
| 01 | READY_FOR_REVIEW | `docs/evidence/PHASE_01.md` |
| 02 | READY_FOR_REVIEW | `docs/evidence/PHASE_02.md` |
| 03 | READY_FOR_REVIEW | `docs/evidence/PHASE_03.md` |
| 04 | READY_FOR_REVIEW | `docs/evidence/PHASE_04.md` |
| 05 | READY_FOR_REVIEW | `docs/evidence/PHASE_05.md` |
| 06 | READY_FOR_REVIEW | `docs/evidence/PHASE_06.md` |
| 07 | READY_FOR_REVIEW | `docs/evidence/PHASE_07.md` |
| 08 | READY_FOR_REVIEW | `docs/evidence/PHASE_08.md` |
| 09 | READY_FOR_REVIEW | `docs/evidence/PHASE_09.md` |
| 10 | READY_FOR_REVIEW | `docs/evidence/PHASE_10.md` |
| 11 | READY_FOR_REVIEW | `docs/evidence/PHASE_11.md` |
| 12 | READY_FOR_REVIEW | `docs/evidence/PHASE_12.md` |
| 13 | READY_FOR_REVIEW | `docs/evidence/PHASE_13.md` |
| 14 | READY_FOR_REVIEW | `docs/evidence/PHASE_14.md` |
| 15 | READY_FOR_REVIEW | `docs/evidence/PHASE_15.md` |
| 16 | READY_FOR_REVIEW | `docs/evidence/PHASE_16.md` |
| 17 | READY_FOR_REVIEW | `docs/evidence/PHASE_17.md` |
| 18 | READY_FOR_REVIEW | `docs/evidence/PHASE_18.md` |
| 19 | READY_FOR_REVIEW | `docs/evidence/PHASE_19.md` |
| 20 | READY_FOR_REVIEW | `docs/evidence/PHASE_20.md` |
| 21 | READY_FOR_REVIEW | `docs/evidence/PHASE_21.md` |
| 22 | READY_FOR_REVIEW | `docs/evidence/PHASE_22.md` |
| 23 | READY_FOR_REVIEW | `docs/evidence/PHASE_23.md` |
| 24 | READY_FOR_REVIEW | `docs/evidence/PHASE_24.md` |
| 25 | NOT_STARTED | |
