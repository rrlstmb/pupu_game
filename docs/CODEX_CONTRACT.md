# Codex Development Contract

## Purpose

This contract keeps each Codex session small, reviewable, reversible, and aligned with the project plan.

## Scope Control

- Implement only the assigned phase.
- Do not start later phases early.
- Keep changes close to the files required by the phase.
- Avoid broad refactors and whole-repository formatting.
- Preserve user work. If `git status --short` shows unrelated changes, leave them intact.
- Do not push or create irreversible migrations without explicit approval.

## Architecture Rules

- Pure rules live in `src/domain` and must not import Phaser.
- Phaser scenes and adapters live in `src/scenes` and focused folders under `src/systems`.
- Data definitions live under `src/data` or `assets/data`.
- UI reads state/events and dispatches commands; it does not own simulation rules.
- Time, random numbers, state setup, and level data must be injectable.
- Tests must be able to run deterministic simulations with fixed seeds.

## Testing Rules

- Run targeted tests before broad checks when code changes exist.
- Then run lint, typecheck, applicable tests, build, and e2e when scripts exist.
- If a command is absent, record it as absent instead of claiming it passed.
- Never report tests as passing without command and exit code.
- Evidence belongs in `docs/evidence/PHASE_XX.md`.

## Reporting Format

Final reports must use the MASTER format:

- `【狀態】READY_FOR_REVIEW` or `【狀態】BLOCKED`
- `【完成摘要】`
- `【變更檔案】`
- `【架構決策】`
- `【測試證據】`
- `【手動驗收】`
- `【驗收對照】`
- `【已知限制】`
- `【下一階段風險】`

## Forbidden

- Marking a phase as `PASS`.
- Inventing hidden hit chances.
- Faking rules with placeholders.
- Implementing formal gameplay in foundation/documentation phases.
- Deleting user files or untracked work.
- `git reset --hard`, `git clean -fd`, or force push.
