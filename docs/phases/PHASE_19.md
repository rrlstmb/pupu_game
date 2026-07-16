# Phase 19: Level 8 - Citywide Livestream

## Scope

- Add only Level 8, photographer snapshots, streamer recording exposure, concealment, bounded surveillance scheduling, capture penalties, camera stars, and the live-stream climax.
- Preserve Levels 1-7 and all projectile, collision, score, combo, Alert, wind, bounce, zone, cleaner, and counterattack behavior.

## Level Data

- Id/name: `level_08`, `第 8 關：全城直播`; 135 seconds; target 2100; seed `level-08-camera-seed`.
- Roster: photographer, streamer, tourist, office worker. Available poop: normal, sticky, splash.
- Stars: score, avoid three snapshots, survive two recording windows.
- The 34-second climax activates independent surveillance, spawn, and presentation events once.

## Snapshot Model

- Photographer requests use deterministic authored sweep centers rather than copying Level 7 player-X retaliation.
- A telegraph exposes the authoritative rooftop interval; the short active endpoint performs one captured/avoided check.
- Movement outside the interval or an enabled concealment zone prevents capture. Cancelled/interrupted requests do not count as avoided.

## Recording And Exposure

- Streamers telegraph before a bounded recording window. Exposure increases in-zone, is amplified while throwing, and decays outside or under concealment.
- Reaching the threshold produces one capture; ending below it produces one survived result. Alert is never incremented per frame.
- A legal hit interrupts an active camera source and applies the authored interruption Alert cost without awarding avoidance.

## Safety And Lifecycle

- Queue, telegraph, active snapshot, active recording, global gap, source ownership, and Phaser view counts are bounded.
- New zones require at least 180 canonical pixels of uncovered rooftop movement.
- Pause performs no surveillance update. Retry/menu/shutdown reconstruct state and dispose warnings, exposure bars, locks, invulnerability, queue, and pooled views.

## Event Channel

- `surveillanceChannel` uses the shared priority then authored-order replacement rule and cannot overwrite spawn, cleanup, wind, hazard, or presentation state.

## Non-Goals

- Prompt 20, Level 9, security/searchlights, Bosses, health, permanent tracking, projectile physics changes, aim paths, formal art, or audio.
