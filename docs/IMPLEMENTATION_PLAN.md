# Development roadmap: school spelling first

> **Definition of done:** [Final Game Specification v1.0](FINAL_SPEC.md). This roadmap distinguishes working **prototype** code from unimplemented approved features.

## M0 — Repository scaffold (complete)

- [x] GitHub repository, Phaser/Vite/PWA base and 22-level story outline.
- [x] Zoey-confirmed story facts separated from proposed story bridges.
- [x] GitHub Pages deployment workflow (site may still need Settings → Pages enablement).

## M1 — Spelling practice prototype (implemented in code, pending on-device QA)

- [x] Parent Corner with adult UX gate.
- [x] Weekly list input, edit, activate, and archive: **1–20 unique words**.
- [x] Local word-level stats, JSON export/import, erase with confirmation.
- [x] Full 22-stage spelling campaign; every weekly word guaranteed at least once, flexible list lengths, spare levels for weak current words first, previous-week reinforcement only when the active list has no weak or untested words.
- [x] Recheck current-week weaknesses before each spare level, so new misses override older-week review.
- [x] Save campaign after each completed challenge; resume after app close and replay a fresh 22-stage campaign.
- [x] Separate tricky-word review and full-word-list mock test (no fixed five-word main quest).
- [x] Browser spoken word via direct tap, untimed Peek/Hide fallback, first-letter/length hint.
- [x] Prototype spells from memory with keyboard text entry; immediate answer correction and retry.
- [ ] **Replace keyboard as primary child interface** with accessible tap-first **full-alphabet letter tiles**, reordering, repeated letters, and punctuation.
- [x] Prototype distinguishes first-try from assisted/corrected attempts.
- [ ] **Enforce approved secure-word threshold:** two independent correct presentations since latest miss/hint/peek/skip; track dates for preferred cross-day retention and reset streak on regression.
- [ ] **Add parent recordings** for exact words with locally stored audio, TTS fallback, recording replacement/deletion and failure handling.
- [x] Flower rewards and game-themed practice screen.
- [ ] Confirm successful build, launch, local storage and iPad Safari keyboard.
- [ ] Confirm speech playback and PWA behavior on actual older iPad(s).

## M2 — Integrate spelling in actual Phaser platformer

- [ ] Give Lyla a polished 2D bunny sprite and pink fanny pack (never visibly a robot).
- [ ] Implement forgiving high single jump, auto-run, automatic flower collection, bounce-back and portal.
- [ ] Make spelling a meaningful part of opening a gate, collecting a special flower, escaping a cage and reaching a portal.
- [ ] **Pause** scrolling, physics, enemies and input on a story spelling trigger; use tile composer and local audio/voice; resume with grace and no double triggers. Allow Hint/Retry/Skip without punishing gameplay.
- [ ] Implement Level 1 hot-pink-castle cage, Bunny Police, king reveal, tiger and automatic Ridensee rescue.
- [ ] Implement Level 2 inside a rainbow.
- [ ] Add skippable storybook cutscenes and offline-safe narration approach.
- [ ] Reuse the existing 22-stage word scheduler and checkpointed progress within the playable side-scrolling scenes. New active lists start a new 22-stage assignment; world identities stay fixed.
- [ ] No mandatory math or general reading quizzes.

## M3 — Stronger spelling instruction

- [ ] Test optional **parent recordings** plus TTS fallback on older iPads and offline; do not assume browser TTS always works.
- [ ] Optional word-family hints and letter-sound pattern assistance **only when correct** (avoid guessing wrong phoneme splits).
- [ ] Refine the required **letter-tile primary gameplay** with better visual patterns and accessibility. A broad alphabet bank is unassisted; revealing answer letters or narrowing choices counts as help.
- [ ] Optional on-paper spelling check mode for alignment with handwritten school tests.
- [ ] Improve cross-day review scheduling with transparent outcomes; **different days are preferred, never required or time-gated**.
- [ ] Gentle mini cutscenes, word-specific flower rewards and persistent bunny satchel progress.

## M4 — Remaining world and polish

- [ ] Implement and test all 22 story levels using current weekly words.
- [ ] Zoo animals, bead hazards, hand obstacles, rainbow paint doors, find bow, final giant monster.
- [ ] Add warm original art, readable screens, captions, reduced motion, and 180px/192px/512px PWA PNG icons.
- [ ] QA: intermittent/no network, older iPad home-screen mode, storage export/import, school spelling changes, lists with 10, 15 and 20 words, no previous weeks, many previous weeks, missed words, changed active lists, complete campaign replay and interrupted sessions.

**Important:** M1 is a **keyboard-based browser spelling prototype**, not the finished game. Letter tiles, recordings, two-success mastery, actual 22 side-scrolling levels and in-world spelling pauses still need implementation.
