# Development roadmap: school spelling first

## M0 — Repository scaffold (complete)

- [x] GitHub repository, Phaser/Vite/PWA base and 22-level story outline.
- [x] Zoey-confirmed story facts separated from proposed story bridges.
- [x] GitHub Pages deployment workflow (site may still need Settings → Pages enablement).

## M1 — Spelling practice MVP (implemented in code, pending on-device QA)

- [x] Parent Corner with adult UX gate.
- [x] Weekly list input, edit, activate, and archive: **1–20 unique words**.
- [x] Local word-level stats, JSON export/import, erase with confirmation.
- [x] Five-word quick quests, tricky-word review, full-word-list mock test.
- [x] Browser spoken word via direct tap, brief Peek fallback, first-letter/length hint.
- [x] Spell from memory with on-screen keyboard; immediate answer correction and retry.
- [x] Distinguish independent first try from assisted/corrected attempts.
- [x] Flower rewards and game-themed practice screen.
- [ ] Confirm successful build, launch, local storage and iPad Safari keyboard.
- [ ] Confirm speech playback and PWA behavior on actual older iPad(s).

## M2 — Integrate spelling in actual Phaser platformer

- [ ] Give Lyla a polished 2D bunny sprite and pink fanny pack (never visibly a robot).
- [ ] Implement forgiving high single jump, auto-run, automatic flower collection, bounce-back and portal.
- [ ] Make spelling a meaningful part of opening a gate, collecting a special flower, escaping a cage and reaching a portal.
- [ ] Implement Level 1 hot-pink-castle cage, Bunny Police, king reveal, tiger and automatic Ridensee rescue.
- [ ] Implement Level 2 inside a rainbow.
- [ ] Add skippable storybook cutscenes and offline-safe narration approach.
- [ ] Make story level progression independent of the current week's spelling list: replay with any active week.
- [ ] No mandatory math or general reading quizzes.

## M3 — Stronger spelling instruction

- [ ] Test reliable bundled audio or parent recording for each weekly word; don't depend solely on TTS.
- [ ] Optional word-family hints and letter-sound pattern assistance **only when correct** (avoid guessing wrong phoneme splits).
- [ ] Optional letter tiles for guided practice, tracked as assisted.
- [ ] Optional on-paper spelling check mode for alignment with handwritten school tests.
- [ ] Cross-day spaced review with transparent scheduling and mastery based on independent success on multiple days.
- [ ] Gentle mini cutscenes, word-specific flower rewards and persistent bunny satchel progress.

## M4 — Remaining world and polish

- [ ] Implement and test all 22 story levels using current weekly words.
- [ ] Zoo animals, bead hazards, hand obstacles, rainbow paint doors, find bow, final giant monster.
- [ ] Add warm original art, readable screens, captions, reduced motion, and 180px/192px/512px PWA PNG icons.
- [ ] QA: intermittent/no network, older iPad home-screen mode, storage export/import, school spelling changes, a list with 1 word, a list with 20 words, missed words and interrupted sessions.

**Important:** M1 is a working browser practice loop; do not describe M2–M4 as already playable.
