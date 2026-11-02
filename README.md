# Robot Bunnies: Lyla's Spelling Quest 🐰🌸

An iPad spelling-test adventure designed around **Zoey's actual weekly spelling words** (up to 20 per week), set in her 22-level cartoon Robot Bunnies world.

> **Authoritative design:** [Final Game Specification v1.0](docs/FINAL_SPEC.md). This supersedes earlier discussion, especially keyboard entry, the mastery threshold, audio, and in-game spelling.

## Current status

**A spelling-practice prototype is in the code, not the finished game.** The Parent Corner, a **resumable 22-stage spelling campaign**, targeted missed-word review, and up-to-20-word mock spelling test are implemented; playable Phaser side-scrolling, cutscenes and finished 22 story levels are still **planned**.

- **Parent Corner:** enter or edit 1–20 words per week; activate earlier weeks; see attempts, misses and first-try successes. A grown-up math gate discourages accidental edits but is **not a security control**.
- **Prototype Spelling Quest:** listen and spell using the iPad keyboard, with hints/peek, correction and retry. **Final game requirement:** broad-bank touch **letter tiles**, with no need to type on the iPad keyboard.
- **Flower reward:** each correctly spelled word earns Lyla a flower and opens the way toward a purple-and-blue portal. No time limits or punished mistakes.
- **Full playthrough:** one spelling prompt on each of 22 stages. **Every active weekly word appears at least once**; spare stages prioritize weak or unpracticed **current-week words**. Earlier-week words appear only after the full current list is independently secure. A 10-word list and a 20-word list both use all 22 stages. **No timer, fixed session duration, or forced stopping.**
- **Resume:** automatically save the next level after a successful or skipped challenge. Zoey can leave at any point and continue; on completing all 22, starting again makes another full playthrough.
- **Review:** optional targeted tricky-word review; full mock test drills all active words. These are extra tools, not a shortened main quest.
- **Pronunciation:** the current prototype uses TTS; the approved game adds optional per-word parent recordings to override mispronunciations.
- **Learning:** final mastery rule is **two independent correct presentations**, ideally on separate days but with no waiting requirement. The prototype's current mastery approximation is not yet aligned; see [spec](docs/FINAL_SPEC.md).
- **Privacy:** current lists and progress are in on-device browser storage, with JSON backup/import and erase. Parent audio recordings and backup of recordings are **not yet implemented**. No backend, sign-in, tracking, ads or purchases.
- **Story:** keep Zoey's fluffy white bunny Lyla, Ridensee, secret king, tiger, magical flowers, rainbow, hot pink castle, and the giant monster in a 22-level adventure.

### Documentation

- **[Final Game Specification v1.0 — authoritative](docs/FINAL_SPEC.md)**
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
npm test
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
