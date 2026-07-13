# Roadmap

This roadmap mirrors `docs/CODEX_PHASE_PLAN.md` V2.0. It defines 26 prompts and 6 release gates. A later prompt must not start until its dependency has been accepted by the reviewer.

## Release Gates

| Gate | Area | Required Prompts | Blocks |
|---|---|---|---|
| A | Technical and feel baseline | 00-04 | Prompt 05 and Core Loop work |
| B | Core loop MVP | 05-08 | Prompt 09 and Tactical Vertical Slice work |
| C | Vertical slice | 09-12 | Prompt 13 and Campaign work |
| D | Complete ten levels | 13-21 | Prompt 22 and Polish/Meta work |
| E | Product experience | 22-24 | Prompt 25 and release-candidate work |
| F | Release Candidate | 25 | Release claims |

Gate work is integration acceptance, not a feature phase. Codex records `READY_FOR_REVIEW` or `BLOCKED`; only the reviewer may mark a phase `PASS`.

## Prompts

| Prompt | Name | Depends On | Gate | Do Not Implement Early |
|---:|---|---|---|---|
| 00 | Project audit, technical decisions, development contract | None | A | Formal gameplay |
| 01 | Project scaffold, toolchain, scene lifecycle | 00 PASS | A | Character control or authored art |
| 02 | Layered scene, alley lanes, parallax | 01 PASS | A | Player control or collisions |
| 03 | Horizontal player movement and input adapter | 02 PASS | A | Throwing or final mobile UI |
| 04 | Predictable trajectory, throwing, landing assist | 03 PASS | A | NPC hits or special poop |
| 05 | Basic NPCs, spawner, state machine | Gate A and 04 PASS | B | Hits, rants, scoring |
| 06 | Hit validation, rant loop, repeated hits | 05 PASS | B | Formal score, combo, capture |
| 07 | Score, precision, combo | 06 PASS | B | Capture or level results |
| 08 | Alert, cover, warning stages, failure | 07 PASS | B | Advanced alert NPCs |
| 09 | Sticky, splash, jumbo tactical poop | Gate B and 08 PASS | C | Bounce, stink, split, golden |
| 10 | Bounce, stink, split, golden poop | 09 PASS | C | Full advanced NPC roster |
| 11 | Complete NPC roster and interaction matrix | 10 PASS | C | Boss or ten-level content |
| 12 | Level schema, goals, timer, stars, Level 1 slice | 11 PASS | C | Levels 2-10 |
| 13 | Level 2: Rush Hour | Gate C and 12 PASS | D | Later-level mechanics |
| 14 | Level 3: Umbrella Line | 13 PASS | D | Later-level mechanics |
| 15 | Level 4: Market Closing | 14 PASS | D | Later-level mechanics |
| 16 | Level 5: Upwind Delivery | 15 PASS | D | Later-level mechanics |
| 17 | Level 6: Cleanup Operation | 16 PASS | D | Later-level mechanics |
| 18 | Level 7: Alley Counterattack | 17 PASS | D | Later-level mechanics |
| 19 | Level 8: Citywide Livestream | 18 PASS | D | Later-level mechanics |
| 20 | Level 9: Security Patrol | 19 PASS | D | Final boss implementation |
| 21 | Level 10: Clean City Day and influencer boss | 20 PASS | D | Polish/meta work |
| 22 | Hit feel, visual feedback, audio, opening | Gate D and 21 PASS | E | Save modes or release claims |
| 23 | Progress, unlocks, titles, save, modes | 22 PASS | E | Online backend |
| 24 | Touch, responsive UX, usability, accessibility | 23 PASS | E | Release claims |
| 25 | Full QA, balance tools, performance, release candidate | Gate E and 24 PASS | F | Post-launch content |

## Requirement Categories from `pupu_game_plan.txt`

### Core Gameplay

Horizontal rooftop movement, predictable throws, target timing, right-to-left NPC movement, hit/rant/recover, score, combo, alert, repeated-hit risk, tactical poop choices, and 90-180 second level loops.

### Content

Ten story levels, NPC and poop definitions, goals, star conditions, events, unlocks, boss structure, titles, and dialogue snippets.

### Presentation

Cartoon visual style, rooftop/alley layers, hit stop, shake, particles, readable HUD, audio cues, music intensity, opening, results, and comedic reactions.

### Long-Term Modes

Endless, daily challenge, precision, frenzy, achievements, cosmetics, leaderboards, events, and social sharing. These remain later work and cannot be required by Foundation gates.
