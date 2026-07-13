# Phase 03: Player Horizontal Movement and Input Abstraction

## Section

Foundation

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 02 acceptance was declared passed by the user prompt. Codex did not mark Phase 02 as `PASS`.

## Scope

- Add an input abstraction layer.
- Map keyboard input to common actions for future keyboard/touch parity.
- Add pure action state with `pressed`, `held`, and `released`.
- Add data-driven horizontal player movement.
- Clamp the placeholder player to rooftop movement bounds.
- Render placeholder player states: `idle`, `move`, and `nervous`.
- Clear held input on blur, visibility loss, pause-equivalent cleanup, and scene disposal.
- Verify scene re-entry does not duplicate input handler count.

## Design

Input is split into two layers:

- `ActionStateStore`: pure domain input state.
- `InputAdapter`: Phaser/browser adapter that maps real events into actions.

Movement is pure domain logic:

- `createInitialPlayerState(bounds)`
- `updatePlayerMovement(state, input, bounds, config, deltaSeconds)`

The scene owns visual synchronization only. It reads `WorldLayout.rooftop` for movement bounds and `PLAYER_MOVEMENT_CONFIG` for acceleration, deceleration, max speed, and placeholder size.

## Interfaces

Actions:

- `left`
- `right`
- `throw`
- `aim`
- `switchPrev`
- `switchNext`

Keyboard mappings:

- `A` / `ArrowLeft`: left
- `D` / `ArrowRight`: right
- `Space`: throw
- `ShiftLeft` / `ShiftRight`: aim
- `Q`: switchPrev
- `E`: switchNext

Movement config:

- `acceleration`
- `deceleration`
- `maxSpeed`
- `nervousSpeedThreshold`
- `width`
- `height`

## Rules

- Player x changes with delta time.
- Player y is fixed by the rooftop presentation layer.
- There is no jump, vertical movement, or collision system.
- Simultaneous left and right input resolves to neutral.
- `pressed` is true only on the transition into held.
- `released` is true only on the transition out of held.
- `throw.pressed` can be consumed once later; holding throw does not retrigger every frame.

## Debug

GameScene exposes:

- `window.__SHIMING_BIDA_DEBUG__.player`
- `window.__SHIMING_BIDA_DEBUG__.inputListenerCount`

The placeholder player shows visual state text and color:

- `idle`: yellow
- `move`: blue
- `nervous`: red

## Non-Goals

- No throwing.
- No projectile.
- No collision system.
- No formal mobile UI.
- No final player art or animation.

