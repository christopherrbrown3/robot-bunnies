# Spelling-only learning design

> **Binding product rules live in [Final Game Specification v1.0](FINAL_SPEC.md).** The rules below are implemented in `src/spelling/` and `src/ui/SpellingPanel.ts`.

**Scope change:** Zoey's spelling tests are the entire learning goal. Do **not** reintroduce general reading, sentence comprehension, addition, counting, money arithmetic, or other unrelated educational objectives.

## Weekly parent workflow

1. Enter up to **20 school-assigned words** directly in Parent Corner (one per line or comma-separated); save under a week name.
2. Review the list before activating. The active week supplies every word in the child's game and practice test.
3. Start or resume the **22-level spelling campaign**. All current words appear at least once across a full run, regardless of whether this week's list has 10, 15 or 20 words. Extra levels first repeat current-week words that are weak, assisted or untested. **Previous-week words appear only when there are no weak current-week words.**
4. Before a school spelling test, use **Full spelling test**: all the active week's words, no forced hints. The parent can review first-try correct vs. missed/assisted responses.
5. Keep previous weeks locally; the campaign may use up to four spare levels for past-week reinforcement **only after the active list has no weak or untested words**. Export a JSON backup periodically. Switching or editing lists restarts the active campaign's word assignment.

## Spelling loop

Hear → recall → arrange **letter tiles** into a complete word → immediate feedback → optional assisted correction → later revisit. Only **first-try, no-hint spelling from a broad alphabet tile bank** counts as independent success. Audio replay does not count as a hint. Revealing the word, asking for a hint, or correcting after an error remains worthwhile learning but is recorded as assisted.

On an error, show exact correct spelling immediately, encourage a new response with the answer hidden, then return that word to future review. Don't penalize mistakes or delete progress.

## Frequency and scheduling

**No timer or session cap.** Zoey can complete the entire 22-level run at once, pause in the middle, or return on another day. Save after each completed challenge. The scheduler guarantees full active-list coverage, uses dynamic spare stages to prioritize active words with unresolved difficulty; after all current words demonstrate independent success, a few older words may return. This decision is rechecked throughout the same run and may switch back if she misses a current word. Repeated sessions across days may strengthen retention, but the interface must never force a break. A true review-interval scheduler using separate-day independent retrieval is a future refinement; current priorities are transparent heuristics.

**Approved secure-word rule:** two independent correct presentations **since the last miss, hint, Peek or Skip**. A successful prompted retry after an error is assisted, not independent. Two successes on separate days are preferred and separately tracked, but a child is **never forced to wait for tomorrow** to continue or to become secure. One independent success is still weak; an error or hint after security makes it weak again until two new independent successes. A word's stage and calendar date must be tracked so repeated taps on one attempt cannot count twice. This is a practical game heuristic, **not a scientific diagnostic or educational assessment**. Implemented in `src/spelling/mastery.ts` and covered by `scripts/test-mastery.mjs`.

## Interaction & motor-skills considerations

**Approved primary child interaction: arrange large tappable letter tiles.** Offer a reusable full A–Z bank, not only the answer letters, to reduce answer cues. Tap tiles to enter, tap entered letters to remove/rearrange, and provide Backspace, Clear, Hear, Hint and Check. Unassisted full-word recall from a broad bank is eligible for independent credit. **Tile layout itself is not a hint**; Peek, filled letters, narrowed choices, answer reveal and retries are assistance. Text-input may remain a developer or accessibility fallback, never the primary game mechanic. Support repeated letters and any accepted punctuation in parent lists. Handwritten practice may still be useful before a written school test.

## Speech and pronunciation

**Approved audio behavior:** try an optional local **parent recording for the exact word first**, otherwise browser/on-device **text-to-speech**, and use an explicit Peek → Hide → Spell fallback when audio fails (counted as assistance). Parent Corner must offer Record/Play/Replace/Delete per word; store blobs locally in IndexedDB and document backup/restore limits. Recording and audio priority are implemented: MediaRecorder where available, audio-file import otherwise, and a separate recordings backup. Audio may be unreliable offline on some older iPads; do not claim otherwise until tested on the device.

## Reports and privacy

Review missed words, helpful attempts and independent first tries by week. Keep all data only on the iPad; no user profile, telemetry, service/backend, sharing, or network calls for personal word data. Offer explicit backup, restore and erase with confirmation. A parent-gate math question is a simple UX separation from the child, **not secure authentication**.

## Evidence

Detailed evidence and research references live in [SPELLING_RESEARCH.md](SPELLING_RESEARCH.md). The largest practical priorities are retrieval from memory, immediate correction and future review; do not make the game depend on word-search puzzles or copying as the central learning method.
