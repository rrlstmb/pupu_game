# Acceptance Checklist

Use this file as the review checklist for every phase. Status values are `MET`, `NOT MET`, or `BLOCKED`.

## Every Phase

- [ ] Current phase is identified in `docs/STATUS.md`.
- [ ] Dependencies are `PASS`, unless the phase has none.
- [ ] `git status --short` was recorded before edits.
- [ ] User changes were preserved.
- [ ] Scope matches the assigned phase.
- [ ] `docs/phases/PHASE_XX.md` exists.
- [ ] `docs/evidence/PHASE_XX.md` exists.
- [ ] Commands, exit codes, and test counts are recorded.
- [ ] `docs/DECISIONS.md` records reversible assumptions.
- [ ] `docs/STATUS.md` is `READY_FOR_REVIEW` or `BLOCKED`, never self-marked `PASS`.

## Architecture

- [ ] Pure domain rules are separated from Phaser scene code.
- [ ] Time, RNG, state, and data are injectable where relevant.
- [ ] Level/NPC/poop/score/alert rules are data driven where relevant.
- [ ] Events and state transitions are documented or tested where relevant.

## Testing

- [ ] Targeted tests ran when code changed.
- [ ] Lint ran when available.
- [ ] Typecheck ran when available.
- [ ] Unit tests ran when available.
- [ ] Build ran when available.
- [ ] Playwright/e2e ran when UI or browser flow changed.
- [ ] Missing scripts are recorded as absent, not passing.

## Manual Acceptance

- [ ] Startup steps are listed.
- [ ] Fixed seed and level are listed when simulation exists.
- [ ] Operator steps are specific.
- [ ] Expected behavior is concrete.
- [ ] Evidence path is listed.

## Phase 00

- [ ] `AGENTS.md` exists.
- [ ] `docs/PRODUCT_INVARIANTS.md` exists.
- [ ] `docs/CODEX_CONTRACT.md` exists.
- [ ] `docs/ARCHITECTURE.md` exists.
- [ ] `docs/ROADMAP.md` lists 26 phases and 6 Release Gates.
- [ ] `docs/ACCEPTANCE.md` exists.
- [ ] `docs/DECISIONS.md` exists.
- [ ] `docs/STATUS.md` exists and is not `PASS`.
- [ ] `docs/QUALITY_GATES.md` exists.
- [ ] No formal gameplay was implemented.

## Per-Prompt Checklist Index

Each row is a required review checklist. Apply the universal architecture, testing, and manual-acceptance checks above in addition to the prompt-specific focus below. Detailed criteria remain authoritative in `docs/CODEX_PHASE_PLAN.md` and the matching `docs/phases/PHASE_XX.md`.

| Prompt | Acceptance Focus | Review |
|---:|---|---|
| 01 | Stable npm/Vite/Phaser scaffold, scene navigation, strict TypeScript, CI-equivalent scripts, lifecycle disposal | [ ] |
| 02 | 25/45/30 zones, three data-driven lanes/parallax layers, rooftop bounds/covers, canonical coordinates, responsive FIT canvas | [ ] |
| 03 | Horizontal-only movement, action transitions, neutral opposite input, blur/hidden/pause clearing, bounded delta-time motion, no duplicate handlers | [ ] |
| 04 | Shared deterministic trajectory, five golden cases, aim/actual landing agreement, cooldown, active cap, view pool and recycling | [ ] |
| 05 | Seeded right-to-left NPC schedule, three base types, lane behavior, state/pool limits | [ ] |
| 06 | Legal hit token, hit/rant/recover loop, immunity, repeat hit after walking | [ ] |
| 07 | Rant-sourced score breakdown, precision, combo thresholds/window, deterministic HUD state | [ ] |
| 08 | Alert stages/sources, cover decay, risk multiplier, caught latch, clean retry | [ ] |
| 09 | Sticky/splash/jumbo strategies, inventory/cooldown, effect identity and tactical tradeoffs | [ ] |
| 10 | Bounce/stink/split/golden lifecycle, coexistence, global limits, arsenal sandbox | [ ] |
| 11 | Full NPC roster, composed abilities, telegraph/active/recovery, validated interaction matrix | [ ] |
| 12 | Validated level schema, timer/goals/stars, deterministic 90-second Level 1 vertical slice | [ ] |
| 13 | Level 2 authored decision and regression | [ ] |
| 14 | Level 3 authored decision and regression | [ ] |
| 15 | Level 4 authored decision and regression | [ ] |
| 16 | Level 5 authored decision and regression | [ ] |
| 17 | Level 6 authored decision and regression | [ ] |
| 18 | Level 7 authored decision and regression | [ ] |
| 19 | Level 8 authored decision and regression | [ ] |
| 20 | Level 9 authored decision and regression | [ ] |
| 21 | Level 10/Boss authored decision and full-campaign regression | [ ] |
| 22 | Hit feel, visual/audio feedback, opening, accessibility-safe presentation | [ ] |
| 23 | Progression, unlocks, titles, versioned local save, game modes | [ ] |
| 24 | Touch controls, responsive layouts, usability, accessibility | [ ] |
| 25 | Full automated/manual QA, performance budgets, balance tooling, release-candidate evidence | [ ] |

## Release Gate Checklists

### Gate A: Technical and Feel Baseline

- [ ] Contracts, architecture, roadmap, acceptance, decision log, status, and quality gates agree on Prompts 00-04 and Gate A.
- [ ] `lint`, `typecheck`, unit tests, build, and applicable e2e pass with recorded exit codes.
- [ ] GameScene can be entered and exited 10 times without listener, timer, entity, or debug-session growth.
- [ ] 1280x720, 1920x1080, and 390x844 preserve the 16:9 canvas and canonical world layout.
- [ ] Horizontal movement remains bounded and input clears on blur, hidden-tab, pause, resume, and shutdown.
- [ ] Prediction and simulation use the same trajectory source and satisfy golden/tolerance tests.
- [ ] Projectile cooldown, cap, pool reuse, landing/expiry, and shutdown cleanup are verified.
- [ ] No Blocker or Critical finding remains.

### Gate B: Core Loop MVP

- [ ] Seeded NPCs enter right, move left through data-driven lanes, exit, and reuse pooled views.
- [ ] Legal collision emits one hit; rant transition emits one score event; recovery restores movement before the next valid hit.
- [ ] Score is deterministic and idempotent; combo window, thresholds, timeout, hit stop, and reset use game time.
- [ ] Alert sources, decay, data-driven stages, risk reward, caught latch, and clean reset are verified.
- [ ] Retry clears NPCs, projectiles, tokens, score/combo, alert history, timers, events, wind/config, and preserves listener counts.
- [ ] A browser acceptance test proves the complete observe/throw/hit/rant/score/combo/alert/recover/repeat loop.
- [ ] No Blocker or Critical finding remains.

### Gates C-F

- [ ] Gate C validates Prompts 09-12 as one Level 1 vertical slice.
- [ ] Gate D validates Prompts 13-21 as the complete ten-level campaign.
- [ ] Gate E validates Prompts 22-24 as a coherent product experience.
- [ ] Gate F validates Prompt 25 as a release candidate.
