# Phase 04: Predictable Trajectory, Throwing, and Aim Assist

## Section

Foundation

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 03 acceptance was declared passed by the user prompt. Codex did not mark Phase 03 as `PASS`.

## Scope

- Add pure projectile trajectory calculation.
- Add ordinary projectile config.
- Add Phaser projectile presentation and lifecycle mapping.
- Add cooldown, active projectile cap, lifetime, and recycling.
- Add AimAssist predicted curve and landing marker.
- Use Space to fire a normal placeholder projectile.
- Use Shift to show aim assist.
- Add debug wind adjustment.
- Add golden trajectory cases.

## Units

- Position: canonical world pixels.
- Velocity: pixels per second.
- Gravity: pixels per second squared.
- Wind: horizontal pixels per second squared.
- Time: seconds.

## Design

Prediction and simulation share the same pure functions:

- `positionAt`
- `velocityAt`
- `sampleTrajectory`
- `predictLanding`

`ProjectileSystem` is a pure state updater. `PhaserProjectileSystem` maps that state to placeholder Phaser circles and velocity vectors. `AimAssist` renders the predicted path and landing marker from the same trajectory input.

Landing is defined as crossing a horizontal landing plane after the projectile has entered the playable arc. This avoids immediate landing when a projectile starts from the rooftop edge and travels upward before descending.

## Interfaces

- `TrajectoryInput`: origin, initial velocity, gravity, wind.
- `ProjectileConfig`: gravity, wind, initial velocity, cooldown, max active, radius, lifetime, prediction step, prediction max, tolerance, aim-assist enable.
- `ProjectileSystemState`: projectiles, cooldown, next id, recycled count.
- Debug API:
  - `projectileSystem`
  - `predictedLanding`
  - `actualLanding`
  - `landingError`
  - `windAccelerationX`
  - `aimAssistVisible`

## Controls

- `Space`: fire ordinary placeholder projectile.
- `Shift`: hold to show aim assist.
- `[`: decrease wind.
- `]`: increase wind.

## Non-Goals

- No NPC hit detection.
- No special poop.
- No score.
- No formal hit effects.
- No final art or audio.

## Targeted Presentation Amendments

- Current Space behavior charges on hold and throws on release; production trajectory helpers remain disabled.
- ChargeMeter is a right-anchored vertical bar whose fill grows bottom-to-top from the same 1%-100% power used by target Y.
- Each active projectile view owns a pooled placeholder shadow at its authoritative ground projection. The airborne sprite remains at visual position, and shadow presentation never participates in collision.
- Evidence: `docs/evidence/PHASE_04_VERTICAL_METER_SHADOW_FIX.md`.
