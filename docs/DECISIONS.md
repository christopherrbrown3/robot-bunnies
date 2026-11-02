# Decision log, attribution and open questions

This is an **accuracy guardrail**. We must not accidentally turn adult/assistant brainstorms into things Zoey said.

## Confirmed directly by Zoey (via her dad)

- **22 levels total**; first easiest, increasing difficulty gradually; some settings repeat.
- Bunnies collect flowers for a king; flowers contain **money**.
- The king controls apparently normal-looking **robot bunnies with his phone**.
- The king is **secretly evil**. The bunny heroes discover his nature at the handoff of the key.
- Hero **Lyla**: white, looks like a normal bunny, pink fanny pack; main/only controllable bunny.
- Lyla auto-runs with finger-controlled **high single jump** (Dad suggested, Zoey agreed).
- Lyla collects flowers **automatically on contact**.
- Lyla can shrink to the size of an **ant** when in danger by **tapping her**; automatic growth back to normal when safe; must grow to collect flowers.
- Obstacles cause a **small backward bounce** instead of game over.
- Collecting all flowers leads to a **purple-and-blue portal**.
- Level 1 begins **inside a cage inside a hot pink castle** (corrected an earlier outside-castle idea).
- The **Bunny Police** give Lyla the key, revealing the king's secret.
- The king sends an **evil tiger** that **jumps out** instead of following all the time.
- On capture Lyla goes back to prison. **Ridensee** rescues automatically; Lyla returns to **where she was caught**, and the tiger **disappears for that level**.
- **Ridensee** is a **blue boy bunny** with a **green fanny pack** and **super speed**, present only for rescue and not user-controlled.
- Level 2 takes place **inside a rainbow**.
- At least one zoo level: zoo animals **jump down to grab bunnies carrying flowers**.
- Other obstacle ideas: beads to pick up so bunnies do not trip; a hand to avoid.
- Rainbow-door puzzle: colored paint splatters placed in rainbow order to unlock flowers; multiple colorful doors.
- Final level features a **giant monster** confrontation with **bow and arrows**; bow and arrow are discovered during the game.
- Colorful **cartoon** visual style; bunny should **not visibly look robotic**.

## Confirmed by dad / project requirements

- **Superseded:** initial first-grade reading/math learning goal has been explicitly replaced with a **spelling-test-only game** using school-supplied weekly word lists of up to 20 words.
- Simple and forgiving, not too difficult; **cutscenes allowed**.
- **PWA**, **GitHub Pages**, works on **older iPads**; same general stack as previous family games.
- Project name/repository: `christopherrbrown3/robot-bunnies`.
- Weekly spelling words and practice tracking are now the core educational purpose; parent controls and a quick practice MVP are implemented in code. No backend assumed. Runtime and authoring choices in the next section are implementation decisions.

## Proposals / implementation decisions (not canon)

- Phaser 3, TypeScript, Vite, vite-plugin-pwa, mobile-first 2D art and UI.
- Act breakdown, 22 proposed individual level titles beyond Levels 1 and 2, and placements of zoo/beads/hand/rainbow-door.
- The idea that Lyla protects the flowers from the evil king and returns money to the kingdom.
- Rescue cutscene details, boss phases, nonviolent effects, all dialogue, exact spelling prompts, coin representation.
- Level duration target (2–4 min), offline caching, checkpoint design, progression heuristics, parent dashboard, audio implementation, and art direction beyond Zoey's decisions.
- Accessible assistance, no punishing loss, and separate story/skills progress as adult product-design requirements.

## Questions to revisit with Zoey

1. What exactly happens **inside the rainbow** in Level 2?
2. Who or what is **the giant monster**? Is it working for the king?
3. Why does the king put Lyla in prison; why does she collect flowers *after* learning his secret?
4. What happens to the flower money at the end?
5. How does Lyla find her bow and arrows?
6. What does the **hand** obstacle look like?
7. How should the zoo animals behave if they catch her?
8. Any other level settings, friends, songs, or surprises she'd like to invent?

When Zoey answers, update this log, [STORY_BIBLE.md](STORY_BIBLE.md), [LEVEL_OUTLINE.md](LEVEL_OUTLINE.md), and the machine-readable content together.

## Latest product direction (authoritative)

- The app's **only learning objective** is helping Zoey prepare for her weekly spelling tests.
- Each week has **up to 20 spelling words**, entered by a parent in an on-device Parent Corner.
- The 22-level adventure and characters remain, but educational challenges **must practice the active weekly list**; math and broad reading-curriculum goals are cancelled.
- Short oral/visual word-to-memory-spelling prompts, corrections, later review, and a low-pressure full-list spelling test replace general quizzes.
- Implemented in the source: parent editor, local data, backup/restore, word statistics, five-word practice quest and spelling test. Phaser story levels are still planned.

## Latest clarification — full-playthrough spelling coverage

- The **main game is the complete 22-level playthrough**; there is no 5-word or 5-minute session cap.
- Each playthrough must cover **all words on the current week’s list**, regardless of list length (usually 10–20).
- Any remaining levels may repeat difficult current words and draw on **previous weeks for reinforcement**, never replacing current-list coverage.
- Zoey decides when she is done playing: leaving and returning should resume the campaign at the next unfinished stage.
- Game stages and word lists are separate: 22 story locations persist across weeks; the scheduler picks words and retains the plan for the duration of an active run.

## Current-week spelling priority — confirmed requirement

- Zoey's **current school week's words come first**, including repeated practice of weak, previously missed, assisted or not-yet-tested current words.
- **Only** when the active list has no weak/unpracticed words may spare story levels draw from older weeks for reinforcement. No blanket quota of old words should preempt active-word practice.
- The app reevaluates this priority **during a playthrough**, since new misses can make a previously strong list need attention again. Core scheduled coverage of all active words never changes.
- The exact mastery threshold is a provisional heuristic (successful independent spelling, considering previous misses), open for tuning after real playtesting.
