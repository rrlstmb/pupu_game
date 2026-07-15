# Phase 14: Level 3 - Umbrella Defense

## Scope

- Add one authored rainy Level 3 and no later level content.
- Teach defense recognition: normal poop is blocked by umbrellas; jumbo poop cracks the defense and creates a legal rant/score.
- Add a matching-company umbrella group climax and one umbrella-crack star.
- Preserve Level 1, Level 2, charged throwing, landing hits, shadow, score, and alert behavior.

## Level Data

- Id/name: `level_03`, `第 3 關：雨傘防線`.
- Duration/countdown: 110 seconds / 3 seconds.
- Seed: `level-03-umbrella-seed`; target score: 1100.
- NPC weights: umbrella pedestrian 6, office worker 3, phone user 1.
- Available poop: normal and jumbo; bouncy remains unavailable in this authored level.
- Rain: validated rainy profile with 38 low-alpha placeholder streaks.
- Climax: at 25 seconds remaining, a 0.5-second spawn profile containing only umbrella pedestrians activates once, bounded at 14 active NPCs.
- Stars: target score, three `umbrella_crack` interactions, and accuracy above 50%.

## Interfaces

- `PROJECTILE_BLOCKED` carries projectile/NPC identity, feedback label, alert delta, and interaction tags.
- Block events recycle projectiles and can raise alert, but do not mutate NPC hit count or create rant scoring.
- Legal hits carry interaction tags into pending rant context and LevelSession metrics.
- `interaction_target` evaluates an authored interaction tag/count without UI or Scene-owned objective logic.
- `LevelVisualDefinition.weather` owns clear/rain presentation parameters.

## Navigation

- Menu exposes Level 3.
- Level 2 result advances to Level 3.
- Level 3 retains the unavailable next-level placeholder because Prompt 15 is out of scope.

## Non-Goals

- Prompt 15, Level 4, campaign persistence, or unlock gating.
- New NPC or poop definitions.
- Bouncy poop unlock in Level 3.
- Formal rain art, animation, or audio.
- Projectile, charge, shadow, LandingHitWindow, score, or alert refactors.

## Manual Acceptance

1. Start Level 3 and confirm rainy presentation, umbrella-heavy spawns, normal/jumbo inventory, and seed.
2. Align with an umbrella pedestrian and throw normal poop; confirm the timed `雨傘擋住！` label, no rant, and no score.
3. Press E, observe jumbo stock 2 and its longer cooldown, then hit the same NPC; confirm rant, score, higher alert, and stock consumption.
4. Reach 25 seconds remaining and confirm the one-shot matching umbrella group without exceeding 14 active NPCs.
5. Finish or time out; verify the umbrella-crack PASS/MISS result row.
6. Retry and confirm clean metrics/event state with the same seed.
