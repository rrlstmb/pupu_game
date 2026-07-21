# Phase 24: Touch, Responsive, Accessibility, and Settings

## Scope

Phase 24 adds touch as a third unified gameplay input, canonical responsive layout snapshots, browser-local settings, keyboard-operable UI proxies, important-event announcements, and visual accessibility controls. It preserves all ten levels, Campaign/modes, persistence, gameplay timing, collision, and presentation ownership.

## Touch Input

`TouchInputAdapter` owns separate movement and charge pointer IDs. Movement drag produces only a normalized axis; charge produces the same pressed/held/released edges consumed by `GameplayInputController`. Touch cancellation, lost capture, blur, hidden visibility, orientation, pause, retry, Menu, and shutdown clear owners without releasing a throw. Touch-like pen input is explicit. A bounded suppression window prevents a following synthetic mouse sequence from entering gameplay.

Controls use two DOM regions outside the canonical canvas: movement and throw. They support simultaneous pointers, 56px minimum targets, pointer capture, right/left-handed mirroring, and `touch-action: none` only on game controls. Poop selection remains the validated HUD selector.

## Responsive Layout

`ResponsiveLayoutService` classifies desktop, tablet portrait/landscape, and mobile portrait/landscape from VisualViewport with window fallback. It emits safe-area-aware viewport and touch regions, text/UI scales, and orientation. Phaser continues simulating at 1280x720; CSS/render scaling and device pixel ratio never enter collision or world rules. Mobile HUD enlarges critical state and folds secondary diagnostics.

## Settings

`SettingsDataV1` uses `shiming-bida.settings.v1`, separate from `shiming-bida.save.v1`. Repository/service layers validate and clamp audio, motion, visual, control, and accessibility values. Storage failure falls back to memory. Future versions are not overwritten. Reset Settings clears only the settings key; Reset Progress clears only progress.

## Accessibility

- Settings is a labelled DOM dialog with focus trap, Escape close, focus restore, 44px targets, value text, and immediate preview.
- Canvas actions expose keyboard-focusable proxy buttons without changing Phaser command ownership.
- High contrast, text scale, hazard pattern cues, visual audio cues, reduced motion, screen-shake/camera preferences, and flash levels are presentation-only.
- `AccessibilityAnnouncer` uses bounded token dedupe and polite/assertive live regions for level results and danger events.
- No high-frequency fullscreen flash is introduced; flash-off retains existing shape/text/icon cues.

## Performance And Cleanup

Touch controls have fixed object/listener counts. Responsive subscriptions and VisualViewport listeners are disposable. Announcer receipts are capped at 24. Settings writes occur only on user changes, never per frame. Scene input disposal removes touch owners/capture/listeners alongside keyboard and mouse state.

## Non-goals

No Level 11, gameplay/balance change, native packaging, PWA, bundle splitting, release optimization, key rebinding, cloud settings, final WCAG certification, or Prompt 25 work.
