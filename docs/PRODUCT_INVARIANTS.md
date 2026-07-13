# Product Invariants

These rules define the game shape. A phase may refine them, but must not silently violate them.

## Core Play

- NPCs and threats enter from the right side of the lane and travel left.
- The player is located on the rooftop layer and can only move horizontally.
- The player throws toward the alley; there is no jump, crouch, vertical movement, or free-angle aiming.
- Throw arcs are predictable. Wind and other variance must be visible, data driven, and seeded.
- There is no hidden hit rate. Hits come from geometry, timing, data, and deterministic simulation.

## NPC Reactions and Scoring

- A hit causes a visible NPC reaction such as hit, ranting, searching, recording, retaliating, panicking, recovering, or exiting.
- The first scoring event for a normal hit is tied to the successful rant/reaction event, not to an invisible damage number.
- After ranting or another resolved reaction, an NPC can recover and continue unless level data says otherwise.
- Repeated hits must increase comedy and risk while preventing infinite optimal farming.

## Tactical Content

- Each poop type must have a clear strength, weakness, best-use case, and cost.
- Special poop types cannot be simple score upgrades over normal poop.
- NPC types must change player decisions, not just visual appearance.
- Levels, NPC definitions, poop definitions, score rules, combo rules, and alert rules must be data driven.

## Structure

- Story mode targets 10 authored levels.
- The MVP must prove one 90-second level before broad content expansion.
- Long-term modes such as endless, daily challenge, precision mode, and frenzy mode are later content and must not be required for early core validation.

## Presentation

- The tone is exaggerated cartoon comedy, mildly gross but not realistic.
- No blood, wounds, or serious injury presentation.
- Placeholder art and audio are allowed only for assets, never for gameplay rules.

