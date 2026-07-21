# Settings Schema

## Storage

- Version: `SettingsDataV1`, schema version 1
- Key: `shiming-bida.settings.v1`
- Repository: localStorage with in-memory fallback
- Progress key remains `shiming-bida.save.v1`

## Fields And Defaults

- Audio: master .8, music/ambience .65, SFX .8, UI .75, mute false.
- Motion: reduced motion follows `prefers-reduced-motion` only before a stored choice; shake full/reduced, camera zoom, flash full/reduced/off.
- Visual: high contrast false, text 100%, pattern/control cues on.
- Controls: right-handed touch, touch/mouse sensitivity 1.0 (validated 0.5-1.5).
- Accessibility: important announcements and visual audio cues on.

Volumes are clamped 0-1. Enums and malformed values use safe defaults. A future schema version is loaded as a temporary default and is not automatically overwritten.

## Boundary And Reset

Settings never contain Campaign unlocks, records, inventory, charge/input ownership, hazard/Boss state, or any transient entity. Reset Progress does not touch settings. Reset Settings requires confirmation, clears only the settings key, and does not touch progress. Storage failure changes settings to memory-only without affecting gameplay.
