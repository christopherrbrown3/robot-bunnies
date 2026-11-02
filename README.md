# Robot Bunnies: Lyla's Flower Quest 🐰🌸

A gentle, story-driven, educational 2D platform adventure invented by **Zoey**. Built as an installable, landscape-first iPad PWA for GitHub Pages.

> **Status: project scaffold / design phase.** The app can display a title screen and browse the 22-level outline. Platforming, cutscenes, assessment, art, and sound are **not implemented yet**. Level ideas not explicitly chosen by Zoey are proposals, not canon.

## The game

Guide Lyla, a white bunny with a pink fanny pack, through **exactly 22 levels**. Lyla looks like a normal bunny but is secretly a robot. She collects flowers that contain money, discovers the truth about the king, escapes an evil tiger, and ultimately confronts a giant monster using a bow and arrows. Her blue, super-fast friend Ridensee rescues her if she's captured.

- Side-scrolling, cheerful cartoon platforming; forgiving and accessible to a young child.
- Lyla auto-runs; press a large Jump button for one high jump at a time.
- Tap Lyla **while in danger** to shrink to ant size; she grows back automatically when safe.
- Walk over flowers to collect them in her fanny pack. Collect them all to open a purple-and-blue portal.
- No lives, game-over screens, hard time limits, or loss of progress on capture.
- Meaningful first-grade reading and math integrated into play, with optional hints and read-aloud support planned.
- Brief, skippable storybook cutscenes; optional narration planned.

## Documentation

| Document | What it covers |
|---|---|
| [Game design](docs/GAME_DESIGN.md) | Vision, controls, game loop, level structure, difficulty, encounters and cutscenes |
| [Story bible](docs/STORY_BIBLE.md) | World, characters, confirmed story, and unresolved narrative questions |
| [All 22 levels](docs/LEVEL_OUTLINE.md) | Level-by-level proposed progression and educational hooks |
| [Learning design](docs/LEARNING_DESIGN.md) | First-grade literacy/numeracy outcomes, feedback, adaptation and parent dashboard |
| [Technical design](docs/TECHNICAL_DESIGN.md) | Phaser/PWA architecture, older-iPad constraints, offline and save strategy |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Phases, acceptance criteria, test matrix, and deferred work |
| [Decisions & provenance](docs/DECISIONS.md) | Zoey-confirmed facts vs. adult design proposals; questions to settle later |

The machine-readable level outline is [src/content/levels.json](src/content/levels.json).

## Stack

**Phaser 3 + TypeScript + Vite + vite-plugin-pwa**, deployed by GitHub Actions to GitHub Pages. Static hosting; no backend, account, cloud save, analytics, or ads required.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm install
npm run dev
npm run validate
npm run build
npm run preview
```

Vite serves locally at the URL shown in its output. `npm run validate` checks the design-data invariants without needing installed dependencies. The production base path is `/robot-bunnies/`; the development server uses `/`.

## Deployment

1. In **Settings → Pages** for this repository, choose **GitHub Actions** as the build/deployment source.
2. Commit to `main`; the workflow in [deploy.yml](.github/workflows/deploy.yml) will validate and build the site, then deploy `dist/`.
3. Once deployed, open `https://christopherrbrown3.github.io/robot-bunnies/` on the iPad in Safari and choose **Share → Add to Home Screen**.
4. The service worker caches the app after a successful online visit. Offline use is a goal, not something to assume before deployment testing.

GitHub Pages may need its first manual enablement. This repository is currently **public**; do not commit private details or individual learning records. Child-specific progress must stay on-device by default.

## Principles

1. **Zoey is the creative director.** Keep her confirmed decisions separate from proposals and revise the latter freely.
2. **Game first, schoolwork woven in.** Never block progress for incorrect answers; give hints and celebrate trying.
3. **Forgiving by design.** No death, no forced level replay after a rescue, predictable controls, short sessions.
4. **Older-iPad friendly.** Lightweight 2D art, touch-friendly targets, capped graphics memory, no heavy 3D or server dependency.
5. **Build iteratively.** Implement a small Level 1 vertical slice before producing all 22 worlds.

## License and assets

No license has been selected. Code and documentation are not automatically licensed for reuse. Replace placeholder graphics with original or appropriately licensed assets; do not copy Nintendo art, music, or characters.
