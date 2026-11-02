# Complete 22-level story & learning outline (draft)

**Important:** Zoey confirmed there are exactly **22 levels**, Level 1 starts with her in a cage inside a **hot pink castle**, Level 2 is **inside a rainbow**, and Level 22 culminates in a **giant monster fight with a bow and arrows**. All other level names, ordering and individual settings in the table below are **adult/assistant proposals**. The zoo, beads, hand, and rainbow paint door are Zoey's ideas, but their level numbers have **not** been confirmed.

A gradual difficulty curve here refers mainly to learning complexity and *new ideas*, not punishing platforming difficulty. All levels stay easy to control and short; every world ends at a purple-and-blue portal after its required flowers have been collected.

| # | Level | Setting | Reading opportunity | Math opportunity | Status |
|---|---|---|---|---|---|
| 1 | Escape from the Hot Pink Castle | Hot pink castle interior | Decode KEY / HOP with optional narration | Count 1–5 flowers | **Zoey-chosen anchor** |
| 2 | Inside the Rainbow | Inside a giant rainbow | Read RED / BLUE / SUN | Count and order 1–6 | **Zoey-chosen anchor** |
| 3 | Rainbow Paint Doors | Prism Hall | Match color words with audio hints | Complete repeating sequences | Proposed placement |
| 4 | Cloud Hop | Sky clouds | Read UP / GO / HOP | More / less comparisons | Proposed placement |
| 5 | The Bead Garden | Castle garden | Read simple warning signs | Count removed beads within 10 | Proposed placement |
| 6 | Moonlight Meadow | Moonlit flower meadow | CVC word-picture matching | Addition within 10 using petals | Proposed placement |
| 7 | The Woodland Bridge | Storybook woodland | Short phrases and directions | Number bonds to 10 | Proposed placement |
| 8 | Zoo Surprise | Colorful zoo | Read short animal warning signs | Subtract flowers from small sets | Proposed placement |
| 9 | Above the Zoo | Zoo treetops | Short sentence comprehension | Count forward/backward within 20 | Proposed placement |
| 10 | River of Numbers | Riverside stones | Read simple action prompts | Addition within 10 | Proposed placement |
| 11 | The Golden Greenhouse | Glasshouse garden | Vocabulary: color, shape, amount | Subtraction within 10 | Proposed placement |
| 12 | The Helping Hand Hall | Enchanted hall | Read LEFT / RIGHT / STOP | Simple comparison and patterning | Proposed placement |
| 13 | Orchard of Clues | Sunny orchard | Two-sentence clues | Add within 20 using visual counters | Proposed placement |
| 14 | Skybridge Stories | Rainbow skybridge | Sentence order | Tens and ones | Proposed placement |
| 15 | Clock Tower Mystery | Old tower | Read brief dialogue | Number patterns and grouping | Proposed placement |
| 16 | The Robot Workshop | Secret workshop | Short narrative comprehension | Make ten / teen numbers | Proposed placement |
| 17 | The Flower Vault | Money-flower vault | Read 2–3 sentence instructions | Optional coin identification or within-20 sums | Proposed placement |
| 18 | Finding the Bow | Training meadow | Read target word clues | Add/subtract within 20 | Proposed placement |
| 19 | Returning to the Castle | Hot pink castle garden | Short dialogue and inference | Count mixed flower bundles | Proposed placement |
| 20 | The King's Phone | Control room | Reading clues in order | Two-step visual number problem | Proposed placement |
| 21 | The Monster's Garden | Giant flower garden | Short story comprehension | Mixed within-20 review | Proposed placement |
| 22 | The Giant Monster | Final flower clearing | Choose words from simple clues | Visual first-grade sums and patterns | **Zoey-chosen anchor** |

## Act I — Escape and discovery (1–5)

Level 1 introduces basic jumping, collecting, the Bunny Police's key and the king's betrayal. The tiger is a safe surprise encounter; if caught, Ridensee automatically performs the rescue and the tiger goes away for the rest of the level. Level 2 is inside the rainbow. Levels 3–5 revisit Zoey's paint-door and bead ideas in proposed settings. None require fast reactions.

## Act II — Flower missions (6–12)

Introduce new and repeated environments. The zoo animals jump down attempting to capture flower-carrying bunnies, not to steal the flowers directly. Use clear warnings and forgiving rescue/reset behavior. The hand obstacle must be whimsical rather than frightening. These are **placements to review with Zoey**.

## Act III — The king's secret (13–18)

Short signs and storybook dialogue explain the king's plan. The robot-bunny premise comes to the foreground without changing Lyla's fluffy, natural appearance. A proposed bow-training level introduces aiming without time pressure or violence. Her final weapon acquisition is established, but the exact level has not been chosen by Zoey.

## Act IV — Finish the adventure (19–22)

Return to familiar places, interrupt the evil king's plan, and face the Level 22 giant monster with the bow and arrows. Make the final fight manageable with large, stationary targets, clear prompts, and as many retries as needed. The ending should celebrate Lyla, Ridensee, and the flowers, with exact narrative resolution awaiting Zoey's approval.

## Content contract

The structured data is in [../src/content/levels.json](../src/content/levels.json). Each entry has an integer `id` from 1–22, unique slug, title, setting, theme, story, mechanic, reading/math examples, and `provenance`. Do **not** treat any `proposed` field as a decision Zoey made.

Specific text, math problems, asset keys, checkpoints and cutscene scripts should be added in later implementation phases, not embedded into this narrative outline as fake canon.
