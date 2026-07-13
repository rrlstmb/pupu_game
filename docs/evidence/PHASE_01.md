# Phase 01 Evidence

## Status

READY_FOR_REVIEW

## Preflight

- Current phase: 01, project scaffold, toolchain, and scene lifecycle.
- Dependency: user prompt states Prompt 00 acceptance passed. Codex did not mark Phase 00 as `PASS`.
- `git status --short` before Phase 01 edits: `?? AGENTS.md`, `?? docs/`, `?? pupu_game_plan.txt`.
- Existing package manager before Phase 01: none.
- Selected package manager: npm.
- Node: `v22.22.1`.
- npm: `9.2.0`.
- Lockfile: `package-lock.json`.
- Formal gameplay implemented: none.

## Commands

| Command | Exit Code | Result | Label | Notes |
|---|---:|---|---|---|
| `git status --short` | 0 | PASS | baseline | Confirmed untracked Phase 00 docs and plan were preserved |
| `npm install` | 130 | FAIL | baseline | Interrupted after no output in sandbox |
| `npm install` | 0 | PASS | setup | Escalated network access; created lockfile and installed dependencies |
| `npm run test` | 1 | FAIL | targeted | Initial EventBus imported Phaser and failed in Node because `window` was absent |
| `npm run lint` | 0 | PASS | targeted | Initial lint passed |
| `npm run typecheck` | 2 | FAIL | targeted | Missing Node typings and type-only Phaser import issue |
| `npm install` | 1 | FAIL | setup | Sandbox retry failed with `EAI_AGAIN` fetching `@types/node` |
| `npm install` | 0 | PASS | setup | Escalated network access; installed `@types/node` and updated lockfile |
| `npm run test` | 0 | PASS | targeted | 2 files, 3 tests passed |
| `npm run lint` | 0 | PASS | targeted | ESLint passed |
| `npm run typecheck` | 2 | FAIL | targeted | EventBus internal generic map was too strict |
| `npm run typecheck` | 0 | PASS | regression | TypeScript strict check passed |
| `npm run build` | 0 | PASS | regression | Vite build passed with Phaser chunk-size warning |
| `npm run test:e2e` | 1 | FAIL | e2e | Sandbox blocked Vite local port with `listen EPERM` |
| `npm run test:e2e` | 1 | FAIL | e2e | Escalated run found missing Playwright Chromium binary |
| `npx playwright install chromium` | 0 | PASS | setup | Installed Playwright Chromium, headless shell, and ffmpeg |
| `npm run test:e2e` | 1 | FAIL | e2e | Initial test used DOM text for canvas-rendered Phaser text and missing snapshot |
| `npm run test:e2e` | 0 | PASS | e2e | 1 Chromium test passed |
| `npm run verify` | 0 | PASS | regression | lint, typecheck, unit tests, and build passed |
| `git diff --check` | 0 | PASS | verification | No whitespace errors |
| `npm run dev -- --port 5173` | N/A | PASS | manual | Dev server started and remained running at `http://127.0.0.1:5173/` |
| `curl -I http://127.0.0.1:5173/` | 7 | FAIL | manual | Default sandbox could not open localhost socket |
| `curl -I http://127.0.0.1:5173/` | 0 | PASS | manual | Escalated localhost check returned `HTTP/1.1 200 OK` |

## Test Counts

- Vitest: 2 files, 3 tests passed.
- Playwright: 1 Chromium test passed.
- `npm run verify`: lint, typecheck, 3 unit tests, and build passed.

## Fixed Seed / Level

- Fixed seed: N/A.
- Level: N/A.
- Reason: no gameplay simulation or level data exists in Phase 01.

## UI Evidence

- Screenshot: `docs/evidence/phase-01-menu.png`.
- Trace: none retained because the final Playwright run passed and trace mode is `on-first-retry`.

## State / Resource Checks

- Active scene check after load: `MenuScene`.
- Active scene check after start click: `GameScene` and `HUDScene`.
- Active scene check after return click: `MenuScene`.
- EventBus unit test verifies listener count goes from 0 -> 1 -> 0 after explicit `on`/`off`.
- Scene shutdown rules are documented in `docs/phases/PHASE_01.md`.

## Acceptance Comparison

- MET: `npm run dev` can start when local port binding is allowed; Playwright uses it through `webServer`.
- MET: `npm run build` succeeds.
- MET: Main menu to empty GameScene flow is operable by Playwright.
- MET: Returning from GameScene to MenuScene is operable by Playwright.
- MET: Page reload boots to MenuScene without white screen in Playwright.
- MET: Window resize preserves 16:9 canvas ratio.
- MET: `npm run lint` passes.
- MET: `npm run typecheck` passes.
- MET: `npm run test` passes.
- MET: `npm run test:e2e` passes with local server permission.
- MET: `npm run verify` passes.
- MET: No formal background, player control, throwing, NPC, scoring, or level content was implemented.

## Known Limitations

- Vite dev server cannot bind to localhost inside the default sandbox; e2e required escalated local port permission.
- Default sandbox cannot open a localhost socket for `curl`; escalated localhost check succeeded.
- `npm audit` reports 5 vulnerabilities from installed dependencies. Phase 01 did not run `npm audit fix --force` because it may introduce breaking changes.
- Build reports a large Phaser bundle chunk warning. This is expected before later code splitting.
