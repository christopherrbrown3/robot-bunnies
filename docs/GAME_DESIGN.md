# Game design: spelling-first Robot Bunnies

**Primary purpose:** help Zoey prepare for her weekly school spelling tests using her actual teacher-provided list of **up to 20 words**. **No general first-grade math curriculum.** The imaginative 22-level Robot Bunnies world is the setting and reward system for repeated, evidence-informed spelling practice.

## Game structure

- Parent adds, edits, activates and archives a dated/named weekly list directly on Zoey's iPad, up to 20 unique words per list.
- Zoey plays a **22-level campaign** with one word-based challenge at each level. All 10–20 current-week words (or any smaller list) are guaranteed at least one appearance over the full playthrough. Every spare opportunity prioritizes still-weak or untested current-week words. **Only after all current-week words have independent success without unresolved weak-word signals may a spare level review earlier weeks.** Re-evaluate this before every spare stage. A parent can open a separate full-list practice test.
- Flowers, gates, bridges, magical keys, bow targets and portals use **the current weekly list first**. Additional levels repeat difficult current words; past-week bonus reinforcement is allowed **only while the current list has no weak or untested words**, and reevaluated during play. No arbitrary curriculum words.
- The 22 story levels are fixed **locations**, not 22 separate school weeks. Each full run spans all 22 locations. Changing the active list prepares a new 22-stage word assignment; replaying with the same list rotates and reviews the words.
- Puzzles and action segments must remain easy; **correct spelling**, not twitch reflexes, should determine the challenge.
- Flowers are recovered when spelling is checked successfully; mistakes provide feedback, not lost lives.
- A word once missed or completed with hints is prioritized for reinforcement on replay. A mistake does not stop the player from continuing the story.
- Parents can see which words Zoey spells without help on her first attempt, which she struggles with, and which she skips.

## The core learning interaction

1. Lyla finds a flower. **Listen** to its word (audio) without seeing the answer; if speech doesn't work, **Peek** at it briefly, hide it, then attempt recall.
2. Zoey types the word using a real on-screen iPad keyboard. Future versions can add assistive letter tiles; an independent full-word response stays the primary goal.
3. If correct, Lyla gains a flower. Keep first-attempt success separate from assisted or corrected success.
4. If incorrect, immediately reveal the *correct spelling*, invite Zoey to study it, then hide it before she retries. Keep the word in future practice rotation.
5. Each spelling challenge advances to the next story level; after Level 22, celebrate the purple-and-blue portal and full campaign completion. No time penalty, shame, or score punishment.

See [SPELLING_RESEARCH.md](SPELLING_RESEARCH.md) for sources, evidence strength and implementation limits.

## Story and character canon

The original story is still Zoey's: white bunny Lyla, pink fanny pack, secret robot identity, blue fast friend Ridensee with green fanny pack, apparently kind but evil king, Bunny Police, a hot pink castle and cage, the surprise tiger, the rainbow, zoo, beads, hand obstacle, magical flower money, and the final giant monster with bow and arrows. Refer to [STORY_BIBLE.md](STORY_BIBLE.md). The boy Ridensee only appears in automatic rescues.

## Levels and cutscenes

Exactly **22 levels** with some recurring and some new areas. Level 1 starts in a cage in the hot pink castle. Level 2 is inside a rainbow. Level 22 ends with a giant monster and bow/arrows. Other level placements are provisional. Short, replayable/skippable cutscenes bridge major story moments; optional narration for words and stories. The tiger/ridensee rescue is playful and never deletes spelling progress.

## Child-friendly accessibility

No mandatory read-the-story challenge, timed spelling, lives, game-overs, or punishing platform action. No artificial session-time ceiling: Zoey may play all 22 stages in one sitting or return later. Large buttons, portrait recovery and landscape iPad support. Immediate correctness feedback and assisted retries. Provide a visible way to pause/leave without destroying the saved word progress.

## Current MVP status

The **resumable 22-stage spelling-question flow and Parent Corner** are functional in the scaffold, pending deployment and iPad testing. Each stage displays its story location, but this is **not yet a playable side-scroller**. Upcoming work integrates the same spelling engine into Phaser platform scenes with cartoon art and narrative cutscenes.
