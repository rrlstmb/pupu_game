# Phase 23 - Local Progress, Unlocks, Titles, and Modes

## Scope

Phase 23 adds a versioned browser-local save, monotonic Campaign progression, result records, title evaluation, persistent Opening/tutorial flags, a progress-aware menu, explicit run contexts, reset confirmation, Free Play, and authored local challenge modes. It does not add a level, NPC, poop, hazard, account, backend, cloud sync, touch input, accessibility settings, or release packaging.

## Persistent And Transient Boundary

Persistent data is limited to schema metadata, Campaign start/completion, unlocked/completed level IDs, best level records, completion counts, discovered roster poop, tutorial/Opening flags, titles, unlocked mode IDs, bounded result-token receipts, and independent challenge records.

Score, combo, Alert, timers, charge/input ownership, inventory, cooldowns, projectiles, shadows, NPCs, zones, event channels, queues, security/surveillance state, Boss state/protections, blocked intervals, final windows, and both Level 9 and final golden inventory remain LevelSession/encounter state. A discovered `golden_poop` roster entry never supplies inventory; LevelDefinition/Boss initialization remains authoritative.

## Save Architecture

- `SaveDataV1` is runtime-validated and repaired from untrusted JSON.
- `SaveRepository` separates storage from domain rules. Production uses `LocalStorageSaveRepository`; unit tests and storage failures use `InMemorySaveRepository`.
- The primary key is `shiming-bida.save.v1`; the previous valid document is retained at `.backup` before replacement.
- `SaveService` is the only write transaction entry. It validates before write, increments revision once, catches storage errors, and preserves an in-memory session.
- `ProgressionService` applies one complete result transaction and rejects duplicate bounded result tokens.
- Future schema documents are not overwritten. Explicit Reset is the only path that may remove them.

## Migration And Recovery

Legacy objects without a version are treated as V0 and migrated to V1. Known records, completed levels, highest stars/scores, inferred next-level unlocks, and reasonable poop discoveries are retained. Invalid individual IDs/numbers are dropped or clamped without discarding unrelated records. Corrupt primary JSON tries the backup, then starts a recovered default. Migration always ends with V1 validation.

## Campaign Progression

Fresh progress unlocks only Level 1. A legal Campaign success unlocks the next registry entry, updates monotonic best score/stars/accuracy/combo/time, and increments completion count once. Failure and non-Campaign results do not unlock Campaign content. Level 10 sets `campaign.completed` and never creates Level 11. `locked`, `unlocked`, `completed`, and `mastered` are computed by one pure function; mastered means three stars.

Continue selects the highest unlocked incomplete level and always creates a fresh LevelSession. New Campaign means replay Level 1 without deleting records. Level Select renders lock state, stars, and score from SaveData. Reset uses an explicit modal and removes only this game's primary/backup keys.

## Discovery And Titles

Campaign completion discovers the roster poop available in that authored level. Discovery never changes `availablePoopTypes`. The ten phase-plan titles are evaluated from monotonic persistent achievements. Unlock and new-record notices are presentation-only and do not gate commit.

## Modes And RunContext

Every launch carries `RunContext { modeId, levelId, seed, progressionEligibility, challengeId?, runId? }`.

- Campaign may update Campaign progression.
- Free Play reuses an unlocked Campaign LevelDefinition and optional normalized seed, but persists no Campaign result.
- Precision Delivery uses finite normal-poop stock.
- Frenzy/Crowd Blast reuses Level 4 with a bounded spawn interval multiplier.
- Endless Patrol reuses Level 7 with a longer run and staged authored pressure; caught/timeout settles the run.
- Stealth Crisis reuses Level 9.
- Daily Mission uses the device local calendar date (`YYYY-MM-DD`) to derive a deterministic local seed.

Challenge overrides are cloned through an allowlist: duration, target score, allowed poop, stock, and bounded spawn interval multiplier. They cannot override physics, collision, hit windows, final-golden legality, safety coordinators, or reset semantics. Challenge records are stored separately from Campaign records.

## Input And Presentation Protection

Progress controls exist only in Menu presentation. Gameplay still enters through `GameplayInputController`; each start/retry creates a fresh run token and neutral input adapter. Result animations do not commit progress. Existing semantic UI audio, character/VFX pools, Opening, Level Intro, mouse selector, ChargeMeter, shadow, and Boss presentation remain unchanged.

## Privacy

All data stays in browser localStorage. No identity, analytics, fingerprint, network request, account, or cloud API is added. Custom seeds are NFKC-normalized, character-filtered, and capped at 40 characters before Phaser text rendering.

## Non-goals

Prompt 24 owns touch, responsive work, accessibility, reduced motion, and settings UI. Prompt 25 owns bundle splitting, performance/release optimization, packaging, and production readiness. Import/export and cross-device sync are intentionally absent.
