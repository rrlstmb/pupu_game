# Local Save Schema

## Storage

- Current version: `1`
- Primary key: `shiming-bida.save.v1`
- Backup key: `shiming-bida.save.v1.backup`
- Location: this browser origin's localStorage only
- Network transfer: none

The complete save is one JSON document. Before replacing an existing primary document, the repository copies it to the backup key. Reset removes only these two keys and then writes a fresh V1 document.

## V1 Fields

```text
schemaVersion: 1
revision: non-negative integer
metadata: createdAt, updatedAt, optional gameVersion
campaign:
  started, completed, highestUnlockedLevelId
  completedLevelIds[]
  openingSeen
  levelRecords[levelId]:
    completed, completionCount
    bestScore, bestStars, bestAccuracy, bestCombo
    optional bestCompletionTimeMs, firstCompletedAt, lastCompletedAt
unlocks:
  levelIds[], poopTypeIds[], modeIds[], tutorialIds[], titleIds[]
modes:
  challengeRecords[challengeId]:
    attempts, completions, bestScore, optional bestRank/bestCompletionTimeMs
processedResultTokens[]
```

Fresh defaults use revision 0, only `level_01`, only `normal_poop`, no records/modes/titles/tutorials, and `openingSeen = false`. Result tokens are capped to the latest 256 receipts.

## Validation

JSON is never cast directly. Runtime validation checks registered Campaign levels, poop roster, modes, challenges and titles; de-duplicates/sorts IDs; rejects non-finite/negative metrics; clamps stars to 0-3 and accuracy to 0-1; validates timestamps; ignores unknown fields; and salvages valid records independently. Encounter-owned final golden is not a separate persistent roster item and no inventory count is represented in this schema.

## Migration

Unversioned legacy data is V0. Migrations run one version at a time and are followed by V1 validation. V0 migration preserves known records/completions, infers next-level unlocks and poop discovery from completed authored levels, and never imports transient gameplay fields.

Corrupt primary JSON loads a valid backup where possible. Otherwise a recovered default is used. A schema version greater than 1 is `incompatible`: it is left untouched and gameplay uses temporary memory progress until the player explicitly confirms Reset.

## Never Saved

Current score/combo/Alert/time, charge/input/pointer state, inventory/cooldown, projectile/shadow/pools, NPC/effects, wind, cleaner/counterattack/surveillance/security/searchlight/blockade state, event channels, listeners/timers, Camera/VFX/audio, Boss phase/protections/transitions/window, Level 9 golden stock, and Level 10 final-golden grant/use/remaining attempts are never persisted.

## Failure And Reset

Storage exceptions switch the current service to memory-only mode; gameplay and progression continue and Menu reports that reload may lose progress. No automatic retry loop is used. Reset requires explicit confirmation, never calls `localStorage.clear()`, and restores the deterministic fresh defaults.
