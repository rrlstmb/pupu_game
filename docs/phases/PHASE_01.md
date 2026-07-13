# Phase 01: Project Scaffold, Toolchain, and Scene Lifecycle

## Section

Foundation

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 00 acceptance was declared passed by the user prompt. Codex did not mark Phase 00 as `PASS`.

## Scope

- Create the Vite + TypeScript + Phaser 3 project scaffold.
- Enable strict TypeScript.
- Add npm lockfile and a single package manager strategy.
- Add scene lifecycle layers: Boot, Preload, Menu, Game, and HUD.
- Add centralized `GameConfig`, `SceneKeys`, `GameEvents`, and typed event bus.
- Add placeholder asset generation so the app boots without real art.
- Add 16:9 canvas configuration with Phaser scale fit mode.
- Add development debug access under `window.__SHIMING_BIDA_DEBUG__`.
- Add npm scripts for dev, build, lint, typecheck, unit tests, e2e, and verify.
- Add Vitest and Playwright coverage for config, event bus, and menu-to-game flow.

## Design

The scaffold is intentionally playable only as a shell. The menu starts an empty GameScene and the GameScene can return to the menu. HUDScene launches with GameScene to establish scene layering.

Phaser is kept out of pure utility tests where possible. The event bus is implemented as a small TypeScript class rather than directly exposing Phaser's emitter, so unit tests can run in a Node environment.

The game uses a 1280x720 baseline canvas and Phaser `Scale.FIT` with `CENTER_BOTH`, preserving the 16:9 play area during browser resizing.

## Interfaces

- `GAME_CONFIG`: centralized runtime constants and debug flag.
- `SceneKeys`: stable keys for Boot, Preload, Menu, Game, and HUD.
- `GameEvents`: lifecycle and navigation events.
- `TypedEventBus`: explicit `on`, `off`, `once`, `emit`, `listenerCount`, and `removeAllListeners`.
- `registerSceneDisposer`: binds cleanup to Phaser shutdown and destroy events.
- `createPhaserConfig`: maps project config into Phaser core config.

## Dispose / Shutdown Rules

- Scene listeners registered on interactive objects must be removed in the scene disposer.
- Scene shutdown emits a `scene:shutdown` event.
- GameScene stops HUDScene on shutdown.
- EventBus listeners must be explicitly removed by the owner that added them.
- E2E verifies menu -> game -> menu re-entry and records active scene checks.

## Placeholder Asset Strategy

PreloadScene generates a `placeholder-tile` texture at runtime. This keeps boot independent from formal art and prevents asset placeholders from encoding gameplay rules.

## Non-Goals

- No player movement.
- No throwing.
- No NPC spawning.
- No scoring.
- No level content.
- No formal background, character, poop, or audio assets.

