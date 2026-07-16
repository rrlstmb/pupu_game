# Phase 20: Level 9 - Security Patrol

## Scope

- Add only Level 9, guard observation, deterministic searchlights, cover occlusion, throw exposure, rare golden poop, safe rooftop blockade, security stars, and the lockdown climax.
- Preserve Levels 1-8 and all charged throw, projectile, collision, score, Alert, wind, bounce, environmental zone, cleaner, counterattack, and surveillance behavior.

## Level Data

- Id/name: `level_09`, `第 9 關：保全巡邏`; 140 seconds; target 2400; seed `level-09-security-patrol-seed`.
- Roster: security guard, office worker, tourist. Available poop: normal, jumbo, golden; golden stock is one per attempt.
- Stars: score, avoid three guard observations, one legal golden-poop hit.
- At 35 seconds remaining, independent security, blockade, spawn, and presentation events activate once.

## Security Lifecycle

- `SecuritySystem` owns authoritative warning/observing instances, detection progress, source ownership, cooldowns, queue, throw exposure, penalties, and reset state.
- Guard observations and searchlights use canonical rooftop intervals. Phaser views only render those intervals.
- Detection accumulates while the player is inside an observation interval and not occluded. It decays outside or under valid cover and creates one sourced Alert penalty only at threshold.
- Guard hits cancel their current observation. Pause supplies no domain delta; retry/menu/shutdown reconstruct state and dispose all active and pooled views.

## Searchlights And Cover

- Two authored ping-pong searchlights have staggered phases, warnings, bounded widths, and a hard concurrency limit.
- Cover is a typed one-dimensional interval that can block guards, searchlights, or both. Throw exposure temporarily disables cover for detection without changing projectile physics.
- This differs from Phase 19 surveillance: cameras resolve discrete snapshot/recording windows, while security continuously accumulates detection from moving observation sources and physical occlusion.

## Golden Poop

- Level stock overrides reuse `PoopDefinition`, `PoopInventory`, charged target Y, ground projection, shadow, LandingHitWindow, legal rant scoring, and Alert cost.
- One authored shot is restored on retry and menu re-entry, consumed once on fire, and counted only after a legal hit.

## Blockade Reachability

- The lockdown warning precedes one authored blocked interval. Pure interval subtraction leaves a one-unit boundary clearance so relocation cannot place the player inside the blockade edge.
- `getReachableHorizontalIntervals`, deterministic nearest relocation, and `hasValidSecurityRoute` enforce remaining movement, cover, and safe-width requirements before authored data is accepted by tests.
- `securityChannel` and `blockadeChannel` are independent from spawn, surveillance, hazard, cleanup, wind, and presentation channels.

## Non-Goals

- Prompt 21, Level 10, Boss logic, health, final art/audio, full ray casting, projectile-path helpers, or cross-hazard framework rewrites.
