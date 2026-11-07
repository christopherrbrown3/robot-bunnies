# Robot Bunnies — Finalized Game Specification (v1.0)

**Status:** product and interaction design approved by Zoey's dad on November 1, 2026. This specification is authoritative over older brainstorming documents and the current keyboard-driven prototype. **It is a build target, not a claim that all features exist.**

**Working title:** Robot Bunnies: Lyla's Spelling Quest  
**Creative director:** Zoey (story, characters, worlds, major powers)  
**Product goal:** help Zoey prepare for her real weekly spelling tests through a compelling, forgiving 23-level platform game — **spelling only**, not a broad first-grade reading/math curriculum.

## 1. Non-negotiable game requirements

- **Exactly 23 levels per full playthrough** (Zoey's 22 plus the Christmas level, Level 12, added November 7, 2026), from the hot-pink castle/cage (Level 1), through a world *inside a rainbow* (Level 2), to the giant-monster/bow finale (Level 23).
- A complete playthrough encounters **every word on the current week's teacher-provided list** at least once, whether the list has 10, 15, 20 or another supported number (1–20). World locations are fixed; weekly words are changeable.
- **No timer, session length cap, daily limit, lives, death screen or punitive restart.** Zoey may play the whole adventure or leave and resume later. Save at checkpoints and after completed spelling interactions.
- **Current-week words always take priority.** Untested, missed, assisted or not-yet-secure current words receive extra opportunities. Earlier weeks contribute *only* if every current word is currently secure; if a current word becomes weak again, immediately prioritize it for future extra prompts.
- Learning happens **inside platforming**, not as a detached worksheet: Lyla reaches a flower, gate, key, paint door or other story object; the world safely pauses for spelling; after the interaction, platforming resumes.
- **Primary input: letter tiles**, not keyboard typing. A child constructs the spelling by tapping or moving letter tiles into an answer area. Do not substitute a typed text box for the final experience.
- **Audio: device text-to-speech by default**, with **optional parent-provided word recordings** overriding it when pronunciation is poor; audio is initiated by a large Hear button and repeatable.
- A current word becomes **secure after two independent correct spellings**, preferably on separate calendar days, **without requiring a calendar wait**. A new missed/assisted attempt restores review priority until there are two new independent correct responses.
- On an error, **immediately show the correct spelling**; then hide it and let Zoey retry, ask for help or skip. Every path returns to the game without shaming, lost flowers, or stuck progression. Keep the word prioritized for future attempts.
- All learning progress, weekly lists, optional recordings and campaign saves remain **on the iPad**. Static PWA on GitHub Pages, no backend/accounts/ads/telemetry.

## 2. The core gameplay-to-spelling interaction

**Entry trigger:** a significant gameplay object (flower, gate, key, arrow target, rainbow door) is reached. A few ordinary flowers may still collect automatically for fun; the level's required spelling challenge is associated with one clear story action.

**State sequence:**

```text
RUNNING
  → TRIGGER_REACHED
  → WORLD_PAUSED / SPELLING_READY
  → LISTEN (parent recording → TTS → accessible Peek fallback)
  → BUILD_WORD_WITH_TILES
    ├─ CORRECT → record independent/assisted result → reward → RESUME_WORLD
    ├─ INCORRECT → show full correct spelling → STUDY → hide → RETRY
    ├─ HINT / PEEK → mark assisted for that presentation → continue trying
    └─ SKIP → mark needs review → return to gameplay without penalty
  → NEXT CHECKPOINT / PORTAL
```

**Pause/resume contract:** freeze character position/velocity, scrolling, enemy movement, hazard timers, collision events and input while the spelling panel is open. A hazard cannot capture Lyla behind a spelling screen. Save the spelling trigger's identity and state. After resolution, remove/complete that trigger, restore world state **once**, and provide a short no-collision grace period. Avoid duplicate scoring or re-triggering a spell prompt after reloading. Save immediately after resolving a prompt, including skipping.

**Errors:** wrong letters must never inflict damage or cost a life. Give immediate, accurate spelling feedback; avoid an automatic animation that advances before Zoey sees it. Show the word for as long as she needs and offer **Try again**, **Hint** and **Skip for now**. On retry, the correct spelling is hidden again. A corrected success is *assisted*, never independent. If the word is skipped, gameplay still continues, but the parent report marks it for review.

**Cutscenes:** skippable/replayable, with captions and optional narration. Never gate story comprehension on independent reading ability.

## 3. Letter-tile interaction — REQUIRED

- **Primary gameplay interaction:** tap a letter tile to add it to the next answer position, or drag tiles into position if this proves reliable on older iPads. Tap an answer letter to remove/replace it; include **Backspace**, **Clear**, **Hear again** and **Check**. Large minimum 44×44 CSS-pixel hit targets (prefer larger).
- Offer a **complete letter bank**: A–Z, with letters reusable as needed for doubled/tripled letters. Do **not** supply only the exact letters of the answer (anagrams reveal spelling too easily). Optionally display commonly used letter patterns as hints, but such assistance is logged.
- Answer slots may show **word length** as a consistent UI cue. Do not show the word itself, fill in correct letters, place letters in order, auto-correct or auto-complete during an independent attempt.
- Shuffle/control layout deliberately for an early reader; no randomness that changes the answer's letter order automatically. Letter input should be tap-friendly, not dependent on precise drag-and-drop, multitouch or a hardware keyboard.
- Repeated letters, apostrophes, hyphens and multiword entries need correct rendering and submission. The existing parent editor permits such entries; either support their punctuation explicitly or flag unsupported lists before play.
- **Independence is judged by the response**, not whether it used a keyboard. An unassisted full-word spelling assembled from a broad letter bank can count as independent practice; a word made with revealed answer letters, only-answer-letter tiles, a peek, a correction, or a hint cannot.
- An optional adult-only keyboard/debug input may remain for development and accessibility fallback, but **tiles are the default and primary child UI**.

**Accessible fallback:** always keep a non-drag tap path, visible focus/selection and spoken instruction. Ensure the letter grid does not obscure the puzzle when the iPad changes orientation.

## 4. Voice and optional parent recordings

**Selection order for a prompt:**

1. If the parent recorded **this exact word**, play the local recording.
2. Else, use an available **on-device/browser en-US text-to-speech voice**, when supported.
3. Else, offer a clearly labeled **Peek → Hide → Spell from memory** visual fallback. Peeking is assistance.

Repeat Hear as many times as requested without counting it as a hint. Do not show the correct word while speaking it. A parent recording is optional and never required to enter a new list.

**Parent Corner additions:** per-word **Record**, **Play**, **Replace**, **Delete** controls. Require a user gesture/microphone permission; prefer feature-detected browser recording (e.g. MediaRecorder), with an optional audio-file import fallback on older iPads. Store compressed/short clips in IndexedDB as local blobs; never upload recordings or write them to GitHub. Explicitly identify when a voice/recording won't work offline. The existing JSON-only word-list backup does *not* yet include audio: provide a separately documented export/import method for recordings before promising full backup.

**Pronunciation caveat:** some spelling words are heteronyms or are pronounced incorrectly by TTS. Let a parent record the word and optional example sentence; use the recording over TTS. Do not synthesize a confident incorrect pronunciation.

## 5. Word security and reinforcement

**Independent attempt (one presentation):** first submitted full spelling is correct without Peek, Hint, answer reveal, letter-position cue or prior correction on that presentation. Replaying the audio is allowed. A successful retry after a miss counts as learned practice, **not independent**.

**Secure/comfortable:** **two independent correct presentations of the same current-week word, with no unresolved miss or assisted performance since**. Ideally successful presentations occur on **different dates**; show that distinction to parents as *retention confidence*, but **do not block secure status or additional game levels until tomorrow**. Mastery is a practical game heuristic, not a standardized evaluation.

**Weak/needing practice:** untested, fewer than two independent correct presentations, or newly missed/assisted/skipped after being secure. Require two fresh independent successes after a regression to regain secure status. Multiple independent first tries in one day are valid for the threshold; separately dated successes are a stronger signal, not a gate.

**Important feasibility:** with 20 current words and 23 levels, a single playthrough cannot guarantee **two independent successes for each word** (minimum 40 presentations). The full-run completion goal is *coverage*, **not all words secure in one run**. Continue reinforcement across replays and natural additional prompts, and report any words still weak at the end without punishing the player.

**Scheduling:** assign one *required* prompt per story level (23 total in a run), guaranteeing coverage of the entire active list. In spare slots, favor weakest current words; use old-week words only when no current word needs work. Reevaluate at each spare slot (not only at run start). Reuse saved, versioned local word-history records; distinguish word accuracy, hints, misses, independent streak and distinct successful dates. Track progress by the word's **source week** so a previous-week reminder updates the correct list.

**If the word list changes mid-run:** preserve past results and explain the effect. A new active week/edited word set generates a new assignment; don't silently claim full-run coverage for a list that changed midway.

## 6. 23-level story and difficulty

Zoey's confirmed canon: Lyla is an ordinary-looking fluffy white rabbit with pink fanny pack, secretly controlled as a robot by the one evil king; Ridensee is a fast blue **boy** bunny with green fanny pack and only appears automatically for rescues; Level 1 begins in a cage **inside** a hot-pink castle and the Bunny Police's key reveals the king's secret; the tiger ambushes her, captures her and is removed after Ridensee rescues her back to the exact capture position; Level 2 is **inside a rainbow**; other environments include a zoo with animals jumping to grab flower-carrying bunnies, spilled beads, a big hand, and a rainbow paint-door puzzle; the final level (Zoey's Level 22, now Level 23) features a giant monster confronted with bow and arrows. Level 12, a Christmas village, was added on request and is not Zoey's canon. Flowers containing money collect automatically on contact when Lyla is normal size, and the purple-and-blue portal ends each level.

**Proposed additions (not attributed to Zoey):** placement of unnumbered levels, simple 2–5 panel cutscenes, friendly monster defeat/escape mechanics, small spelling trigger in each level, and the story bridge for why Lyla collects flowers after learning the king is evil.

Controls remain forgiving: auto-run, one high jump at a time, tap Lyla when danger allows shrinking to ant size, grow automatically when safe, bounce back after minor obstacle hits, gentle rescue and no game-over penalties. **The first-grade spelling task is the actual difficulty; platforming should remain easy.**

## 7. Parent Corner

Parents can enter or edit **up to 20 unique words per week**, activate an earlier week, review missed/assisted/independent successes, run a full-list mock test, and export/import local backups. Include an accessible summary showing current week **covered in run**, **needs practice**, **secure**, and **secure across multiple days**; raw counters must not be mislabeled as mastery. Add optional pronunciation recordings as in section 4. Previous weeks should be available for reinforcement but never displace current-week weaknesses.

The current adult arithmetic gate is only a UX discouragement, **not authentication or content security**. No personal data leaves the device. No parent name, child account or cloud sync required.

## 8. State, saves, implementation boundaries

- **Target stack:** Phaser 3 + TypeScript + Vite + PWA service worker, hosted as `/robot-bunnies/` on GitHub Pages. Aim for older iPads, smooth fallback from 60 to 30 fps, low graphics memory, touch-first UI. Keep spelling overlay outside game physics/timers but integrate it into the scene's state machine.
- **Persistent state:** weekly lists, source-week word history, independent streak and practice dates, optional audio blobs, checkpoint identity, campaign's per-level word assignment/cursor (older saves migrate when levels are added), cutscene flags, hints and puzzle outcome. Version/migrate saved schema; export data without compromising locally stored child content.
- **No new gameplay prompts on resume** if one was already resolved. Resume precisely at saved checkpoint, otherwise at a safe restart near last trigger.
- **No unlicensed media.** All art/sound original or appropriately licensed; no Nintendo characters, art, or copyrighted music.
- **No timer.** The child controls when to take a break; there are no maximum playtime or forced breaks.

## 9. Acceptance criteria (definition of done)

1. **10-, 15-, 20-word tests:** every current word appears across exactly 23 levels; smaller lists leave review slots; previous words appear only when every current word qualifies as secure.
2. **Regression:** when Zoey misses, peeks or skips a previously secure current word, the next optional reinforcement level switches from an old-week word to that weak current word.
3. **Letter tiles:** a child can assemble words with duplicates and punctuation, repair a mistake, replay audio and submit without using the keyboard. The bank does not give away the answer.
4. **Mastery:** 1 independent success → weak; 2 independent successes (same day or different days) → secure; new miss/hint/skip → weak; 2 fresh independent successes → secure again. Distinct dates are tracked, not enforced.
5. **Audio:** Hear plays local recording when present, otherwise TTS; errors and unavailable recording/TTS provide a usable visual fallback, not a dead end.
6. **Error recovery:** an incorrect answer reveals correct spelling and allows hidden retry, hint or skip; no death/progress loss. Corrected success is recorded as assisted.
7. **Pause/resume:** spelling freezes physics/hazards; returns safely to the exact gameplay state with no double rewards. Leaving and reloading midrun preserves the correct level and word history.
8. **Parent records:** word lists and recordings do not leave the iPad; local export/import and erase behaviors are clear; a previous-week result is recorded against the previous list.
9. **Story:** Lyla's confirmed appearance, Ridensee rescue, castle, rainbow, magic portal, Zoey's 22 levels (plus the added Christmas level) and final boss are preserved. No general math/reading curriculum is introduced.
10. **Device QA:** older iPad Safari/home-screen PWA tested with touch interaction, offline launch after caching, local save, orientation changes, no external fonts/telemetry and acceptable performance.

## 10. Honest status (updated November 2, 2026)

**Built in code and checked in desktop Chromium (automated playthrough of all 23 levels):**

- The 23 Phaser side-scrolling levels, with auto-run, one high jump, tap-Lyla-to-shrink during danger, bounce-back obstacles with automatic helper hops, flowers that collect on contact, checkpoints, and the purple-and-blue portal.
- Zoey's canon: the Level 1 cage with the Bunny Police key and king reveal, the tiger ambush with the automatic Ridensee rescue back to the capture point, Level 2 inside a rainbow, the zoo animal ambushes, beads to tap, the hand obstacle, rainbow paint doors, the bow found in Level 19, and the Level 23 giant monster faced with bow and arrows.
- The Christmas level (Level 12, added November 7, 2026): gifts, candy canes, Christmas trees, elves, bells, a snowman, falling snow, jingle bells to tap and a giant present to open by spelling.
- Freeze-and-resume spelling triggers (§2). Physics, tweens, animations and hazards stop while the panel is open. The trigger is saved as resolved before any celebration, and play resumes once with a short grace period. A resolved prompt is never shown again after a reload.
- The tile composer (§3). Full a–z reusable bank, punctuation tiles when lists need them, tap-to-remove letters, Back, Clear, Hear, Peek, Hint and Check. Errors reveal the spelling with the missed letters highlighted, then the child can retry hidden, retry with a hint, or skip. The keyboard is only a desktop/adult fallback.
- Audio priority (§4). The parent's local IndexedDB recording plays first, then TTS, then the Peek fallback. Parent Corner has Record (MediaRecorder, with audio-file import when that isn't available), Play and Delete, and a separate recordings backup, import and erase.
- The two-independent-success mastery model with regression and distinct-date tracking (§5), with a v1 → v2 save migration. Spare levels re-target weak current words and fall back to old weeks only while every current word is secure.
- Campaign saves for checkpoints, collected objects, level flags, per-level outcomes and the run's flowers. Resume returns to the saved checkpoint. A changed word list starts a new plan, and Parent Corner says so. A run saved before a level was added is migrated, not lost.
- Parent Corner summary: covered in this run, needs practice, secure, and secure across multiple days.
- Skippable storybook cutscenes with captions and optional narration, replayable from the map's Storybook. Pause menu with sound and story-voice toggles. PNG home-screen icons.

**Still to do before calling v1 done:**

- Real iPad QA (§9.10): touch feel, performance on the oldest target iPad, Safari TTS voices, MediaRecorder or file-import recording, offline launch after caching, orientation changes and home-screen mode. Nothing has been tested on real hardware yet.
- Confirm the GitHub Pages deployment works.
- Zoey's review of the invented story details listed in [DECISIONS.md](DECISIONS.md). These include the zoo animals as monkeys, how the hand behaves, what the monster looks like and its friendly ending, the king's look, cutscene wording, and why Lyla keeps collecting flowers.
- Art is original vector-style drawing made in code. It may be replaced with hand-drawn final art later.

Do not describe the game as "tested on iPad" until that QA has actually been done.
