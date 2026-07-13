# Phase 02: Screen Layering, Alley Lanes, and Parallax Scene

## Section

Foundation

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 01 acceptance was declared passed by the user prompt. Codex did not mark Phase 01 as `PASS`.

## Scope

- Establish the screen's spatial language.
- Split the world into skyline, alley, and rooftop vertical zones.
- Add placeholder parallax layers using geometry and generated texture.
- Define three alley lanes with y position, scale, depth, and base speed multiplier.
- Define rooftop movement bounds and two reserved cover slots.
- Add pure layout and depth models.
- Add debug overlay toggled by `L`.
- Test layout at multiple viewport sizes.

## Design

The game still uses the Phase 01 1280x720 canonical canvas. Phaser scale mode handles viewport fitting. Phase 02 adds a pure `WorldLayout` model that produces all world-space positions from width and height.

Vertical zones:

- Skyline: 25%.
- Alley: 45%.
- Rooftop: 30%.

Lanes:

- `back_shop`: rear shop area, smaller scale, lower speed multiplier, lower depth.
- `mid_sidewalk`: middle sidewalk, neutral scale and speed.
- `front_road`: front road, larger scale, higher speed multiplier, higher depth.

Parallax is placeholder-only. Three generated texture layers move at distinct factors to prove the visual language without formal art.

## Interfaces

- `createWorldLayout(width, height)`: returns pure layout data.
- `getZone(layout, id)`: returns a named vertical zone.
- `getLane(layout, id)`: returns a named lane.
- `Depths`: centralized z-order contract.
- Game debug API: `window.__SHIMING_BIDA_DEBUG__.layout` and `.debugOverlayVisible`.

## Debug Overlay

Press `L` in GameScene to toggle:

- Zone boundaries and labels.
- Lane bounds and y lines.
- Rooftop movement area.
- Left/right movement boundaries.
- Reserved cover slots.
- Coordinate grid.

## Non-Goals

- No player control.
- No collision.
- No NPCs.
- No projectile logic.
- No formal background, character, or cover art.

