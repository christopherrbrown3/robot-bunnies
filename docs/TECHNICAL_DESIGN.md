# Technical architecture (initial)

## Constraints and goals

- **Distribution:** static build on GitHub Pages at `/robot-bunnies/`. Home-screen install via Safari.
- **Devices:** older iPads, touch first, landscape 4:3/16:9 screens, aim for acceptable performance on iPadOS 15+ (actual minimum TBD after device testing).
- **Stack:** Phaser 3, TypeScript, Vite, vite-plugin-pwa/Workbox.
- **No backend:** no authentication, child account, remote telemetry or externally stored learning history. No mandatory network after first app cache.
- **Scope now:** working title screen and browseable level outline **only**; gameplay, educational activities, cutscenes, parent tools and art are future work.

## Source layout

```text
src/
  main.ts                 # Phaser configuration
  scenes/
    BootScene.ts          # startup scene
    TitleScene.ts         # title/menu, handoff to outline
    OutlineScene.ts       # 22-level browser; not gameplay
  content/
    levels.json           # all 22 proposed level definitions
    types.ts              # static level shape
public/
  icons/bunny.svg         # simple placeholder graphic; replace with final art
docs/                       # design and implementation specifications
scripts/
  validate-content.mjs    # structural verification; no dependencies
.github/workflows/deploy.yml
```

Production architecture **target**, to implement incrementally: `GameScene`, `HUDScene`, `CutsceneScene`, `LearningScene`, `RescueScene`, `ParentScene`, `AudioManager`, `ProgressStore`, `ContentRepository`, `InputRouter`. Do not create empty classes for functionality that doesn't yet exist.

## Game engine approach

- Phaser Arcade Physics for lightweight 2D collision and auto-running platform controls.
- Fixed virtual size **960×540**, `Phaser.Scale.FIT` with letterboxing; letterbox/background absorbs unused 4:3 space.
- 60 fps aspirational; 30 fps acceptable with transparent fallbacks. Use compact atlases, reuse sprites, pool particles, cap effects and support reduced motion. Avoid large video backgrounds or heavy libraries.
- HTML title description and optional ARIA accessible controls can be added as overlays later. Phaser canvas alone is not inherently screen-reader accessible.
- Start with a fully drawn but asset-light level using shapes. Later replace with original sprites/atlasses.
- Separate content/progression data from physics scene code, so new levels aren't 22 copies of a script.
- Prefer very large hit targets and forgiving physics. Prioritize predictable feeling over precise simulation.

## Input state machine (future)

`RUNNING` (auto-run / high single jump) ↔ `SHRUNK` (only after tap on Lyla in DANGER_WINDOW) → `RECOVERING` (automatic regrowth), and `CAPTURED` → `RIDENSEE_RESCUE` → `RUNNING`.

Pause/cutscene/puzzle states stop movement and disable conflicting input. A tap on the on-screen Jump button must not bubble through into the shrink-tap handler. Explicitly test single-touch, accidental second taps, resume after backgrounding, orientation changes, and audio unlock gestures.

## Save system (future)

Use a versioned local JSON record for current level, completed levels, flower achievements, checkpoint snapshots, hints and accommodations. Small records can use `localStorage`; use IndexedDB if skill-event history grows. Never persist individual user identities by default. Provide backup/export and explicit reset controls. Treat browser data deletion as potential progress loss; don't promise perpetual storage.

A settings namespace might be `robot-bunnies.settings.v1`; a progress namespace `robot-bunnies.progress.v1`. Design migrations before adding persisted schema.

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
