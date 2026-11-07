# Research: What helps young children learn spelling?

> **Approved product design:** [Final Game Specification v1.0](FINAL_SPEC.md). The research supports recall, feedback and spaced review; it does **not** independently prove a tile-bank interface or exact mastery threshold.

Research reviewed November 2026. This document guides the actual game loop, not a general first-grade math/reading curriculum. School-provided weekly words (up to 20) are the **only required learning content**.

## The strongest practical principles

1. **Recall, don't simply copy.** An experimental study with first- and second-graders (three experiments, small samples) found retrieval practice improved spelling more than repeatedly rainbow-writing words. This is particularly relevant to Zoey's age. Source: Angela C. Jones et al. (2016), *Beyond the Rainbow: Retrieval Practice Leads to Better Spelling than Does Rainbow Writing*. [ERIC](https://eric.ed.gov/?id=EJ1100679). **Implementation:** play a spoken word, conceal its spelling, ask the child to produce it from memory. Do not make tracing, repeated copying or word-recognition multiple-choice the primary drill.

2. **Give immediate, clear corrective feedback.** In fifth-graders, retrieval practice showed spelling benefits over copying when followed by corrective feedback after errors. This evidence is from older children than Zoey but supports an actionable design rule. Source: Veiga da Silva, Ekuni & Jaeger (2023), [PubMed](https://pubmed.ncbi.nlm.nih.gov/37605436/). **Implementation:** if misspelled, immediately reveal the correct word and invite a new attempt with it hidden. Do not merely show a red X.

3. **Strengthen sound-to-letter mappings.** The What Works Clearinghouse recommends linking segments of spoken words to written letters and explicitly teaching children to decode, analyze, write and recognize words (strong evidence for recommendations 2 and 3). Source: [IES Foundational Skills Practice Guide (2016, updated 2019)](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/). **Implementation:** prompt children to say the word slowly, attend to sounds and spelling patterns, and offer simple letter/sound hints. Avoid auto-generated syllable/sound segmentation that might be incorrect.

4. **Review words across days, not just once.** Research-based spelling-teaching advice includes periodically reviewing previously taught words to promote retention. Source: [Reading Rockets, Tips for Teaching Spelling](https://www.readingrockets.org/sites/default/files/migrated/pdfs/Tips%20for%20Teaching%20Spelling.pdf). **Implementation:** review over multiple visits and days when it naturally happens, prioritize missed/assisted/unpracticed words, and include a no-hints recall check before the school test. Do not impose a time cap. The particular scheduling thresholds are heuristic, not scientifically validated.

5. **Mix patterns thoughtfully.** A 2025 preregistered classroom study of German third-graders found that interleaving spelling-rule examples reduced errors relative to blocked practice. This is supportive, not direct evidence for U.S. first-grade weekly word lists. Source: [Klimovich & Richter (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12511507/). **Implementation:** mix practiced word order and revisit confusable patterns, without forcing an overly complex rules curriculum.

## Core word-learning interaction

1. **Hear:** present the spoken word (and potentially a simple example sentence, if supplied by a parent). On devices with unreliable speech synthesis, provide a *peek, hide, retrieve* alternative.
2. **Think:** encourage the child to say the sounds slowly and map them to letters. Never force a timed response.
3. **Spell:** construct the entire word *from memory*. The game uses a **full-alphabet letter-tile bank** rather than the keyboard. Tiles are an input modality, not automatically assistance; a reduced answer-only tile set would be cued/assisted.
4. **Check:** evaluate the whole spelling, ignoring capitalization. Correct → flower and progress. Incorrect → show the correct answer, invite another hidden attempt, and flag for future review.
5. **Revisit:** return to previously missed or assisted words in a later session, not just immediately in the same session.
6. **Assess:** provide a full-list, low-pressure *practice test* to spot remaining difficulty. Parent report distinguishes first-try independent success from helped attempts.

## Game mapping

- Lyla remains a white bunny with a pink fanny pack. Correct spelling retrieves flowers, reveals clues, frees companions, opens gates and moves toward the purple/blue portal.
- **One spelling prompt per level**, across all 23 levels in a playthrough. Guarantee every current-list word appears at least once (10–20 words, or fewer if school assigns fewer), fill remaining stages by reinforcing hard or untested current-week words; older-week words only appear once all current-week words show sufficient independent success. Check again after new misses. These 23 levels are *storybook geography*, not 23 school weeks.
- A week list can be practiced repeatedly. New lists can be loaded whenever a teacher issues them. Previously saved weeks remain available.
- Make breaks optional and allow seamless resumption, rather than ending after a fixed number of words or minutes. Avoid punishing errors, speed bonuses, mastery fireworks for a single correct attempt, or character distress.
- Use the tiger/Ridensee rescue story and skippable cutscenes; no academic quizzes involving math.

## Evidence caveats

Evidence for a particular touch interface, 23-question campaign, automatic mastery threshold, or iPad modality is not established by the cited studies. Treat these as hypotheses to improve through observation. Actual school tests may be written by hand, and typing accuracy is not identical to handwriting-based spelling transfer; periodically have Zoey say or write words on paper too.

## Current implementation vs future work

**Built in code:** weekly list editor (1–20 words); local history with the two-independent-success secure rule, regression and date evidence; 23 playable platform levels with in-world freeze-and-resume spelling triggers; a full-alphabet letter-tile composer; immediate correction, hidden retry, hint and skip; parent recordings ahead of TTS, with a Peek fallback; full-list mock test; flower rewards; captioned cutscenes.

**Not yet built:** phoneme-grapheme feedback; on-paper practice options; reliable offline pronunciation on every target device (recordings help); real-iPad validation.

**Speech limitation:** iPadOS/Safari voices differ, and speech synthesis can be silent or unavailable offline. The peek fallback lets the child study then hide a word, but it is not equivalent to listening dictation. Record or bundle offline spoken audio in a later version for a reliable true test experience.
