# Game design specification

**Working title:** Robot Bunnies: Lyla's Flower Quest  
**Audience:** Zoey and similar early elementary learners (approximately first grade)  
**Platform:** Older iPads, landscape-first home-screen PWA  
**Length:** Exactly 22 authored levels; typical target 2–4 minutes of active gameplay per level, excluding pauses and cutscenes (design target, not a timer).

## Design pillars

- **Adventure before worksheet:** 70–80% of a typical level feels like running, jumping, exploring, and meeting characters, with learning woven into authentic goals; this ratio is a starting hypothesis to test with Zoey.
- **One hero:** Lyla is the sole controllable character throughout the story. Ridensee appears in automated rescue sequences.
- **Friendly challenge:** forgiving collision and checkpoints, adjustable assistance, no lives, countdowns, punitive repeats, or game-over loops.
- **Storybook charm:** clean, colorful, original 2D cartoon assets; brief animated cutscenes with optional narration and skip/replay controls.
- **Progress without pressure:** world progress and skills progress are tracked separately; incorrect literacy/math responses provide scaffolded help, not punishment.

## Canonical core loop

1. Begin or resume a level; brief optional story framing or cutscene.
2. Lyla runs automatically through a scrolling environment.
3. Tap **Jump** for a high single jump. Land before jumping again.
4. Run over flowers to collect them automatically into the pink fanny pack. Flowers contain money as an in-world story element.
5. Avoid obstacles. Ordinary collisions bounce Lyla backward a little and grant a short recovery window.
6. During a visible danger window, tapping **Lyla herself** makes her shrink to ant size. She grows back automatically once safe; she cannot collect flowers while tiny.
7. Solve occasional short, contextual reading/math tasks with unlimited hints and retries.
8. After collecting all required flowers (and completing any contextual objective), enter a **purple-and-blue portal** to finish the level.
9. Show a short celebration and unlock the next level. All completed levels remain replayable.

## Input and iPad usability

- Landscape 16:9 **virtual game area** letterboxed as needed; safe areas respected on iPads with different aspect ratios.
- Auto-run avoids requiring a virtual direction pad.
- Very large, anchored **Jump** touch button; one action per press, no double jump; keyboard Space/ArrowUp supported for testing.
- Tap Lyla directly to shrink **only when a danger indicator is active**. Avoid competing input hitboxes with jump; taps on UI are never forwarded to world input.
- Pause, replay narration, skip cutscene, and parent access should be separate, labeled targets.
- Controls should not require fast multi-touch or precision landings.
- Optional reduced-motion mode, readable fonts and non-color-only puzzle clues.

## Obstacles and safety rules

| Event | Planned behavior |
|---|---|
| Hit basic obstacle / hidden hand / bead | Gentle bounce backward, brief invulnerability, no loss of life |
| Miss platform | Return to recent stable platform/checkpoint automatically, no penalty |
| Tiger surprises Lyla and catches her | Brief return-to-cage scene; Ridensee races in automatically; resume **where captured**, tiger disappears for the remainder of that level |
| Tap Lyla during danger | Shrink to ant size; no flower collection until automatic regrowth |
| Wrong puzzle answer | Friendly prompt, then escalating hints; no score penalty |
| Stuck or repeatedly struggling | Offer optional assisted completion or simplified timing |
| Exit midlevel | Resume most recent checkpoint, or restart a short level without loss of unlocked levels |

Other enemy interactions need design decisions; the Tiger rescue is the confirmed rule and can inform similar soft-fail encounters.

## 22-level shape

- **Act I, levels 1–5:** Escape and discovery. Level 1 begins inside a cage at a hot pink castle; Level 2 takes place *inside a rainbow*. Other locations are proposals.
- **Act II, levels 6–12:** New settings and flower missions; zoo animals, beads, rainbow paint doors, and hand obstacle can appear.
- **Act III, levels 13–18:** Uncover the king's schemes, retrieve helpful items, meet allies, begin using the bow and arrow in nonviolent puzzle contexts.
- **Act IV, levels 19–22:** Return toward the kingdom and confront a huge monster in Level 22 with bow and arrows. Victory is achievable without precision aiming.
- See [LEVEL_OUTLINE.md](LEVEL_OUTLINE.md) for the full draft, and [DECISIONS.md](DECISIONS.md) for confirmed/proposed boundaries.

## Cutscenes

Presentation: 2–5 illustrated panels, simple pan/fade and character expressions, optional locally bundled narration, on-screen dialogue, Skip and Replay. Suggested story beats: opening castle cage/key reveal, first Ridensee rescue, midgame realization, obtaining the bow, pre-final encounter, and ending. No unskippable lengthy sequences. Maintain accessibility for readers who are still decoding short sentences.

## Boss design for level 22

Keep Zoey's giant monster and bow/arrow showdown. Make it a 3-phase pattern-based encounter, with generous telegraphs, unlimited retries and big target zones. For example, select the correct word/number on a target, then tap a large Fire button while the target is still. A gentle audiovisual success animation advances the phase. The monster is outsmarted, calmed or sent away rather than graphically harmed. Exact design is **proposed**, not Zoey-confirmed.

## Success criteria

- Zoey can play without sustained adult intervention.
- A new player understands jump, collect, and portal within the first 90 seconds.
- No one loses unlocked progress due to a collision, rescue, puzzle mistake, or refresh.
- At least one literacy and one numeracy interaction are meaningful in each cluster of levels, but neither dominates.
- The core loop remains fun if all explicit text and math prompts are disabled for a playtesting session.
