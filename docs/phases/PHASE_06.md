# Phase 06: Hit Detection, Rant Loop, and Repeated Hits

## Section

Core Loop

## Status

READY_FOR_REVIEW

## Dependencies

Prompt 05 acceptance was declared passed by the user prompt. Codex did not mark Phase 05 as `PASS`.

## Scope

- Add pure projectile/NPC hit detection.
- Add `Hit`, `Ranting`, and `Recovering` NPC states.
- Stop NPC movement immediately after a legal hit.
- Show placeholder hit/rant reaction in Phaser.
- Track `validHitCount` per NPC.
- Use data-driven rant duration, immunity, and reaction level.
- Recycle ordinary projectiles on legal hit.
- Emit gameplay events for hit, rant start, and recovery.
- Prevent duplicate hit callbacks with a unique hit token.
- Allow the same NPC to be hit again only after it returns to movement.

## Design

Hit detection lives in `src/domain/gameplay/HitDetection.ts` and receives current projectile state, NPC state, NPC definitions, and existing hit tokens. It returns updated NPC state, projectile ids to recycle, new hit tokens, and gameplay events.

Projectile prediction and simulation remain in `src/domain/projectile`. The Phaser projectile system only maps the pure projectile state to placeholder visuals and recycles views by id after a legal hit.

NPC rant timing remains in `src/domain/npc/NPCStateMachine.ts`. Phaser NPC views read state and render placeholder colors, labels, and a rant bubble; they do not own gameplay rules.

## States and Rules

- `Walking` and `Distracted`: hittable.
- `Hit`: one-frame transition into `Ranting`.
- `Ranting`: movement speed is zero; not hittable.
- `Recovering`: movement speed is zero; not hittable.
- `Exiting`: not hittable.
- `Walking` after recovery: hittable again with an advanced `hitWindowId`.

## Events

- `PROJECTILE_HIT`: legal collision was accepted.
- `NPC_RANT_STARTED`: rant/reaction began; future score systems must listen here.
- `NPC_RECOVERED`: immunity completed and NPC can move again.

## Data

Hit reaction data lives in `src/data/npcHitRules.ts`.

Each rule includes:

- hit count
- rant duration
- immunity duration
- reaction level

## Interfaces

- `GameplayEvent`
- `GameplayEventTypes`
- `resolveProjectileNPCHits`
- `canNPCBeHit`
- `recycleProjectilesById`
- `hitReactionForCount`

## Non-Goals

- No formal score.
- No combo.
- No alert/caught system.
- No special poop behavior.
- No final art, animation, audio, or particles.
