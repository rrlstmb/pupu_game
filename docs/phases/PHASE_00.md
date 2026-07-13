# Phase 00: Project Audit, Technical Decision, Development Contract

## Section

Foundation

## Status

READY_FOR_REVIEW

## Dependencies

None. This is the first phase.

## Scope

- Audit repository contents.
- Read `pupu_game_plan.txt`.
- Classify requirements into core gameplay, content, presentation, and long-term modes.
- Choose the web game stack.
- Establish development contract, architecture boundaries, product invariants, roadmap, acceptance process, quality gates, and status tracking.
- Create `docs/phases/` and `docs/evidence/` conventions.

## Design

Phase 00 is documentation-only. Because the repository is effectively empty except for the user-provided plan, it fixes a conservative stack and prepares the project for incremental implementation.

The selected stack is:

- Phaser 3
- TypeScript
- Vite
- Vitest
- Playwright
- npm

The planned architecture separates:

- `scenes`: Phaser lifecycle and rendering
- `domain`: pure deterministic rules
- `systems`: adapters and orchestration
- `entities`: serializable runtime state
- `data`: typed game configuration
- `ui`: HUD and menus
- `assets`: media and data files
- `tests`: unit, integration, and e2e checks

## Interfaces

No runtime code or public TypeScript interfaces are created in this phase.

Future phase interfaces must support:

- Injected time source
- Injected seeded RNG
- Serializable game state
- Data-driven level/NPC/poop/score/alert definitions
- Domain events emitted before Phaser presentation effects

## Requirement Classification

### Core Gameplay

Rooftop horizontal movement, predictable throwing, NPC right-to-left movement, target timing, hit/rant/recover, score, combo, alert, repeated-hit risk, tactical poop selection, and 90-second MVP loop.

### Content

10 levels, NPC roster, poop roster, star goals, unlocks, dialogue, special events, boss structure, titles, and long-form authored progression.

### Presentation

Cartoon city layers, readable rooftop/alley composition, hit stop, camera shake, particles, HUD, audio layers, intro, results, and comedic feedback.

### Long-Term Modes

Endless mode, daily challenge, precision mode, frenzy mode, achievements, cosmetics, leaderboards, events, and social sharing.

## Non-Goals

- No player movement implementation.
- No throwing implementation.
- No NPC implementation.
- No scoring implementation.
- No Phaser scene implementation.
- No package scaffold.
- No art/audio asset import.

## Directory Conventions

- Phase specs: `docs/phases/PHASE_XX.md`
- Evidence: `docs/evidence/PHASE_XX.md`
- Architecture/contract/status docs: `docs/*.md`
- Future source: `src/*` as described in `docs/ARCHITECTURE.md`

