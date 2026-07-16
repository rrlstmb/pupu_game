# Phase 18: Level 7 - Alley Counterattack

## Scope

- Add only Level 7, data-driven angry-pedestrian retaliation, readable counterattack presentation, dodge/hit penalties, climax scheduling, and dodge-star metrics.
- Reuse existing legal projectile-hit events, angry NPC capability presentation, rooftop movement bounds, Alert failure, LevelDirector channels, and result UI.
- Preserve charged throws, landing hit windows, projectile shadows, wind/bounce/zone/cleaner systems, and Levels 1-6.

## Level Data

- Id/name: `level_07`, `第 7 關：巷口反擊`.
- Duration/countdown: 130 seconds / 3 seconds; target score 1850; seed `level-07-counterattack-seed`.
- Roster: angry pedestrian, office worker, phone user; base maximum 12, climax maximum 15.
- Available poop: normal and splash. Splash can create several requests, but cannot bypass scheduler limits.
- Stars: score, three completed counterattack dodges, and five angry-pedestrian hits.

## Retaliation Model

- `CounterattackSystem` consumes deduplicated legal angry-NPC hit tokens. Two hits queue one retaliation; visual effects do not alter progress.
- Telegraph scheduling snapshots player X. Flight retains that X and resolves exactly one hit or miss at completion.
- A source owns at most one queued/active request. Cooldown and retaliation count are game-time domain state.
- Source exit cancels a pending telegraph. Fired projectiles finish without tracking the source or player.

## Dodge And Penalty

- The warning ellipse uses the same target half-width as collision and includes a non-color text/countdown cue.
- Leaving locked X plus player padding before flight completion is a dodge. Cancelled or unlaunched requests do not count.
- A hit adds 18 Alert, reduces movement speed for 0.8 seconds, locks throwing for 0.65 seconds, and grants 1.1 seconds counter-hit invulnerability.
- No health field or direct counterattack game-over exists; caught remains owned by AlertSystem.

## Safety Limits

- Base limits: one telegraph, one flying projectile, 1.1-second global gap, four queued sources, three pooled Phaser views.
- Requests use deterministic source-id FIFO selection. A new telegraph starts only if at least 170 px of rooftop movement remains outside all warning zones.
- The climax may permit two staggered telegraphs, but one-projectile flight cap and escape-space checks remain mandatory.
- Pause performs no update. Retry reconstructs instances, queue, source progress, penalties, stats, and adapter views.

## Event Channels

- The 32-second `hazardChannel` event changes only counterattack cadence/capacity.
- Separate spawn and presentation events trigger at the same threshold; no channel overwrites wind or cleanup state.
- Triggered ids remain one-shot and reset with the deterministic LevelSession attempt.

## Non-Goals

- Prompt 19, Level 8, camera/live-stream/security/Boss content, health, homing projectiles, dense bullet patterns, formal art/audio, or core projectile/event rewrites.

## Manual Acceptance

1. Select Level 7 and verify residential-alley visuals, angry-heavy roster, normal/splash inventory, and fixed seed.
2. Hit one angry pedestrian twice and verify a text plus ground warning appears before any counter projectile.
3. Stay inside the warning area; verify Alert increase and temporary movement/throw impairment without health.
4. Retry, hit another angry pedestrian twice, move horizontally after lock, and verify the projectile keeps old X and records one dodge.
5. At 32 seconds remaining verify angry spawn pressure and staggered multi-source warnings coexist while leaving escape space.
6. Complete or time out and inspect score, dodge star, angry-hit star, and seed.
