# Implementation roadmap & acceptance criteria

This repository begins with a **starter app and game spec**. Future feature phases are suggestions, not finished capabilities.

## M0 — Repository & spec (this scaffold)

- [x] GitHub repository supplied by the project owner.
- [x] Separate Zoey-confirmed canon from proposals.
- [x] 22-level outline and machine-readable JSON definitions.
- [x] Architecture, educational plan, game-design document, initial content validation.
- [x] Vite + Phaser + PWA app-shell source, GitHub Actions Pages workflow.
- [ ] Confirm first deployment and PWA installation on a real iPad.
- [ ] Run `npm ci && npm run build` in a networked environment; dependency installation was not available in the authoring environment.

## M1 — Level 1 vertical slice (next)

- [ ] Replace the outline-only preview with a real auto-running Lyla controller.
- [ ] Draw original placeholder bunny, castle cage, Bunny Police, key, tiger, flowers and portal.
- [ ] Add single high jump, collision bounce and forgiving checkpoint.
- [ ] Collect all flowers automatically by contact; unlock portal.
- [ ] Danger indicator and tap-Lyla-to-shrink; automatic regrowth and flower-collection restriction.
- [ ] Tiger ambush and capture → automated Ridensee rescue → respawn at exact prior place; tiger removed.
- [ ] One embedded reading cue (KEY/HOP), one visual math task (count flowers), hint and read-aloud alternative.
- [ ] Brief skippable intro/key cutscene, pause, no punishing resets.
- [ ] Test a complete Level 1 on an older iPad, including returning from the Home Screen.

**Acceptance:** Zoey can finish a full Level 1 without adult help, can't get stuck, and sees the king/tiger/Ridensee story without mandatory reading.

## M2 — Reusable platformer system

- [ ] JSON-driven spawners for terrain, flowers, hazards, doors, portal and triggers.
- [ ] Reusable scene transitions, cutscene runner, branching story flags.
- [ ] Separate, versioned progress storage; resume/replay/backup behavior.
- [ ] Adaptive learning widgets: letter decoding, choice puzzle, number counters and short dialogue.
- [ ] Optional narration strategy that works offline on target iPad models; accessible captions.
- [ ] Level 2 rainbow plus proposed rainbow-door and bead mechanics.

**Acceptance:** Levels 1–3 are authored by data instead of copying scene logic; each maintains 60/30 fps performance target on test devices.

## M3 — Content production

- [ ] Make all 22 levels playable, keeping each short and achievable.
- [ ] Develop original 2D art, sprite sheets, effects and audio under a documented asset license.
- [ ] Implement zoo animal ambush, hand obstacle, beads, returning worlds, bow practice, and final monster.
- [ ] Complete skippable cutscenes and storybook captions.
- [ ] Tune reading/math skill progression through observation and practical playtests with Zoey.

**Acceptance:** No dead ends, no unfinishable puzzle, and the full campaign is completable without losing progress.

## M4 — Parent and polish

- [ ] Parent-only view for weekly spelling-list input on-device.
- [ ] Reading/math practice history and nonjudgmental skill confidence.
- [ ] Local JSON backup/export/import and clear reset confirmation.
- [ ] Optional reduced-motion mode and sound controls.
- [ ] Real 180×180/192×192/512×512 PNG icons, orientation and offline smoke tests.
- [ ] Manual QA for at least one older iPad and one current iPad; Safari home-screen and regular tabs.

**Acceptance:** Content remains usable offline after installation, personal learning history stays on-device, and a parent can safely recover/export data.

## Deferred intentionally

Multiplayer, cloud sync, backend accounts, leaderboards, subscriptions, precise full-screen 3D graphics, procedurally generated levels, and complicated combat are **out of scope**.

## Decisions before implementation

- [ ] Confirm the plot bridge for money-filled flowers after evil king reveal.
- [ ] Select optional read-aloud approach on older iPads and source/recorded audio.
- [ ] Determine actual oldest iPad/iPadOS hardware target and test manually.
- [ ] Finalize approved character appearance and gameplay sprite scale.
