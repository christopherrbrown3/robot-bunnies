# 23 story levels: spelling-first concept

Zoey specified exactly **22 levels**. In November 2026 a Christmas level was added in the middle as Level 12, at the project owner's request, so the adventure now has **23 levels** (the old Levels 12–22 are now 13–23). The levels are **not fixed educational stages or school weeks**: whichever weekly list (up to 20 words) is active is used across the adventure. **Every full playthrough must visit every word** on the current week's list at least once; extra levels revisit current tricky words and may present words from previous weeks. Zoey may stop and resume anywhere without an artificial duration limit.

- **Confirmed:** Level 1 hot pink castle (cage, key from Bunny Police, evil king reveal, tiger, automatic Ridensee rescue); Level 2 inside rainbow; the final level (Level 23, Zoey's Level 22) giant monster faced with bow/arrows.
- **Confirmed ideas, unassigned level:** zoo animals jump down to catch flower-carrying bunnies, beads must be picked up to avoid tripping, cartoon hand obstacle, colorful rainbow paint doors.
- **Proposed:** all other named locations, all level numbers for obstacles, and individual word interactions in the table.
- **Added on request (not Zoey's):** Level 12, the Christmas village.

| # | Proposed episode | Setting | Spelling-driven task |
|---|---|---|---|
| 1 | Escape from the Hot Pink Castle | Hot pink castle interior | Listen, look if needed, then spell the key word to free Lyla |
| 2 | Inside the Rainbow | Inside a giant rainbow | Spell a rainbow flower word to open the portal |
| 3 | Rainbow Paint Doors | Prism Hall | Spell a color word to unlock the rainbow paint door |
| 4 | Cloud Hop | Sky clouds | Spell a secret word to build a cloud bridge |
| 5 | The Bead Garden | Castle garden | Spell a word to clean up the bead path |
| 6 | Moonlight Meadow | Moonlit flower meadow | Spell a flower word to fill Lyla's pack |
| 7 | The Woodland Bridge | Storybook woodland | Spell a word to repair the woodland bridge |
| 8 | Zoo Surprise | Colorful zoo | Spell a zoo warning word before animals jump |
| 9 | Above the Zoo | Zoo treetops | Spell a word to find a safe treetop route |
| 10 | River of Numbers | Riverside stones | Spell a word to reveal a crossing stone |
| 11 | The Golden Greenhouse | Glasshouse garden | Spell a word to sort the magical flowers |
| 12 | A Very Bunny Christmas | Snowy Christmas village | Spell a word to untie the ribbon on the elves' giant present |
| 13 | The Helping Hand Hall | Enchanted hall | Spell a word to stop the bouncing hand |
| 14 | Orchard of Clues | Sunny orchard | Spell a clue word to choose the orchard path |
| 15 | Skybridge Stories | Rainbow skybridge | Spell a word to cross the story skybridge |
| 16 | Clock Tower Mystery | Old tower | Spell a secret word to open the clock tower |
| 17 | The Robot Workshop | Secret workshop | Spell a word to decode a message about the king |
| 18 | The Flower Vault | Money-flower vault | Spell a word to unlock the flower vault |
| 19 | Finding the Bow | Training meadow | Spell a word to earn a harmless training arrow |
| 20 | Returning to the Castle | Hot pink castle garden | Spell a word to unlock a castle gate |
| 21 | The King's Phone | Control room | Spell a word to jam the king's phone |
| 22 | The Monster's Garden | Giant flower garden | Spell tricky words to prepare for the final monster |
| 23 | The Giant Monster | Final flower clearing | Spell a set of words to help Lyla hit large boss targets |

## As built

Each level's gameplay settings are in `src/content/levels.json` under `play`: visual theme, length, obstacles, platforms, hazards, beads, practice targets, paint door, cutscene, and the story object with its spelling text. Layouts are generated the same way every time from those settings (`src/game/levelPlan.ts`). Hazards in the game: the tiger (Levels 1, 20, 21), zoo monkeys (Levels 8, 9, 22), the hand (Levels 13, 17, 21, 22) and beads (Levels 5, 11, 16, 18), with jingle bells in place of beads in Level 12. Paint doors are in Levels 3 and 15, the bow is found in Level 19, and the boss is Level 23. Levels 13–23 keep the layouts they had as Levels 12–22 (`layoutSeed` in `levels.json`), so a saved checkpoint still lands in the same place.

Level 12, the Christmas village, has its own theme: a snowy dusk sky with a sleigh across the moon, a village with glowing windows, decorated Christmas trees, lamp posts with wreaths and bells, a gingerbread house, icing-snow ground and falling snow. Obstacles are wrapped gifts, platforms are candy canes, and a welcome arch, Christmas trees, candy canes and a snowman line the path. Three elves wave and call out as Lyla runs past and cheer when the giant present opens. Details invented for the build are listed in [DECISIONS.md](DECISIONS.md#proposals-made-while-building-the-playable-game-november-2-2026--not-canon).

## Word allocation rules

A saved campaign creates a fixed word assignment with one entry per level using the active weekly list and up to four prior-week review words in spare slots. Each level has one spelling opportunity in the current scaffold, with current-list words spread across the whole adventure. Future gameplay may have optional extra practice, but should **never skip an active school word** during a completed run. Changes to word lists create a new campaign assignment. No timer or five-word cutoff.

## Story gameplay integration targets

- Level 1: spelling a word helps release Lyla from her cage; the Bunny Police reveal the king's secret. The evil tiger's capture is an automatic, no-punishment rescue cutscene.
- Level 2: collect flower words on wide rainbow paths, unlock a purple-and-blue portal.
- Zoo: incoming animal is introduced via a friendly warning, not a timed spelling task. Spelling a word helps protect flowers.
- Paint doors: a rainbow-door challenge might give optional visual clues but the **weekly word** still drives success.
- Bow and arrows: gently spell a word to activate each oversized final target—no dangerous or graphic combat.

All levels remain achievable without perfect word knowledge. Failed spellings get immediate correction; success can be assisted, but the reporting distinguishes it from independent recall.
