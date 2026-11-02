import type { ThemeKey } from '../game/themes';

export type LevelProvenance = 'confirmed-setting' | 'confirmed-final' | 'proposed';
export type DevelopmentStatus = 'planned' | 'in-progress' | 'playable';
export type HazardType = 'tiger' | 'monkey' | 'hand';
export type TriggerKind = 'cage' | 'flower' | 'gate' | 'bow' | 'phone' | 'heart';

export interface LevelTrigger {
  kind: TriggerKind;
  /** Fraction of the level length, 'start' (Level 1 cage) or 'boss' (Level 22 arena). */
  at: number | 'start' | 'boss';
  title: string;
  story: string;
  success: string;
}

/** Gameplay parameters; layouts are generated deterministically from these. */
export interface LevelPlay {
  scene: ThemeKey;
  length: number;
  obstacles: number;
  platforms: number;
  hazards: Array<{ type: HazardType; at: number }>;
  beads: number;
  /** Tappable bow-practice targets (after the bow is found). */
  targets: number;
  trigger: LevelTrigger;
  /** Zoey's rainbow paint-door puzzle, as a fraction of the level length. */
  paintDoor?: number;
  /** Storybook cutscene shown before the level. */
  cutscene?: string;
  boss?: boolean;
}

export interface LevelOutline {
  id: number;
  slug: string;
  title: string;
  setting: string;
  theme: string;
  provenance: LevelProvenance;
  story: string;
  mechanic: string;
  spellingChallenge: string;
  developmentStatus: DevelopmentStatus;
  play: LevelPlay;
}
