# Accessibility

## Supported Input

- Keyboard: A/D movement, Space charge/release, keyboard-focusable Menu and dialog controls.
- Mouse: canonical pointer-to-world movement, left-button charge/release, HUD selection.
- Touch/pen: independent movement drag and throw button, simultaneous multi-touch, HUD selection.

Touch targets are at least 44 CSS px; gameplay controls use 56px minimum sizing. Browser zoom remains enabled. Safe-area insets and dynamic viewport changes are supported. Game controls prevent local scrolling while the Settings panel retains normal scrolling.

## Focus

Settings traps focus and restores it to its launcher. Escape closes it. Canvas controls have focus proxies activated with Enter/Space. While Settings is open, GameScene is paused and unified input is cleared on pause/resume.

## Motion And Flash

Reduced motion suppresses CSS transition/animation amplitude without changing domain timing. Screen shake and camera zoom preferences are exposed for presentation systems. Flash supports full/reduced/off; off hides optional flash overlays while warnings retain text, icons, outlines, and authored timing. No rapid fullscreen flashing was added.

## Contrast And Text

High contrast strengthens canvas/UI separation. Hazard designs retain labels, shapes, patterns, and icons rather than color-only meaning. Text scale supports 100%, 115%, and 130%; mobile HUD prioritizes Alert, Timer, charge, and selected poop while folding secondary score diagnostics.

## Audio Alternatives And Announcements

Mute never disables hazard visuals. Visual audio cues remain enabled independently. The bounded live-region announcer reports level start/result and dangerous Alert states, deduplicated by event token. It can be disabled without affecting visuals or gameplay.

## Known Limits

This is an engineering accessibility pass, not a formal WCAG conformance claim. Contrast tokens have automated checks but require final-art audit. Screen-reader behavior and touch ergonomics need a real-device/browser matrix. Key rebinding and broader assistive settings are not included.
