# Spelling-only learning design

**Scope change:** Zoey's spelling tests are the entire learning goal. Do **not** reintroduce general reading, sentence comprehension, addition, counting, money arithmetic, or other unrelated educational objectives.

## Weekly parent workflow

1. Enter up to **20 school-assigned words** directly in Parent Corner (one per line or comma-separated); save under a week name.
2. Review the list before activating. The active week supplies every word in the child's game and practice test.
3. Run quick 5-word practice sessions on several days of the week; use **Practice tricky words** when mistakes accumulate.
4. Before a school spelling test, use **Full spelling test**: all the active week's words, no forced hints. The parent can review first-try correct vs. missed/assisted responses.
5. Keep previous weeks locally for optional review; export a JSON backup periodically.

## Spelling loop

Hear → recall → type → immediate feedback → optional assisted correction → spaced later revisit. Only **first-try, no-hint spelling** counts as independent success. Revealing the word, asking for a hint, or correcting after an error remains worthwhile learning but is recorded as assisted.

On an error, show exact correct spelling immediately, encourage a new response with the answer hidden, then return that word to future review. Don't penalize mistakes or delete progress.

## Frequency and scheduling

Short, mixed practice is generally preferable to one long repetitive cram session. Five words per quick session is a **UX default** for an early learner, not an experimentally established dose. The current scheduler prioritizes still-hard words and unseen words. A true day-level spacing algorithm (with dated review intervals) is a future improvement, especially for words first practiced on Monday and revisited through Friday.

A simple word history stores attempts, misses, first-try correct and assisted correct. Do not call this a scientific mastery score. A recommended future definition of `comfortable` is at least two successful independent spelling attempts on separate days; this threshold is a practical product heuristic, not medical/educational diagnosis.

## Interaction & motor-skills considerations

The MVP uses an iPad's ordinary onscreen keyboard. An optional letter-tile builder is appropriate for very early practice, but letter choices may cue the answer, so record as **assisted** and ensure full-word retrieval remains available. Consider parent-supervised write-on-paper prompts before the school test because keyboard spelling is not a full substitute for handwriting.

## Speech and pronunciation

The app tries browser `speechSynthesis` on a direct Hear button tap. It may not work consistently offline or with all older iPads. The Peek button offers an explicit study→hide→spell fallback, counted as assistance. For a reliable audio-dictation experience, future work should bundle recorded word audio or provide parent-recorded prompts stored locally. Do **not** silently assume perfect or offline TTS.

## Reports and privacy

Review missed words, helpful attempts and independent first tries by week. Keep all data only on the iPad; no user profile, telemetry, service/backend, sharing, or network calls for personal word data. Offer explicit backup, restore and erase with confirmation. A parent-gate math question is a simple UX separation from the child, **not secure authentication**.

## Evidence

Detailed evidence and research references live in [SPELLING_RESEARCH.md](SPELLING_RESEARCH.md). The largest practical priorities are retrieval from memory, immediate correction and future review; do not make the game depend on word-search puzzles or copying as the central learning method.
