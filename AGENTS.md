# Codex Project Rules for Shiming Bida

This repository uses these rules for every Codex session.

## Current Stack

- Game runtime: Phaser 3
- Language: TypeScript
- Build tool: Vite
- Unit tests: Vitest
- Browser/e2e tests: Playwright
- Package manager: npm

The Phase 01 scaffold is active and provides Vite, Phaser scenes, Vitest, Playwright, and npm scripts.

## Non-Negotiable Product Rules

- NPCs enter from the right and move left.
- The player stays on the rooftop and only moves horizontally.
- Throws are deterministic and learnable, never hidden hit chance.
- Time, random, state, and data must be injectable and reproducible.
- Level, NPC, poop, score, and alert behavior must be data driven.
- A hit must drive an NPC reaction; scoring is tied to the rant/reaction event.
- Special poop types must have tactical tradeoffs, not pure upgrades.
- The final game targets 10 authored story levels.

## Scope Control

- Work only on the currently assigned phase.
- Do not implement later-phase gameplay early.
- Do not perform unrelated rewrites or whole-repo formatting.
- Do not modify or remove user changes unless explicitly asked.
- Do not push.
- Do not mark any phase as `PASS`; only the user/reviewer may do that.

## Required Before Edits

1. Run `git status --short`.
2. Read `AGENTS.md`, `pupu_game_plan.txt`, `docs/PRODUCT_INVARIANTS.md`, `docs/ARCHITECTURE.md`, `docs/STATUS.md`, and relevant previous evidence when present.
3. Confirm the current phase and dependencies.
4. Run available baseline commands, or record why they do not exist.

## Required Reporting

Final reports must include:

- Status: `READY_FOR_REVIEW` or `BLOCKED`.
- Completed work and intentionally omitted work.
- Added, modified, and deleted files.
- Architecture decisions and whether `docs/DECISIONS.md` changed.
- Test evidence with commands, exit codes, pass/fail, test count, and baseline/regression labels.
- Manual acceptance steps.
- Acceptance checklist with `MET`, `NOT MET`, or `BLOCKED`.
- Known limitations and next-phase risks.

## Test Commands

- Install: `npm install`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Unit tests: `npm run test`
- Build: `npm run build`
- E2E: `npm run test:e2e`
- CI-equivalent local verification: `npm run verify`

## Forbidden

- `git reset --hard`
- `git clean -fd`
- Force push
- Hidden hit rates
- Placeholder gameplay rules pretending to be complete
- Mixing pure domain rules into Phaser scene code
- Advancing `docs/STATUS.md` to `PASS`
