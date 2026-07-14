# Architecture

## Chosen Stack

- Phaser 3 for rendering, input, audio, camera, and browser runtime.
- TypeScript for all source.
- Vite for dev server and build.
- Vitest for pure domain and adapter unit tests.
- Playwright for browser and smoke/e2e checks.
- npm as package manager.

## Source Boundaries

Planned structure:

```text
src/
  scenes/
  domain/
  systems/
  entities/
  data/
  ui/
  assets/
tests/
  unit/
  integration/
  e2e/
assets/
  data/
  images/
  audio/
docs/
  phases/
  evidence/
```

## Responsibilities

### `scenes`

Phaser scene lifecycle, composition, asset loading, camera setup, input wiring, and visual synchronization. Scenes call adapters and dispatch commands but do not contain scoring, alert, NPC, projectile, or combo rules.

### `domain`

Pure deterministic rules and data types: throw simulation, NPC state transitions, score calculation, combo windows, alert changes, level timers, RNG interfaces, and event reduction. Domain code must not import Phaser or browser globals.

### `systems`

Runtime coordination around domain rules. Systems translate Phaser time/input/collisions into domain commands and translate domain events into render/audio/UI effects.

### `entities`

Runtime object models and IDs for player, NPCs, projectiles, poop inventory, hazards, reactions, and level sessions. Entity state must be serializable enough for tests and debugging.

### `data`

Typed loaders and validation for level, NPC, poop, score, combo, alert, spawn, and presentation data. Static authored data should be JSON-compatible.

### `ui`

HUD, pause, results, meters, inventory, tutorial text, and acceptance/debug overlays. UI reads state and dispatches commands; it must not mutate domain rules directly.

### `assets`

Sprites, audio, fonts, and generated or placeholder media. Placeholder assets are allowed for validation, but must be named as placeholders and not encode rules.

### `tests`

Unit tests target pure domain first. Integration tests validate adapter/event flow. Playwright checks browser boot, canvas rendering, input flow, and acceptance traces.

## Event Flow

1. Input creates an explicit command, such as `MovePlayer`, `ThrowPoop`, `Hide`, or `SelectPoop`.
2. Systems attach injected time, seeded RNG, and current level context.
3. Domain reducers return new state plus domain events.
4. Systems map domain events to Phaser effects, audio, UI, and telemetry.
5. Evidence logs record seed, level, commands, emitted events, entity counts, timers, and listener/session cleanup where relevant.

## Foundation Lifecycle Baseline

- `registerSceneDisposer` owns paired `SHUTDOWN` and `DESTROY` hooks and removes both when either fires, so scene restarts do not retain the unused counterpart.
- `InputAdapter` owns keyboard, blur, visibility, pause, and resume bindings. Blur, hidden-tab, pause, resume, and dispose clear all held/transient actions.
- The game simulates in the canonical 1280x720 coordinate system. Phaser `FIT` scales the canvas at the presentation boundary; `WorldLayout` remains the single source for zones, lanes, rooftop bounds, and covers.
- Projectile prediction and runtime simulation call `ProjectileTrajectory.positionAt`; the Phaser adapter pools inactive views and destroys active plus pooled views on scene shutdown.

## Core Loop Lifecycle Baseline

- Collision emits only `PROJECTILE_HIT` and stores immutable pending-rant context on the NPC. The pure state-transition collector emits `NPC_RANT_STARTED` on `Hit -> Ranting` and `NPC_RECOVERED` only after recovery has restored leftward movement.
- Score consumes `NPC_RANT_STARTED` and rejects duplicate `eventId` values. UI remains a subscriber and never awards points.
- Hit tokens are scoped to projectile, NPC, and hit window, then removed when the owning projectile recycles.
- Pure NPC state is separate from Phaser NPC views. Active views return to a reusable pool on NPC exit, and active plus pooled views are destroyed on scene shutdown.
- Reaching `caught` latches the frame before later systems can mutate score, combo, or alert. Retry reinitializes RNG, NPCs, projectiles, hit tokens, events, score/combo, alert history, projectile wind/config, timers, and the caught latch.
- GameScene shutdown owns EventBus unsubscription. Retry must preserve stable scene and EventBus listener counts rather than accumulating handlers.

## Level Runtime

- `LevelDefinition` is immutable JSON-compatible data loaded through runtime validation. Invalid definitions throw one diagnostic error before a session starts.
- `LevelDirector` is a pure reducer for countdown, running, paused, and settled phases. It owns the level clock, objective completion latch, attempt/session id, metrics, outcome, and immutable result snapshot.
- `ObjectiveSystem` evaluates the target score. `StarEvaluation` separately evaluates score, highest combo, and strict accuracy conditions; stars do not decide basic level success.
- Every gameplay event carries the active LevelSession id. GameScene ignores scoring events from another session, and restart clears event/token collections before creating the next attempt.
- HUD renders level and result snapshots received through the typed EventBus. It does not calculate score, accuracy, stars, or outcome.
- Authored level spawn tables and available poop types override general sandbox content. Development sandboxes can still expose the full roster/arsenal without changing the authored Level 1 definition.
- Retry increments the deterministic attempt id while preserving the level seed and reinitializing RNG, entities, timers, score/combo, alert, effects, listeners, and level metrics.

## Data-Driven Rules

- Level duration, target score, spawn tables, lane definitions, weather, wind, unlocks, and star goals are data.
- NPC speed, value, reaction timings, hit radius, alert behavior, and special behaviors are data.
- Poop weight, speed, flight time, collision radius, cooldown, inventory, effects, and alert cost are data.
- Score, combo, alert thresholds, and multipliers are data with typed validation.

## Layout Rules

- World layout starts from one canonical coordinate system: the 1280x720 game canvas.
- Vertical zones are defined as 25% skyline, 45% alley, and 30% rooftop.
- Lane, cover, boundary, and depth values come from `src/domain/layout/WorldLayout.ts`.
- Scene code renders layout data; it must not scatter independent resolution-specific pixel constants.
- Phaser scale mode preserves the 16:9 play area across browser sizes.

## Depth Rules

Depth constants live in `src/domain/layout/Depth.ts`.

- Background: far, mid, near.
- Alley: back, mid, front lanes.
- Rooftop: base area and cover reservations.
- Future gameplay: projectile above rooftop/lane entities, particles above projectile, debug above world, HUD above all world layers.

## Input and Movement Rules

- `InputAdapter` maps keyboard and future touch sources into the same action state.
- Actions are `left`, `right`, `throw`, `aim`, `switchPrev`, and `switchNext`.
- Action state distinguishes `pressed`, `held`, and `released`.
- Held one-shot actions must not repeat `pressed` every frame.
- Simultaneous left and right input resolves to neutral movement.
- Window blur, tab visibility loss, and scene disposal clear held input.
- Player movement uses delta seconds, acceleration, deceleration, max speed, and layout bounds.
- Player movement parameters live in data/config, not in scene literals.

## Projectile Rules

- Projectile coordinates use the canonical world pixel coordinate system.
- Velocity is pixels per second.
- Gravity and wind acceleration are pixels per second squared.
- Pure trajectory prediction lives in `src/domain/projectile/ProjectileTrajectory.ts`.
- Projectile cooldown, active projectile cap, lifetime, radius, gravity, wind, and initial velocity are data.
- Prediction and simulation must call the same trajectory functions.
- Aim assist may render predicted path and landing, but must not introduce hidden hit chance.
- Projectile instances carry a data-driven poop type so collision/effects can resolve behavior without guessing from visuals.
- Debug wind is a runtime modifier layered on top of selected poop projectile data; prediction and fired projectile simulation must use the same merged config.
- Active projectile instances carry their own config and poop projectile rules; switching inventory must not mutate already-fired projectiles.
- Bounces use surface tags/material capabilities, not object names.
- Split child projectiles carry parent id and generation; generation and global active projectile caps prevent exponential growth.

## Poop Inventory and Tactical Effect Rules

- Poop definitions live in `src/data/poopDefinitions.ts`; runtime inventory and effect logic must not mutate definition data.
- Poop runtime rules live under `src/domain/poop` and are pure TypeScript.
- `PoopInventory` owns selected slot, stock, cooldown, and Q/E switching.
- `PoopBehaviorStrategy` resolves capability effects for legal projectile/NPC hits.
- Strategies are capability-based (`normal`, `sticky`, `splash`, `jumbo`) instead of scattering large switches in collision code.
- Every effect gets a stable effect instance id derived from projectile, poop type, and impact window.
- Sticky effects refresh an existing same-poop slow effect on the same NPC instead of stacking unlimited multipliers.
- Splash effects dedupe by effect instance id so one explosion cannot affect the same NPC twice in the same frame.
- Jumbo poop marks `breaksDefense` for future defense objects, but Phase 09 does not implement defense objects.
- Bouncy poop can bounce only on surfaces whose tags match its capability data.
- Stink poop creates `EnvironmentalEffectZone` domain state with lifetime, radius, slow multiplier, alert pressure, stats, and cleanup hooks for future cleaner systems.
- Split poop spawns bounded child projectiles from data-driven timing/count/spread rules.
- Golden poop may add score and combo extension only when a legal `NPC_RANT_STARTED` event reaches scoring.
- Balance fields `skillFloor`, `bestAgainst`, `weakAgainst`, and `alertCost` are required to keep special poop tactical rather than pure upgrades.
- Debug arsenal sandbox uses Alt+1 through Alt+8 for acceptance and does not replace normal Q/E inventory switching.

## NPC Rules

- NPC definitions are readonly data.
- Runtime NPC state must not mutate definition data.
- NPCs spawn from the right side and move left.
- Lane y, scale, depth, and speed multiplier come from `WorldLayout`.
- Spawn type, type weights, lane weights, interval, max active count, and seed are data.
- Spawn overflow strategy is skip-and-count, not queue-and-burst.
- NPC state machine is pure domain logic; Phaser only maps state to placeholder visuals.
- Phase 05 states are `Entering`, `Walking`, `Distracted`, and `Exiting`.
- Phase 06 adds `Hit`, `Ranting`, and `Recovering` as pure NPC states.
- Legal projectile hits are geometric checks against active projectiles and hittable NPC states; they do not use hidden hit chance.
- A hit moves the NPC to `Hit`, stops movement immediately, increments `validHitCount`, emits `PROJECTILE_HIT`, and records the validated context needed by the later rant transition.
- The pure state-transition collector emits `NPC_RANT_STARTED` only on `Hit -> Ranting`; scoring subscribes to this event instead of projectile collision.
- Rant duration, immunity, and reaction level are data in `src/data/npcHitRules.ts`.
- Each projectile/NPC/hit-window combination has one hit token to prevent repeated collision callbacks from producing duplicate hits.
- `Recovering` is immune; a NPC can be hit again only after restoring leftward movement and returning to `Walking` or `Distracted`, which advances its hit window and emits `NPC_RECOVERED`.
- NPC Phaser views are pooled independently from pure NPC state; pool size is bounded by peak concurrent views and all views are destroyed on shutdown.
- Phase 11 NPC roster uses tags and composed abilities instead of type-specific scene branches.
- NPC abilities include umbrella shield, dog alert, cleaner, retaliation, recording, tourist group behavior, and security observation/search.
- Dangerous NPC behavior stores `dangerPhase`, `dangerKind`, and timer fields; behavior must pass through telegraph, active, and recovery phases.
- NPC x poop interactions live in a data matrix with safe default behavior for missing pairs.
- Umbrella blocking, interaction alert deltas, and interaction score deltas are resolved in domain hit logic.
- Cleaner systems clear environmental effect zones through the shared zone cleanup interface.
- Debug NPC sandbox is development-only and exposes deterministic spawn/clear commands for acceptance.

## Score and Combo Rules

- Score calculation lives in pure domain code under `src/domain/score`.
- Score rules live in `src/data/scoreRules.ts` and include base scores, precision grades, combo thresholds, repeat-hit multipliers, miss penalty, and default phase multipliers.
- The Phase 07 formula is base score x poop adaptation x combo multiplier x precision multiplier x risk multiplier x repeat-hit multiplier + special event score.
- Poop adaptation multiplier is keyed by poop type and comes from score rules.
- Score may only be created from validated gameplay events. Phase 07 scores `NPC_RANT_STARTED`, not raw collision.
- Every score change produces an immutable `ScoreBreakdown` with `eventId`, NPC, ammo, multipliers, and final score.
- Score processing is idempotent by `eventId`; replaying an already-scored rant cannot add score or combo.
- Precision is deterministic distance grading, not hidden chance.
- Combo uses game delta time. Scene pause/tab hidden stops updates naturally because Phaser does not call the gameplay update loop.
- Phase 07 treats `Hit`, `Ranting`, and `Recovering` as a hit-stop window that pauses the combo timer while the player reads the reaction.
- HUD renders score state received from the gameplay event bus; HUD does not calculate score.

## Alert, Cover, and Failure Rules

- Alert logic lives in pure domain code under `src/domain/alert`.
- Alert rules live in `src/data/alertRules.ts` and define source values, decay rates, stationary thresholds, stage boundaries, and risk multipliers.
- Alert value is clamped to 0-100.
- Alert stages are `safe`, `suspicious`, `high_alert`, `exposed_soon`, and `caught`.
- Alert changes preserve recent source records for HUD/debug; systems must not mutate a bare number without a source.
- Cover checks use shared `CoverVisibility` rules against `WorldLayout` rooftop cover slots.
- Stopping throws slowly decays alert; standing in cover accelerates decay.
- Normal hits, rapid throw attempts, repeated hits, and staying exposed in one position increase alert.
- Score risk multiplier reads the current alert stage when scoring a validated rant event.
- `caught` is a one-way game-over latch. After it is set, gameplay update returns early and later input/projectile/NPC events cannot change score, combo, or alert until retry.
- Alert stage thresholds are injected through `AlertRules`; reset creates a clean value, stage, source history, and stationary tracker.
- Retry restarts the GameScene and explicitly resets alert, score, combo, projectiles, projectile config/wind, NPCs, hit tokens, event logs, RNG, timers, and failure state.

## Seeded RNG

- Every random decision must receive an injected RNG instance.
- Seeds must be logged in evidence and manual acceptance steps.
- Domain tests must be reproducible with fixed seeds.
- Visual-only randomness may be separate, but must not affect rules.

## Naming

- Types and classes: `PascalCase`.
- Functions, variables, and commands: `camelCase`.
- Files with a main exported type or class: `PascalCase.ts`.
- Data files and IDs: `kebab-case` for filenames, `snake_case` for stable content IDs.
- Phase docs: `PHASE_XX.md`.
