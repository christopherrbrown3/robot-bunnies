# Robot Bunnies: Lyla's Spelling Quest 🐰🌸

An iPad spelling-test adventure designed around **Zoey's actual weekly spelling words** (up to 20 per week), set in her 22-level cartoon Robot Bunnies world.

> **Authoritative design:** [Final Game Specification v1.0](docs/FINAL_SPEC.md). This supersedes earlier discussion, especially keyboard entry, the mastery threshold, audio, and in-game spelling.

## Current status

**The 22-level game is built and playable in the browser.** It still needs testing on Zoey's actual iPad, a live GitHub Pages deployment check, and Zoey's review of the story details we invented (see [DECISIONS.md](docs/DECISIONS.md)).

- **22 side-scrolling levels:** each has its own look, from the hot pink castle cage (Level 1) and inside the rainbow (Level 2) to the giant monster (Level 22). Lyla runs by herself. Tap anywhere to do her one high jump. When danger is coming, tap Lyla to shrink to ant size; she grows back when it's safe. Small obstacles bounce her back a little, and after a couple of bumps she gets a free helper hop. There are no pits, lives, timers or game over.
- **Zoey's ideas in the game:** the Bunny Police give Lyla the key and reveal that the king is evil. The tiger jumps out of a bush. If it catches Lyla, Ridensee rescues her automatically and puts her back where she was caught, and that tiger is gone. Zoo animals jump down from trees. Beads must be tapped to pick them up. A big hand presses down. There are rainbow paint doors, flowers with money inside, the purple-and-blue portal, the bow and arrows (found in Level 18), and the giant monster with star targets.
- **Spelling inside the platforming:** each level has one story object (cage lock, magic flower, gate, bow, the king's phone or the monster's heart). When Lyla reaches it, the whole world freezes and the spelling panel opens. After the word is answered, the object opens and play resumes with a short safe period. A level's prompt is saved the moment it is answered, so reloading never asks it again.
- **Letter tiles, not typing:** a full a–z tile bank with reusable letters. Apostrophe, hyphen and space tiles appear when any saved list uses them. Answer slots show the word's length. Tap a placed letter to take it out. There are Back, Clear, Hear word, Peek, Hint and Check buttons, and the iPad keyboard never opens. A wrong answer shows the correct spelling, with the missed letters glowing. The child can then hide it and retry, try with a hint, or skip. Hints, Peek and corrected answers are counted as help, never as independent.
- **Audio:** a parent's own recording of a word plays first, then the iPad's text-to-speech. If neither works, the panel says so and offers Peek → hide → spell.
- **Mastery:** a word is **secure** after two independent correct spellings since its last miss, hint, peek or skip. Successes on different days are tracked and shown, but never required.
- **Scheduling:** every word on the active weekly list (1–20 words) appears at least once across the 22 levels. Spare levels go to weak current-week words first. Earlier weeks' words come back only while every current word is secure, and this is re-checked before each spare level.
- **Saving:** progress saves at checkpoints, right after each spelling answer, and on Pause → Save & leave. Leaving and coming back resumes at the same level and checkpoint. After all 22 levels, a gentle summary appears and a new playthrough can start.
- **Parent Corner:** a grown-up check (a math question, not security), then 1–20 words per week with earlier weeks kept. Each word shows a status (Not tried / Needs practice / Secure / Secure · 2+ days) and its counts. There is a summary line (covered in this run, needs practice, secure, secure across multiple days) and per-word **Record / Play / Delete** for parent voice clips. While recording, a red banner names the word, the word's row is highlighted, and the button turns into a pulsing **■ Stop** with a countdown (up to 5 s) and a live microphone level meter. Short tones mark the start and end. Word-list backup and recordings backup are separate files, and both can be erased. Extra practice is available: tricky words, or a full mock spelling test.
- **Privacy:** word lists, progress and voice recordings stay in this browser on the iPad (localStorage and IndexedDB). No backend, sign-in, tracking, ads or purchases. All art and sounds are drawn or synthesized in code; there are no outside images, fonts or music.

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
npm test          # content validation, campaign, mastery and level-layout tests
npm run dev       # http://localhost:5173/
npm run build
npm run preview   # production build at http://localhost:4173/robot-bunnies/
npm run e2e       # optional: plays all 22 levels in Chromium (needs Playwright and a running preview)
npm run e2e:recording  # optional: checks the voice-recording cue with Chromium's fake microphone
```

On a computer, Space/↑ jumps, ↓ shrinks when in danger, P pauses, and letters, Backspace and Enter work in the spelling panel. On the iPad, everything is done by tapping.

## Deploy

GitHub Pages is set to **GitHub Actions** with the custom domain **[robotbunnies.christopherbrown.ai](https://robotbunnies.christopherbrown.ai/)**. Every push to `main` runs [deploy.yml](.github/workflows/deploy.yml). The workflow asks Pages for the site's base path and builds with it: `/` for the custom domain, or `/robot-bunnies/` if the custom domain is ever removed and the site goes back to `christopherrbrown3.github.io/robot-bunnies/`. If the page ever shows only a loading or error message, it reports which file failed to load.

On an iPad, open in Safari, then **Share → Add to Home Screen**. After an initial connected visit, the service-worker cache can help make the app available offline. **Speech synthesis may still need device voices or network** on older iPads.

## Scope

This is **not** a general first-grade literacy and math application anymore. Spellings supplied by school are the learning target. The game world remains Zoey's original invention, but any educational interaction should directly support spelling retrieval, corrective feedback or later review.

## License & child privacy

No license selected. The repository is public; do not commit private records, a child's spelling progress, identifying information or recordings. Local browser data may disappear if Safari storage is cleared; use a backup. All game artwork should be original or properly licensed.
