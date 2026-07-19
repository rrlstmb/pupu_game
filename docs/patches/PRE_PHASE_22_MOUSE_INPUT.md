# Pre-Phase 22 Mouse Input Patch

## Scope

This targeted patch adds complete desktop mouse gameplay without changing campaign content, projectile physics, scoring, hazards, or Boss rules. Keyboard controls remain active. Touch, pointer lock, remapping, persistence, and Prompt 22 presentation work are non-goals.

## Input Abstraction

`KeyboardInputAdapter` and `MouseInputAdapter` translate device events into snapshots. `GameplayInputController` resolves them into one `GameplayInputIntent` consumed by player movement and charge/throw handling. Gameplay systems do not branch on device type.

The intent contains horizontal axis, charge pressed/held/released edges, keyboard-only aim/switch edges, and the last active device for presentation diagnostics. Held A/D has movement priority; when keyboard movement returns to neutral, the current mouse axis resumes.

## Horizontal Mapping

Mouse client coordinates are converted from the current canvas rectangle into the canonical 1280x720 world. Horizontal intent is:

`clamp((pointerWorldX - playerWorldX) / fullSpeedDistancePx, -1, 1)`

The configured 22px dead zone yields neutral intent and 180px yields full speed. The player continues through the existing `PlayerMovement` acceleration, deceleration, speed, rooftop bounds, blockade, stagger, and penalty rules. The adapter never assigns player X directly and does not use pointer delta.

## Charge Ownership

The first valid charge press owns the charge until its matching release. Keyboard-owned charge ignores mouse press/release; mouse-owned charge ignores Space press/release. The owner releases at most once and is cleared by pause, blur, visibility loss, retry, menu transition, shutdown, or adapter disposal. Both devices call the existing charge state and projectile spawn path.

## Pointer Lifecycle

A legal left-button gameplay press captures that pointer on the canvas. Matching pointerup releases one throw while gameplay is active. Pointer cancel, lost capture while held, blur, hidden document, pause, retry, menu, and shutdown cancel without throwing. Right and middle buttons are ignored. Context menu suppression is scoped to the game canvas.

## UI Isolation

The input router checks role-tagged interactive objects across active Phaser scenes. Pointer hover over menu, pause, result, and arsenal controls neutralizes mouse movement; pointerdown on those controls cannot begin charge. HUD poop icons emit a typed selection request and retain inventory, cooldown, lock, and stock validation in `GameScene`.

## Reset Rules

Scene disposal removes two keyboard listeners, seven native pointer listeners, blur/visibility handlers, and pause/resume handlers. Reset clears horizontal intent, charge edges, owner, pointer capture, and active device gameplay state. Diagnostics expose listener count, pointer listener count, capture, owner, and intent for soak tests.

## Non-goals

- No touch or mobile controls.
- No pointer lock or direct player teleportation.
- No trajectory, landing, or auto-aim helper.
- No campaign, NPC, poop, hazard, balance, physics, or Boss changes.
- No Prompt 22 work.
