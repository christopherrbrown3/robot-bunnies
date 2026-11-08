# Technical architecture (initial)

> **Authority:** [Final Game Specification v1.0](FINAL_SPEC.md). The game described below is implemented. Real-iPad QA is still pending.

## Constraints and goals

- **Distribution:** static build on GitHub Pages at the custom domain `robotbunnies.christopherbrown.ai` (served from `/`). Home-screen install via Safari.
- **Devices:** older iPads, touch first, landscape 4:3/16:9 screens, aim for acceptable performance on iPadOS 15+ (actual minimum TBD after device testing).
- **Stack:** Phaser 3, TypeScript, Vite, vite-plugin-pwa/Workbox.
- **No backend:** no authentication, child account, remote telemetry or externally stored learning history. No mandatory network after first app cache.
- **Scope now:** the full 23-level platformer with in-world spelling triggers, a letter-tile composer, parent recordings, two-success mastery, storybook cutscenes, an adventure map and Parent Corner. All art and sound are generated in code (Canvas 2D and Web Audio), so there are no asset files to license or download.

## Source layout

```text
src/
  main.ts                 # Phaser config (960 wide × screen-shaped height, FIT, Arcade physics, windowEvents off), audio unlock
  updates.ts              # service-worker updates: background checks, Update button/Parent Corner install, version label
  scenes/
    BootScene.ts          # generates all character/object textures
    TitleScene.ts         # Play/Continue, Map, Grown-ups, sound toggle
    MapScene.ts           # 23-node adventure map, level info, Storybook replays
    CutsceneScene.ts      # captioned, narrated, skippable storybook panels
    GameScene.ts          # one level: run/jump/shrink, hazards, rescue, paint door, spelling trigger, boss, portal
    FinaleScene.ts        # end-of-run celebration and gentle word summary
  game/
    hidpi.ts              # screen size (fills 4:3 iPads), retina rendering (RES), per-scene camera setup
    art.ts                # Canvas 2D drawings (shaded characters, objects, themed props/platforms, buttons, panels)
    christmasArt.ts       # Level 12 art: elves, Christmas trees, candy canes, bells, snowman, arch, giant present, snowflakes
    themes.ts             # 14 visual themes: painted skies, parallax layers, ground, foreground, ambient particles
    sceneArt.ts           # title-screen castle scene, adventure-map road and nodes, storybook frame
    levelPlan.ts          # deterministic layout generator from levels.json `play` parameters
    cutscenes.ts          # storybook panel captions
    flow.ts / ui.ts       # navigation helpers, buttons, bubbles, screen-pinned overlays
  spelling/
    mastery.ts            # two-independent-success model, regression, distinct dates (pure functions)
    store.ts              # schema v2 weekly lists + per-word history (migrates v1)
    scheduler.ts          # all active words first; weak current words in spare slots; old weeks only when all secure
    campaign.ts           # per-level assignment, cursor, checkpoint/flags/outcome, run flowers, migration when levels are added
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
    levels.json           # 23 story locations + gameplay parameters and trigger text
    types.ts
public/icons/             # SVG + 180/192/512 PNG icons
scripts/
  validate-content.mjs    # 23 levels, canon anchors, play config
  test-campaign.mjs       # coverage for 1–20 words, priority, resume, in-level saves
  test-mastery.mjs        # §9 criteria 2 and 4, migration, source-week recording
  test-layouts.mjs        # every layout jumpable, deterministic, hazard/trigger zones clear
  e2e-playthrough.cjs     # optional Playwright run of all 23 levels (`npm run e2e`)
  e2e-recording.cjs       # optional Parent Corner recording-cue check with a fake mic (`npm run e2e:recording`)
```

## Game engine approach

- Phaser Arcade Physics for lightweight 2D collision and auto-running platform controls.
- Fixed virtual size **960×540**, `Phaser.Scale.FIT` with letterboxing; letterbox/background absorbs unused 4:3 space.
- **Retina rendering:** on high-density screens (every retina iPad) the canvas is 1920×1080. Each scene's camera uses origin (0,0) and zoom 2, so game code keeps logical 960×540 coordinates and screen-fixed UI stays put. `GameScene` follows Lyla with its own clamped lerp, because Phaser's built-in follow/bounds/pan assume a centred zoom. Textures are drawn at 2× and registered at their logical size (the source/frame report logical dimensions, so UVs still span 0..1). Text renders at `resolution: 2`. TileSprites copy frames by pixel size, so the world ground uses a raw 2× texture with `tileScale 0.5`, and the screen-fixed parallax layers are pairs of leapfrogging images. Non-retina screens use 1× at no extra cost; `?lowres` forces 1×.
- **Art pipeline:** everything is drawn in code with Canvas 2D (gradients, soft shadows, rim light, gloss), so no image assets need licensing. Each level theme has a painted far layer (sky, sun/moon glow, scenery), a mid layer, a themed ground tile, a foreground strip with faster parallax, themed obstacles/platforms, and a gentle ambient particle style (petals, fireflies, leaves, pollen, sparkles). Characters get a contact shadow, take-off stretch, landing squash and dust puffs. Large background textures and props of other themes are freed when a level starts. Ambient particles and decorative tweens respect `prefers-reduced-motion`.
- 60 fps aspirational; 30 fps acceptable with transparent fallbacks. Use compact atlases, reuse sprites, pool particles, cap effects and support reduced motion. Avoid large video backgrounds or heavy libraries.
- HTML title description and optional ARIA accessible controls can be added as overlays later. Phaser canvas alone is not inherently screen-reader accessible.
- Start with a fully drawn but asset-light level using shapes. Later replace with original sprites/atlasses.
- Separate content/progression data from physics scene code, so new levels aren't copies of one script.
- Prefer very large hit targets and forgiving physics. Prioritize predictable feeling over precise simulation.

## Input state machine

`RUNNING` (auto-run / high single jump) ↔ `SHRUNK` (only after tap on Lyla in DANGER_WINDOW) → `RECOVERING` (automatic regrowth), and `CAPTURED` → `RIDENSEE_RESCUE` → `RUNNING`.

Spelling triggers pause physics, character velocity, enemy movement, timers and game input; restore the saved world and resume after success, error-corrected success or skip, with short collision grace. The tile composer must be touch-first and accessible. Pause/cutscene/puzzle states stop movement and disable conflicting input. A tap on the on-screen Jump button must not bubble through into the shrink-tap handler. Explicitly test single-touch, accidental second taps, resume after backgrounding, orientation changes, and audio unlock gestures.

## Screen size

Scenes are laid out in a 960×540 (16:9) design area. The canvas is 960 wide and as tall as the screen's landscape shape needs (`LOGICAL_HEIGHT` in `hidpi.ts`: 540 on 16:9, 720 on a 4:3 iPad, so the game fills the iPad with no bars; wider screens such as phones keep 540 with side bars). In levels the design area sits at the bottom and the extra room is sky: the camera scrolls up by `EXTRA_HEIGHT`, the HUD stays at the top of the screen, and the far backdrop is painted taller. Menus are centred, with their backdrops continued above and below; screen-fixed overlays (pause, paint door, rescue, level complete) are centred with full-screen dimmers. Character drawings keep headroom (`BUNNY_HEADROOM`) so long ears are never clipped.

## Save system

- `robot-bunnies.spelling.v1` (localStorage, schema v2; v1 data migrates on load): weekly lists and per-word history. Each word records attempts, misses, independent and assisted successes, skips, independent streak, streak dates and success dates. Results are recorded against the word's **source week**.
- `robot-bunnies.campaign.v2`: the frozen word assignment (one step per level), run number, `nextLevelIndex`, each level's outcome, the run's flowers, run flags (`bow`), and the current level's progress: `promptResolved`, `checkpointX`, flowers, collected object IDs and level flags (such as `tiger-gone` or `paint-door`). The prompt is saved as resolved before any celebration, and resolving twice keeps the first result. Spare stages are re-evaluated just before each prompt, never after it is resolved. Editing lists, switching weeks or importing a backup starts a new assignment. When a level is added (`ADDED_LEVEL_INDEXES` in `campaign.ts`), an older saved run gets a spare step at that position on load: finished levels keep their results, and the player's place moves up one if it was at or past the new level.
- `robot-bunnies.prefs.v1`: sound, story voice, and which cutscenes have been seen.
- IndexedDB `robot-bunnies-audio`: parent recordings keyed by exact word, stored as ArrayBuffers because old Safari can't reliably store Blobs. They have their own JSON backup format.
- The word-list backup does **not** include the in-progress campaign position or recordings. Clearing Safari data loses everything that hasn't been backed up, and nothing syncs to a server.

## PWA / GitHub Pages

- The production `base` must match where Pages serves the site. The deploy workflow passes `BASE_PATH` from `actions/configure-pages` (`/` for the custom domain, `/robot-bunnies/` for github.io). A wrong base makes every script and stylesheet 404, so `index.html` contains an inline boot-status message that names any file that fails to load.
- PWA manifest `start_url` and `scope` relative to build base. Cache emitted JS/CSS/fonts/images/HTML using Workbox in `vite-plugin-pwa`.
- Updates (`src/updates.ts`): `registerType: 'prompt'`, so a new service worker installs and waits instead of taking over and reloading mid-level. The app calls `registration.update()` every 30 minutes while visible and when it becomes visible again (at most every 5 minutes), and watches `updatefound` itself because `registerSW` only reports the first update found shortly after start-up. When one is waiting, the title screen and map show an Update button (`addUpdateButton` in `flow.ts`, never in a level) and Parent Corner shows **Update now**; installing sends `SKIP_WAITING` and reloads on `controllerchange` (or after 4 s). Parent Corner's **Check for updates** reports newest, downloading, ready or offline.
- Version shown to grown-ups: `vite.config.ts` defines `__APP_VERSION__` (package version), `__APP_COMMIT__` (`GITHUB_SHA` in the deploy workflow, else `local`) and `__APP_BUILT__` (build time).
- Reopening offline works **only after** service worker installation and asset cache completion while online.
- Initial icon is SVG only. For reliable older iPad install appearance, produce a **180×180 PNG apple-touch-icon** plus 192/512 PNGs in the asset phase and reference them in `index.html`/manifest. Until then, home-screen icon appearance may vary.
- HTTPS on GitHub Pages is required for service workers. Development PWA/offline behavior is not identical to production; test preview and actual Pages URL.
- Public GitHub Pages repository has public source; **never** commit child progress data, private names, audio recordings, photos or other personal information.

## Security and privacy

No third-party analytics, external font loading, tracking, cookies, ads, in-app purchases, or external requests required at runtime. Avoid arbitrary HTML injection in story or parent-provided spelling words; use Phaser text rendering and treat input as plain text. Parent gate is a UX barrier, not authentication.

## Validation

- `npm run validate`: check exactly 23 unique levels, contiguous IDs, story anchors, and required content.
- `npm run build`: TypeScript + production bundle; run on GitHub Actions and locally.
- Manual iPad matrix: iPadOS 15 / Safari, home-screen launch, cold install, offline reopen, 4:3 landscape, portrait recovery, keyboard dev mode, PWA update, safe-area spacing, parent gate, and long-term data migration (as features land).
- Never claim browser-device performance until tested on real hardware.
