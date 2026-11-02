/**
 * Short storybook cutscenes: skippable, replayable, captioned and optionally
 * narrated with text-to-speech, so story never depends on reading ability.
 *
 * Canon from Zoey is kept as-is. Lines marked PROPOSED in docs/DECISIONS.md
 * (why Lyla keeps collecting flowers, the monster's change of heart, the
 * ending) are adult proposals awaiting Zoey's review.
 */

export type PanelArt =
  | 'lyla-hello' | 'king-phone' | 'castle-cage' | 'police-key'
  | 'rainbow-jump' | 'zoo-warning' | 'workshop' | 'bow-hint'
  | 'monster-appears' | 'monster-friendly' | 'robots-free' | 'flowers-home';

export interface Panel { art: PanelArt; caption: string }
export interface Cutscene { id: string; title: string; panels: Panel[] }

export const CUTSCENES: Record<string, Cutscene> = {
  intro: {
    id: 'intro', title: 'The Hot Pink Castle',
    panels: [
      { art: 'lyla-hello', caption: 'This is Lyla. She looks like a normal fluffy white bunny with a pink fanny pack.' },
      { art: 'king-phone', caption: 'But Lyla is secretly a robot bunny! The king controls the robot bunnies with his phone.' },
      { art: 'castle-cage', caption: 'The king sends bunnies to collect magic flowers with money inside. He seems nice, but he locked Lyla in a cage in his hot pink castle.' },
      { art: 'police-key', caption: 'Then the Bunny Police sneak in with a key...' }
    ]
  },
  rainbow: {
    id: 'rainbow', title: 'Into the Rainbow',
    panels: [
      { art: 'rainbow-jump', caption: 'Lyla escapes the castle and jumps right inside a giant rainbow!' },
      { art: 'lyla-hello', caption: 'Now that she knows the king is evil, Lyla will keep the magic flowers safe from him.' }
    ]
  },
  zoo: {
    id: 'zoo', title: 'Zoo Surprise',
    panels: [
      { art: 'zoo-warning', caption: 'Lyla reaches the zoo. Watch out! Zoo animals jump down to grab bunnies carrying flowers.' },
      { art: 'lyla-hello', caption: 'When you see the warning, tap Lyla to shrink as small as an ant!' }
    ]
  },
  workshop: {
    id: 'workshop', title: 'The Robot Workshop',
    panels: [
      { art: 'workshop', caption: 'Lyla sneaks into a secret workshop full of robot bunny parts.' },
      { art: 'king-phone', caption: 'Somewhere in here is a message about the king and his phone.' }
    ]
  },
  bow: {
    id: 'bow', title: 'Finding the Bow',
    panels: [
      { art: 'bow-hint', caption: 'The Bunny Police whisper: a magic bow and arrows are hidden in the training meadow.' },
      { art: 'lyla-hello', caption: 'Lyla will need it for the biggest challenge of all!' }
    ]
  },
  monster: {
    id: 'monster', title: 'The Giant Monster',
    panels: [
      { art: 'monster-appears', caption: 'A GIANT monster guards the last magic flowers!' },
      { art: 'bow-hint', caption: 'Lyla gets her bow and arrows ready. Tap the glowing stars to aim!' }
    ]
  },
  ending: {
    id: 'ending', title: 'The End... for Now',
    panels: [
      { art: 'monster-friendly', caption: 'The rainbow arrow tickles the monster, and it shrinks into a tiny, friendly monster!' },
      { art: 'robots-free', caption: "The king's phone stops working. All the robot bunnies are free!" },
      { art: 'flowers-home', caption: 'Lyla brings the magic flowers home for everyone. You did it!' }
    ]
  }
};

export const STORYBOOK_ORDER = ['intro', 'rainbow', 'zoo', 'workshop', 'bow', 'monster', 'ending'];
