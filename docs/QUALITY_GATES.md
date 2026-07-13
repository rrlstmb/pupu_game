# Quality Gates

## Release Gate Map

| Gate | Required Prompts | Acceptance Focus |
|---|---|---|
| A | 00-04 | Contracts, toolchain, scene lifecycle, layout, horizontal input, deterministic trajectory, aim/landing agreement, projectile recycling |
| B | 05-08 | NPC loop, legal hit/rant/recover, score/combo, alert/failure/reset |
| C | 09-12 | Tactical arsenal, NPC interaction matrix, Level 1 vertical slice |
| D | 13-21 | Authored Levels 2-10 and campaign regression |
| E | 22-24 | Feel, audio, progression/save, touch, responsive UX, accessibility |
| F | 25 | Full QA, performance, balance evidence, release candidate |

No gate introduces features. A failed gate receives the smallest compatible repair and a regression test before it is re-run.

## Automated Gates

- Install succeeds with the chosen package manager.
- Lint succeeds.
- Typecheck succeeds.
- Unit tests succeed.
- Build succeeds.
- Playwright/e2e succeeds when UI or browser flow changes.
- Missing commands must be recorded as absent until the scaffold phase adds them.

## Manual Gates

- Current phase acceptance checklist is complete.
- Manual reproduction steps include startup, seed, level, actions, expected behavior, and evidence path.
- No phase is self-marked `PASS` by Codex.
- User changes are preserved.

## Performance Gates

To be measured after runtime exists:

- Browser boot smoke test completes without console errors.
- Canvas renders nonblank content for UI/gameplay phases.
- Domain simulation remains deterministic for the same seed.
- Entity, listener, timer, and session counts are checked after restart/retry flows when those systems exist.

## Regression Gates

- Targeted regression tests cover changed domain behavior.
- Browser smoke/e2e covers changed UI or flow.
- Previous phase evidence remains valid or is intentionally superseded.
- Data schema changes include migration or compatibility notes.

## Evidence Gates

Each phase must write `docs/evidence/PHASE_XX.md` with:

- Commands
- Exit codes
- Pass/fail
- Test counts
- Baseline vs regression labels
- Fixed seeds and levels when applicable
- Known limitations
- Acceptance comparison
