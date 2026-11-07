# Game design: spelling-first Robot Bunnies

> **See [Final Game Specification v1.0](FINAL_SPEC.md) for binding requirements.**

**Primary purpose:** help Zoey prepare for her weekly school spelling tests using her actual teacher-provided list of **up to 20 words**. **No general first-grade math curriculum.** The imaginative 23-level Robot Bunnies world is the setting and reward system for repeated, evidence-informed spelling practice.

## Game structure

- Parent adds, edits, activates and archives a dated/named weekly list directly on Zoey's iPad, up to 20 unique words per list.
- Zoey plays a **23-level campaign** with one word-based challenge at each level. All 10–20 current-week words (or any smaller list) are guaranteed at least one appearance over the full playthrough. Every spare opportunity prioritizes still-weak or untested current-week words. **Only after all current-week words have independent success without unresolved weak-word signals may a spare level review earlier weeks.** Re-evaluate this before every spare stage. A parent can open a separate full-list practice test.
- Flowers, gates, bridges, magical keys, bow targets and portals use **the current weekly list first**. Additional levels repeat difficult current words; past-week bonus reinforcement is allowed **only while the current list has no weak or untested words**, and reevaluated during play. No arbitrary curriculum words.
- The 23 story levels are fixed **locations**, not 23 separate school weeks. Each full run spans all 23 locations. Changing the active list prepares a new word assignment for every level; replaying with the same list rotates and reviews the words.
- Puzzles and action segments must remain easy; **correct spelling**, not twitch reflexes, should determine the challenge.
- Flowers are recovered when spelling is checked successfully; mistakes provide feedback, not lost lives.
- A word once missed or completed with hints is prioritized for reinforcement on replay. A mistake does not stop the player from continuing the story.
- Parents can see which words Zoey spells without help on her first attempt, which she struggles with, and which she skips.

## The approved in-game spelling interaction

1. In a playable, forgiving side-scrolling level, Lyla encounters a flower, key, gate or other story objective. **The game world freezes safely**: no enemies, scrolling or physics continue while spelling.
2. The target word is heard aloud from TTS or an optional parent recording that overrides a mispronunciation. Repeat audio without penalty. If audio fails, use Peek → Hide → Recall (logged as help).
3. Zoey **arranges letter tiles** to construct the word from memory. The tile bank contains all letters, not only letters in the answer; repeated letters are selectable. The iPad keyboard is **not** the primary child experience.
4. First-attempt independent success gets the reward. On a miss, immediately reveal the correct spelling, hide it for another attempt, and allow hints or Skip. Corrected attempts remain assisted; mistakes never cost lives, progress or flowers.
5. Once the prompt is resolved, **resume the paused level**, give a brief collision grace period, and retain progress. Every full run must cover the whole current word list; spare stages prioritize weak current words before any past-week reinforcement.
6. A word is considered secure only after **two independent, first-try correct presentations since the last miss/assisted outcome**, preferably separated by days but with **no enforced waiting**.

See [SPELLING_RESEARCH.md](SPELLING_RESEARCH.md) for sources, evidence strength and implementation limits.

## Story and character canon

The original story is still Zoey's: white bunny Lyla, pink fanny pack, secret robot identity, blue fast friend Ridensee with green fanny pack, apparently kind but evil king, Bunny Police, a hot pink castle and cage, the surprise tiger, the rainbow, zoo, beads, hand obstacle, magical flower money, and the final giant monster with bow and arrows. Refer to [STORY_BIBLE.md](STORY_BIBLE.md). The boy Ridensee only appears in automatic rescues.

## Levels and cutscenes

Exactly **23 levels** (Zoey's 22 plus a Christmas village added as Level 12 in November 2026) with some recurring and some new areas. Level 1 starts in a cage in the hot pink castle. Level 2 is inside a rainbow. Level 23 ends with a giant monster and bow/arrows. Other level placements are provisional. Short, replayable/skippable cutscenes bridge major story moments; optional narration for words and stories. The tiger/ridensee rescue is playful and never deletes spelling progress.

## Child-friendly accessibility

No mandatory read-the-story challenge, timed spelling, lives, game-overs, or punishing platform action. No artificial session-time ceiling: Zoey may play all 23 stages in one sitting or return later. Large buttons, portrait recovery and landscape iPad support. Immediate correctness feedback and assisted retries. Provide a visible way to pause/leave without destroying the saved word progress.

## Current status

All 23 levels are playable, with spelling built into the platforming as described above. Remaining work is real-iPad QA, confirming the Pages deployment, and Zoey reviewing the story details we proposed (see [DECISIONS.md](DECISIONS.md)).
