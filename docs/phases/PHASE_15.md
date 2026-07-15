# Phase 15: Level 4 - Market Closing

## Scope

- Add one authored market-evening Level 4 and no later level content.
- Teach waiting for a crowd and spending limited splash poop for multi-target score/combo.
- Add one bounded market-exit crowd event and a one-projectile three-target star.
- Preserve Levels 1-3, ordinary/sticky/jumbo behavior, umbrella defense, charge, shadow, score, and alert.

## Level Data

- Id/name: `level_04`, `第 4 關：市場散場`.
- Duration/countdown: 120 seconds / 3 seconds.
- Seed: `level-04-market-seed`; target score: 1400.
- NPC weights: office worker 3, phone user 2, tourist 5.
- Available poop: normal and splash.
- Splash tradeoff: radius 96, max targets 4, stock 3, cooldown 0.9s, score multiplier 0.8, alert cost 7.
- Climax: at 20 seconds remaining, 0.4s market-exit spawn profile weighted 7/2/1 toward tourists, bounded at 15 active NPCs.
- Stars: target score, one splash hitting at least 3 legal NPCs, accuracy above 50%.

## Splash Contract

- Authoritative origin is `projectile.landedAt`, never visual arc position.
- Only Walking/Distracted candidates within the data-driven radius are considered.
- Candidates sort by distance then stable NPC id and are capped by `splashMaxTargets`.
- Stable `splash:projectile:npc:hitWindow` tokens prevent one explosion from hitting the same NPC twice.
- Each legal target emits the existing hit/rant flow, so score, combo, alert, and NPC recovery remain unchanged.
- LevelSession records only the maximum targets reached by one splash projectile for star evaluation.

## Navigation

- Menu exposes Level 4.
- Level 3 result advances to Level 4.
- Level 4 next remains unavailable because Prompt 16 is out of scope.

## Non-Goals

- Prompt 16, Level 5, new NPC/poop definitions, or campaign persistence.
- Formal market art, vendors, audio, or crowd pathfinding.
- Changes to ordinary, sticky, jumbo, umbrella, projectile, charge, shadow, or LandingHitWindow rules.

## Manual Acceptance

1. Start Level 4 with `level-04-market-seed`; verify market-evening palette and tourist-heavy roster.
2. Press E to select splash poop; verify stock 3 and cooldown 0.9s.
3. Wait until at least three eligible NPCs cluster, then land one splash among them.
4. Verify multiple rants, combo/score increase, high alert cost, one stock consumed, and no duplicate NPC score.
5. At 20 seconds remaining verify market-exit pressure triggers once and remains under 15 NPCs.
6. Finish or time out and verify the three-person splash star row.
