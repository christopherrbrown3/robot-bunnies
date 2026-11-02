# Robot Bunnies: Lyla's Spelling Quest 🐰🌸

An iPad spelling-test adventure designed around **Zoey's actual weekly spelling words** (up to 20 per week), set in her 22-level cartoon Robot Bunnies world.

## Current status

**A playable spelling-practice MVP is in the code.** The Parent Corner, five-word flower quest, targeted missed-word practice, and up-to-20-word mock spelling test are implemented; the full Phaser platform game and its 22 story levels are still **planned**.

- **Parent Corner:** enter or edit 1–20 words per week; activate earlier weeks; see attempts, misses and first-try successes. A grown-up math gate discourages accidental edits but is **not a security control**.
- **Spelling Quest:** listen to a word and spell it from memory using the iPad keyboard, with optional hints/peek, immediate corrective feedback, and another hidden attempt.
- **Flower reward:** each correctly spelled word earns Lyla a flower and opens the way toward a purple-and-blue portal. No time limits or punished mistakes.
- **Review:** five-word quick sessions prefer unpracticed and missed words; targeted tricky-word review; full mock test drills all words on the active list.
- **Privacy:** lists and progress stored only on that iPad in browser storage. JSON backup/export/import and permanent erasure are available. No backend, sign-in, tracking, ads or purchases.
- **Story:** keep Zoey's fluffy white bunny Lyla, Ridensee, secret king, tiger, magical flowers, rainbow, hot pink castle, and the giant monster in a 22-level adventure.

### Documentation

- [Research and evidence for spelling instruction](docs/SPELLING_RESEARCH.md)
- [Spelling-only learning design](docs/LEARNING_DESIGN.md)
- [Game design and narrative integration](docs/GAME_DESIGN.md)
- [22-level storyline plan](docs/LEVEL_OUTLINE.md)
- [Character and story canon](docs/STORY_BIBLE.md)
- [Technical architecture](docs/TECHNICAL_DESIGN.md)
- [Implementation roadmap](docs/IMPLEMENTATION_PLAN.md)
- [What Zoey decided vs. our proposals](docs/DECISIONS.md)

## Tech

Phaser 3, TypeScript, Vite, vite-plugin-pwa, GitHub Pages. Home screen PWA; landscape-first iPad experience for older devices; static hosting; no backend. The game's 22 story locations are in [src/content/levels.json](src/content/levels.json).

## Run

```bash
npm install
npm run validate
npm run dev
npm run build
```

## Deploy

In GitHub **Settings → Pages**, choose **GitHub Actions**, then run the workflow in [deploy.yml](.github/workflows/deploy.yml). The intended site address is [christopherrbrown3.github.io/robot-bunnies/](https://christopherrbrown3.github.io/robot-bunnies/). Do not assume the site is already live until deployment succeeds.

On an iPad, open in Safari, then **Share → Add to Home Screen**. After an initial connected visit, the service-worker cache can help make the app available offline. **Speech synthesis may still need device voices or network** on older iPads.

## Scope

This is **not** a general first-grade literacy and math application anymore. Spellings supplied by school are the learning target. The game world remains Zoey's original invention, but any educational interaction should directly support spelling retrieval, corrective feedback or later review.

## License & child privacy

No license selected. The repository is public; do not commit private records, a child's spelling progress, identifying information or recordings. Local browser data may disappear if Safari storage is cleared; use a backup. All game artwork should be original or properly licensed.
