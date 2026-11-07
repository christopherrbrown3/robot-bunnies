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
- [x] Full spelling campaign (one stage per level); every weekly word guaranteed at least once, flexible list lengths, spare levels for weak current words first, previous-week reinforcement only when the active list has no weak or untested words.
- [x] Recheck current-week weaknesses before each spare level, so new misses override older-week review.
- [x] Save campaign after each completed challenge; resume after app close and replay a fresh campaign.
- [x] Separate tricky-word review and full-word-list mock test (no fixed five-word main quest).
- [x] Browser spoken word via direct tap, untimed Peek/Hide fallback, first-letter/length hint.
- [x] Spell from memory with letter tiles (keyboard kept only as a desktop/adult fallback); immediate answer correction and retry.
- [x] **Replace keyboard as primary child interface** with accessible tap-first **full-alphabet letter tiles**, reordering, repeated letters, and punctuation.
- [x] Prototype distinguishes first-try from assisted/corrected attempts.
- [x] **Enforce approved secure-word threshold:** two independent correct presentations since latest miss/hint/peek/skip; track dates for preferred cross-day retention and reset streak on regression.
- [x] **Add parent recordings** for exact words with locally stored audio, TTS fallback, recording replacement/deletion and failure handling (untested on real iPad microphones).
- [x] Flower rewards and game-themed practice screen.
- [x] Confirm successful build, launch and local storage (desktop Chromium). iPad Safari still to check.
- [ ] Confirm speech playback and PWA behavior on actual older iPad(s).

## M2 — Integrate spelling in actual Phaser platformer

- [x] Give Lyla a 2D bunny sprite and pink fanny pack (never visibly a robot); drawn in code, replaceable with final art.
- [x] Implement forgiving high single jump, auto-run, automatic flower collection, bounce-back and portal.
- [x] Make spelling a meaningful part of opening a gate, collecting a special flower, escaping a cage and reaching a portal.
- [x] **Pause** scrolling, physics, enemies and input on a story spelling trigger; use tile composer and local audio/voice; resume with grace and no double triggers. Allow Hint/Retry/Skip without punishing gameplay.
- [x] Implement Level 1 hot-pink-castle cage, Bunny Police, king reveal, tiger and automatic Ridensee rescue.
- [x] Implement Level 2 inside a rainbow.
- [x] Add skippable storybook cutscenes with captions and optional TTS narration (TTS may need network/voices on some iPads).
- [x] Reuse the existing 22-stage word scheduler and checkpointed progress within the playable side-scrolling scenes. New active lists start a new assignment; world identities stay fixed.
- [x] No mandatory math or general reading quizzes.

## M3 — Stronger spelling instruction

- [ ] Test optional **parent recordings** plus TTS fallback on older iPads and offline; do not assume browser TTS always works.
- [ ] Optional word-family hints and letter-sound pattern assistance **only when correct** (avoid guessing wrong phoneme splits).
- [x] Required **letter-tile primary gameplay**: broad alphabet bank is unassisted; hints glow the next letter and count as help. Further visual/accessibility refinement welcome after iPad testing.
- [ ] Optional on-paper spelling check mode for alignment with handwritten school tests.
- [ ] Improve cross-day review scheduling with transparent outcomes; **different days are preferred, never required or time-gated**.
- [ ] Gentle mini cutscenes, word-specific flower rewards and persistent bunny satchel progress.

## M4 — Remaining world and polish

- [x] Implement all 22 story levels using current weekly words (automated browser playthrough: `npm run e2e`).
- [x] Add the Christmas level as Level 12 (23 levels in all), with saved runs migrated and the renumbered levels' layouts unchanged.
- [x] Zoo animals, bead hazards, hand obstacles, rainbow paint doors, find bow, final giant monster.
- [x] Add original art (drawn in code), readable screens, captions, reduced-motion handling, and 180px/192px/512px PWA PNG icons.
- [ ] QA: intermittent/no network, older iPad home-screen mode, storage export/import, school spelling changes, lists with 10, 15 and 20 words, no previous weeks, many previous weeks, missed words, changed active lists, complete campaign replay and interrupted sessions.

**Status:** M1–M4 game features are implemented and pass automated tests plus a desktop-browser playthrough of all 23 levels. Remaining: real older-iPad QA, Pages deployment confirmation, and Zoey's review of proposed story details. Optional later work: word-family hints, on-paper practice mode, hand-drawn final art.
