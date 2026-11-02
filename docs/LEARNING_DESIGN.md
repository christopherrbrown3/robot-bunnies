# Spelling-only learning design

**Scope change:** Zoey's spelling tests are the entire learning goal. Do **not** reintroduce general reading, sentence comprehension, addition, counting, money arithmetic, or other unrelated educational objectives.

## Weekly parent workflow

1. Enter up to **20 school-assigned words** directly in Parent Corner (one per line or comma-separated); save under a week name.
2. Review the list before activating. The active week supplies every word in the child's game and practice test.
3. Start or resume the **22-level spelling campaign**. All current words appear at least once across a full run, regardless of whether this week's list has 10, 15 or 20 words. Extra levels repeat harder current words and may draw from earlier weeks.
4. Before a school spelling test, use **Full spelling test**: all the active week's words, no forced hints. The parent can review first-try correct vs. missed/assisted responses.
5. Keep previous weeks locally; the campaign may use up to four spare levels for past-week reinforcement when available. Export a JSON backup periodically. Switching or editing lists restarts the active campaign's word assignment.

## Spelling loop

Hear → recall → type → immediate feedback → optional assisted correction → spaced later revisit. Only **first-try, no-hint spelling** counts as independent success. Revealing the word, asking for a hint, or correcting after an error remains worthwhile learning but is recorded as assisted.

On an error, show exact correct spelling immediately, encourage a new response with the answer hidden, then return that word to future review. Don't penalize mistakes or delete progress.

## Frequency and scheduling

**No timer or session cap.** Zoey can complete the entire 22-level run at once, pause in the middle, or return on another day. Save after each completed challenge. The scheduler guarantees full active-list coverage, uses spare stages for current-word repetitions and a few previous-week words, and rotates assignments on replay. Repeated sessions across days may strengthen retention, but the interface must never force a break. A true review-interval scheduler using separate-day independent retrieval is a future refinement; current priorities are transparent heuristics.

A simple word history stores attempts, misses, first-try correct and assisted correct. Do not call this a scientific mastery score. A recommended future definition of `comfortable` is at least two successful independent spelling attempts on separate days; this threshold is a practical product heuristic, not medical/educational diagnosis.

## Interaction & motor-skills considerations

The MVP uses an iPad's ordinary onscreen keyboard. An optional letter-tile builder is appropriate for very early practice, but letter choices may cue the answer, so record as **assisted** and ensure full-word retrieval remains available. Consider parent-supervised write-on-paper prompts before the school test because keyboard spelling is not a full substitute for handwriting.

## Speech and pronunciation

The app tries browser `speechSynthesis` on a direct Hear button tap. It may not work consistently offline or with all older iPads. The Peek button offers an explicit study→hide→spell fallback, counted as assistance. For a reliable audio-dictation experience, future work should bundle recorded word audio or provide parent-recorded prompts stored locally. Do **not** silently assume perfect or offline TTS.

## Reports and privacy

Review missed words, helpful attempts and independent first tries by week. Keep all data only on the iPad; no user profile, telemetry, service/backend, sharing, or network calls for personal word data. Offer explicit backup, restore and erase with confirmation. A parent-gate math question is a simple UX separation from the child, **not secure authentication**.

## Evidence

Detailed evidence and research references live in [SPELLING_RESEARCH.md](SPELLING_RESEARCH.md). The largest practical priorities are retrieval from memory, immediate correction and future review; do not make the game depend on word-search puzzles or copying as the central learning method.
