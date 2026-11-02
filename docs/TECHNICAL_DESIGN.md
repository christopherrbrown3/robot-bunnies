# Technical architecture (initial)

> **Authority:** [Final Game Specification v1.0](FINAL_SPEC.md). The game described below is implemented. Real-iPad QA is still pending.

## Constraints and goals

- **Distribution:** static build on GitHub Pages at `/robot-bunnies/`. Home-screen install via Safari.
- **Devices:** older iPads, touch first, landscape 4:3/16:9 screens, aim for acceptable performance on iPadOS 15+ (actual minimum TBD after device testing).
- **Stack:** Phaser 3, TypeScript, Vite, vite-plugin-pwa/Workbox.
- **No backend:** no authentication, child account, remote telemetry or externally stored learning history. No mandatory network after first app cache.
- **Scope now:** the full 22-level platformer with in-world spelling triggers, a letter-tile composer, parent recordings, two-success mastery, storybook cutscenes, an adventure map and Parent Corner. All art and sound are generated in code (Canvas 2D and Web Audio), so there are no asset files to license or download.

## Source layout

```text
src/
  main.ts                 # Phaser config (960×540 FIT, Arcade physics, windowEvents off), audio unlock
  scenes/
    BootScene.ts          # generates all character/object textures
    TitleScene.ts         # Play/Continue, Map, Grown-ups, sound toggle
    MapScene.ts           # 22-node adventure map, level info, Storybook replays
    CutsceneScene.ts      # captioned, narrated, skippable storybook panels
    GameScene.ts          # one level: run/jump/shrink, hazards, rescue, paint door, spelling trigger, boss, portal
    FinaleScene.ts        # end-of-run celebration and gentle word summary
  game/
    art.ts                # Canvas 2D drawings: Lyla, Ridensee, Bunny Police, king, tiger, monkey, hand, monster, objects
    themes.ts             # 13 visual themes; parallax backgrounds generated lazily per level
    levelPlan.ts          # deterministic layout generator from levels.json `play` parameters
    cutscenes.ts          # storybook panel captions
    flow.ts / ui.ts       # navigation helpers, buttons, bubbles, screen-pinned overlays
  spelling/
    mastery.ts            # two-independent-success model, regression, distinct dates (pure functions)
    store.ts              # schema v2 weekly lists + per-word history (migrates v1)
    scheduler.ts          # all active words first; weak current words in spare slots; old weeks only when all secure
    campaign.ts           # 22-stage assignment, cursor, per-level checkpoint/flags/outcome, run flowers
  audio/
    sfx.ts                # synthesized Web Audio sound effects
    speech.ts             # TTS with failure detection
    recordings.ts         # IndexedDB parent clips (ArrayBuffer storage), separate backup format
    wordAudio.ts          # Hear priority: recording → TTS → none (Peek fallback)
    prefs.ts              # sound / story voice / seen cutscenes
  ui/
    SpellingPanel.ts      # the tile composer and LISTEN→BUILD→CHECK→STUDY→RETRY state machine (DOM overlay)
    PracticeSession.ts    # optional tricky-word review and full mock test
    ParentCorner.ts       # lists, mastery summary, recordings, backups
  content/
    levels.json           # 22 story locations + gameplay parameters and trigger text
    types.ts
public/icons/             # SVG + 180/192/512 PNG icons
scripts/
  validate-content.mjs    # 22 levels, canon anchors, play config
  test-campaign.mjs       # coverage for 1–20 words, priority, resume, in-level saves
  test-mastery.mjs        # §9 criteria 2 and 4, migration, source-week recording
  test-layouts.mjs        # every layout jumpable, deterministic, hazard/trigger zones clear
  e2e-playthrough.cjs     # optional Playwright run of all 22 levels (`npm run e2e`)
```

## Game engine approach

- Phaser Arcade Physics for lightweight 2D collision and auto-running platform controls.
- Fixed virtual size **960×540**, `Phaser.Scale.FIT` with letterboxing; letterbox/background absorbs unused 4:3 space.
- 60 fps aspirational; 30 fps acceptable with transparent fallbacks. Use compact atlases, reuse sprites, pool particles, cap effects and support reduced motion. Avoid large video backgrounds or heavy libraries.
- HTML title description and optional ARIA accessible controls can be added as overlays later. Phaser canvas alone is not inherently screen-reader accessible.
- Start with a fully drawn but asset-light level using shapes. Later replace with original sprites/atlasses.
- Separate content/progression data from physics scene code, so new levels aren't 22 copies of a script.
- Prefer very large hit targets and forgiving physics. Prioritize predictable feeling over precise simulation.

## Input state machine

`RUNNING` (auto-run / high single jump) ↔ `SHRUNK` (only after tap on Lyla in DANGER_WINDOW) → `RECOVERING` (automatic regrowth), and `CAPTURED` → `RIDENSEE_RESCUE` → `RUNNING`.

Spelling triggers pause physics, character velocity, enemy movement, timers and game input; restore the saved world and resume after success, error-corrected success or skip, with short collision grace. The tile composer must be touch-first and accessible. Pause/cutscene/puzzle states stop movement and disable conflicting input. A tap on the on-screen Jump button must not bubble through into the shrink-tap handler. Explicitly test single-touch, accidental second taps, resume after backgrounding, orientation changes, and audio unlock gestures.

## Save system

- `robot-bunnies.spelling.v1` (localStorage, schema v2; v1 data migrates on load): weekly lists and per-word history. Each word records attempts, misses, independent and assisted successes, skips, independent streak, streak dates and success dates. Results are recorded against the word's **source week**.
- `robot-bunnies.campaign.v2`: the frozen 22-stage word assignment, run number, `nextLevelIndex`, each level's outcome, the run's flowers, run flags (`bow`), and the current level's progress: `promptResolved`, `checkpointX`, flowers, collected object IDs and level flags (such as `tiger-gone` or `paint-door`). The prompt is saved as resolved before any celebration, and resolving twice keeps the first result. Spare stages are re-evaluated just before each prompt, never after it is resolved. Editing lists, switching weeks or importing a backup starts a new assignment.
- `robot-bunnies.prefs.v1`: sound, story voice, and which cutscenes have been seen.
- IndexedDB `robot-bunnies-audio`: parent recordings keyed by exact word, stored as ArrayBuffers because old Safari can't reliably store Blobs. They have their own JSON backup format.
- The word-list backup does **not** include the in-progress campaign position or recordings. Clearing Safari data loses everything that hasn't been backed up, and nothing syncs to a server.

## PWA / GitHub Pages

- `base: /robot-bunnies/` in production Vite config is **mandatory** for repo-scoped hosting.
- PWA manifest `start_url` and `scope` relative to build base. Cache emitted JS/CSS/fonts/images/HTML using Workbox in `vite-plugin-pwa`.
- Reopening offline works **only after** service worker installation and asset cache completion while online.
- Initial icon is SVG only. For reliable older iPad install appearance, produce a **180×180 PNG apple-touch-icon** plus 192/512 PNGs in the asset phase and reference them in `index.html`/manifest. Until then, home-screen icon appearance may vary.
- HTTPS on GitHub Pages is required for service workers. Development PWA/offline behavior is not identical to production; test preview and actual Pages URL.
- Public GitHub Pages repository has public source; **never** commit child progress data, private names, audio recordings, photos or other personal information.

## Security and privacy

No third-party analytics, external font loading, tracking, cookies, ads, in-app purchases, or external requests required at runtime. Avoid arbitrary HTML injection in story or parent-provided spelling words; use Phaser text rendering and treat input as plain text. Parent gate is a UX barrier, not authentication.

## Validation

- `npm run validate`: check exactly 22 unique levels, contiguous IDs, story anchors, and required content.
- `npm run build`: TypeScript + production bundle; run on GitHub Actions and locally.
- Manual iPad matrix: iPadOS 15 / Safari, home-screen launch, cold install, offline reopen, 4:3 landscape, portrait recovery, keyboard dev mode, PWA update, safe-area spacing, parent gate, and long-term data migration (as features land).
- Never claim browser-device performance until tested on real hardware.
