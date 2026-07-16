# Phase 19 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Scope: Prompt 19 only; Prompt 20, Level 9, security/searchlights, Boss, health, and projectile changes were not implemented.
- Dependency: user states Prompt 18 PASS.
- Initial worktree: clean.
- Package manager/lockfile: npm / `package-lock.json`; Node v22.22.1, npm 9.2.0.
- Fixed acceptance seed: `level-08-camera-seed`.
- Baseline affected tests: 6 files / 31 tests, exit 0.

## Commands

| Command | Exit Code | Result | Label | Count / Notes |
|---|---:|---|---|---|
| Baseline affected Vitest set | 0 | PASS | baseline | 6 files / 31 tests |
| Phase 19 targeted Vitest set | 0 | PASS | targeted unit | 7 files / 35 tests |
| `npx playwright test --grep "phase 19 level 8"` | 0 | PASS | targeted e2e | 1/1 Chromium flow |
| First `npm run test:e2e` | 1 | FAIL | regression discovery | 24/26; legacy roster index and exact reset fixture omitted new zero metrics |
| Failed-test targeted rerun | 0 | PASS | regression fix | 2/2 Chromium tests |
| Final `npm run lint` | 0 | PASS | regression | repository ESLint scan |
| Final `npm run typecheck` | 0 | PASS | regression | strict TypeScript |
| Final `npm run test` | 0 | PASS | regression | 36 files / 163 tests |
| Final `npm run build` | 0 | PASS | regression | TypeScript plus Vite; 75 modules |
| Final `npm run test:e2e` | 0 | PASS | full regression e2e | 26/26 Chromium tests |
| Final `git diff --check` | 0 | PASS | patch hygiene | no whitespace errors |

## Automated Evidence

- Snapshot tests cover telegraph-before-active, immutable authored target interval, one-shot capture, movement avoidance, concealment, source cancellation, and no cancelled-as-avoided metric.
- Recording tests cover active-window exposure, throwing multiplier, out-of-zone decay, one capture maximum, pause freeze, bounded queue, deterministic scheduling, safe-space rejection, interruption, and reset.
- Level tests cover schema, fixed seed, photographer/streamer roster, independent surveillance/spawn climax channels, one-shot event ids, and separate snapshot/recording stars.
- Browser flow captures a visible snapshot warning, proves stationary capture plus Alert, retries cleanly, proves recording exposure and blind-spot decay, and verifies the climax channel once with no console errors.

## State And Resource Evidence

- Captured snapshot: one capture result, sourced Alert increase, one temporary throw lock/invulnerability, and no duplicate result.
- Retry after clearing newly spawned acceptance actors: surveillance instances 0, queued sources 0, throw lock 0, invulnerability 0; LevelSession camera metrics reset to zero.
- Leaving a recording interval/entering authored concealment reduced exposure and did not produce captured Alert below threshold.
- Scene shutdown disposes every active/pooled warning view; full scene lifecycle E2E confirms existing input and event listener counts remain stable.
- Screenshot: `docs/evidence/phase-19-snapshot-telegraph.png`.

## Acceptance Comparison

- MET: Level 8 is selectable, playable/settleable through the existing LevelDirector, data driven, and uses fixed seed `level-08-camera-seed`.
- MET: photographers use telegraphed authored-sweep one-shot snapshots; streamers use telegraphed bounded recording exposure.
- MET: authoritative world intervals own capture; visuals read the same intervals and never own collision.
- MET: movement and two visible concealment zones avoid capture while minimum safe width prevents full rooftop coverage.
- MET: capture applies Alert and short throw lock without health; one instance cannot punish twice.
- MET: legal hits interrupt camera instances with one data-driven Alert cost; interruption is not counted as avoidance.
- MET: bounded queue/concurrency/global gap/source ownership/view pool prevent unbounded camera growth.
- MET: `surveillanceChannel` coexists with spawn/presentation and the climax triggers once.
- MET: snapshot and recording metrics/stars are separate and reset deterministically.
- MET: Levels 1-7, charged throws, shadows, landing windows, wind, zones, cleaners, and counterattacks pass full E2E regression.
- MET: production still shows no throw helper paths or debug bounds.

## Known Limits

- Severity: Low. Camera, REC bar, blind spots, and flash are placeholder geometry/text.
- Severity: Medium. Snapshot resolves at the authored active endpoint rather than a swept visual shutter interval; this is intentional one-shot behavior.
- Severity: Low. Source-id queue ordering favors older NPC ids; deterministic rotating fairness is deferred.
- Severity: Low. Build emits the existing Vite chunk-size warning; it does not block runtime or Phase 19 acceptance.
